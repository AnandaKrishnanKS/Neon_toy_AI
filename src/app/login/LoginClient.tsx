'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { verifyGoogleToken } from '../actions';

export default function LoginClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if google is defined globally
    if (typeof window !== 'undefined' && 'google' in window) {
      initializeGoogleSignIn();
    } else {
      // Load script if not present
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.body.appendChild(script);
    }
    
    function initializeGoogleSignIn() {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (!clientId) {
        setError('Google Client ID is missing. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment.');
        return;
      }
      
      // @ts-ignore
      google.accounts.id.initialize({
        client_id: clientId,
        callback: handleGoogleResponse
      });

      // @ts-ignore
      google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { theme: 'filled_black', size: 'large', text: 'continue_with', width: 300 }
      );
    }
  }, []);

  const handleGoogleResponse = async (response: any) => {
    setLoading(true);
    setError(null);
    try {
      const result = await verifyGoogleToken(response.credential);
      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || 'Failed to authenticate');
      }
    } catch (e: any) {
      setError(e.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '20px' }}>
      <div style={{ background: 'var(--card-bg)', padding: '50px', borderRadius: '24px', border: '1px solid var(--card-border)', textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h1 style={{ marginBottom: '10px', fontSize: '2rem', background: 'linear-gradient(to right, var(--accent-pink), var(--accent-cyan))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Welcome Back</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '40px' }}>Sign in securely to manage your orders, checkout, and view your profile.</p>
        
        {loading ? (
           <p>Authenticating...</p>
        ) : (
           <div id="google-signin-button" style={{ display: 'flex', justifyContent: 'center' }}></div>
        )}
        
        {error && <p style={{ color: '#ef4444', marginTop: '20px', fontSize: '0.9rem' }}>{error}</p>}
        
        <div style={{ marginTop: '30px' }}>
          <button 
            type="button" 
            onClick={() => router.push('/')}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Return to Store
          </button>
        </div>
      </div>
    </div>
  );
}
