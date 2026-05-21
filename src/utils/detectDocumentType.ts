import type { DocumentType } from '../types';

export function detectDocumentType(rawText: string): DocumentType {
  const normalized = rawText.toUpperCase();

  if (normalized.includes('REQUESTED LOAN AMOUNT') || normalized.includes('LOAN APPLICATION')) {
    return 'Loan Application Form';
  }

  if (normalized.includes('PAN NUMBER') || normalized.includes('AADHAAR NUMBER')) {
    return 'Identity Document';
  }

  if (normalized.includes('MONTHLY INCOME') || normalized.includes('SALARY') || normalized.includes('EMPLOYMENT TYPE')) {
    return 'Income Document';
  }

  if (normalized.includes('BORROWER FINANCIAL PROFILE') || normalized.includes('PERSONAL INFORMATION')) {
    return 'Borrower Financial Profile';
  }

  return 'Unknown Document';
}
