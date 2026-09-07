import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');
  
  // NEW: State for on-screen messages
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' }); // Clear any previous messages when clicking submit

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        // NEW: Replaced alert() with setMessage()
        setMessage({ text: 'Logged in successfully!', type: 'success' }); 
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: role, 
            }
          }
        });
        if (error) throw error;
        // NEW: Replaced alert() with setMessage()
        setMessage({ text: 'Registration successful! Please check your email to verify.', type: 'success' });
      }
    } catch (error) {
        // NEW: Replaced alert() with setMessage()
        setMessage({ text: error.message, type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? 'Login' : 'Register Stakeholder'}</h2>
          <p>Digital Metrology System (SIH 26036)</p>
        </div>

        {/* NEW: The notification banner that appears on the screen */}
        {message.text && (
          <div style={{
            padding: '12px',
            marginBottom: '20px',
            borderRadius: '8px',
            textAlign: 'center',
            fontWeight: '500',
            backgroundColor: message.type === 'error' ? '#ffebee' : '#e8f5e9',
            color: message.type === 'error' ? '#c62828' : '#2e7d32',
            border: `1px solid ${message.type === 'error' ? '#ef9a9a' : '#a5d6a7'}`
          }}>
            {message.text}
          </div>
        )}

        <form className="auth-form" onSubmit={handleAuth}>
          {!isLogin && (
            <>
              <input 
                type="text" 
                placeholder="Full Name / Organization Name" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required 
              />
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="user">General User / Business</option>
                <option value="lmo">Legal Metrology Officer (LMO)</option>
                <option value="gatc">Govt. Approved Test Centre (GATC)</option>
                <option value="admin">Administrator</option>
              </select>
            </>
          )}

          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Secure Log In' : 'Create Account')}
          </button>
        </form>

        <div className="auth-toggle" onClick={() => {
            setIsLogin(!isLogin);
            setMessage({ text: '', type: '' }); // Clear messages when switching tabs
        }}>
          {isLogin ? 'Need an account? Register here' : 'Already have an account? Log in'}
        </div>
      </div>
    </div>
  );
}