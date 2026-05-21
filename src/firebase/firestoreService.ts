import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { createEmptyConfidenceScores } from '../utils/confidenceScore';
import type { ConfidenceScores, ExtractedFields, FieldConflict, LoanApplication, RiskFlag, ReviewStatus, ValidationErrors } from '../types';

export type LoanApplicationPayload = Omit<LoanApplication, 'id' | 'createdAt' | 'updatedAt'>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function createEmptyExtractedFields(): ExtractedFields {
  return {
    fullName: '',
    email: '',
    phoneNumber: '',
    panNumber: '',
    aadhaarNumber: '',
    dateOfBirth: '',
    address: '',
    employmentType: '',
    monthlyIncome: '',
    requestedLoanAmount: '',
  };
}

function createEmptyValidationErrors(): ValidationErrors {
  return {
    fieldErrors: {},
    generalErrors: [],
    isValid: true,
  };
}

function parseTimestamp(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }

  return '';
}

function isReviewStatus(value: unknown): value is ReviewStatus {
  return value === 'Pending Review' || value === 'Verified' || value === 'Needs Correction' || value === 'Submitted';
}

function normalizeValidationErrors(value: unknown): ValidationErrors {
  if (!isRecord(value)) {
    return createEmptyValidationErrors();
  }

  return {
    fieldErrors: isRecord(value.fieldErrors) ? (value.fieldErrors as ValidationErrors['fieldErrors']) : {},
    generalErrors: Array.isArray(value.generalErrors) ? value.generalErrors.filter((message): message is string => typeof message === 'string') : [],
    isValid: typeof value.isValid === 'boolean' ? value.isValid : true,
  };
}

function normalizeLoanApplication(data: unknown, id: string): LoanApplication {
  const record = isRecord(data) ? data : {};
  const finalFormData = isRecord(record.finalFormData) ? { ...createEmptyExtractedFields(), ...(record.finalFormData as Partial<ExtractedFields>) } : createEmptyExtractedFields();
  const fieldConfidenceScores = isRecord(record.fieldConfidenceScores)
    ? { ...createEmptyConfidenceScores(), ...(record.fieldConfidenceScores as Partial<ConfidenceScores>) }
    : createEmptyConfidenceScores();

  return {
    id,
    finalFormData,
    uploadedDocuments: Array.isArray(record.uploadedDocuments) ? (record.uploadedDocuments as LoanApplication['uploadedDocuments']) : [],
    fieldConfidenceScores,
    fieldConflicts: Array.isArray(record.fieldConflicts) ? (record.fieldConflicts as FieldConflict[]) : [],
    validationErrors: normalizeValidationErrors(record.validationErrors),
    riskFlags: Array.isArray(record.riskFlags) ? (record.riskFlags as RiskFlag[]) : [],
    aiReviewSummary: typeof record.aiReviewSummary === 'string' ? record.aiReviewSummary : '',
    reviewStatus: isReviewStatus(record.reviewStatus) ? record.reviewStatus : 'Pending Review',
    auditTrail: Array.isArray(record.auditTrail) ? (record.auditTrail as LoanApplication['auditTrail']) : [],
    createdAt: parseTimestamp(record.createdAt),
    updatedAt: parseTimestamp(record.updatedAt),
    source: typeof record.source === 'string' ? (record.source as LoanApplication['source']) : 'Multi Document Upload Prototype',
  };
}

function sortApplicationsByDate(applications: LoanApplication[]): LoanApplication[] {
  const parseSortableTimestamp = (value: string): number => {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  };

  return [...applications].sort((left, right) => {
    const leftTimestamp = parseSortableTimestamp(left.createdAt || left.updatedAt || '');
    const rightTimestamp = parseSortableTimestamp(right.createdAt || right.updatedAt || '');

    return rightTimestamp - leftTimestamp;
  });
}

export async function submitLoanApplication(payload: LoanApplicationPayload): Promise<void> {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables before submitting.');
  }

  await addDoc(collection(db, 'loanApplications'), {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export const saveLoanApplication = submitLoanApplication;

export async function getLoanApplications(): Promise<LoanApplication[]> {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables to view submitted applications.');
  }

  const loanApplicationsQuery = query(collection(db, 'loanApplications'));
  const snapshot = await getDocs(loanApplicationsQuery);
  const applications = snapshot.docs.map((documentSnapshot) => normalizeLoanApplication(documentSnapshot.data(), documentSnapshot.id));
  return sortApplicationsByDate(applications);
}

export async function getLoanApplicationById(id: string): Promise<LoanApplication | null> {
  if (!db) {
    throw new Error('Firebase is not configured. Add the VITE_FIREBASE_* environment variables to view submitted applications.');
  }

  const documentSnapshot = await getDoc(doc(db, 'loanApplications', id));
  if (!documentSnapshot.exists()) {
    return null;
  }

  return normalizeLoanApplication(documentSnapshot.data(), documentSnapshot.id);
}