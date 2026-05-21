import type { RiskFlag } from '../types';

type RiskFlagsPanelProps = {
  riskFlags: RiskFlag[];
};

export function RiskFlagsPanel({ riskFlags }: RiskFlagsPanelProps) {
  return (
    <div className="card risk-card compact-card">
      <div className="card-header">
        <div>
          <p className="card-label">Risk flags</p>
          <h2>Review warnings</h2>
        </div>
        <span className="pill muted">{riskFlags.length} flags</span>
      </div>

      {riskFlags.length === 0 ? (
        <p>No risk flags detected.</p>
      ) : (
        <details className="details-block">
          <summary>{riskFlags.length} risk signal(s) found. Open to review.</summary>
          <div className="risk-list">
            {riskFlags.map((flag) => (
              <div key={flag.id} className={`risk-flag ${flag.severity}`}>
                <strong>{flag.label}</strong>
                <p>{flag.description}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
