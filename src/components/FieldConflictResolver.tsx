import type { ExtractedFields, FieldConflict, FieldName } from '../types';

const fieldLabels: Record<FieldName, string> = {
  fullName: 'Full Name',
  email: 'Email',
  phoneNumber: 'Phone Number',
  panNumber: 'PAN Number',
  aadhaarNumber: 'Aadhaar Number',
  dateOfBirth: 'Date of Birth',
  address: 'Address',
  employmentType: 'Employment Type',
  monthlyIncome: 'Monthly Income',
  requestedLoanAmount: 'Requested Loan Amount',
};

type FieldConflictResolverProps = {
  conflicts: FieldConflict[];
  currentValues: ExtractedFields;
  onResolveField: (field: FieldName, value: string) => void;
  hasDocuments: boolean;
};

export function FieldConflictResolver({ conflicts, currentValues, onResolveField, hasDocuments }: FieldConflictResolverProps) {
  if (!hasDocuments) {
    return (
      <div className="card compact-card">
        <p className="card-label">Conflict resolution</p>
        <p>Upload borrower documents to review any field conflicts.</p>
      </div>
    );
  }

  if (conflicts.length === 0) {
    return (
      <div className="card compact-card">
        <p className="card-label">Conflict resolution</p>
        <p>No conflicts detected. All documents agree on the current borrower profile.</p>
      </div>
    );
  }

  return (
    <div className="card conflict-card compact-card">
      <div className="card-header">
        <div>
          <p className="card-label">Conflict resolution</p>
          <h2>Field conflicts detected</h2>
        </div>
        <span className="pill danger">{conflicts.length} unresolved</span>
      </div>

      <div className="conflict-list">
        {conflicts.map((conflict) => (
          <details key={conflict.field} className="conflict-item">
            <summary className="conflict-item__header">
              <strong>{fieldLabels[conflict.field]}</strong>
              <span className={conflict.isResolved ? 'conflict-resolved' : 'conflict-open'}>
                {conflict.isResolved ? 'Resolved' : 'Unresolved'}
              </span>
            </summary>

            <div className="conflict-options">
              {conflict.values.map((candidate) => (
                <button
                  key={`${candidate.documentId}-${candidate.value}`}
                  type="button"
                  className={`conflict-option ${currentValues[conflict.field] === candidate.value ? 'active' : ''}`}
                  onClick={() => onResolveField(conflict.field, candidate.value)}
                >
                  <span>{candidate.value}</span>
                  <small>{candidate.fileName}</small>
                </button>
              ))}
            </div>

            <label className="conflict-manual-input">
              <span>Manual override</span>
              <input
                type="text"
                value={currentValues[conflict.field]}
                onChange={(event) => onResolveField(conflict.field, event.target.value)}
                placeholder={`Enter final ${fieldLabels[conflict.field].toLowerCase()}`}
              />
            </label>
          </details>
        ))}
      </div>
    </div>
  );
}
