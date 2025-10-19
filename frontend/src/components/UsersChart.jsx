import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';

/**
 * Shows users created per day over the last 7 days.
 * If the backend endpoint is not available, you may pass `users` prop
 * (list of users with created_at) and the component will compute counts.
 */
const UsersChart = ({ users = [], days = 7 }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper: generate last `days` days array of YYYY-MM-DD
  const lastNDates = (n) => {
    const out = [];
    const today = new Date();
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const iso = d.toISOString().slice(0, 10); // YYYY-MM-DD
      out.push(iso);
    }
    return out;
  };

  // Fallback compute from users prop
  const computeFromUsers = () => {
    const dates = lastNDates(days);
    const counts = Object.fromEntries(dates.map(d => [d, 0]));
    users.forEach(u => {
      const created = u.createdAt || u.created_at;
      if (!created) return;
      const iso = new Date(created).toISOString().slice(0, 10);
      if (iso in counts) counts[iso] += 1;
    });
    return dates.map(d => ({ date: d, label: formatLabel(d), count: counts[d] }));
  };

  const formatLabel = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); // e.g. "Oct 14"
  };

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        // Try backend endpoint first
        const resp = await api.getUsersCreatedPerDay(days);
        // backend expected: [{ date: "YYYY-MM-DD", count: N }, ...]
        const dates = lastNDates(days);
        const map = {};
        (resp || []).forEach(item => {
          map[item.date] = typeof item.count === 'number' ? item.count : Number(item.count) || 0;
        });
        const prepared = dates.map(d => ({ date: d, label: formatLabel(d), count: map[d] || 0 }));
        if (mounted) setData(prepared);
      } catch (err) {
        // fallback: compute from passed users prop
        console.warn('UsersChart: backend stats fetch failed, falling back to client compute', err);
        const fallback = computeFromUsers();
        if (mounted) {
          setData(fallback);
          setError(err.message || 'Failed to load stats, using local data');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();
    return () => { mounted = false; };
  }, [users, days]);

  if (loading) {
    return (
      <div className="bg-white rounded shadow-sm border p-3 mb-3">
        <h5 className="mb-3">Users created (last {days} days)</h5>
        <div className="text-center text-muted py-4">Loading...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded shadow-sm border p-3 mb-3">
        <h5 className="mb-3">Users created (last {days} days)</h5>
        <div className="text-center text-muted py-4">No data available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm border p-3 mb-3">
      <h5 className="mb-3">Users created (last {days} days)</h5>
      {error && <div className="alert alert-warning py-1">{error}</div>}
      <div style={{ width: '100%', height: 240, minHeight: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Users']} />
            <Bar dataKey="count" fill="#0d6efd" radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsersChart;