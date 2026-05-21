import type { ChangeEvent } from 'react';

type FileUploadProps = {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
};

export function FileUpload({ onFilesSelected, isLoading }: FileUploadProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(
      (file) => file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
    );
    if (files.length === 0) {
      return;
    }

    onFilesSelected(files);
    event.target.value = '';
  };

  return (
    <div className="card upload-card">
      <div className="card-header">
        <div>
          <p className="card-label">Document upload</p>
          <h2>Upload borrower PDF</h2>
        </div>
        {isLoading ? <span className="pill">Extracting...</span> : <span className="pill muted">Ready</span>}
      </div>
      <label className="upload-zone">
        <input type="file" accept="application/pdf" multiple onChange={handleChange} />
        <span>Drop one or more PDFs here or click to choose files</span>
        <small>Process borrower forms, identity documents, and income proofs in one pass.</small>
      </label>
    </div>
  );
}
