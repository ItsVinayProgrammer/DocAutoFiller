import type { UploadedDocument } from '../types';

type UploadedDocumentListProps = {
  documents: UploadedDocument[];
  selectedDocumentId: string | null;
  onViewText: (documentId: string) => void;
  onRemoveDocument: (documentId: string) => void;
};

function statusLabel(status: UploadedDocument['extractionStatus']): string {
  switch (status) {
    case 'queued':
      return 'Queued';
    case 'processing':
      return 'Extracting';
    case 'completed':
      return 'Completed';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function UploadedDocumentList({ documents, selectedDocumentId, onViewText, onRemoveDocument }: UploadedDocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="empty-state card compact-card">
        <p className="card-label">Uploaded documents</p>
        <p>No PDFs uploaded yet. Add one or more borrower documents to begin extraction.</p>
      </div>
    );
  }

  return (
    <div className="card document-list-card compact-card">
      <div className="card-header">
        <div>
          <p className="card-label">Uploaded documents</p>
          <h2>Document queue</h2>
        </div>
        <span className="pill muted">{documents.length} files</span>
      </div>

      <div className="document-list">
        {documents.map((document) => (
          <article key={document.id} className={`document-list-item ${selectedDocumentId === document.id ? 'selected' : ''}`}>
            <div className="document-list-item__body">
              <div>
                <strong>{document.fileName}</strong>
                <p>{document.documentType}</p>
              </div>
              <div className={`document-status ${document.extractionStatus}`}>
                {statusLabel(document.extractionStatus)}
              </div>
            </div>
            {document.extractionStatus === 'failed' && document.errorMessage ? <p className="document-error">{document.errorMessage}</p> : null}
            <div className="document-list-item__actions">
              <button type="button" className="text-button" onClick={() => onViewText(document.id)}>
                View extracted text
              </button>
              <button type="button" className="text-button danger" onClick={() => onRemoveDocument(document.id)}>
                Remove document
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
