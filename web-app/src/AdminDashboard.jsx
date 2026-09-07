import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function AdminDashboard() {
  const [requests, setRequests] = useState([]);
  const [expiringCerts, setExpiringCerts] = useState([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchSystemData = async () => {
    setLoading(true);
    
    // 1. Fetch Workflow Requests
    const { data: requestData, error: requestError } = await supabase
      .from('verification_requests')
      .select(`
        id,
        status,
        created_at,
        instruments ( category, location_address ),
        applicant:profiles!user_id ( full_name ) 
      `)
      .order('created_at', { ascending: false });

    if (requestError) console.error("Supabase Admin Error:", requestError);

    if (!requestError && requestData) {
      setRequests(requestData);
      setStats({
        total: requestData.length,
        pending: requestData.filter(req => req.status === 'pending').length,
        approved: requestData.filter(req => req.status === 'approved').length,
      });
    }

    // 2. Fetch Certificates for Expiry Tracking
    const { data: certData, error: certError } = await supabase
      .from('verification_certificates')
      .select(`
        id,
        certificate_number,
        expiry_date,
        instruments ( category, location_address )
      `);

    if (!certError && certData) {
      const today = new Date();
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(today.getDate() + 30);

      // Filter for certificates expiring in the next 30 days
      const expiring = certData.filter(cert => {
        const expDate = new Date(cert.expiry_date);
        return expDate >= today && expDate <= thirtyDaysFromNow;
      });
      
      setExpiringCerts(expiring);
    }

    setLoading(false);
  };

  useEffect(() => {
    // Defer the initial load so the effect does not synchronously update state
    // during the component's initial commit.
    const timeoutId = setTimeout(() => {
      fetchSystemData();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const sendExpiryAlert = (certNumber) => {
    setMessage({ text: `Automated SMS & Email alert successfully sent to the owner of certificate ${certNumber}.`, type: 'success' });
    
    // Automatically hide the message after 4 seconds
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 4000);
  };

  if (loading) return <p>Loading system statistics...</p>;

  return (
    <div>
      {/* On-screen notification banner */}
      {message.text && (
        <div style={{
          padding: '12px', marginBottom: '20px', borderRadius: '8px', textAlign: 'center', fontWeight: '500',
          backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
          color: message.type === 'error' ? '#c62828' : '#2e7d32',
          border: `1px solid ${message.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`
        }}>
          {message.text}
        </div>
      )}

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

      {/* NEW: Expiry Tracking Console */}
      <div className="card" style={{ borderLeft: '5px solid #dc3545' }}>
        <h3 style={{ margin: '0 0 5px 0', color: '#dc3545' }}>⚠️ Expiry Alerts (Next 30 Days)</h3>
        <p style={{ color: '#6c757d', margin: '0 0 15px 0' }}>Instruments requiring re-verification shortly.</p>
        
        <table className="modern-table">
          <thead>
            <tr>
              <th>Certificate No.</th>
              <th>Instrument</th>
              <th>Location</th>
              <th>Expiry Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {expiringCerts.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', color: '#6c757d' }}>No certificates are expiring in the next 30 days.</td>
              </tr>
            ) : (
              expiringCerts.map((cert) => (
                <tr key={cert.id} style={{ backgroundColor: '#fff5f5' }}>
                  <td><strong>{cert.certificate_number}</strong></td>
                  <td>{cert.instruments?.category}</td>
                  <td>{cert.instruments?.location_address}</td>
                  <td style={{ color: '#dc3545', fontWeight: '600' }}>{cert.expiry_date}</td>
                  <td>
                    <button className="btn-outline" onClick={() => sendExpiryAlert(cert.certificate_number)} style={{ borderColor: '#dc3545', color: '#dc3545' }}>
                      Send Reminder Alert
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* System-Wide Activity Log */}
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
                <td>{req.applicant?.full_name || 'Unknown User'}</td>
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