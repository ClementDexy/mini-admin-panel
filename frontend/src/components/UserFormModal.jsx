import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function UserFormModal({ show, onClose, user, onSaved }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [status, setStatus] = useState('active');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setEmail(user.email || '');
      setRole(user.role || 'admin');
      setStatus(user.status || 'active');
    } else {
      setEmail('');
      setRole('admin');
      setStatus('active');
    }
  }, [user, show]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (user) {
        await api.updateUser(user.id, { email, role, status });
      } else {
        await api.createUser({ email, role, status });
      }
      onSaved();
    } catch (err) {
      console.error(err);
      alert('Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" style={backdropStyle}>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{user ? 'Edit User' : 'Create User'}</h5>
                <button type="button" className="btn-close" onClick={onClose} />
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input className="form-control" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-3">
                  <label className="form-label">Role</label>
                  <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                    <option value="admin">admin</option>
                    <option value="manager">manager</option>
                    <option value="user">user</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const backdropStyle = {
  background: 'rgba(0,0,0,0.5)',
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1050,
};