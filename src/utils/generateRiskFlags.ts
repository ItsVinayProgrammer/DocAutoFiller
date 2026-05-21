import type { ExtractedFields, FieldConflict, RiskFlag, ReviewStatus, ValidationErrors } from '../types';

function addFlag(flags: RiskFlag[], code: string, label: string, severity: RiskFlag['severity'], description: string): void {
  flags.push({
    id: `${code}-${flags.length + 1}`,
    code,
    label,
    severity,
    description,
  });
}

function parseNumericValue(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function generateRiskFlags(
  fields: ExtractedFields,
  validationErrors: ValidationErrors,
  conflicts: FieldConflict[],
  reviewStatus: ReviewStatus
): RiskFlag[] {
  const flags: RiskFlag[] = [];

  if (!fields.panNumber.trim()) {
    addFlag(flags, 'missing-pan', 'Missing PAN', 'critical', 'PAN is required before submission.');
  } else if (!/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(fields.panNumber.trim().toUpperCase())) {
    addFlag(flags, 'invalid-pan', 'Invalid PAN format', 'critical', 'PAN must be 5 uppercase letters, 4 digits, and 1 uppercase letter.');
  }

  if (!fields.aadhaarNumber.trim()) {
    addFlag(flags, 'missing-aadhaar', 'Missing Aadhaar', 'critical', 'Aadhaar is required before submission.');
  } else if (!/^\d{12}$/.test(fields.aadhaarNumber.replace(/\s+/g, '').trim())) {
    addFlag(flags, 'invalid-aadhaar', 'Invalid Aadhaar format', 'critical', 'Aadhaar must be exactly 12 digits.');
  }

  if (!fields.phoneNumber.trim() || !/^[6-9]\d{9}$/.test(fields.phoneNumber.replace(/\s+/g, '').trim())) {
    addFlag(flags, 'invalid-phone', 'Invalid phone number', 'critical', 'Phone number must contain exactly 10 digits and start with 6, 7, 8, or 9.');
  }

  if (!fields.monthlyIncome.trim()) {
    addFlag(flags, 'missing-income', 'Monthly income missing', 'warning', 'Monthly income was not captured from the documents.');
  }

  const monthlyIncome = parseNumericValue(fields.monthlyIncome);
  const requestedLoanAmount = parseNumericValue(fields.requestedLoanAmount);
  if (monthlyIncome > 0 && requestedLoanAmount > monthlyIncome * 15) {
    addFlag(flags, 'loan-vs-income', 'Loan amount unusually high', 'warning', 'Requested loan amount is more than 15 times the monthly income.');
  }

  if (conflicts.length > 0) {
    addFlag(flags, 'field-conflict', 'Field conflict detected', 'warning', 'At least one field has conflicting values across uploaded documents.');
  }

  if (reviewStatus !== 'Verified') {
    addFlag(flags, 'manual-review', 'Manual review required', 'info', 'Application must be marked Verified before submission.');
  }

  const hasValidationIssues = !validationErrors.isValid || Object.keys(validationErrors.fieldErrors).length > 0;
  if (hasValidationIssues) {
    addFlag(flags, 'validation-required', 'Validation issues present', 'critical', 'Please resolve validation errors before submitting.');
  }

  return flags;
}
