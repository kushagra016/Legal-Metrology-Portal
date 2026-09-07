import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import LMODashboard from './LMODashboard';
import UserDashboard from './UserDashboard';
import PublicVerification from './PublicVerification';
import AdminDashboard from './AdminDashboard';
import GATCDashboard from './GATCDashboard';


function App() {
  const path = window.location.pathname;
  if (path.startsWith('/verify/')) {
    const certId = path.split('/verify/')[1];
    return <PublicVerification certificateId={certId} />;
  }

  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!error && data) {
      setUserProfile(data);
    }
    setLoading(false);
  };

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

  if (loading) return <div style={{ padding: '50px' }}>Loading application...</div>;
  if (!session) return <Auth />;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h2>Digital Metrology Portal</h2>
        <div className="user-info">
          <span>
            Welcome, {userProfile?.full_name} ({userProfile?.role.toUpperCase()})
          </span>
          <button className="btn-outline" onClick={() => supabase.auth.signOut()}>
            Sign Out
          </button>
        </div>
      </header>

      {/* Role-based Routing */}
      {userProfile?.role === 'lmo' ? (
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