import type { ExtractedFields } from '../types';

const lineBreakPattern = /\r/g;
const whitespacePattern = /\s+/g;

const fieldLabels = {
  fullName: ['full name', 'customer name', 'applicant name', 'name'],
  email: ['email address', 'email'],
  phoneNumber: ['phone number', 'mobile number', 'contact number', 'phone'],
  panNumber: ['pan number', 'pan'],
  aadhaarNumber: ['aadhaar number', 'aadhaar', 'aadhar number', 'aadhar'],
  dateOfBirth: ['date of birth', 'dob', 'd.o.b'],
  address: ['residential address', 'current address', 'address'],
  employmentType: ['employment type', 'occupation', 'profession', 'job type'],
  monthlyIncome: ['monthly income', 'income'],
  requestedLoanAmount: ['requested loan amount', 'loan amount', 'requested amount'],
} as const;

const allLabels = [
  ...fieldLabels.fullName,
  ...fieldLabels.email,
  ...fieldLabels.phoneNumber,
  ...fieldLabels.panNumber,
  ...fieldLabels.aadhaarNumber,
  ...fieldLabels.dateOfBirth,
  ...fieldLabels.address,
  ...fieldLabels.employmentType,
  ...fieldLabels.monthlyIncome,
  ...fieldLabels.requestedLoanAmount,
].sort((first, second) => second.length - first.length);

const emailPattern = /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/;
const phonePattern = /\b(?:\+91[-\s]?)?([6-9]\d{9})\b/;
const panPattern = /\b([A-Z]{5}\d{4}[A-Z])\b/;
const aadhaarPattern = /\b((?:\d{4}[\s-]?){2}\d{4})\b/;

function normalizeText(text: string): string {
  return text.replace(lineBreakPattern, '\n');
}

function normalizeLine(line: string): string {
  return line.replace(whitespacePattern, ' ').trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stopLabelLookahead(): string {
  return `(?=\\b(?:${allLabels.map(escapeRegExp).join('|')})\\b|$)`;
}

function extractAfterLabel(text: string, labels: readonly string[]): string {
  const normalizedText = normalizeText(text);
  const lines = normalizedText.split('\n').map(normalizeLine).filter(Boolean);
  const stopLookahead = stopLabelLookahead();

  for (const line of lines) {
    for (const label of labels) {
      const regex = new RegExp(
        `\\b${escapeRegExp(label)}\\b\\s*[:\\-]?\\s*(.+?)\\s*${stopLookahead}`,
        'i'
      );
      const match = line.match(regex);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  for (const label of labels) {
    const regex = new RegExp(
      `\\b${escapeRegExp(label)}\\b\\s*[:\\-]?\\s*(.+?)\\s*${stopLookahead}`,
      'is'
    );
    const match = normalizedText.match(regex);
    if (match?.[1]) {
      return normalizeLine(match[1]);
    }
  }

  return '';
}

function extractPatternValue(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  if (match?.[1]) {
    return match[1].trim();
  }

  return '';
}

function extractNumericValueAfterLabel(text: string, labels: readonly string[], valuePattern: RegExp): string {
  const normalizedText = normalizeText(text);
  const lines = normalizedText.split('\n').map(normalizeLine).filter(Boolean);

  for (const line of lines) {
    for (const label of labels) {
      const regex = new RegExp(`\\b${escapeRegExp(label)}\\b\\s*[:\\-]?\\s*${valuePattern.source}`, valuePattern.flags.includes('i') ? valuePattern.flags : `${valuePattern.flags}i`);
      const match = line.match(regex);
      if (match?.[1]) {
        return match[1].trim();
      }
    }
  }

  for (const label of labels) {
    const regex = new RegExp(`\\b${escapeRegExp(label)}\\b[^\\n]*?${valuePattern.source}`, valuePattern.flags.includes('i') ? valuePattern.flags : `${valuePattern.flags}is`);
    const match = normalizedText.match(regex);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return '';
}

export function parseFields(text: string): ExtractedFields {
  const normalized = normalizeText(text);
  const lines = normalized.split('\n').map(normalizeLine).filter(Boolean);
  const joined = lines.join(' ');

  const fullName = extractAfterLabel(normalized, fieldLabels.fullName).replace(/\b(?:email|phone|pan|aadhaar|address|income|loan)\b.*$/i, '').trim();
  const email = extractPatternValue(joined, emailPattern);
  const phoneNumber = extractNumericValueAfterLabel(normalized, fieldLabels.phoneNumber, phonePattern);
  const panNumber = extractPatternValue(joined, panPattern);
  const aadhaarNumber = extractNumericValueAfterLabel(normalized, fieldLabels.aadhaarNumber, aadhaarPattern);

  const dateOfBirth = extractAfterLabel(normalized, fieldLabels.dateOfBirth);
  const address = extractAfterLabel(normalized, fieldLabels.address);
  const employmentType = extractAfterLabel(normalized, fieldLabels.employmentType);
  const monthlyIncome = extractAfterLabel(normalized, fieldLabels.monthlyIncome);
  const requestedLoanAmount = extractAfterLabel(normalized, fieldLabels.requestedLoanAmount);

  return {
    fullName,
    email,
    phoneNumber,
    panNumber: panNumber.toUpperCase(),
    aadhaarNumber,
    dateOfBirth,
    address,
    employmentType,
    monthlyIncome,
    requestedLoanAmount,
  };
}
