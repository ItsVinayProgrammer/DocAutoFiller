export * from './types/applicationTypes';

export type SubmissionStatus = {
  type: 'idle' | 'success' | 'error';
  message: string;
};
