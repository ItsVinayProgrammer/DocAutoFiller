import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig'; 
import type { ExtractedFields } from '../types';

type LoanApplicationPayload = {
  extractedFields: ExtractedFields;
  rawExtractedText: string;
  status: 'Submitted';
  source: 'Document Upload Prototype';
};

export async function saveLoanApplication(payload: LoanApplicationPayload): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables before submitting.');
  }

  await addDoc(collection(db, 'loanApplications'), {
    ...payload,
    createdAt: serverTimestamp(),
  });
}