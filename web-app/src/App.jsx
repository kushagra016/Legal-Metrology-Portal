import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import LMODashboard from './LMODashboard';
import UserDashboard from './UserDashboard';
import PublicVerification from './PublicVerification';
import AdminDashboard from './AdminDashboard';
import GATCDashboard from './GATCDashboard';
import LandingPage from './LandingPage';

function App() {
  // ==========================================
  // 1. ALL HOOKS MUST COME FIRST
  // ==========================================
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  async function fetchProfile(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
    setLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) fetchProfile(session.user.id);
      else {
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ==========================================
  // 2. ROUTING (Runs safely after hooks)
  // ==========================================

  // A. Check for Public QR Verification Route
  const path = window.location.pathname;
  if (path.startsWith('/verify/')) {
    const certId = path.split('/verify/')[1];
    return <PublicVerification certificateId={certId} />;
  }

  // B. Handle Loading State
  if (loading) return <div style={{ padding: '50px' }}>Loading application...</div>;

  // C. Handle Unauthenticated Users
  // C. Handle Unauthenticated Users
  if (!session) {
    if (showAuth) {
      return <Auth onBack={() => setShowAuth(false)} />;
    }
    return <LandingPage onLoginClick={() => setShowAuth(true)} />;
  }

  // ==========================================
  // 3. MAIN DASHBOARD UI
  // ==========================================
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Digital Metrology Portal</h2>
        <div className="user-info">
          <span>
            Welcome, {userProfile?.full_name} ({userProfile?.role?.toUpperCase()})
          </span>
          <button className="btn-outline" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Role-based Routing */}
      {['lmo', 'gatc'].includes(userProfile?.role) && !userProfile?.is_approved ? (
        <div className="card" style={{ textAlign: 'center', padding: '50px' }}>
          <h2 style={{ color: '#856404' }}>⏳ Account Pending Approval</h2>
          <p style={{ fontSize: '16px', color: '#6c757d', maxWidth: '500px', margin: '0 auto' }}>
            Your registration as an official {userProfile?.role.toUpperCase()} has been received. You will gain access to the secure dashboard once an Administrator verifies your credentials.
          </p>
        </div>
      ) : userProfile?.role === 'lmo' ? (
        <LMODashboard session={session} />
      ) : userProfile?.role === 'user' ? (
        <UserDashboard session={session} />
      ) : userProfile?.role === 'gatc' ? (
        <GATCDashboard session={session} />
      ) : userProfile?.role === 'admin' ? (
        <AdminDashboard />
      ) : (
        <div className="card">
          <h3>Dashboard</h3>
          <p>Invalid role detected.</p>
        </div>
      )}
    </div>
  );
}

export default App;