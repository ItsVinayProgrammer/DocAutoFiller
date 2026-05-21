type PreviewCardProps = {
  title: string;
  subtitle: string;
  content: string;
  emptyLabel: string;
  compact?: boolean;
};

export function PreviewCard({ title, subtitle, content, emptyLabel, compact = true }: PreviewCardProps) {
  const previewText = content ? content.slice(0, 240) : emptyLabel;

  return (
    <div className="card preview-card">
      <div className="card-header">
        <div>
          <p className="card-label">{subtitle}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {compact ? (
        <details className="details-block" open={false}>
          <summary>{content ? previewText : emptyLabel}</summary>
          <pre className="preview-text">{content || emptyLabel}</pre>
        </details>
      ) : (
        <pre className="preview-text">{content || emptyLabel}</pre>
      )}
    </div>
  );
}
