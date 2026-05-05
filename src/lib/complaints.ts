'use client';

import {
    doc,
    updateDoc,
    serverTimestamp,
    Firestore,
    deleteDoc,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export const updateComplaintResponse = (
    db: Firestore,
    id: string,
    adminResponse: string
) => {
    const docRef = doc(db, 'complaints', id);
    const data = {
        adminResponse,
        status: 'Resolved', // Also update status to Resolved
        updatedAt: serverTimestamp(),
    };

    return updateDoc(docRef, data).catch((error) => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: docRef.path,
                operation: 'update',
                requestResourceData: data,
            })
        );
        // Re-throw the error to be caught by the calling component
        throw error;
    });
};

export const deleteComplaint = (db: Firestore, id: string) => {
    const docRef = doc(db, 'complaints', id);
    return deleteDoc(docRef).catch((error) => {
        errorEmitter.emit(
            'permission-error',
            new FirestorePermissionError({
                path: docRef.path,
                operation: 'delete',
            })
        );
        throw error;
    });
};
