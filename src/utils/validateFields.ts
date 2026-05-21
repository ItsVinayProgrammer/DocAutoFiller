import type { ExtractedFields, ValidationErrors } from '../types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^(?:\+91[-\s]?)?[6-9]\d{9}$/;
const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const aadhaarPattern = /^\d{12}$/;
const dobPattern = /^\d{4}-\d{2}-\d{2}$/;

function createEmptyValidationErrors(): ValidationErrors {
  return {
    fieldErrors: {},
    generalErrors: [],
    isValid: true,
  };
}

function addFieldError(errors: ValidationErrors, field: keyof ExtractedFields, message: string): void {
  errors.fieldErrors[field] = [...(errors.fieldErrors[field] ?? []), message];
  errors.generalErrors = [...errors.generalErrors, message];
}

function isNumericText(value: string): boolean {
  return /^\d+(?:\.\d+)?$/.test(value.replace(/,/g, '').trim());
}

function toNumber(value: string): number {
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : 0;
}

export function validateFields(fields: ExtractedFields): ValidationErrors {
  const errors = createEmptyValidationErrors();

  if (!fields.fullName.trim()) {
    addFieldError(errors, 'fullName', 'Full Name is required.');
  }

  if (!fields.email.trim()) {
    addFieldError(errors, 'email', 'Email is required.');
  } else if (!emailPattern.test(fields.email.trim())) {
    addFieldError(errors, 'email', 'Email format is invalid.');
  }

  if (!fields.phoneNumber.trim()) {
    addFieldError(errors, 'phoneNumber', 'Phone Number is required.');
  } else if (!phonePattern.test(fields.phoneNumber.replace(/\s+/g, '').trim())) {
    addFieldError(errors, 'phoneNumber', 'Phone Number must be exactly 10 digits.');
  }

  if (!fields.panNumber.trim()) {
    addFieldError(errors, 'panNumber', 'PAN Number is required.');
  } else if (!panPattern.test(fields.panNumber.trim().toUpperCase())) {
    addFieldError(errors, 'panNumber', 'PAN Number format is invalid.');
  }

  if (!fields.aadhaarNumber.trim()) {
    addFieldError(errors, 'aadhaarNumber', 'Aadhaar Number is required.');
  } else if (!aadhaarPattern.test(fields.aadhaarNumber.replace(/\s+/g, '').trim())) {
    addFieldError(errors, 'aadhaarNumber', 'Aadhaar Number must be 12 digits.');
  }

  if (!fields.dateOfBirth.trim()) {
    addFieldError(errors, 'dateOfBirth', 'Date of Birth is required.');
  } else if (!dobPattern.test(fields.dateOfBirth.trim())) {
    addFieldError(errors, 'dateOfBirth', 'Date of Birth must be in YYYY-MM-DD format.');
  }

  if (!fields.address.trim()) {
    addFieldError(errors, 'address', 'Address is required.');
  }

  if (!fields.employmentType.trim()) {
    addFieldError(errors, 'employmentType', 'Employment Type is required.');
  }

  if (!fields.monthlyIncome.trim()) {
    addFieldError(errors, 'monthlyIncome', 'Monthly Income is required.');
  } else if (!isNumericText(fields.monthlyIncome)) {
    addFieldError(errors, 'monthlyIncome', 'Monthly Income must be numeric.');
  } else if (toNumber(fields.monthlyIncome) <= 0) {
    addFieldError(errors, 'monthlyIncome', 'Monthly Income must be greater than 0.');
  }

  if (!fields.requestedLoanAmount.trim()) {
    addFieldError(errors, 'requestedLoanAmount', 'Requested Loan Amount is required.');
  } else if (!isNumericText(fields.requestedLoanAmount)) {
    addFieldError(errors, 'requestedLoanAmount', 'Requested Loan Amount must be numeric.');
  } else if (toNumber(fields.requestedLoanAmount) <= 0) {
    addFieldError(errors, 'requestedLoanAmount', 'Requested Loan Amount must be greater than 0.');
  }

  errors.isValid = Object.keys(errors.fieldErrors).length === 0 && errors.generalErrors.length === 0;
  return errors;
}
