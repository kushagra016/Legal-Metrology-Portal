import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function PublicVerification({ certificateId }) {
  const [certData, setCertData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const verifyCertificate = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Safely handle the input to prevent fatal crashes if undefined
        const input = certificateId ? decodeURIComponent(certificateId).trim() : '';

        if (!input) {
          setError("NO CERTIFICATE ID PROVIDED.");
          setLoading(false);
          return;
        }

        // 2. Smart routing based on input format
        const searchColumn = input.toUpperCase().startsWith('CERT-') ? 'certificate_number' : 'id';

        // 3. Execute query
        const { data, error: fetchError } = await supabase
          .from('verification_certificates')
          .select(`
            *,
            instruments ( category, model_number, serial_number, capacity, location_address ),
            profiles ( full_name )
          `)
          .eq(searchColumn, input)
          .single();

        if (fetchError || !data) {
          setError("CERTIFICATE NOT FOUND OR INVALID.");
        } else {
          setCertData(data);
        }
      } catch (err) {
        console.error("Verification error:", err);
        setError("AN ERROR OCCURRED DURING VERIFICATION.");
      }

      setLoading(false);
    };

    verifyCertificate();
  }, [certificateId]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}><h3>Verifying Certificate...</h3></div>;
  }

  if (error || !certData) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px', color: 'red' }}>
        <h1 style={{ fontSize: '50px', margin: '0' }}>⚠️</h1>
        <h2>{error || "CERTIFICATE NOT FOUND"}</h2>
        <p>This record does not match any official government records.</p>
      </div>
    );
  }

  // Safely evaluate dates
  const isExpired = certData.expiry_date ? new Date(certData.expiry_date) < new Date() : false;

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '20px', fontFamily: 'sans-serif', border: '1px solid #ccc', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        {isExpired ? (
          <h2 style={{ color: 'red', border: '2px solid red', display: 'inline-block', padding: '10px' }}>EXPIRED</h2>
        ) : (
          <h2 style={{ color: 'green', border: '2px solid green', display: 'inline-block', padding: '10px' }}>✅ AUTHENTIC RECORD</h2>
        )}
        <p style={{ margin: '5px 0' }}>Department of Legal Metrology</p>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Certificate Number:</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{certData.certificate_number || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Instrument:</strong></td>
            {/* Using optional chaining (?.) prevents rendering crashes if data is missing */}
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{certData.instruments?.category || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Serial Number:</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{certData.instruments?.serial_number || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Verified On:</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}>{certData.verification_date || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee' }}><strong>Valid Until:</strong></td>
            <td style={{ padding: '10px', borderBottom: '1px solid #eee', color: isExpired ? 'red' : 'black', fontWeight: 'bold' }}>{certData.expiry_date || 'N/A'}</td>
          </tr>
          <tr>
            <td style={{ padding: '10px' }}><strong>Verifying Officer:</strong></td>
            <td style={{ padding: '10px' }}>{certData.profiles?.full_name || 'N/A'}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}