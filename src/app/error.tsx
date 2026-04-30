'use client';

import { useEffect, useState } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [showChat, setShowChat] = useState(false);
  const [chatStatus, setChatStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    console.error('App Error:', error);
  }, [error]);

  const handleSendHelp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setChatStatus('sending');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email');
    const message = formData.get('message');

    const webhookUrl = process.env.NEXT_PUBLIC_SLACK_WEBHOOK_URL;

    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          body: JSON.stringify({
            text: `🚨 *Database Outage Report*\n*From:* ${email}\n*Message:* ${message}`
          })
        });
      } catch (err) {
        console.error('Failed to send to Slack:', err);
      }
    }

    setChatStatus('sent');
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#18191A',
        zIndex: 9999,
        padding: '20px',
        fontFamily: 'sans-serif'
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#e4e6eb', margin: '0 0 8px 0' }}>
          Sorry, something went wrong.
        </h2>
        <p style={{ fontSize: '15px', color: '#b0b3b8', margin: '0 0 24px 0' }}>
          We're working on getting this fixed as soon as we can.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 24px',
              backgroundColor: '#1877f2',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#166fe5'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1877f2'}
          >
            Reload Page
          </button>
          
          <button
            onClick={() => {
              setShowChat(true);
              setChatStatus('idle');
            }}
            style={{
              padding: '8px 24px',
              backgroundColor: '#3a3b3c',
              color: '#e4e6eb',
              fontSize: '15px',
              fontWeight: '600',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#4e4f50'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3a3b3c'}
          >
            Help
          </button>
        </div>
      </div>

      {/* Chatbot Modal */}
      {showChat && (
        <div style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '320px',
          backgroundColor: '#242526',
          borderRadius: '12px',
          boxShadow: '0 12px 28px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 10000,
          border: '1px solid #3e4042'
        }}>
          {/* Header */}
          <div style={{
            backgroundColor: '#3a3b3c',
            padding: '12px 16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #3e4042'
          }}>
            <span style={{ color: '#e4e6eb', fontWeight: '600', fontSize: '15px' }}>Support Chat</span>
            <button 
              onClick={() => setShowChat(false)}
              style={{ background: 'transparent', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontSize: '20px', lineHeight: '1' }}
            >
              &times;
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '16px' }}>
            {chatStatus === 'sent' ? (
              <div style={{ textAlign: 'center', color: '#e4e6eb', padding: '20px 0' }}>
                <div style={{ fontSize: '30px', marginBottom: '10px' }}>✅</div>
                <p style={{ margin: 0, fontSize: '15px' }}>Thanks! Our team has received your message.</p>
              </div>
            ) : (
              <form onSubmit={handleSendHelp} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ color: '#e4e6eb', margin: '0 0 4px 0', fontSize: '14px' }}>
                  Hi there! 👋 Since the system is down, let us know how we can reach you.
                </p>
                <input 
                  type="email" 
                  name="email"
                  required 
                  placeholder="Your Email" 
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #3e4042',
                    backgroundColor: '#3a3b3c',
                    color: '#e4e6eb',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
                <textarea 
                  name="message"
                  required
                  placeholder="What were you trying to do?" 
                  rows={3}
                  style={{
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid #3e4042',
                    backgroundColor: '#3a3b3c',
                    color: '#e4e6eb',
                    fontSize: '14px',
                    outline: 'none',
                    resize: 'none'
                  }}
                />
                <button 
                  type="submit"
                  disabled={chatStatus === 'sending'}
                  style={{
                    padding: '10px',
                    backgroundColor: '#1877f2',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: chatStatus === 'sending' ? 'not-allowed' : 'pointer',
                    opacity: chatStatus === 'sending' ? 0.7 : 1
                  }}
                >
                  {chatStatus === 'sending' ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
