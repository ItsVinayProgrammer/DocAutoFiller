import type { ConfidenceScores, FieldName } from '../types';

export const CONFIDENCE_LEVELS = {
  strong: 95,
  label: 85,
  fallback: 60,
  missing: 0,
  manual: 100,
} as const;

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

export function createEmptyConfidenceScores(): ConfidenceScores {
  return fieldNames.reduce<ConfidenceScores>((scores, fieldName) => {
    scores[fieldName] = CONFIDENCE_LEVELS.missing;
    return scores;
  }, {} as ConfidenceScores);
}

export function confidenceForMethod(method: 'strong' | 'label' | 'fallback' | 'manual' | 'missing'): number {
  switch (method) {
    case 'strong':
      return CONFIDENCE_LEVELS.strong;
    case 'label':
      return CONFIDENCE_LEVELS.label;
    case 'fallback':
      return CONFIDENCE_LEVELS.fallback;
    case 'manual':
      return CONFIDENCE_LEVELS.manual;
    case 'missing':
    default:
      return CONFIDENCE_LEVELS.missing;
  }
}

export function clampConfidence(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}
