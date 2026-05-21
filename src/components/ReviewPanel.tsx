import { AIReviewSummary } from './AIReviewSummary';
import { RiskFlagsPanel } from './RiskFlagsPanel';
import type { RiskFlag, ReviewStatus, ValidationErrors } from '../types';

type ReviewPanelProps = {
  hasCompletedDocuments: boolean;
  reviewStatus: ReviewStatus;
  validationErrors: ValidationErrors;
  riskFlags: RiskFlag[];
  summary: string;
  canSubmit: boolean;
  isSubmitting: boolean;
  onReviewStatusChange: (status: ReviewStatus) => void;
  onSubmit: () => void;
};

function collectValidationMessages(validationErrors: ValidationErrors): string[] {
  const messages = new Set<string>();

  for (const fieldMessages of Object.values(validationErrors.fieldErrors)) {
    for (const message of fieldMessages ?? []) {
      messages.add(message);
    }
  }

  for (const message of validationErrors.generalErrors) {
    messages.add(message);
  }

  return Array.from(messages);
}

export function ReviewPanel({
  hasCompletedDocuments,
  reviewStatus,
  validationErrors,
  riskFlags,
  summary,
  canSubmit,
  isSubmitting,
  onReviewStatusChange,
  onSubmit,
}: ReviewPanelProps) {
  const validationMessages = collectValidationMessages(validationErrors);

  if (!hasCompletedDocuments) {
    return (
      <div className="card empty-state workflow-empty-state">
        <p className="card-label">Review</p>
        <p>Upload borrower documents to generate validation, risk, and review signals.</p>
      </div>
    );
  }

  return (
    <div className="review-stack">
      <div className="card review-status-card">
        <div className="card-header">
          <div>
            <p className="card-label">Review readiness</p>
            <h2>Validation summary</h2>
          </div>
          <span className={`pill ${validationErrors.isValid && validationMessages.length === 0 ? 'muted' : 'danger'}`}>
            {validationMessages.length} issue{validationMessages.length === 1 ? '' : 's'}
          </span>
        </div>

        <label className="field review-status-field">
          <span>Review Status</span>
          <select value={reviewStatus} onChange={(event) => onReviewStatusChange(event.target.value as ReviewStatus)}>
            <option value="Pending Review">Pending Review</option>
            <option value="Verified">Verified</option>
            <option value="Needs Correction">Needs Correction</option>
            <option value="Submitted">Submitted</option>
          </select>
        </label>

        {validationMessages.length > 0 ? (
          <div className="validation-summary">
            <strong>Validation issues</strong>
            <ul>
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="validation-summary validation-summary--clear">
            <strong>No validation issues detected.</strong>
            <p>The extracted borrower profile is ready for final review.</p>
          </div>
        )}
      </div>

      <RiskFlagsPanel riskFlags={riskFlags} />
      <AIReviewSummary summary={summary} />

      <div className="card review-submit-card">
        <div className="card-header">
          <div>
            <p className="card-label">Submission</p>
            <h2>Final action</h2>
          </div>
          <span className="pill muted">{reviewStatus}</span>
        </div>

        {canSubmit ? (
          <button type="button" className="submit-button review-submit-button" onClick={onSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit to Firestore'}
          </button>
        ) : (
          <div className="review-submit-note">
            <p>Resolve validation issues, clear conflicts, and mark the application as Verified to enable submission.</p>
          </div>
        )}
      </div>
    </div>
  );
}