import { useState } from 'react';
import { supabase } from './supabaseClient';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('user');

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // Log in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        alert('Logged in successfully!');
      } else {
        // Register new user and pass role/name to metadata
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
        alert('Registration successful! Please check your email to verify.');
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ padding: '50px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>{isLogin ? 'Login to Metrology System' : 'Register Stakeholder'}</h2>
      <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        
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
          {isLoading ? 'Loading...' : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>

      <p style={{ marginTop: '20px', cursor: 'pointer', color: 'blue' }} onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need an account? Register here' : 'Already have an account? Log in'}
      </p>
    </div>
  );
}