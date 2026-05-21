import type { ExtractedFields, ExtractionMeta, FormattedFinancialFields, ParsedExtractionResult } from '../types';

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

const CRITICAL_FIELDS: Array<keyof ExtractedFields> = [
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

function toAnchorText(text: string): string {
  return text.toUpperCase();
}

function findAnchorIndex(anchorText: string, anchor: string, fromIndex = 0): number {
  return anchorText.indexOf(anchor.toUpperCase(), fromIndex);
}

function sliceAfterAnchor(text: string, anchorText: string, startAnchor: string, endAnchors: string[], fromIndex = 0): string {
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

function pickFirstMatch(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  return match?.[1]?.trim() ?? '';
}

function extractEmail(section: string): string {
  return pickFirstMatch(section, /\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
}

function extractPhone(section: string): string {
  return pickFirstMatch(section, /\b(?:\+91[-\s]?)?([6-9]\d{9})\b/);
}

function extractPan(section: string): string {
  return pickFirstMatch(section, /\b([A-Z]{5}\d{4}[A-Z])\b/i).toUpperCase();
}

function extractAadhaar(section: string): string {
  return pickFirstMatch(section, /\b(\d{12})\b/);
}

function extractDateOfBirth(section: string): string {
  return pickFirstMatch(section, datePattern);
}

function cleanLeadingNoise(value: string): string {
  return value.replace(/^[:\s]+/, '').trim();
}

function cleanEmailFragments(value: string): string {
  return value.replace(/\S*@\S*/g, '').replace(/\s+/g, ' ').trim();
}

function extractFullName(personalZone: string): string {
  return cleanLeadingNoise(
    sliceAfterAnchor(personalZone, toAnchorText(personalZone), FULL_NAME, [EMAIL_ADDRESS, PHONE_NUMBER, DATE_OF_BIRTH, ADDRESS])
  );
}

function extractAddress(rawText: string, anchorText: string): string {
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
    return cleanEmailFragments(addressSection);
  }

  const fallbackSection = rawText.split(/Address\s*:?/i)[1]?.split(/IDENTITY/i)[0] ?? '';
  return cleanEmailFragments(fallbackSection.trim());
}

function extractEmploymentType(section: string): string {
  const match = section.match(/\b(Salaried|Self-employed|Self employed|Other)\b/i);
  if (!match?.[1]) {
    return '';
  }

  const value = match[1].toLowerCase();
  if (value === 'self employed') {
    return 'Self-employed';
  }

  if (value === 'salaried') {
    return 'Salaried';
  }

  return 'Other';
}

function extractDigits(section: string): string {
  const match = section.match(/\b(\d+)\b/);
  return match?.[1]?.trim() ?? '';
}

function extractNumericField(section: string): string {
  return extractDigits(section.replace(/\b(?:INR|REQUESTED|METRICS|DEDUCTIONS|END OF DOCUMENT)\b/gi, ' '));
}

function formatIndianCurrency(value: string | number): string {
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

function buildExtractionMeta(fields: ExtractedFields): ExtractionMeta {
  const isComplete = CRITICAL_FIELDS.every((field) => fields[field].trim().length > 0);

  return {
    executionTimestamp: new Date().toISOString(),
    isComplete,
  };
}

export function parseFields(rawText: string): ParsedExtractionResult {
  const normalizedText = normalizeText(rawText);
  const anchorText = toAnchorText(normalizedText);

  const personalZone =
    sliceAfterAnchor(normalizedText, anchorText, PERSONAL_INFORMATION, [IDENTITY_DETAILS, EMPLOYMENT_FINANCIAL_DETAILS, REQUESTED_METRICS, END_OF_DOCUMENT]) ||
    normalizedText;

  const identityZone =
    sliceAfterAnchor(normalizedText, anchorText, IDENTITY_DETAILS, [EMPLOYMENT_FINANCIAL_DETAILS, REQUESTED_METRICS, END_OF_DOCUMENT]) ||
    normalizedText;

  const employmentZone =
    sliceAfterAnchor(normalizedText, anchorText, EMPLOYMENT_FINANCIAL_DETAILS, [REQUESTED_METRICS, END_OF_DOCUMENT]) ||
    normalizedText;

  const requestedMetricsZone =
    sliceAfterAnchor(normalizedText, anchorText, REQUESTED_METRICS, [END_OF_DOCUMENT]) ||
    normalizedText;

  const fullName = extractFullName(personalZone);

  const emailSection = sliceAfterAnchor(personalZone, toAnchorText(personalZone), EMAIL_ADDRESS, [PHONE_NUMBER, DATE_OF_BIRTH, ADDRESS]);
  const email = extractEmail(emailSection);

  const phoneSection = sliceAfterAnchor(personalZone, toAnchorText(personalZone), PHONE_NUMBER, [DATE_OF_BIRTH, ADDRESS]);
  const phoneNumber = extractPhone(phoneSection);

  const dobSection = sliceAfterAnchor(personalZone, toAnchorText(personalZone), DATE_OF_BIRTH, [ADDRESS, IDENTITY_DETAILS, EMPLOYMENT_FINANCIAL_DETAILS]);
  const dateOfBirth = extractDateOfBirth(dobSection);

  const address = extractAddress(normalizedText, anchorText);

  const panNumber = extractPan(identityZone);
  const aadhaarNumber = extractAadhaar(identityZone);

  const employmentTypeSection = sliceAfterAnchor(employmentZone, toAnchorText(employmentZone), EMPLOYMENT_TYPE, [MONTHLY_INCOME, REQUESTED_METRICS, END_OF_DOCUMENT]);
  const employmentType = extractEmploymentType(employmentTypeSection || employmentZone);

  const monthlyIncomeSection = sliceAfterAnchor(employmentZone, toAnchorText(employmentZone), MONTHLY_INCOME, [REQUESTED_METRICS, END_OF_DOCUMENT]);
  const monthlyIncome = extractNumericField(monthlyIncomeSection);

  const requestedLoanAmountSection = sliceAfterAnchor(requestedMetricsZone, toAnchorText(requestedMetricsZone), REQUESTED_LOAN_AMOUNT, [END_OF_DOCUMENT]);
  const requestedLoanAmount = extractNumericField(requestedLoanAmountSection);

  const extractedFields: ExtractedFields = {
    fullName: fullName.trim(),
    email: email.trim(),
    phoneNumber: phoneNumber.trim(),
    panNumber: panNumber.trim(),
    aadhaarNumber: aadhaarNumber.trim(),
    dateOfBirth: dateOfBirth.trim(),
    address: address.trim(),
    employmentType: employmentType.trim(),
    monthlyIncome: monthlyIncome.trim(),
    requestedLoanAmount: requestedLoanAmount.trim(),
  };

  const formattedFinancialFields: FormattedFinancialFields = {
    monthlyIncome: formatIndianCurrency(extractedFields.monthlyIncome),
    requestedLoanAmount: formatIndianCurrency(extractedFields.requestedLoanAmount),
  };

  return {
    extractedFields,
    formattedFinancialFields,
    extractionMeta: buildExtractionMeta(extractedFields),
  };
}

export { formatIndianCurrency };