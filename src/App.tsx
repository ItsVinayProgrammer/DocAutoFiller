import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { AdminDashboard } from './components/AdminDashboard';
import { AuditTrail } from './components/AuditTrail';
import { ExtractedForm } from './components/ExtractedForm';
import { FieldConflictResolver } from './components/FieldConflictResolver';
import { FileUpload } from './components/FileUpload';
import { PreviewCard } from './components/PreviewCard';
import { ReviewPanel } from './components/ReviewPanel';
import { UploadedDocumentList } from './components/UploadedDocumentList';
import { isFirebaseConfigured } from './firebase/firebaseConfig';
import { submitLoanApplication } from './firebase/firestoreService';
import { detectDocumentType } from './utils/detectDocumentType';
import { extractPdfText } from './utils/extractPdfText';
import { generateRiskFlags } from './utils/generateRiskFlags';
import { generateReviewSummary } from './utils/generateReviewSummary';
import { mergeParsedFields } from './utils/mergeParsedFields';
import { parseFields } from './utils/parseFields';
import { validateFields } from './utils/validateFields';
import type { AuditEvent, DocumentType, FieldName, ReviewStatus, SubmissionStatus, UploadedDocument, ValidationErrors } from './types';
import { useLocation, useNavigate } from 'react-router-dom';

const INITIAL_REVIEW_STATUS: ReviewStatus = 'Pending Review';
const EMPTY_VALIDATION_ERRORS: ValidationErrors = {
  fieldErrors: {},
  generalErrors: [],
  isValid: true,
};

type WorkflowTab = 'documents' | 'form' | 'conflicts' | 'review' | 'audit';

const WORKFLOW_TABS: Array<{ id: WorkflowTab; label: string; description: string }> = [
  { id: 'documents', label: 'Documents', description: 'Upload and inspect PDFs' },
  { id: 'form', label: 'Application Form', description: 'Review extracted borrower data' },
  { id: 'conflicts', label: 'Conflicts', description: 'Resolve mismatched fields' },
  { id: 'review', label: 'Review', description: 'Assess readiness and submit' },
  { id: 'audit', label: 'Audit', description: 'Track workflow events' },
];

function createEmptyRawDocument(id: string, fileName: string): UploadedDocument {
  return {
    id,
    fileName,
    documentType: 'Unknown Document',
    rawText: '',
    parsedFields: parseFields(''),
    extractionStatus: 'processing',
  };
}

function createId(): string {
  return typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAuditEvent(action: AuditEvent['action'], description: string, extras: Partial<AuditEvent> = {}): AuditEvent {
  return {
    id: createId(),
    timestamp: new Date().toISOString(),
    action,
    description,
    ...extras,
  };
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [manualSelections, setManualSelections] = useState<Partial<Record<FieldName, string>>>({});
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>(INITIAL_REVIEW_STATUS);
  const [activeTab, setActiveTab] = useState<WorkflowTab>('documents');
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([]);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<SubmissionStatus>({ type: 'idle', message: '' });

  const conflictSignatureRef = useRef('');
  const isAdminRoute = location.pathname.startsWith('/admin');

  const mergedApplication = useMemo(
    () => mergeParsedFields(uploadedDocuments, manualSelections),
    [uploadedDocuments, manualSelections]
  );

  const validationErrors = useMemo(() => validateFields(mergedApplication.finalFormData), [mergedApplication.finalFormData]);

  const riskFlags = useMemo(
    () => generateRiskFlags(mergedApplication.finalFormData, validationErrors, mergedApplication.fieldConflicts, reviewStatus),
    [mergedApplication.finalFormData, validationErrors, mergedApplication.fieldConflicts, reviewStatus]
  );

  const aiReviewSummary = useMemo(
    () => generateReviewSummary(mergedApplication.finalFormData, validationErrors, riskFlags),
    [mergedApplication.finalFormData, validationErrors, riskFlags]
  );

  const hasCompletedDocuments = useMemo(
    () => uploadedDocuments.some((document) => document.extractionStatus === 'completed'),
    [uploadedDocuments]
  );

  const visibleValidationErrors = hasCompletedDocuments ? validationErrors : EMPTY_VALIDATION_ERRORS;
  const visibleRiskFlags = hasCompletedDocuments ? riskFlags : [];
  const visibleReviewSummary = hasCompletedDocuments
    ? aiReviewSummary
    : 'Upload borrower documents to generate a review summary.';
  const visibleConflicts = hasCompletedDocuments ? mergedApplication.fieldConflicts : [];

  const unresolvedConflicts = useMemo(
    () => visibleConflicts.filter((conflict) => !conflict.isResolved),
    [visibleConflicts]
  );
  const selectedDocument = useMemo(
    () => uploadedDocuments.find((document) => document.id === selectedDocumentId) ?? uploadedDocuments[0] ?? null,
    [selectedDocumentId, uploadedDocuments]
  );

  const canSubmit =
    hasCompletedDocuments && visibleValidationErrors.isValid && unresolvedConflicts.length === 0 && reviewStatus === 'Verified' && uploadedDocuments.length > 0;

  useEffect(() => {
    if (uploadedDocuments.length === 0) {
      setSelectedDocumentId(null);
      return;
    }

    const isSelectedDocumentValid = selectedDocumentId ? uploadedDocuments.some((document) => document.id === selectedDocumentId) : false;
    if (!isSelectedDocumentValid) {
      setSelectedDocumentId(uploadedDocuments[0].id);
    }
  }, [uploadedDocuments, selectedDocumentId]);

  useEffect(() => {
    const activeConflictFields = mergedApplication.fieldConflicts
      .filter((conflict) => !conflict.isResolved)
      .map((conflict) => conflict.field)
      .sort()
      .join('|');

    if (activeConflictFields && activeConflictFields !== conflictSignatureRef.current) {
      conflictSignatureRef.current = activeConflictFields;
      setAuditTrail((current) => [
        ...current,
        createAuditEvent('conflicts_detected', `${mergedApplication.fieldConflicts.length} conflicting field(s) detected in uploaded documents.`),
      ]);
    }

    if (!activeConflictFields) {
      conflictSignatureRef.current = '';
    }
  }, [mergedApplication.fieldConflicts]);

  const appendAuditEvent = (action: AuditEvent['action'], description: string, extras: Partial<AuditEvent> = {}) => {
    setAuditTrail((current) => [...current, createAuditEvent(action, description, extras)]);
  };

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setStatus({ type: 'idle', message: '' });
    setIsExtracting(true);

    let successCount = 0;
    let failureCount = 0;

    for (const file of files) {
      const documentId = createId();
      const queuedDocument = createEmptyRawDocument(documentId, file.name);

      setUploadedDocuments((current) => [...current, queuedDocument]);
      setSelectedDocumentId(documentId);
      appendAuditEvent('documents_uploaded', `Uploaded ${file.name} for extraction.`, { documentId, fileName: file.name });

      try {
        const rawText = await extractPdfText(file);
        const parsed = parseFields(rawText);
        const documentType = detectDocumentType(rawText);

        const completedDocument: UploadedDocument = {
          ...queuedDocument,
          documentType,
          rawText,
          parsedFields: {
            ...parsed,
            documentType,
          },
          extractionStatus: 'completed',
        };

        setUploadedDocuments((current) => current.map((document) => (document.id === documentId ? completedDocument : document)));
        appendAuditEvent('text_extracted', `Extracted raw text from ${file.name}.`, { documentId, fileName: file.name });
        appendAuditEvent('fields_parsed', `Parsed ${documentType} fields from ${file.name}.`, { documentId, fileName: file.name });
        successCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unable to extract the uploaded document.';
        setUploadedDocuments((current) =>
          current.map((document) =>
            document.id === documentId
              ? {
                  ...document,
                  extractionStatus: 'failed',
                  errorMessage: message,
                }
              : document
          )
        );
        appendAuditEvent('text_extracted', `Failed to extract ${file.name}: ${message}`, { documentId, fileName: file.name });
        failureCount += 1;
      }
    }

    setIsExtracting(false);

    if (successCount > 0 && failureCount === 0) {
      setStatus({ type: 'success', message: `Processed ${successCount} document(s) successfully.` });
      return;
    }

    if (successCount > 0 && failureCount > 0) {
      setStatus({ type: 'error', message: `Processed ${successCount} document(s) with ${failureCount} extraction failure(s).` });
      return;
    }

    setStatus({ type: 'error', message: 'No PDF documents could be processed.' });
  };

  const handleResolveField = (field: FieldName, value: string) => {
    setManualSelections((current) => ({ ...current, [field]: value }));
    appendAuditEvent('field_edited', `User updated ${field} to ${value}.`, { field });

    if (reviewStatus === 'Verified' || reviewStatus === 'Submitted') {
      setReviewStatus('Pending Review');
    }
  };

  const handleReviewStatusChange = (nextStatus: ReviewStatus) => {
    setReviewStatus(nextStatus);

    if (nextStatus === 'Verified') {
      appendAuditEvent('form_marked_verified', 'Form marked as verified by the reviewer.');
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    setUploadedDocuments((current) => current.filter((document) => document.id !== documentId));
    if (selectedDocumentId === documentId) {
      setSelectedDocumentId(null);
    }
  };

  const handleSubmit = async () => {
    if (!hasCompletedDocuments) {
      setStatus({ type: 'error', message: 'Upload and extract at least one document before submitting.' });
      return;
    }

    const validationCompletedEvent = createAuditEvent(
      'validation_completed',
      visibleValidationErrors.isValid ? 'Validation completed successfully.' : 'Validation completed with errors.'
    );
    const validationTrail = [...auditTrail, validationCompletedEvent];

    if (!visibleValidationErrors.isValid) {
      setAuditTrail(validationTrail);
      setStatus({ type: 'error', message: 'Please fix the validation errors before submitting.' });
      return;
    }

    if (unresolvedConflicts.length > 0) {
      setStatus({ type: 'error', message: 'Resolve all field conflicts before submitting.' });
      return;
    }

    if (reviewStatus !== 'Verified') {
      setStatus({ type: 'error', message: 'Mark the application as Verified before submission.' });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: 'idle', message: '' });

    const submittedTrail = [...validationTrail, createAuditEvent('submitted_to_firestore', 'Submitting loan application to Firestore.')];
    const finalTrail = [...submittedTrail, createAuditEvent('submitted_to_firestore', 'Form successfully submitted to Firestore.')];
    setAuditTrail(submittedTrail);

    try {
      await submitLoanApplication({
        finalFormData: mergedApplication.finalFormData,
        uploadedDocuments: uploadedDocuments.map((document) => ({
          fileName: document.fileName,
          documentType: document.documentType,
          rawText: document.rawText,
          parsedFields: document.parsedFields,
          extractionStatus: document.extractionStatus,
        })),
        fieldConfidenceScores: mergedApplication.fieldConfidenceScores,
        fieldConflicts: visibleConflicts,
        validationErrors: visibleValidationErrors,
        riskFlags: visibleRiskFlags,
        aiReviewSummary: visibleReviewSummary,
        reviewStatus: 'Submitted',
        auditTrail: finalTrail,
        source: 'Multi Document Upload Prototype',
      });

      setAuditTrail(finalTrail);
      setReviewStatus('Submitted');
      setStatus({ type: 'success', message: 'Form submitted to Firestore successfully.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save data to Firestore.';
      setStatus({ type: 'error', message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const documentCount = uploadedDocuments.length;
  const completedDocumentCount = uploadedDocuments.filter((document) => document.extractionStatus === 'completed').length;
  const conflictCount = hasCompletedDocuments ? mergedApplication.fieldConflicts.length : 0;
  const workflowStatus = !hasCompletedDocuments
    ? 'Waiting for documents'
    : visibleValidationErrors.isValid && unresolvedConflicts.length === 0
      ? 'Ready for final review'
      : 'Needs attention';

  const activeTabLabel = WORKFLOW_TABS.find((tab) => tab.id === activeTab)?.label ?? 'Documents';

  let activePanel: ReactElement;
  switch (activeTab) {
    case 'documents':
      activePanel = (
        <div className="workflow-stack">
          {!isFirebaseConfigured ? (
            <div className="alert error">
              Firebase is not configured yet. Add your VITE_FIREBASE_* values in a local .env.local file, then restart the dev server.
            </div>
          ) : null}

          <FileUpload onFilesSelected={handleFilesSelected} isLoading={isExtracting} />
          <UploadedDocumentList
            documents={uploadedDocuments}
            selectedDocumentId={selectedDocumentId}
            onViewText={setSelectedDocumentId}
            onRemoveDocument={handleRemoveDocument}
          />

          <PreviewCard
            title={`Raw extracted text${selectedDocument ? ` • ${selectedDocument.fileName}` : ''}`}
            subtitle={selectedDocument ? selectedDocument.documentType : 'Audit trail and parsing input'}
            content={selectedDocument?.rawText ?? ''}
            emptyLabel="Select an uploaded document to view its extracted text."
          />
        </div>
      );
      break;
    case 'form':
      activePanel = (
        <ExtractedForm
          fields={mergedApplication.finalFormData}
          fieldConfidenceScores={mergedApplication.fieldConfidenceScores}
          validationErrors={visibleValidationErrors}
          onFieldChange={handleResolveField}
        />
      );
      break;
    case 'conflicts':
      activePanel = (
        <FieldConflictResolver
          hasDocuments={hasCompletedDocuments}
          conflicts={visibleConflicts}
          currentValues={mergedApplication.finalFormData}
          onResolveField={handleResolveField}
        />
      );
      break;
    case 'review':
      activePanel = (
        <ReviewPanel
          hasCompletedDocuments={hasCompletedDocuments}
          reviewStatus={reviewStatus}
          validationErrors={visibleValidationErrors}
          riskFlags={visibleRiskFlags}
          summary={visibleReviewSummary}
          canSubmit={canSubmit}
          isSubmitting={isSubmitting}
          onReviewStatusChange={handleReviewStatusChange}
          onSubmit={handleSubmit}
        />
      );
      break;
    case 'audit':
    default:
      activePanel = <AuditTrail events={auditTrail} />;
      break;
  }

  return isAdminRoute ? (
    <AdminDashboard onBack={() => navigate('/')} />
  ) : (
    <main className="app-shell workflow-shell">
      <section className="hero-panel workflow-hero">
        <div className="workflow-hero-copy">
          <p className="eyebrow">DocAutoFiller Prototype</p>
          <h1>Multi-document finance onboarding dashboard</h1>
          <p className="hero-copy">
            Upload PDFs, merge borrower data, resolve conflicts, review the application, and submit a verified onboarding packet to Firestore.
          </p>
        </div>

        <div className="workflow-metrics">
          <div className="metric-card">
            <span className="metric-label">Documents</span>
            <strong>{documentCount}</strong>
            <small>{completedDocumentCount} parsed</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">Conflicts</span>
            <strong>{conflictCount}</strong>
            <small>{hasCompletedDocuments ? 'After extraction' : 'Waiting'}</small>
          </div>
          <div className="metric-card">
            <span className="metric-label">Validation</span>
            <strong>{workflowStatus}</strong>
            <small>{activeTabLabel} tab</small>
          </div>
          <button type="button" className="submit-button admin-back-link" onClick={() => navigate('/admin')}>
            Admin dashboard
          </button>
        </div>
      </section>

      <nav className="workflow-tabs" aria-label="Workflow sections">
        {WORKFLOW_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`workflow-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span>{tab.label}</span>
            <small>{tab.description}</small>
          </button>
        ))}
      </nav>

      <section className="workflow-panel">
        {activePanel}
      </section>

      {status.message ? <div className={`alert ${status.type} workflow-alert`}>{status.message}</div> : null}
    </main>
  );
}