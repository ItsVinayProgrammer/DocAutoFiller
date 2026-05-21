import type { AuditEvent } from '../types';

type AuditTrailProps = {
  events: AuditEvent[];
};

export function AuditTrail({ events }: AuditTrailProps) {
  const visibleEvents = events.slice(-3).reverse();

  return (
    <div className="card audit-card compact-card">
      <div className="card-header">
        <div>
          <p className="card-label">Audit trail</p>
          <h2>Workflow timeline</h2>
        </div>
        <span className="pill muted">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <p>No audit events yet.</p>
      ) : (
        <details className="details-block">
          <summary>
            {events.length} timeline event{events.length === 1 ? '' : 's'} recorded. View latest activity.
          </summary>
          <ol className="audit-list">
            {visibleEvents.map((event) => (
              <li key={event.id} className="audit-event">
                <div>
                  <strong>{event.action.replace(/_/g, ' ')}</strong>
                  <p>{event.description}</p>
                </div>
                <time>{new Date(event.timestamp).toLocaleString('en-IN')}</time>
              </li>
            ))}
          </ol>
          {events.length > 3 ? <p className="details-footnote">Older events remain in the database audit log.</p> : null}
        </details>
      )}
    </div>
  );
}
