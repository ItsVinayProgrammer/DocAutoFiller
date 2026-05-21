import type { ConfidenceScores, DocumentType, ExtractedFields, ExtractionMeta, ParsedFields } from '../types';
import { confidenceForMethod, createEmptyConfidenceScores } from './confidenceScore';
import { detectDocumentType } from './detectDocumentType';

const PERSONAL_INFORMATION = 'PERSONAL INFORMATION';
const IDENTITY_DETAILS = 'IDENTITY DETAILS';
const EMPLOYMENT_FINANCIAL_DETAILS = 'EMPLOYMENT & FINANCIAL DETAILS';
const REQUESTED_METRICS = 'REQUESTED METRICS';
const END_OF_DOCUMENT = 'END OF DOCUMENT';

const FULL_NAME = 'Full Name';
const EMAIL_ADDRESS = 'Email Address';
const PHONE_NUMBER = 'Phone Number';
const DATE_OF_BIRTH = 'Date of Birth';
const ADDRESS = 'Address';
const EMPLOYMENT_TYPE = 'Employment Type';
const MONTHLY_INCOME = 'Monthly Income';
const REQUESTED_LOAN_AMOUNT = 'Requested Loan Amount';

const fieldNames: Array<keyof ExtractedFields> = [
  'fullName',
  'email',
  'phoneNumber',
  'panNumber',
  'aadhaarNumber',
  'dateOfBirth',
  'address',
  'employmentType',
  'monthlyIncome',
  'requestedLoanAmount',
];

const datePattern = /\b(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{2}-\d{2}-\d{4})\b/;

function normalizeText(rawText: string): string {
  return rawText.replace(/\s+/g, ' ').trim();
}

function toUpper(text: string): string {
  return text.toUpperCase();
}

function findAnchorIndex(anchorText: string, anchor: string, fromIndex = 0): number {
  return anchorText.indexOf(anchor.toUpperCase(), fromIndex);
}

function sliceZone(text: string, anchorText: string, startAnchor: string, endAnchors: string[], fromIndex = 0): string {
  const startIndex = findAnchorIndex(anchorText, startAnchor, fromIndex);
  if (startIndex === -1) {
    return '';
  }

  const contentStart = startIndex + startAnchor.length;
  let endIndex = text.length;

  for (const endAnchor of endAnchors) {
    const candidateIndex = findAnchorIndex(anchorText, endAnchor, contentStart);
    if (candidateIndex !== -1 && candidateIndex < endIndex) {
      endIndex = candidateIndex;
    }
  }

  if (endIndex <= contentStart) {
    return '';
  }

  return text.substring(contentStart, endIndex).trim();
}

function extractMatchValue(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? '';
}

function cleanLeadingNoise(value: string): string {
  return value.replace(/^[:\s]+/, '').trim();
}

function cleanEmailFragments(value: string): string {
  return value.replace(/\S*@\S*/g, '').replace(/\s+/g, ' ').trim();
}

function extractFullName(personalZone: string): { value: string; confidence: number } {
  const startIndex = personalZone.indexOf(FULL_NAME);
  const endIndex = personalZone.indexOf(EMAIL_ADDRESS, startIndex + FULL_NAME.length);

  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return { value: '', confidence: 0 };
  }

  const value = cleanLeadingNoise(personalZone.substring(startIndex + FULL_NAME.length, endIndex));
  return { value, confidence: confidenceForMethod('label') };
}

function extractEmail(personalZone: string): { value: string; confidence: number } {
  const match = personalZone.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (match?.[1]) {
    return { value: match[1].trim(), confidence: confidenceForMethod('strong') };
  }

  const startIndex = personalZone.indexOf(EMAIL_ADDRESS);
  const endIndex = personalZone.indexOf(PHONE_NUMBER, startIndex + EMAIL_ADDRESS.length);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    return { value: '', confidence: 0 };
  }

  const value = cleanLeadingNoise(personalZone.substring(startIndex + EMAIL_ADDRESS.length, endIndex)).split(' ')[0]?.trim() ?? '';
  return { value, confidence: value ? confidenceForMethod('label') : 0 };
}

function extractAddress(rawText: string, personalZone: string, anchorText: string): { value: string; confidence: number } {
  const personalStartIndex = findAnchorIndex(anchorText, PERSONAL_INFORMATION);
  const candidateIndexes = [
    personalStartIndex,
    findAnchorIndex(anchorText, FULL_NAME, personalStartIndex),
    findAnchorIndex(anchorText, EMAIL_ADDRESS, personalStartIndex),
    findAnchorIndex(anchorText, PHONE_NUMBER, personalStartIndex),
    findAnchorIndex(anchorText, DATE_OF_BIRTH, personalStartIndex),
  ].filter((index) => index >= 0);
  const searchStart = candidateIndexes.length > 0 ? Math.max(...candidateIndexes) : 0;

  const addressLabelIndex = findAnchorIndex(anchorText, ADDRESS, searchStart);
  const identityLabelIndex = findAnchorIndex(anchorText, IDENTITY_DETAILS, addressLabelIndex + ADDRESS.length);

  if (addressLabelIndex !== -1 && identityLabelIndex !== -1 && identityLabelIndex > addressLabelIndex) {
    let addressSection = rawText.substring(addressLabelIndex + ADDRESS.length, identityLabelIndex);
    addressSection = addressSection.replace(/^[:\s]+/, '').trim();
    const value = cleanEmailFragments(addressSection);
    return { value, confidence: value ? confidenceForMethod('label') : 0 };
  }

  const fallbackSection = rawText.split(/Address\s*:?/i)[1]?.split(/IDENTITY/i)[0] ?? '';
  const value = cleanEmailFragments(fallbackSection.trim());
  return { value, confidence: value ? confidenceForMethod('fallback') : 0 };
}

function extractPhone(personalZone: string): { value: string; confidence: number } {
  const match = personalZone.match(/\b(?:\+91[-\s]?)?([6-9]\d{9})\b/);
  return match?.[1] ? { value: match[1].trim(), confidence: confidenceForMethod('strong') } : { value: '', confidence: 0 };
}

function extractPan(identityZone: string): { value: string; confidence: number } {
  const match = identityZone.match(/\b([A-Z]{5}\d{4}[A-Z])\b/i);
  return match?.[1] ? { value: match[1].toUpperCase().trim(), confidence: confidenceForMethod('strong') } : { value: '', confidence: 0 };
}

function extractAadhaar(identityZone: string): { value: string; confidence: number } {
  const match = identityZone.match(/\b(\d{12})\b/);
  return match?.[1] ? { value: match[1].trim(), confidence: confidenceForMethod('strong') } : { value: '', confidence: 0 };
}

function extractDateOfBirth(personalZone: string): { value: string; confidence: number } {
  const match = personalZone.match(datePattern);
  return match?.[1] ? { value: match[1].trim(), confidence: confidenceForMethod('strong') } : { value: '', confidence: 0 };
}

function extractEmploymentType(employmentZone: string, fallbackText: string): { value: string; confidence: number } {
  const text = employmentZone || fallbackText;
  const match = text.match(/\b(Salaried|Self-employed|Self employed|Other)\b/i);

  if (!match?.[1]) {
    return { value: '', confidence: 0 };
  }

  const value = match[1].toLowerCase() === 'self employed' ? 'Self-employed' : match[1].toLowerCase() === 'salaried' ? 'Salaried' : 'Other';
  return { value, confidence: confidenceForMethod('label') };
}

function extractMonthlyIncome(employmentZone: string): { value: string; confidence: number } {
  const startIndex = employmentZone.indexOf(MONTHLY_INCOME);
  if (startIndex === -1) {
    const fallbackMatch = employmentZone.match(/\b(\d+)\b/);
    return fallbackMatch?.[1] ? { value: fallbackMatch[1], confidence: confidenceForMethod('fallback') } : { value: '', confidence: 0 };
  }

  const remainder = employmentZone.substring(startIndex + MONTHLY_INCOME.length);
  const requestedMetricsIndex = remainder.indexOf(REQUESTED_METRICS);
  const deductionsIndex = remainder.indexOf('DEDUCTIONS');

  let endIndex = remainder.length;
  if (requestedMetricsIndex !== -1 && requestedMetricsIndex < endIndex) {
    endIndex = requestedMetricsIndex;
  }
  if (deductionsIndex !== -1 && deductionsIndex < endIndex) {
    endIndex = deductionsIndex;
  }

  const section = remainder.substring(0, endIndex);
  const match = section.match(/\b(\d+)\b/);
  return match?.[1] ? { value: match[1].trim(), confidence: confidenceForMethod('label') } : { value: '', confidence: 0 };
}

function extractRequestedLoanAmount(requestedMetricsZone: string): { value: string; confidence: number } {
  const startIndex = requestedMetricsZone.indexOf(REQUESTED_LOAN_AMOUNT);
  if (startIndex === -1) {
    const fallbackMatch = requestedMetricsZone.match(/\b(\d+)\b/);
    return fallbackMatch?.[1] ? { value: fallbackMatch[1], confidence: confidenceForMethod('fallback') } : { value: '', confidence: 0 };
  }

  const remainder = requestedMetricsZone.substring(startIndex + REQUESTED_LOAN_AMOUNT.length);
  const endIndex = remainder.indexOf(END_OF_DOCUMENT);
  const section = endIndex === -1 ? remainder : remainder.substring(0, endIndex);
  const match = section.match(/\b(\d+)\b/);
  return match?.[1] ? { value: match[1].trim(), confidence: confidenceForMethod('label') } : { value: '', confidence: 0 };
}

export function formatIndianCurrency(value: string | number): string {
  const numericText = typeof value === 'number' ? String(value) : value.replace(/[^\d.-]/g, '');
  if (!numericText) {
    return '';
  }

  const numericValue = Number(numericText);
  if (!Number.isFinite(numericValue)) {
    return '';
  }

  return Math.trunc(numericValue).toLocaleString('en-IN');
}

function buildExtractionMeta(extractedFields: ExtractedFields): ExtractionMeta {
  const isComplete = fieldNames.every((fieldName) => extractedFields[fieldName].trim().length > 0);

  return {
    executionTimestamp: new Date().toISOString(),
    isComplete,
  };
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

export function parseFields(rawText: string): ParsedFields {
  const normalizedText = normalizeText(rawText);
  const anchorText = toUpper(normalizedText);

  const personalZone =
    sliceZone(normalizedText, anchorText, PERSONAL_INFORMATION, [IDENTITY_DETAILS, EMPLOYMENT_FINANCIAL_DETAILS, REQUESTED_METRICS, END_OF_DOCUMENT]) ||
    normalizedText;

  const identityZone =
    sliceZone(normalizedText, anchorText, IDENTITY_DETAILS, [EMPLOYMENT_FINANCIAL_DETAILS, REQUESTED_METRICS, END_OF_DOCUMENT]) ||
    normalizedText;

  const employmentZone =
    sliceZone(normalizedText, anchorText, EMPLOYMENT_FINANCIAL_DETAILS, [REQUESTED_METRICS, END_OF_DOCUMENT]) ||
    normalizedText;

  const requestedMetricsZone =
    sliceZone(normalizedText, anchorText, REQUESTED_METRICS, [END_OF_DOCUMENT]) ||
    normalizedText;

  const fullName = extractFullName(personalZone);
  const email = extractEmail(personalZone);
  const phoneNumber = extractPhone(personalZone);
  const dateOfBirth = extractDateOfBirth(personalZone);
  const address = extractAddress(normalizedText, personalZone, anchorText);
  const panNumber = extractPan(identityZone);
  const aadhaarNumber = extractAadhaar(identityZone);
  const employmentType = extractEmploymentType(employmentZone, normalizedText);
  const monthlyIncome = extractMonthlyIncome(employmentZone);
  const requestedLoanAmount = extractRequestedLoanAmount(requestedMetricsZone);

  const extractedFields = createEmptyExtractedFields();
  const confidenceScores = createEmptyConfidenceScores();

  extractedFields.fullName = fullName.value;
  confidenceScores.fullName = fullName.confidence;

  extractedFields.email = email.value;
  confidenceScores.email = email.confidence;

  extractedFields.phoneNumber = phoneNumber.value;
  confidenceScores.phoneNumber = phoneNumber.confidence;

  extractedFields.panNumber = panNumber.value;
  confidenceScores.panNumber = panNumber.confidence;

  extractedFields.aadhaarNumber = aadhaarNumber.value;
  confidenceScores.aadhaarNumber = aadhaarNumber.confidence;

  extractedFields.dateOfBirth = dateOfBirth.value;
  confidenceScores.dateOfBirth = dateOfBirth.confidence;

  extractedFields.address = address.value;
  confidenceScores.address = address.confidence;

  extractedFields.employmentType = employmentType.value;
  confidenceScores.employmentType = employmentType.confidence;

  extractedFields.monthlyIncome = monthlyIncome.value;
  confidenceScores.monthlyIncome = monthlyIncome.confidence;

  extractedFields.requestedLoanAmount = requestedLoanAmount.value;
  confidenceScores.requestedLoanAmount = requestedLoanAmount.confidence;

  const formattedFinancialFields = {
    monthlyIncome: formatIndianCurrency(extractedFields.monthlyIncome),
    requestedLoanAmount: formatIndianCurrency(extractedFields.requestedLoanAmount),
  };

  const documentType: DocumentType = detectDocumentType(normalizedText);

  return {
    extractedFields,
    confidenceScores,
    formattedFinancialFields,
    extractionMeta: buildExtractionMeta(extractedFields),
    documentType,
  };
}