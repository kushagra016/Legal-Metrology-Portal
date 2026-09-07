import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import CertificateView from './CertificateView'; // 1. Import the view

export default function LMODashboard({ session }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewCertId, setViewCertId] = useState(null); // 2. Track which certificate to view

  async function fetchAssignedRequests() {
    setLoading(true);
    const { data, error } = await supabase
      .from('verification_requests')
      .select(`
        id,
        status,
        scheduled_date,
        instruments ( id, category, location_address, model_number ),
        verification_certificates ( id ) 
      `) // 3. We added verification_certificates to the query to get the generated ID
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching requests:", error);
    } else {
      setRequests(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAssignedRequests();
    }, 0);

    return () => clearTimeout(timeoutId);
  }, []);

  const updateStatus = async (requestId, instrumentId, newStatus) => {
    const { error } = await supabase
      .from('verification_requests')
      .update({ status: newStatus })
      .eq('id', requestId);
      
    if (error) {
      alert("Error updating status: " + error.message);
      return;
    }

    if (newStatus === 'approved') {
      // Use the request ID as a stable certificate number so rendering remains pure.
      const certNumber = `CERT-${requestId}`;
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);

      const { error: certError } = await supabase
        .from('verification_certificates')
        .insert([{
          certificate_number: certNumber,
          request_id: requestId,
          instrument_id: instrumentId,
          verified_by: session.user.id,
          expiry_date: expiryDate.toISOString().split('T')[0]
        }]);

      if (certError) {
        alert("Error generating certificate: " + certError.message);
        return;
      }
    }

    fetchAssignedRequests();
    alert(`Status updated to ${newStatus.toUpperCase()} successfully!`);
  };

  if (loading) return <p>Loading your assigned tasks...</p>;

  // 4. If a certificate is selected, hide the table and show ONLY the certificate
  if (viewCertId) {
    return (
      <div style={{ padding: '20px' }}>
        <button 
          onClick={() => setViewCertId(null)} 
          style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          &larr; Back to Dashboard
        </button>
        <CertificateView certificateId={viewCertId} />
      </div>
    );
  }

  // 5. Otherwise, show the normal dashboard table
  return (
    <div className="card">
      <h3 style={{ margin: '0 0 5px 0', color: '#203a43' }}>LMO Inspection Dashboard</h3>
      <p style={{ color: '#6c757d', margin: '0 0 20px 0' }}>Monitor your assigned verification activities below.</p>
      
      <table className="modern-table">
        <thead>
          <tr>
            <th>Instrument Type</th>
            <th>Location</th>
            <th>Scheduled Date</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ textAlign: 'center', color: '#6c757d' }}>No assigned requests found.</td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id}>
                <td>
                  <strong>{req.instruments?.category}</strong> <br/>
                  <small style={{ color: '#6c757d' }}>Model: {req.instruments?.model_number}</small>
                </td>
                <td>{req.instruments?.location_address}</td>
                <td>{req.scheduled_date || 'Not scheduled'}</td>
                <td>
                  <span className={`status-badge status-${req.status}`}>
                    {req.status.replace('_', ' ')}
                  </span>
                </td>
                <td>
                  {req.status === 'pending' && (
                    <button className="btn-primary" onClick={() => updateStatus(req.id, req.instruments.id, 'in_inspection')}>
                      Start Inspection
                    </button>
                  )}
                  {req.status === 'in_inspection' && (
                    <button className="btn-success" onClick={() => updateStatus(req.id, req.instruments.id, 'approved')}>
                      Approve Certificate
                    </button>
                  )}
                  {req.status === 'approved' && req.verification_certificates?.length > 0 && (
                    <button className="btn-outline" onClick={() => setViewCertId(req.verification_certificates[0].id)} style={{ marginLeft: '10px' }}>
                      View Certificate
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}