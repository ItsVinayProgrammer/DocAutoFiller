export type ExtractedFields = {
  fullName: string;
  email: string;
  phoneNumber: string;
  panNumber: string;
  aadhaarNumber: string;
  dateOfBirth: string;
  address: string;
  employmentType: string;
  monthlyIncome: string;
  requestedLoanAmount: string;
};

export type FormattedFinancialFields = {
  monthlyIncome: string;
  requestedLoanAmount: string;
};

export type ExtractionMeta = {
  executionTimestamp: string;
  isComplete: boolean;
};

export type ParsedExtractionResult = {
  extractedFields: ExtractedFields;
  formattedFinancialFields: FormattedFinancialFields;
  extractionMeta: ExtractionMeta;
};

export type SubmissionStatus = {
  type: 'idle' | 'success' | 'error';
  message: string;
};
