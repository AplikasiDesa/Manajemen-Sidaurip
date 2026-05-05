'use client';

import { Firestore, doc, getDoc, serverTimestamp, writeBatch, collection } from 'firebase/firestore';
import { Resident } from './types';

/**
 * MENCARI DATA PENDUDUK (OPTIMIZED)
 * Menggunakan getDoc langsung pada ID dokumen (NIK).
 * Ini lebih aman karena hanya memerlukan izin 'get' di Security Rules.
 */
export const getResidentByNik = async (db: Firestore, nik: string): Promise<Resident | null> => {
  if (!nik || nik.length !== 16) return null;
  
  try {
    const docRef = doc(db, 'residents', nik);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Resident;
    }
    
    return null;
  } catch (error: any) {
    console.error("Error fetching resident by NIK:", error);
    throw error;
  }
};

/**
 * SEED DATA TESTING
 */
export const seedResidents = async (db: Firestore) => {
  const batch = writeBatch(db);
  const residentsRef = collection(db, 'residents');

  const testData = [
    {
      nik: "3301010101010001",
      noKk: "3301010101018888",
      fullName: "BUDI SANTOSO",
      gender: "Laki-laki",
      dateOfBirth: "12-05-1985",
      age: "39",
      placeOfBirth: "Cilacap",
      address: "Jl. Mawar No. 12, Sidaurip",
      rt: "001",
      rw: "002",
      kelurahan: "Sidaurip",
      relationshipToHeadOfFamily: "KEPALA KELUARGA",
      maritalStatus: "KAWIN",
      educationLevel: "SLTA / Sederajat",
      religion: "Islam",
      occupation: "Wiraswasta",
      bloodType: "O",
      hasBirthCertificate: "ADA",
      birthCertificateNumber: "12345/DISDUK/2010",
      hasMarriageCertificate: "ADA",
      marriageCertificateNumber: "987/KUA/2012",
      hasDivorceCertificate: "TIDAK",
      divorceCertificateNumber: "-",
      fatherName: "SUTRISNO",
      motherName: "SITI AMINAH"
    },
    {
      nik: "3301010101010002",
      noKk: "3301010101018888",
      fullName: "ANI WIDAYATI",
      gender: "Perempuan",
      dateOfBirth: "20-08-1988",
      age: "34",
      placeOfBirth: "Cilacap",
      address: "Jl. Mawar No. 12, Sidaurip",
      rt: "001",
      rw: "002",
      kelurahan: "Sidaurip",
      relationshipToHeadOfFamily: "ISTRI",
      maritalStatus: "KAWIN",
      educationLevel: "SLTA / Sederajat",
      religion: "Islam",
      occupation: "Ibu Rumah Tangga (IRT)",
      bloodType: "A",
      hasBirthCertificate: "ADA",
      birthCertificateNumber: "55432/DISDUK/2011",
      hasMarriageCertificate: "ADA",
      marriageCertificateNumber: "987/KUA/2012",
      hasDivorceCertificate: "TIDAK",
      divorceCertificateNumber: "-",
      fatherName: "KARTONO",
      motherName: "SUMIATI"
    }
  ];

  testData.forEach(data => {
    const docRef = doc(residentsRef, data.nik);
    batch.set(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  });

  await batch.commit();
};