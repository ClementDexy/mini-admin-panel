import React from 'react';
import { api } from '../services/api';
import { formatCreatedAt, formatRole, formatStatus, truncateHash } from '../utils/formatters';

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
            <tr><td colSpan="6" className="text-center py-4">Loading...</td></tr>
          )}
          {!loading && users.length === 0 && (
            <tr><td colSpan="6" className="text-center py-4">No users found</td></tr>
          )}
          {users.map(u => (
            <tr key={u.id}>
              <td>{u.id}</td>
              <td>{u.email}</td>
              <td>{formatRole(u.role)}</td>
              <td>{formatStatus(u.status)}</td>
              <td>{formatCreatedAt(u)}</td>
              <td className="text-end">
                <button className="btn btn-sm btn-outline-primary me-2" onClick={() => onEdit(u)}>Edit</button>
                <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(u)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}