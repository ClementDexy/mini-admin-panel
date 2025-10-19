import React from 'react';
import { api } from '../services/api';
import { formatCreatedAt, formatRole, truncateHash } from '../utils/formatters';

export default function UsersTable({ users = [], loading, onEdit, onRefresh }) {
  const handleDelete = async (user) => {
    if (!window.confirm(`Delete ${user.email}?`)) return;
    try {
      await api.deleteUser(user.id);
      onRefresh();
    } catch (err) {
      console.error(err);
      alert('Failed to delete user');
    }
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const isActive = status === 'active';
    return (
      <span className={`badge ${isActive ? 'bg-success' : 'bg-secondary'}`}>
        {isActive ? 'Active' : 'Inactive'}
      </span>
    );
  };

  // Role badge component
  const RoleBadge = ({ role }) => {
    const roleConfig = {
      admin: { class: 'bg-danger', label: 'Admin' },
      moderator: { class: 'bg-warning text-dark', label: 'Moderator' },
      user: { class: 'bg-info', label: 'User' }
    };
    
    const config = roleConfig[role] || { class: 'bg-secondary', label: formatRole(role) };
    
    return (
      <span className={`badge ${config.class}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead className="table-light">
          <tr>
            <th>ID</th>
            <th>Email</th>
            <th>Role</th>
            <th>Status</th>
            <th>Created</th>
            <th className="text-end">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr>
              <td colSpan="6" className="text-center py-4">
                <div className="spinner-border spinner-border-sm me-2" role="status"></div>
                Loading users...
              </td>
            </tr>
          )}
          {!loading && users.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center py-4 text-muted">
                No verified users found
              </td>
            </tr>
          )}
          {users.map(u => (
            <tr key={u.id}>
              <td>
                <code className="text-muted">{u.id}</code>
              </td>
              <td>
                <div>
                  <strong>{u.email}</strong>
                  {u.emailHash && (
                    <div className="text-muted small">
                      Hash: {truncateHash(u.emailHash)}
                    </div>
                  )}
                </div>
              </td>
              <td>
                <RoleBadge role={u.role} />
              </td>
              <td>
                <StatusBadge status={u.status} />
              </td>
              <td>
                <small className="text-muted">
                  {formatCreatedAt(u)}
                </small>
              </td>
              <td className="text-end">
                <div className="btn-group btn-group-sm">
                  <button 
                    className="btn btn-outline-primary" 
                    onClick={() => onEdit(u)}
                    title="Edit user"
                  >
                    Edit
                  </button>
                  <button 
                    className="btn btn-outline-danger" 
                    onClick={() => handleDelete(u)}
                    title="Delete user"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}