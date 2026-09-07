import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    supabase
      .from('verification_requests')
      .select(`
        id,
        status,
        created_at,
        instruments ( category, location_address ),
        profiles ( full_name )
      `)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (!isMounted) return;

        if (!error && data) {
          setRequests(data);
          // Calculate system-wide statistics
          setStats({
            total: data.length,
            pending: data.filter(req => req.status === 'pending').length,
            approved: data.filter(req => req.status === 'approved').length,
          });
        }
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) return <p>Loading system statistics...</p>;

  return (
    <div>
      {/* KPI Statistic Cards */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
        <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '20px' }}>
          <h2 style={{ fontSize: '36px', margin: '0 0 10px 0', color: '#203a43' }}>{stats.total}</h2>
          <p style={{ margin: 0, color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>Total Applications</p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '20px' }}>
          <h2 style={{ fontSize: '36px', margin: '0 0 10px 0', color: '#856404' }}>{stats.pending}</h2>
          <p style={{ margin: 0, color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>Pending (Pendency)</p>
        </div>
        <div className="card" style={{ flex: 1, textAlign: 'center', margin: 0, padding: '20px' }}>
          <h2 style={{ fontSize: '36px', margin: '0 0 10px 0', color: '#155724' }}>{stats.approved}</h2>
          <p style={{ margin: 0, color: '#6c757d', fontWeight: '600', textTransform: 'uppercase' }}>Approved Certificates</p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ margin: '0 0 15px 0', color: '#203a43' }}>System-Wide Activity Log</h3>
        <table className="modern-table">
          <thead>
            <tr>
              <th>Applicant Name</th>
              <th>Instrument</th>
              <th>Location</th>
              <th>Date Submitted</th>
              <th>Current Status</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id}>
                <td>{req.profiles?.full_name || 'Unknown User'}</td>
                <td>{req.instruments?.category}</td>
                <td>{req.instruments?.location_address}</td>
                <td>{new Date(req.created_at).toLocaleDateString()}</td>
                <td>
                  <span className={`status-badge status-${req.status}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}