import type { ReactNode } from 'react';
import type { LoanApplication } from '../types';

type ApplicationDetailsProps = {
  application: LoanApplication | null;
};

function DetailsBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="details-block">
      <summary>{title}</summary>
      <div>{children}</div>
    </details>
  );
}

function formatText(value: unknown, fallback = 'Unknown'): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export function ApplicationDetails({ application }: ApplicationDetailsProps) {
  if (!application) {
    return (
      <div className="card">
        <p className="card-label">Application details</p>
        <p>Select a submitted application to inspect the stored payload.</p>
      </div>
    );
  }

  return (
    <div className="card application-details-card">
      <div className="card-header">
        <div>
          <p className="card-label">Application details</p>
          <h2>{application.finalFormData?.fullName || 'Untitled application'}</h2>
        </div>
        <span className="pill muted">{application.reviewStatus || 'Pending Review'}</span>
      </div>

      <div className="application-summary-grid">
        <div className="summary-chip">Name: {formatText(application.finalFormData?.fullName)}</div>
        <div className="summary-chip">Phone: {formatText(application.finalFormData?.phoneNumber)}</div>
        <div className="summary-chip">PAN: {formatText(application.finalFormData?.panNumber)}</div>
        <div className="summary-chip">Monthly Income: {formatText(application.finalFormData?.monthlyIncome)}</div>
        <div className="summary-chip">Loan Amount: {formatText(application.finalFormData?.requestedLoanAmount)}</div>
        <div className="summary-chip">Created: {application.createdAt ? new Date(application.createdAt).toLocaleString('en-IN') : 'Unknown'}</div>
      </div>

      <div className="details-stack">
        <DetailsBlock title="Final form data">
          <pre>{JSON.stringify(application.finalFormData ?? {}, null, 2)}</pre>
        </DetailsBlock>

        <DetailsBlock title="Validation result">
          <pre>{JSON.stringify(application.validationErrors ?? {}, null, 2)}</pre>
        </DetailsBlock>

        <DetailsBlock title="Risk flags">
          <pre>{JSON.stringify(application.riskFlags ?? [], null, 2)}</pre>
        </DetailsBlock>

        <DetailsBlock title="Uploaded documents">
          <pre>{JSON.stringify(application.uploadedDocuments ?? [], null, 2)}</pre>
        </DetailsBlock>

        <DetailsBlock title="Audit trail">
          <pre>{JSON.stringify(application.auditTrail ?? [], null, 2)}</pre>
        </DetailsBlock>

        <DetailsBlock title="AI review summary">
          <p>{application.aiReviewSummary || 'No summary available.'}</p>
        </DetailsBlock>
      </div>
    </div>
  );
}
