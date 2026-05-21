import { ConfidenceBadge } from './ConfidenceBadge';
import { formatIndianCurrency } from '../utils/parseFields';
import type { ConfidenceScores, ExtractedFields, FieldName, ValidationErrors } from '../types';

type ExtractedFormProps = {
  fields: ExtractedFields;
  fieldConfidenceScores: ConfidenceScores;
  validationErrors: ValidationErrors;
  onFieldChange: (field: FieldName, value: string) => void;
};

const fieldLabels: Array<{ key: FieldName; label: string; placeholder: string }> = [
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

export function ExtractedForm({
  fields,
  fieldConfidenceScores,
  validationErrors,
  onFieldChange,
}: ExtractedFormProps) {
  const getFieldError = (field: FieldName): string | undefined => validationErrors.fieldErrors[field]?.[0];

  return (
    <div className="card form-card">
      <div className="card-header">
        <div>
          <p className="card-label">Auto-filled application</p>
          <h2>Borrower form</h2>
        </div>
        <span className="pill muted">Editable</span>
      </div>

      <div className="form-grid">
        {fieldLabels.map(({ key, label, placeholder }) => (
          <label key={key} className="field">
            <span className="field-label-row">
              <span>{label}</span>
              <ConfidenceBadge confidence={fieldConfidenceScores[key]} />
            </span>
            <input
              type="text"
              value={fields[key]}
              placeholder={placeholder}
              onChange={(event) => onFieldChange(key, event.target.value)}
            />
            {(key === 'monthlyIncome' || key === 'requestedLoanAmount') && fields[key] ? (
              <small className="field-hint">Formatted preview: ₹{formatIndianCurrency(fields[key])}</small>
            ) : null}
            {getFieldError(key) ? <small className="field-error">{getFieldError(key)}</small> : null}
          </label>
        ))}
      </div>
    </div>
  );
}
