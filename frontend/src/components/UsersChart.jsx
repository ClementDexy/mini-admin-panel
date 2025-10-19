import React, { useEffect, useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

/**
 * Displays the number of verified users created per day
 * over the last N days.
 *
 * Receives verified users via props (from useVerifiedUsers hook)
 * and automatically recomputes whenever the verified users list updates.
 */
const UsersChart = ({ users = [], days = 7 }) => {
  const [data, setData] = useState([]);

  // Helper: generate the last N days in YYYY-MM-DD format
  const lastNDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      dates.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }
    return dates;
  }, [days]);

  const formatLabel = (isoDate) => {
    const d = new Date(isoDate);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  // Compute chart data based on verified users prop
  useEffect(() => {
    if (!users.length) {
      setData([]);
      return;
    }

    const counts = Object.fromEntries(lastNDates.map((d) => [d, 0]));

    users.forEach((user) => {
      const created = user.createdAt || user.created_at;
      if (!created) return;
      const iso = new Date(created).toISOString().slice(0, 10);
      if (iso in counts) counts[iso] += 1;
    });

    const computed = lastNDates.map((d) => ({
      date: d,
      label: formatLabel(d),
      count: counts[d],
    }));

    setData(computed);
  }, [users, lastNDates]);

  // Render
  if (!data.length) {
    return (
      <div className="bg-white rounded shadow-sm border p-3 mb-3">
        <h5 className="mb-3">Users created (last {days} days)</h5>
        <div className="text-center text-muted py-4">
          No verified user data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm border p-3 mb-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Users created (last {days} days)</h5>
      </div>
      <div style={{ width: '100%', height: 240, minHeight: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 10, right: 16, left: 0, bottom: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis allowDecimals={false} />
            <Tooltip formatter={(v) => [v, 'Users']} />
            <Bar dataKey="count" fill="#0d6efd" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsersChart;