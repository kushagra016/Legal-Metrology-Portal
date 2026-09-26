import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import CertificateView from './CertificateView';
import { generateCalibrationHash } from './cryptoLock'; 
import ScaleAuditor from './ScaleAuditor'; // NEW: Import the interactive auditor component

export default function LMODashboard({ session }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewCertId, setViewCertId] = useState(null);
  const [auditInstrumentId, setAuditInstrumentId] = useState(null); // NEW: State to track which scale is being audited
  const [message, setMessage] = useState({ text: '', type: '' });

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
      `) 
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
    setMessage({ text: '', type: '' });

    const { error } = await supabase
      .from('verification_requests')
      .update({ status: newStatus })
      .eq('id', requestId);
      
    if (error) {
      setMessage({ text: "Error updating status: " + error.message, type: 'error' });
      return;
    }

    if (newStatus === 'approved') {
      try {
        const certifiedParams = {
          max_capacity: 50.0,
          division_step: 0.01,
          zero_offset: 1200,
          calibration_weight: 20.0,
        };

        const cloudHash = await generateCalibrationHash(certifiedParams);

        const { error: instError } = await supabase
          .from('instruments')
          .update({
            calibration_hash: cloudHash,
            calibration_params: certifiedParams,
            is_locked: false, 
            lock_reason: null,
            locked_at: null
          })
          .eq('id', instrumentId);

        if (instError) {
          setMessage({ text: 'Failed to apply cryptographic lock: ' + instError.message, type: 'error' });
          return;
        }

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
          setMessage({ text: "Error generating certificate: " + certError.message, type: 'error' });
          return;
        }
      } catch (err) {
        setMessage({ text: "Cryptographic Error: " + err.message, type: 'error' });
        return;
      }
    }

    fetchAssignedRequests(); 
    setMessage({ text: `Status updated to ${newStatus.replace('_', ' ').toUpperCase()} successfully!`, type: 'success' });
  };

  if (loading) return <p>Loading your assigned tasks...</p>;

  // Render Certificate View
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

  // NEW: Render the Interactive Hardware Auditor View
  if (auditInstrumentId) {
    return (
      <div style={{ padding: '20px' }}>
        <button 
          onClick={() => setAuditInstrumentId(null)} 
          style={{ marginBottom: '20px', padding: '10px 15px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          &larr; Back to Dashboard
        </button>
        <ScaleAuditor instrumentId={auditInstrumentId} />
      </div>
    );
  }

  return (
    <div className="card">
      <h3 style={{ margin: '0 0 5px 0', color: '#203a43' }}>LMO Inspection Dashboard</h3>
      <p style={{ color: '#6c757d', margin: '0 0 20px 0' }}>Monitor your assigned verification activities below.</p>
      
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
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn-outline" onClick={() => setViewCertId(req.verification_certificates[0].id)}>
                        View Certificate
                      </button>
                      {/* NEW: Audit Hardware Button */}
                      <button 
                        onClick={() => setAuditInstrumentId(req.instruments.id)} 
                        style={{ padding: '6px 12px', background: '#ff9800', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        Audit Hardware
                      </button>
                    </div>
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