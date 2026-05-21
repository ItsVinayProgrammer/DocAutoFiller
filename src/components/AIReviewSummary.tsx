type AIReviewSummaryProps = {
  summary: string;
};

export function AIReviewSummary({ summary }: AIReviewSummaryProps) {
  return (
    <div className="card summary-card compact-card">
      <div className="card-header">
        <div>
          <p className="card-label">AI review summary</p>
          <h2>Rule-based summary</h2>
        </div>
        <span className="pill muted">No external AI</span>
      </div>
      <p className="summary-text">{summary}</p>
    </div>
  );
}
