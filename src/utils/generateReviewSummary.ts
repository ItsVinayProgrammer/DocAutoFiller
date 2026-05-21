import type { ExtractedFields, RiskFlag, ValidationErrors } from '../types';
import { formatIndianCurrency } from './parseFields';

function hasCriticalFlag(riskFlags: RiskFlag[], code: string): boolean {
  return riskFlags.some((flag) => flag.code === code);
}

export function generateReviewSummary(
  fields: ExtractedFields,
  validationErrors: ValidationErrors,
  riskFlags: RiskFlag[]
): string {
  const applicantName = fields.fullName.trim() || 'Unknown applicant';
  const employmentType = fields.employmentType.trim() || 'Unspecified';
  const monthlyIncome = fields.monthlyIncome.trim() ? `₹${formatIndianCurrency(fields.monthlyIncome)}` : 'not captured';
  const requestedLoanAmount = fields.requestedLoanAmount.trim() ? `₹${formatIndianCurrency(fields.requestedLoanAmount)}` : 'not captured';

  const panValid = /^\w{5}\d{4}\w$/i.test(fields.panNumber.trim());
  const aadhaarValid = /^\d{12}$/.test(fields.aadhaarNumber.replace(/\s+/g, '').trim());
  const missingCriticalFields = Object.entries(validationErrors.fieldErrors).some(([, errors]) => (errors ?? []).some((message) => message.toLowerCase().includes('required')));
  const unresolvedWarnings = riskFlags.filter((flag) => flag.severity === 'critical' || flag.code === 'field-conflict');
  const formatStatus = panValid && aadhaarValid ? 'PAN and Aadhaar formats are valid.' : 'PAN or Aadhaar format needs review.';

  const status = validationErrors.isValid && unresolvedWarnings.length === 0
    ? 'Ready for human verification.'
    : 'Needs correction before submission.';

  return [
    `Applicant ${applicantName} is ${employmentType} with monthly income of ${monthlyIncome} and requested loan amount of ${requestedLoanAmount}.`,
    formatStatus,
    missingCriticalFields ? 'Mandatory fields are missing.' : 'No mandatory fields are missing.',
    hasCriticalFlag(riskFlags, 'field-conflict') ? 'Conflicts detected across documents.' : 'No field conflicts detected.',
    `Status: ${status}`,
  ].join(' ');
}
