const API_BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.REACT_APP_API_BASE_URL) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  'http://localhost:3001/api';


export const api = {
    getPublicKey: async () => {
        const response = await fetch(`${API_BASE_URL}/public-key`);
        if (!response.ok) {
            throw new Error('Failed to fetch public key');
        }
        return response.json();
    },

    exportUsers: async () => {
        const response = await fetch(`${API_BASE_URL}/users/export`, {
            method: 'GET',
        });
        if (!response.ok) {
            throw new Error('Failed to export users');
        }
        const buffer = await response.arrayBuffer();
        return buffer;
    },

    // Create a new user: data = { email, role, status, ... }
  createUser: async (data) => {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to create user: ${errText}`);
    }
    return res.json();
  },

  // Update existing user: id, data = { email?, role?, status? }
  updateUser: async (id, data) => {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to update user: ${errText}`);
    }
    return res.json();
  },

  // Delete user
  deleteUser: async (id) => {
    const res = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      throw new Error(`Failed to delete user: ${errText}`);
    }
    return true;
  },
}
