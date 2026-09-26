// src/ScaleAuditor.jsx
import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { generateCalibrationHash } from './cryptoLock';

export default function ScaleAuditor({ instrumentId }) {
  const [instrument, setInstrument] = useState(null);
  const [liveParams, setLiveParams] = useState(null);
  const [loading, setLoading] = useState(true);
  const [auditStatus, setAuditStatus] = useState(null); // 'safe' | 'tampered' | null
  const [logMessage, setLogMessage] = useState('');

  const fetchInstrumentData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('instruments')
      .select('*')
      .eq('id', instrumentId)
      .single();

    if (!error && data) {
      setInstrument(data);
      // Initialize live parameters from saved calibration parameters (or provide defaults)
      const baseParams = data.calibration_params || {
        max_capacity: 50.0,
        division_step: 0.01,
        zero_offset: 1204,
        calibration_weight: 20.0,
      };
      setLiveParams(baseParams);
    }
    setLoading(false);
  };

  useEffect(() => {
    let isMounted = true;

    const loadInstrumentData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('instruments')
          .select('*')
          .eq('id', instrumentId)
          .single();

        if (!isMounted) return;

        if (!error && data) {
          setInstrument(data);
          const baseParams = data.calibration_params || {
            max_capacity: 50.0,
            division_step: 0.01,
            zero_offset: 1204,
            calibration_weight: 20.0,
          };
          setLiveParams(baseParams);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadInstrumentData();

    return () => {
      isMounted = false;
    };
  }, [instrumentId]);

  // Perform official LMO initial sealing
  const handleSealAndLock = async () => {
    try {
      const generatedHash = await generateCalibrationHash(liveParams);

      const { error } = await supabase
        .from('instruments')
        .update({
          calibration_hash: generatedHash,
          calibration_params: liveParams,
          is_locked: false,
          lock_reason: null,
          locked_at: null,
        })
        .eq('id', instrumentId);

      if (!error) {
        setAuditStatus('safe');
        setLogMessage('Scale calibrated. SHA-256 HMAC hash successfully locked and synced to cloud.');
        fetchInstrumentData();
      }
    } catch (err) {
      setLogMessage('Error sealing instrument: ' + err.message);
    }
  };

  // Run live verification comparing live EEPROM hash to database hash
  const handleVerifyIntegrity = async () => {
    if (!instrument?.calibration_hash) {
      setLogMessage('Instrument has not been initialized with an official calibration hash.');
      return;
    }

    const currentLiveHash = await generateCalibrationHash(liveParams);

    if (currentLiveHash === instrument.calibration_hash) {
      setAuditStatus('safe');
      setLogMessage('✅ INTEGRITY VERIFIED: Live EEPROM parameters match the immutable SHA-256 cloud hash.');
    } else {
      // Tampering detected: trigger automated lockdown in Supabase
      setAuditStatus('tampered');
      setLogMessage('🚨 TAMPERING DETECTED: EEPROM values differ from certified calibration parameters! Locking instrument...');

      await supabase
        .from('instruments')
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
          lock_reason: 'Cryptographic hash mismatch. Unauthorized service menu alteration detected.',
        })
        .eq('id', instrumentId);

      fetchInstrumentData();
    }
  };

  // Demonstration trigger for SIH presentations
  const handleSimulateTamper = () => {
    if (!liveParams) return;
    // Simulate fraudulent manipulation (e.g. changing calibration weight to inflate readings)
    setLiveParams({
      ...liveParams,
      calibration_weight: Number((liveParams.calibration_weight * 0.9).toFixed(2)),
      zero_offset: liveParams.zero_offset + 55,
    });
    setLogMessage('⚠️ Vendor entered hidden service menu and modified scale calibration values.');
  };

  if (loading) return <p>Loading scale telemetry...</p>;
  if (!instrument) return <p>Instrument not found.</p>;

  return (
    <div style={{ padding: '20px', maxWidth: '750px', margin: '20px auto', background: '#fff', borderRadius: '8px', border: '1px solid #ddd', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
        <h3 style={{ margin: 0, color: '#1a2a3a' }}>SHA-256 Cryptographic Memory Lock</h3>
        <span style={{
          padding: '6px 12px',
          borderRadius: '20px',
          fontWeight: 'bold',
          fontSize: '12px',
          background: instrument.is_locked ? '#ffcdd2' : '#c8e6c9',
          color: instrument.is_locked ? '#c62828' : '#2e7d32'
        }}>
          {instrument.is_locked ? 'HARDWARE LOCKED' : 'SYSTEM OPERATIONAL'}
        </span>
      </div>

      {instrument.is_locked && (
        <div style={{ background: '#ffebee', color: '#b71c1c', border: '1px solid #ffcdd2', padding: '12px', borderRadius: '6px', margin: '15px 0' }}>
          <strong>Lock Reason:</strong> {instrument.lock_reason}<br />
          <small>Locked At: {new Date(instrument.locked_at).toLocaleString()}</small>
        </div>
      )}

      {/* Cloud-Synced Record */}
      <div style={{ margin: '15px 0', background: '#f8f9fa', padding: '12px', borderRadius: '6px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#555' }}>CLOUD-SYNCED CALIBRATION RECORD</h4>
        <div style={{ fontSize: '13px', wordBreak: 'break-all', fontFamily: 'monospace' }}>
          <strong>Stored Hash:</strong> {instrument.calibration_hash || 'NOT CALIBRATED YET'}
        </div>
      </div>

      {/* Live EEPROM Parameters */}
      <div style={{ margin: '15px 0' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#555' }}>LIVE SCALE EEPROM PARAMETERS</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>Max Capacity (kg):</label>
            <input
              type="number"
              value={liveParams?.max_capacity || ''}
              disabled={instrument.is_locked}
              onChange={(e) => setLiveParams({ ...liveParams, max_capacity: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>Division Step (e):</label>
            <input
              type="number"
              value={liveParams?.division_step || ''}
              disabled={instrument.is_locked}
              onChange={(e) => setLiveParams({ ...liveParams, division_step: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>Zero Offset Count:</label>
            <input
              type="number"
              value={liveParams?.zero_offset || ''}
              disabled={instrument.is_locked}
              onChange={(e) => setLiveParams({ ...liveParams, zero_offset: parseInt(e.target.value) })}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#666' }}>Calibration Weight (kg):</label>
            <input
              type="number"
              value={liveParams?.calibration_weight || ''}
              disabled={instrument.is_locked}
              onChange={(e) => setLiveParams({ ...liveParams, calibration_weight: parseFloat(e.target.value) })}
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
        <button
          onClick={handleSealAndLock}
          style={{ flex: 1, padding: '10px', background: '#0056b3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          LMO Official Seal & Lock
        </button>
        <button
          onClick={handleVerifyIntegrity}
          style={{ flex: 1, padding: '10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Check Scale Integrity
        </button>
        <button
          onClick={handleSimulateTamper}
          disabled={instrument.is_locked}
          style={{ flex: 1, padding: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: instrument.is_locked ? 'not-allowed' : 'pointer' }}
        >
          Simulate Tampering
        </button>
      </div>

      {logMessage && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          borderRadius: '4px',
          fontSize: '13px',
          background: auditStatus === 'tampered' ? '#ffebee' : auditStatus === 'safe' ? '#e8f5e9' : '#eef2f7',
          color: auditStatus === 'tampered' ? '#c62828' : auditStatus === 'safe' ? '#2e7d32' : '#333',
        }}>
          {logMessage}
        </div>
      )}
    </div>
  );
}