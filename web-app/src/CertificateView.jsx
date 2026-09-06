import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import QRCode from 'react-qr-code';

export default function CertificateView({ certificateId }) {
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificate = async () => {
      const { data, error } = await supabase
        .from('verification_certificates')
        .select(`
          *,
          instruments ( category, model_number, serial_number, capacity, location_address ),
          profiles ( full_name ) 
        `)
        .eq('id', certificateId)
        .single();

      if (!error && data) setCertData(data);
      setLoading(false);
    };
    
    fetchCertificate();
  }, [certificateId]);

  if (loading) return <p>Loading Certificate...</p>;
  if (!certData) return <p>Certificate not found or invalid.</p>;

  // This is the URL the QR code will point to. 
  // Anyone scanning the QR code will be taken to this public validation link.
  const verificationUrl = `${window.location.origin}/verify/${certData.id}`;

  return (
    <div style={{ border: '5px double #333', padding: '40px', maxWidth: '600px', margin: '20px auto', backgroundColor: '#fff' }}>
      <div style={{ textAlign: 'center', borderBottom: '2px solid #333', paddingBottom: '20px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0', color: '#0056b3' }}>Government of India</h1>
        <h2>Department of Legal Metrology</h2>
        <h3>Certificate of Verification</h3>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ flex: 1 }}>
          <p><strong>Certificate No:</strong> {certData.certificate_number}</p>
          <p><strong>Instrument:</strong> {certData.instruments.category}</p>
          <p><strong>Model / Serial:</strong> {certData.instruments.model_number} / {certData.instruments.serial_number}</p>
          <p><strong>Capacity:</strong> {certData.instruments.capacity}</p>
          <p><strong>Location:</strong> {certData.instruments.location_address}</p>
          <br />
          <p><strong>Date of Verification:</strong> {certData.verification_date}</p>
          <p><strong>Valid Until:</strong> <span style={{ color: 'red', fontWeight: 'bold' }}>{certData.expiry_date}</span></p>
          <p><strong>Verified By (LMO):</strong> {certData.profiles.full_name}</p>
        </div>
        
        {/* THE QR CODE */}
        <div style={{ paddingLeft: '20px', textAlign: 'center' }}>
          <QRCode value={verificationUrl} size={150} />
          <p style={{ fontSize: '0.8em', marginTop: '10px' }}>Scan to Verify Authenticity</p>
        </div>
      </div>
      
      <div style={{ marginTop: '30px', textAlign: 'center' }}>
        <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#333', color: 'white', cursor: 'pointer' }}>
          Print / Export to PDF
        </button>
      </div>
    </div>
  );
}