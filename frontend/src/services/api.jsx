const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';

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
        return response.json();
    }
}
