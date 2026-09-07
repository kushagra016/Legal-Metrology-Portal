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
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? 'Login' : 'Register Stakeholder'}</h2>
          <p>Digital Metrology System (SIH 26036)</p>
        </div>

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

        <div className="auth-toggle" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? 'Need an account? Register here' : 'Already have an account? Log in'}
        </div>
      </div>
    </div>
  );
}