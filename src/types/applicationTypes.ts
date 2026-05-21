export type FieldName =
  | 'fullName'
  | 'email'
  | 'phoneNumber'
  | 'panNumber'
  | 'aadhaarNumber'
  | 'dateOfBirth'
  | 'address'
  | 'employmentType'
  | 'monthlyIncome'
  | 'requestedLoanAmount';

export type DocumentType =
  | 'Loan Application Form'
  | 'Borrower Financial Profile'
  | 'Identity Document'
  | 'Income Document'
  | 'Unknown Document';

export type ExtractionStatus = 'queued' | 'processing' | 'completed' | 'failed';

export type ReviewStatus = 'Pending Review' | 'Verified' | 'Needs Correction' | 'Submitted';

export type ExtractedFields = Record<FieldName, string>;

export type ConfidenceScores = Record<FieldName, number>;

export interface ParsedFields {
  extractedFields: ExtractedFields;
  confidenceScores: ConfidenceScores;
  formattedFinancialFields: FormattedFinancialFields;
  extractionMeta: ExtractionMeta;
  documentType: DocumentType;
}

export interface FieldConflictValue {
  value: string;
  fileName: string;
  documentId: string;
  confidence: number;
}

export interface FieldConflict {
  field: FieldName;
  values: FieldConflictValue[];
  resolvedValue?: string;
  isResolved: boolean;
}

export interface ValidationErrors {
  fieldErrors: Partial<Record<FieldName, string[]>>;
  generalErrors: string[];
  isValid: boolean;
}

export interface RiskFlag {
  id: string;
  code: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
  description: string;
}

export interface AuditEvent {
  id: string;
  timestamp: string;
  action:
    | 'documents_uploaded'
    | 'text_extracted'
    | 'fields_parsed'
    | 'conflicts_detected'
    | 'field_edited'
    | 'validation_completed'
    | 'form_marked_verified'
    | 'submitted_to_firestore';
  description: string;
  documentId?: string;
  fileName?: string;
  field?: FieldName;
}

export interface FormattedFinancialFields {
  monthlyIncome: string;
  requestedLoanAmount: string;
}

export interface ExtractionMeta {
  executionTimestamp: string;
  isComplete: boolean;
}

export interface UploadedDocument {
  id: string;
  fileName: string;
  documentType: DocumentType;
  rawText: string;
  parsedFields: ParsedFields;
  extractionStatus: ExtractionStatus;
  errorMessage?: string;
}

export interface LoanApplication {
  id?: string;
  finalFormData: ExtractedFields;
  uploadedDocuments: Array<Pick<UploadedDocument, 'fileName' | 'documentType' | 'rawText' | 'parsedFields' | 'extractionStatus'>>;
  fieldConfidenceScores: ConfidenceScores;
  fieldConflicts: FieldConflict[];
  validationErrors: ValidationErrors;
  riskFlags: RiskFlag[];
  aiReviewSummary: string;
  reviewStatus: ReviewStatus;
  auditTrail: AuditEvent[];
  createdAt: string;
  updatedAt: string;
  source: 'Multi Document Upload Prototype';
}

export type ParsedExtractionResult = ParsedFields;