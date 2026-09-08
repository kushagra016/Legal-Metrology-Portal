import { useState } from 'react';

export default function LandingPage({ onLoginClick }) {
  const [certId, setCertId] = useState('');

  const handleVerify = () => {
    if (certId.trim()) {
      window.location.href = `/verify/${certId.trim()}`;
    }
  };

  return (
    <div style={{ fontFamily: 'inherit' }}>
      
      {/* Hero Section using your professional gradient theme */}
      <div style={{ background: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)', color: 'white', padding: '50px 20px 80px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          {/* Top Navigation & Logo */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '60px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <h2 style={{ margin: 0, fontSize: '36px', fontWeight: 'bold', color: 'white' }}>LM</h2>
              <div style={{ borderLeft: '2px solid rgba(255,255,255,0.3)', paddingLeft: '15px' }}>
                <div style={{ fontSize: '18px', fontWeight: '600', letterSpacing: '0.5px' }}>Legal Metrology</div>
                <div style={{ fontSize: '13px', color: '#90cdf4' }}>Online Verification System</div>
              </div>
            </div>
            <button onClick={onLoginClick} style={{ background: 'none', color: 'white', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: '500' }}>Admin Portal &rarr;</button>
          </div>
          
          {/* Main Banner Text */}
          <p style={{ color: '#90cdf4', fontWeight: '700', marginBottom: '15px', letterSpacing: '1px', fontSize: '14px' }}>SMART INDIA HACKATHON - PS 26036</p>
          <h1 style={{ fontSize: '48px', margin: '0 0 20px 0', maxWidth: '900px', lineHeight: '1.2' }}>Online Verification System for Weighing & Measuring Instruments</h1>
          <p style={{ fontSize: '18px', maxWidth: '800px', lineHeight: '1.6', color: '#e2e8f0', marginBottom: '50px' }}>
            A unified digital platform connecting the public, businesses, Legal Metrology Inspectors and Government Approved Test Centres for registration, verification, certification and lifecycle management.
          </p>

          {/* Navigation Cards using your existing global .card and .btn-primary classes */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
            <div className="card" style={{ flex: 1, minWidth: '300px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '16px', color: '#495057', marginBottom: '25px', lineHeight: '1.5' }}>Verify certificates, scan QR codes and authenticate Legal Metrology records.</p>
              <button onClick={() => document.getElementById('verify-section').scrollIntoView({ behavior: 'smooth' })} className="btn-primary" style={{ alignSelf: 'flex-start' }}>Continue as Guest</button>
            </div>
            <div className="card" style={{ flex: 1, minWidth: '300px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '16px', color: '#495057', marginBottom: '25px', lineHeight: '1.5' }}>Register instruments, submit applications, track inspections and manage certificates.</p>
              <button onClick={onLoginClick} className="btn-primary" style={{ alignSelf: 'flex-start' }}>Shop Login</button>
            </div>
            <div className="card" style={{ flex: 1, minWidth: '300px', margin: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <p style={{ fontSize: '16px', color: '#495057', marginBottom: '25px', lineHeight: '1.5' }}>Manage assigned work, schedule field visits, inspect instruments and submit results.</p>
              <button onClick={onLoginClick} className="btn-primary" style={{ alignSelf: 'flex-start' }}>Inspector Login</button>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Section */}
      <div id="verify-section" style={{ backgroundColor: '#f8fafc', padding: '80px 20px', minHeight: '50vh' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <p style={{ color: '#64748b', fontWeight: '700', fontSize: '13px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px' }}>Public Certificate Verification</p>
          <h2 style={{ fontSize: '36px', margin: '0 0 15px 0', color: '#0f2027' }}>Verify a certificate</h2>
          <p style={{ color: '#495057', marginBottom: '40px', fontSize: '16px' }}>Enter a certificate ID to authenticate a Legal Metrology certificate.</p>
          
          <div style={{ display: 'flex', gap: '15px', maxWidth: '600px', marginBottom: '80px' }}>
            <input 
              type="text" 
              placeholder="Certificate ID — e.g. CERT-2026-0001" 
              value={certId}
              onChange={(e) => setCertId(e.target.value)}
              style={{ flex: 1, padding: '16px 20px', fontSize: '16px', border: '1px solid #cbd5e1', borderRadius: '8px', outline: 'none' }}
            />
            <button onClick={handleVerify} className="btn-primary" style={{ padding: '0 30px', fontSize: '16px' }}>Verify Certificate</button>
          </div>

          {/* 4-Step Process Guide */}
          <div style={{ display: 'flex', gap: '40px', borderTop: '2px solid #e2e8f0', paddingTop: '50px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <span style={{ color: '#94a3b8', fontWeight: '800', fontSize: '18px' }}>01</span>
              <h4 style={{ margin: '15px 0 10px 0', color: '#0f2027', fontSize: '18px' }}>Register</h4>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>Business registers an instrument.</p>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <span style={{ color: '#94a3b8', fontWeight: '800', fontSize: '18px' }}>02</span>
              <h4 style={{ margin: '15px 0 10px 0', color: '#0f2027', fontSize: '18px' }}>Apply</h4>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>Verification or re-verification application is submitted.</p>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <span style={{ color: '#94a3b8', fontWeight: '800', fontSize: '18px' }}>03</span>
              <h4 style={{ margin: '15px 0 10px 0', color: '#0f2027', fontSize: '18px' }}>Inspect</h4>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>Inspector or GATC performs the assigned activity.</p>
            </div>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <span style={{ color: '#94a3b8', fontWeight: '800', fontSize: '18px' }}>04</span>
              <h4 style={{ margin: '15px 0 10px 0', color: '#0f2027', fontSize: '18px' }}>Certify</h4>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.5' }}>Digital certificate is generated and monitored.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}