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
    <div>
      <h3>LMO Inspection Dashboard</h3>
      <p>Monitor your assigned verification activities below.</p>
      
      <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
        <thead>
          <tr style={{ backgroundColor: '#f4f4f4', textAlign: 'left' }}>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Instrument Type</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Location</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Scheduled Date</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
            <th style={{ padding: '10px', border: '1px solid #ddd' }}>Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td colSpan="5" style={{ padding: '10px', textAlign: 'center' }}>No assigned requests found.</td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id}>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {req.instruments?.category} <br/>
                  <small>(Model: {req.instruments?.model_number})</small>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.instruments?.location_address}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>{req.scheduled_date || 'Not scheduled'}</td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  <span style={{ 
                    padding: '4px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: req.status === 'pending' ? '#ffeeba' : '#d4edda',
                    fontSize: '0.85em'
                  }}>
                    {req.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                  {req.status === 'pending' && (
                    <button onClick={() => updateStatus(req.id, req.instruments.id, 'in_inspection')}>
                      Start Inspection
                    </button>
                  )}
                  {req.status === 'in_inspection' && (
                    <button onClick={() => updateStatus(req.id, req.instruments.id, 'approved')} style={{ backgroundColor: 'green', color: 'white' }}>
                      Approve Certificate
                    </button>
                  )}
                  {/* NEW: The View Certificate button only appears AFTER approval */}
                  {req.status === 'approved' && req.verification_certificates?.length > 0 && (
                    <button 
                      onClick={() => setViewCertId(req.verification_certificates[0].id)} 
                      style={{ backgroundColor: '#0056b3', color: 'white', padding: '5px 10px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    >
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