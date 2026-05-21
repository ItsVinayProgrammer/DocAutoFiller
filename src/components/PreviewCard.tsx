type PreviewCardProps = {
  title: string;
  subtitle: string;
  content: string;
  emptyLabel: string;
};

export function PreviewCard({ title, subtitle, content, emptyLabel }: PreviewCardProps) {
  return (
    <div className="card preview-card">
      <div className="card-header">
        <div>
          <p className="card-label">{subtitle}</p>
          <h2>{title}</h2>
        </div>
      </div>
      <pre className="preview-text">{content || emptyLabel}</pre>
    </div>
  );
}
