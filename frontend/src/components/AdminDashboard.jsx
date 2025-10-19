// ...existing code...
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

      {error && <div className="alert alert-danger">{error}</div>}

      {showChart && (
        <div className="mb-3">
          <UsersChart users={users} days={7} />
        </div>
      )}

      <div className="card">
        <div className="card-body">
          <UsersTable users={users} loading={loading} onEdit={openEdit} onRefresh={refreshUsers} />
        </div>
      </div>

      <UserFormModal
        show={showModal}
        onClose={() => setShowModal(false)}
        user={editingUser}
        onSaved={() => { setShowModal(false); refreshUsers(); }}
      />
    </div>
  );
}