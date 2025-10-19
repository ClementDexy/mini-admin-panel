export const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

  export const formatCreatedAt = (u) => {
    const raw = u.createdAt ?? u.created_at ?? null;
    if (!raw) return '-';
    // ensure numeric ms
    const ms = typeof raw === 'number' ? raw : (typeof raw === 'string' && /^[0-9]+$/.test(raw) ? Number(raw) : Date.parse(raw));
    if (!ms || isNaN(ms)) return '-';
    return new Date(ms).toLocaleString();
  };


export const formatRole = (role) => {
    return role.charAt(0).toUpperCase() + role.slice(1).toLowerCase();
}

export const formatStatus = (status) => {
    return status === 'active' ? 'Active' : 'Inactive';
}

export const bufferToHex = (buffer) => {
    return Array.from(new Uint8Array(buffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

export const truncateHash = (hash, length = 16) => {
    if (typeof hash !== 'string'){
        return hash.length > length ? `${hash.slice(0, length)}...` : hash;
    }
    return 'N/A';
}