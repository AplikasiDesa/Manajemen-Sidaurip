'use client';
import {
  collection,
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  Firestore,
  query,
  orderBy,
  limit,
  setDoc,
  getDocs,
} from 'firebase/firestore';
import { LetterSubmission, LetterSubmissionData, UploadedFile } from './types';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { getCitizenProfile } from './citizens';

// Helper function to read file as Base64
const toBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
  });
  
// Helper function to get a clean target file name
const getTargetFileName = (fieldName: string): string => {
    const lowerCaseFieldName = fieldName.toLowerCase();
    if (lowerCaseFieldName.includes('ktp')) return 'KTP';
    if (lowerCaseFieldName.includes('kk') || lowerCaseFieldName.includes('kartu keluarga')) return 'KK';
    if (lowerCaseFieldName.includes('surat lahir') || lowerCaseFieldName.includes('surat rs')) return 'Surat Lahir RS';
    if (lowerCaseFieldName.includes('rtrw') || lowerCaseFieldName.includes('rt/rw')) return 'Pengantar RT-RW';
    return fieldName.split(' ')[0];
}

/**
 * Uploads a collection of files to the configured Google Apps Script endpoint.
 */
async function uploadFilesToAppsScript(payload: {
  letterType: string;
  requesterName: string;
  files: { targetFileName: string; mimeType: string; base64Data: string }[];
}): Promise<{ fileId: string; fileName: string }[]> {
  const url = "https://script.google.com/macros/s/AKfycbwmUjrzx6UV9-4X1B5N8qKFgn8gTIBGi4f6hrrc-iddq8FUR4k4h4XWfhT9VPbg4WIO/exec";

  if (!url) {
    throw new Error('URL Google Apps Script tidak ditemukan.');
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gagal menghubungi server. Pesan: ${errorText}`);
    }

    const result = await response.json();

    if (result.status !== 'success' || !result.files) {
      throw new Error(`Gagal mengunggah file: ${result.message || 'Error tidak diketahui'}`);
    }

    return result.files;
  } catch (error: any) {
    throw error;
  }
}

export const getLetterRequestsCollection = (db: Firestore) => collection(db, 'letterRequests');

export const getLetterRequestsQuery = (db: Firestore) =>
  query(getLetterRequestsCollection(db), orderBy('createdAt', 'desc'), limit(100));

export const getSubmissionById = async (
  db: Firestore,
  id: string
): Promise<LetterSubmission | null> => {
  const docRef = doc(db, 'letterRequests', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      requesterName: data.requesterName,
      nik: data.nik,
      phoneNumber: data.phoneNumber,
      email: data.email,
      letterType: data.letterType,
      status: data.status,
      date: data.createdAt?.toDate()?.toISOString() ?? new Date().toISOString(),
      formData: data.submissionData ? JSON.parse(data.submissionData) : {},
      documentNumber: data.documentNumber,
      fileLinks: data.fileLinks || [],
      createdAt: data.createdAt,
    } as LetterSubmission;
  }
  return null;
};

/**
 * Generates a unique 6-digit numeric ticket number
 */
async function generate6DigitTicket(db: Firestore): Promise<string> {
    let ticket = '';
    let isUnique = false;
    let attempts = 0;

    while (!isUnique && attempts < 5) {
        ticket = Math.floor(100000 + Math.random() * 900000).toString();
        const docRef = doc(db, 'letterRequests', ticket);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
            isUnique = true;
        }
        attempts++;
    }
    return ticket;
}

export const addSubmission = async (
  db: Firestore,
  userId: string,
  submissionData: LetterSubmissionData
): Promise<{ id: string }> => {
  const { formData, files, ...restOfSubmissionData } = submissionData;
  const collectionRef = getLetterRequestsCollection(db);

  // Generate 6 digit numeric ID
  const ticketId = await generate6DigitTicket(db);

  // Ambil data kontak warga dari profilnya
  const profile = await getCitizenProfile(db, userId);

  const initialDocData = {
    ...restOfSubmissionData,
    phoneNumber: profile?.phoneNumber || '',
    email: profile?.email || '',
    submissionData: JSON.stringify(formData),
    status: 'pending', // Default status changed to pending to avoid UI getting stuck
    requestorAuthUid: userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    fileLinks: [],
  };

  const docRef = doc(db, 'letterRequests', ticketId);
  
  await setDoc(docRef, initialDocData).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: collectionRef.path,
        operation: 'create',
        requestResourceData: initialDocData,
      })
    );
    throw error;
  });

  // Background upload process - non blocking for the main return
  if (files && files.length > 0) {
    (async () => {
        try {
            const filesForScript = await Promise.all(
                files.map(async (fileData) => {
                    const base64 = await toBase64(fileData.file);
                    const targetFileName = getTargetFileName(fileData.fieldName);
                    return {
                        targetFileName: targetFileName,
                        mimeType: fileData.file.type,
                        base64Data: base64,
                        originalFieldName: fileData.fieldName
                    };
                })
            );

            const uploadPayload = {
                letterType: submissionData.letterType,
                requesterName: submissionData.requesterName,
                files: filesForScript.map(({ originalFieldName, ...rest }) => rest),
            };

            const uploadedFilesInfo = await uploadFilesToAppsScript(uploadPayload);

            const finalFileLinks: UploadedFile[] = uploadedFilesInfo.map((uploadedFile: { fileId: string; fileName: string }) => {
                const originalFile = filesForScript.find(f => f.targetFileName === uploadedFile.fileName);
                return {
                    fieldName: originalFile?.originalFieldName || uploadedFile.fileName,
                    fileName: uploadedFile.fileName,
                    fileId: uploadedFile.fileId,
                };
            });

            await updateDoc(docRef, {
                fileLinks: finalFileLinks,
                updatedAt: serverTimestamp(),
            });
        } catch (uploadError: any) {
            console.error("Delayed upload failed:", uploadError);
            await updateDoc(docRef, {
                adminNotes: `Gagal mengunggah beberapa lampiran otomatis: ${uploadError.message}. Admin harap cek manual jika diperlukan.`,
                updatedAt: serverTimestamp(),
            });
        }
    })();
  }

  return { id: ticketId };
};

export const updateSubmissionStatus = (
  db: Firestore,
  id: string,
  status: 'approved' | 'rejected'
) => {
  const docRef = doc(db, 'letterRequests', id);
  const data = { status, updatedAt: serverTimestamp() };
  updateDoc(docRef, data).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
};

export const setSubmissionDocumentNumber = (
  db: Firestore,
  id: string,
  documentNumber: string
) => {
  const docRef = doc(db, 'letterRequests', id);
  const data = { documentNumber, updatedAt: serverTimestamp() };
  const promise = updateDoc(docRef, data);
  promise.catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'update',
        requestResourceData: data,
      })
    );
  });
  return promise;
};

export const deleteSubmission = (db: Firestore, id: string) => {
  const docRef = doc(db, 'letterRequests', id);
  deleteDoc(docRef).catch((error) => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: 'delete',
      })
    );
  });
};
