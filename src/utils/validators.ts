import type { ExtractedFields } from '../types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+91[-\s]?)?[6-9]\d{9}$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const aadhaarPattern = /^(?:\d{4}[\s-]?){2}\d{4}$/;

export function validateExtractedFields(fields: ExtractedFields): string[] {
  const errors: string[] = [];

  if (!fields.fullName.trim()) errors.push('Full Name is required.');
  if (!fields.email.trim()) errors.push('Email is required.');
  if (fields.email.trim() && !emailPattern.test(fields.email.trim())) errors.push('Email format is invalid.');
  if (!fields.phoneNumber.trim()) errors.push('Phone Number is required.');
  if (fields.phoneNumber.trim() && !phonePattern.test(fields.phoneNumber.replace(/\s+/g, '').trim())) {
    errors.push('Phone Number format is invalid.');
  }
  if (!fields.panNumber.trim()) errors.push('PAN Number is required.');
  if (fields.panNumber.trim() && !panPattern.test(fields.panNumber.trim().toUpperCase())) errors.push('PAN Number format is invalid.');
  if (fields.aadhaarNumber.trim() && !aadhaarPattern.test(fields.aadhaarNumber.trim())) errors.push('Aadhaar Number format is invalid.');
  if (!fields.dateOfBirth.trim()) errors.push('Date of Birth is required.');
  if (!fields.address.trim()) errors.push('Address is required.');
  if (!fields.employmentType.trim()) errors.push('Employment Type is required.');
  if (!fields.monthlyIncome.trim()) errors.push('Monthly Income is required.');
  if (!fields.requestedLoanAmount.trim()) errors.push('Requested Loan Amount is required.');

  return errors;
}
