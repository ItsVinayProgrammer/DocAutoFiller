import { useMemo, useState } from 'react';
import { FileUpload } from './components/FileUpload';
import { ExtractedForm } from './components/ExtractedForm';
import { PreviewCard } from './components/PreviewCard';
import { extractPdfText } from './utils/extractPdfText';
import { formatIndianCurrency, parseFields } from './utils/parseFields';
import { validateExtractedFields } from './utils/validators';
import { saveLoanApplication } from './firebase/firestoreService';
import { isFirebaseConfigured } from './firebase/firebaseConfig';
import type { ExtractionMeta, ExtractedFields, FormattedFinancialFields, SubmissionStatus } from './types';


const initialFields: ExtractedFields = {
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

const initialFormattedFinancialFields: FormattedFinancialFields = {
  monthlyIncome: '',
  requestedLoanAmount: '',
};

export default function App() {
  const [fields, setFields] = useState<ExtractedFields>(initialFields);
  const [formattedFinancialFields, setFormattedFinancialFields] = useState<FormattedFinancialFields>(initialFormattedFinancialFields);
  const [extractionMeta, setExtractionMeta] = useState<ExtractionMeta | null>(null);
  const [rawText, setRawText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>({ type: 'idle', message: '' });
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const isFormReady = useMemo(() => rawText.length > 0, [rawText]);

  const handleFileSelected = async (file: File) => {
    setStatus({ type: 'idle', message: '' });
    setValidationErrors([]);
    setFileName(file.name);
    setIsExtracting(true);
    setExtractionMeta(null);

    try {
      const text = await extractPdfText(file);
      const parsed = parseFields(text);
      setRawText(text);
      setFields(parsed.extractedFields);
      setFormattedFinancialFields(parsed.formattedFinancialFields);
      setExtractionMeta(parsed.extractionMeta);
      setStatus({ type: 'success', message: 'Document extracted successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to extract the uploaded document.';
      setStatus({ type: 'error', message });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleChange = (key: keyof ExtractedFields, value: string) => {
    setFields((current) => {
      const nextFields = { ...current, [key]: value };
      if (key === 'monthlyIncome' || key === 'requestedLoanAmount') {
        setFormattedFinancialFields({
          monthlyIncome: formatIndianCurrency(nextFields.monthlyIncome),
          requestedLoanAmount: formatIndianCurrency(nextFields.requestedLoanAmount),
        });
      }

      return nextFields;
    });
  };

  const handleSubmit = async () => {
    const errors = validateExtractedFields(fields);
    setValidationErrors(errors);
    if (errors.length > 0) {
      setStatus({ type: 'error', message: 'Please fix the validation errors before submitting.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    try {
      await saveLoanApplication({
        extractedFields: fields,
        rawExtractedText: rawText,
        extractionMeta: extractionMeta ?? {
          executionTimestamp: new Date().toISOString(),
          isComplete: false,
        },
        status: 'Submitted',
        source: 'Document Upload Prototype',
      });
      setStatus({ type: 'success', message: 'Form submitted to Firestore successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save data to Firestore.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="app-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">DocAutoFiller Prototype</p>
          <h1>Automated onboarding for finance document intake</h1>
          <p className="hero-copy">
            Upload a PDF, extract key borrower details, review the prefilled form, and submit the final application to Firestore.
          </p>
        </div>
        <div className="status-strip">
          <span>Source: Tata Capital style internal workflow</span>
          <span>{fileName || 'No file uploaded yet'}</span>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="left-column">
          {!isFirebaseConfigured ? (
            <div className="alert error">
              Firebase is not configured yet. Add your VITE_FIREBASE_* values in a local .env.local file, then restart the dev server.
            </div>
          ) : null}
          {extractionMeta ? (
            <div className={`alert ${extractionMeta.isComplete ? 'success' : 'error'}`}>
              Parsed at {new Date(extractionMeta.executionTimestamp).toLocaleString('en-IN')} ·
              {extractionMeta.isComplete ? ' Complete capture' : ' Partial capture - review required'}
            </div>
          ) : null}
          <FileUpload onFileSelected={handleFileSelected} isLoading={isExtracting} />
          <PreviewCard title="Raw extracted text" subtitle="Audit trail and parsing input" content={rawText} emptyLabel="Upload a PDF to view extracted text." />
          {status.message ? <div className={`alert ${status.type}`}>{status.message}</div> : null}
        </div>

        <div className="right-column">
          <ExtractedForm
            fields={fields}
            formattedFinancialFields={formattedFinancialFields}
            onFieldChange={handleChange}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            validationErrors={validationErrors}
            canSubmit={isFormReady}
          />
        </div>
      </section>
    </main>
  );
}
