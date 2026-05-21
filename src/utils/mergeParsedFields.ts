import type { ConfidenceScores, ExtractedFields, FieldConflict, FieldName, UploadedDocument } from '../types';
import { CONFIDENCE_LEVELS, clampConfidence, createEmptyConfidenceScores } from './confidenceScore';

function createEmptyFields(): ExtractedFields {
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

function normalizeValue(field: FieldName, value: string): string {
  const trimmed = value.trim();

  switch (field) {
    case 'panNumber':
      return trimmed.toUpperCase().replace(/\s+/g, '');
    case 'aadhaarNumber':
    case 'phoneNumber':
    case 'monthlyIncome':
    case 'requestedLoanAmount':
      return trimmed.replace(/[^\d]/g, '');
    case 'email':
      return trimmed.toLowerCase();
    case 'dateOfBirth':
      return trimmed;
    default:
      return trimmed.replace(/\s+/g, ' ').toLowerCase();
  }
}

function displayValue(field: FieldName, value: string): string {
  const trimmed = value.trim();
  if (field === 'panNumber') {
    return trimmed.toUpperCase();
  }

  return trimmed;
}

function scoreFromDocument(document: UploadedDocument, field: FieldName): number {
  return clampConfidence(document.parsedFields.confidenceScores[field] ?? CONFIDENCE_LEVELS.missing);
}

export interface MergeParsedFieldsResult {
  finalFormData: ExtractedFields;
  fieldConfidenceScores: ConfidenceScores;
  fieldConflicts: FieldConflict[];
}

export function mergeParsedFields(
  documents: UploadedDocument[],
  manualSelections: Partial<Record<FieldName, string>> = {}
): MergeParsedFieldsResult {
  const finalFormData = createEmptyFields();
  const fieldConfidenceScores = createEmptyConfidenceScores();
  const fieldConflicts: FieldConflict[] = [];

  const fieldNames: FieldName[] = [
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

  for (const field of fieldNames) {
    const candidates = documents
      .map((document) => {
        const value = document.parsedFields.extractedFields[field] ?? '';
        return {
          documentId: document.id,
          fileName: document.fileName,
          value: displayValue(field, value),
          normalizedValue: normalizeValue(field, value),
          confidence: scoreFromDocument(document, field),
        };
      })
      .filter((candidate) => candidate.normalizedValue.length > 0);

    const manualValue = manualSelections[field]?.trim() ?? '';
    if (manualValue) {
      finalFormData[field] = displayValue(field, manualValue);
      fieldConfidenceScores[field] = CONFIDENCE_LEVELS.manual;

      const conflictValues = candidates.map((candidate) => ({
        documentId: candidate.documentId,
        fileName: candidate.fileName,
        confidence: candidate.confidence,
        value: candidate.value,
      }));

      if (conflictValues.length > 0) {
        fieldConflicts.push({
          field,
          values: conflictValues,
          resolvedValue: displayValue(field, manualValue),
          isResolved: true,
        });
      }

      continue;
    }

    const groupedByValue = new Map<string, typeof candidates>();
    for (const candidate of candidates) {
      const list = groupedByValue.get(candidate.normalizedValue) ?? [];
      list.push(candidate);
      groupedByValue.set(candidate.normalizedValue, list);
    }

    const uniqueGroups = Array.from(groupedByValue.values());
    if (uniqueGroups.length === 0) {
      finalFormData[field] = '';
      fieldConfidenceScores[field] = CONFIDENCE_LEVELS.missing;
      continue;
    }

    if (uniqueGroups.length === 1) {
      const bestCandidate = uniqueGroups[0].reduce((best, current) => (current.confidence > best.confidence ? current : best), uniqueGroups[0][0]);
      finalFormData[field] = bestCandidate.value;
      fieldConfidenceScores[field] = bestCandidate.confidence;
      continue;
    }

    const conflictValues = uniqueGroups.map((group) => {
      const bestCandidate = group.reduce((best, current) => (current.confidence > best.confidence ? current : best), group[0]);
      return {
        documentId: bestCandidate.documentId,
        fileName: bestCandidate.fileName,
        confidence: bestCandidate.confidence,
        value: bestCandidate.value,
      };
    });

    const bestOverall = conflictValues.reduce((best, current) => (current.confidence > best.confidence ? current : best), conflictValues[0]);
    finalFormData[field] = bestOverall.value;
    fieldConfidenceScores[field] = bestOverall.confidence;
    fieldConflicts.push({
      field,
      values: conflictValues,
      isResolved: false,
    });
  }

  return {
    finalFormData,
    fieldConfidenceScores,
    fieldConflicts,
  };
}
