import type { ChangeEvent } from 'react';

type FileUploadProps = {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
};

export function FileUpload({ onFileSelected, isLoading }: FileUploadProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    onFileSelected(file);
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
        <input type="file" accept="application/pdf" onChange={handleChange} />
        <span>Drop a PDF here or click to choose a file</span>
        <small>PDF text extraction is enabled. OCR for image-only files can be added later.</small>
      </label>
    </div>
  );
}
