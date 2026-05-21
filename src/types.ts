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

export type SubmissionStatus = {
  type: 'idle' | 'success' | 'error';
  message: string;
};
