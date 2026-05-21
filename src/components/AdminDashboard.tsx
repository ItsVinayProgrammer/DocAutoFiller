import { useEffect, useMemo, useState } from 'react';
import { getLoanApplications } from '../firebase/firestoreService';
import type { LoanApplication } from '../types';
import { ApplicationDetails } from './ApplicationDetails';

type AdminDashboardProps = {
  onBack: () => void;
};

export function AdminDashboard({ onBack }: AdminDashboardProps) {
  const [applications, setApplications] = useState<LoanApplication[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const selectedApplication = useMemo(
    () => applications.find((application) => application.id === selectedApplicationId) ?? applications[0] ?? null,
    [applications, selectedApplicationId]
  );

  const formatValue = (value: unknown, fallback = 'Unknown'): string => (typeof value === 'string' && value.trim() ? value.trim() : fallback);

  const formatTimestamp = (value: string | undefined): string => {
    if (!value) {
      return 'Unknown';
    }

    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? 'Unknown' : timestamp.toLocaleString('en-IN');
  };

  useEffect(() => {
    let isMounted = true;

    async function loadApplications() {
      try {
        const data = await getLoanApplications();
        if (!isMounted) {
          return;
        }
        setApplications(data);
        setSelectedApplicationId(data[0]?.id ?? null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Failed to load applications.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadApplications();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className="app-shell admin-shell">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">DocAutoFiller Admin</p>
          <h1>Submitted loan applications</h1>
          <p className="hero-copy">Internal review dashboard for submitted applications stored in Firestore.</p>
        </div>
        <button type="button" className="submit-button admin-back-link" onClick={onBack}>
          Back to onboarding
        </button>
      </section>

      {isLoading ? <div className="card">Loading applications...</div> : null}
      {errorMessage ? <div className="alert error">{errorMessage}</div> : null}

      {!isLoading && !errorMessage && applications.length === 0 ? (
        <div className="card empty-state">
          <p className="card-label">Firestore collection</p>
          <p>No submitted applications found yet.</p>
        </div>
      ) : null}

      {!isLoading && !errorMessage && applications.length > 0 ? (
        <section className="dashboard-grid admin-grid">
          <div className="card admin-table-card">
            <div className="card-header">
              <div>
                <p className="card-label">Firestore collection</p>
                <h2>loanApplications</h2>
              </div>
              <span className="pill muted">{applications.length} records</span>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Phone</th>
                    <th>PAN</th>
                    <th>Employment Type</th>
                    <th>Monthly Income</th>
                    <th>Requested Loan Amount</th>
                    <th>Review Status</th>
                    <th>Created Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((application) => (
                    <tr key={application.id} className={selectedApplication?.id === application.id ? 'selected-row' : ''}>
                      <td>{formatValue(application.finalFormData?.fullName)}</td>
                      <td>{formatValue(application.finalFormData?.phoneNumber)}</td>
                      <td>{formatValue(application.finalFormData?.panNumber)}</td>
                      <td>{formatValue(application.finalFormData?.employmentType)}</td>
                      <td>{formatValue(application.finalFormData?.monthlyIncome)}</td>
                      <td>{formatValue(application.finalFormData?.requestedLoanAmount)}</td>
                      <td>{formatValue(application.reviewStatus, 'Pending Review')}</td>
                      <td>{formatTimestamp(application.createdAt)}</td>
                      <td>
                        <button type="button" className="text-button" onClick={() => setSelectedApplicationId(application.id ?? null)}>
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <ApplicationDetails application={selectedApplication} />
        </section>
      ) : null}
    </main>
  );
}
