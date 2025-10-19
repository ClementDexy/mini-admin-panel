import React, { useState } from 'react';
import { useVerifiedUsers } from '../hooks/useVerifiedUsers';
import UsersTable from './UsersTable';
import UserFormModal from './UserFormModal';
import UsersChart from './UsersChart';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';

export default function AdminDashboard() {
  const { users, loading, error, refreshUsers } = useVerifiedUsers();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showChart, setShowChart] = useState(false);

  const openCreate = () => { setEditingUser(null); setShowModal(true); };
  const openEdit = (user) => { setEditingUser(user); setShowModal(true); };
  const toggleChart = () => setShowChart(prev => !prev);

  return (
    <div>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="h4">User Management</h2>
        <div>
          <button className="btn btn-outline-secondary me-2" onClick={refreshUsers} disabled={loading}>
            Refresh
          </button>

          <button
            className="btn btn-outline-info me-2"
            onClick={toggleChart}
            aria-pressed={showChart}
            title="Toggle users created chart"
          >
            {showChart ? 'Hide Chart' : 'View Chart'}
          </button>

          <button className="btn btn-primary" onClick={openCreate}>
            + New User
          </button>
        </div>
      </div>

      {/* Error Alert Component */}
      <ErrorAlert 
        error={error} 
        onRetry={refreshUsers} 
        retryLabel="Retry Loading"
      />

      {/* Loading Spinner for initial load */}
      {loading && users.length === 0 && (
        <LoadingSpinner 
          message="Loading and verifying users from protobuf export..."
        />
      )}

{(!loading || users.length > 0) && (
        <>
          {showChart && (
            <div className="mb-3">
              <UsersChart users={users} days={7} />
            </div>
          )}

          <div className="card">
            <div className="card-body">
              {loading && users.length > 0 ? (
                <div className="text-center py-3">
                  <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                  <span className="text-muted">Updating users...</span>
                </div>
              ) : (
                <UsersTable 
                  users={users} 
                  loading={loading} 
                  onEdit={openEdit} 
                  onRefresh={refreshUsers} 
                />
              )}
            </div>
          </div>
        </>
      )}

      {/* Empty state when no users but not loading */}
      {!loading && users.length === 0 && !error && (
        <div className="card">
          <div className="card-body text-center py-5">
            <div className="text-muted mb-3">
              <i className="bi bi-people fs-1"></i>
            </div>
            <h5 className="text-muted">No Verified Users Found</h5>
            <p className="text-muted">
              No cryptographically verified users were found in the protobuf export.
            </p>
            <button 
              className="btn btn-primary" 
              onClick={refreshUsers}
            >
              Check Again
            </button>
          </div>
        </div>
      )}


      <UserFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        user={editingUser}
        onSaved={() => { setShowModal(false); refreshUsers(); }}
      />
    </div>
  );
}