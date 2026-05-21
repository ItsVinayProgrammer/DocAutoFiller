import type { ExtractedFields } from '../types';

type ExtractedFormProps = {
  fields: ExtractedFields;
  onFieldChange: (field: keyof ExtractedFields, value: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  validationErrors: string[];
  canSubmit: boolean;
};

const fieldLabels: Array<{ key: keyof ExtractedFields; label: string; placeholder: string }> = [
  { key: 'fullName', label: 'Full Name', placeholder: 'Applicant name' },
  { key: 'email', label: 'Email', placeholder: 'name@example.com' },
  { key: 'phoneNumber', label: 'Phone Number', placeholder: '10-digit mobile number' },
  { key: 'panNumber', label: 'PAN Number', placeholder: 'ABCDE1234F' },
  { key: 'aadhaarNumber', label: 'Aadhaar Number', placeholder: '12-digit Aadhaar' },
  { key: 'dateOfBirth', label: 'Date of Birth', placeholder: 'YYYY-MM-DD' },
  { key: 'address', label: 'Address', placeholder: 'Residential address' },
  { key: 'employmentType', label: 'Employment Type', placeholder: 'Salaried / Self-employed / Other' },
  { key: 'monthlyIncome', label: 'Monthly Income', placeholder: 'e.g. 50000' },
  { key: 'requestedLoanAmount', label: 'Requested Loan Amount', placeholder: 'e.g. 250000' },
];

export function ExtractedForm({ fields, onFieldChange, onSubmit, isSubmitting, validationErrors, canSubmit }: ExtractedFormProps) {
  return (
    <div className="card form-card">
      <div className="card-header">
        <div>
          <p className="card-label">Auto-filled application</p>
          <h2>Review and submit</h2>
        </div>
        <span className="pill muted">Editable</span>
      </div>

      <div className="form-grid">
        {fieldLabels.map(({ key, label, placeholder }) => (
          <label key={key} className="field">
            <span>{label}</span>
            <input
              type="text"
              value={fields[key]}
              placeholder={placeholder}
              onChange={(event) => onFieldChange(key, event.target.value)}
            />
          </label>
        ))}
      </div>

      {validationErrors.length > 0 ? (
        <div className="validation-box">
          <strong>Validation errors</strong>
          <ul>
            {validationErrors.map((error) => (
              <li key={error}>{error}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="submit-row">
        <button type="button" className="submit-button" onClick={onSubmit} disabled={!canSubmit || isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit to Firestore'}
        </button>
      </div>
    </div>
  );
}
