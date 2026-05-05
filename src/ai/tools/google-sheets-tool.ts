'use server';
/**
 * @fileOverview A Genkit tool for managing a sequential letter number counter in Firestore.
 */
import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, runTransaction, doc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

// Initialize Firebase App if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

const counterRef = doc(db, 'counters', 'letterNumber');

export const getAndIncrementLetterNumberTool = ai.defineTool(
  {
    name: 'getAndIncrementLetterNumberTool',
    description: 'Reads the last letter number from Firestore, increments it, and returns the new number.',
    inputSchema: z.any(), // Input not used, but flow sends it.
    outputSchema: z.number(),
  },
  async () => {
    try {
      const newNumber = await runTransaction(db, async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        
        const lastNumber = counterDoc.exists() ? counterDoc.data().value : 0;
        const newNumber = lastNumber + 1;
        
        transaction.set(counterRef, { value: newNumber });
        
        return newNumber;
      });
      return newNumber;
    } catch (error: any) {
      console.error('Firestore Counter Tool Error:', error);
      throw new Error(`Failed to get next letter number from Firestore: ${error.message}`);
    }
  }
);
