'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Footer() {
  const [showChat, setShowChat] = useState(false);
  const [chatStatus, setChatStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Attempt to load current user to prefill support request email
    fetch('/api/user')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.email) {
          setUser(data);
        }
      })
      .catch(() => { });
  }, []);

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
            text: `🛎️ *User Support Request*\n*From:* ${email}\n*Message:* ${message}`,
          }),
        });
      } catch (err) {
        console.error('Failed to send to Slack:', err);
      }
    }

    setChatStatus('sent');
  };

  return (
    <>
      <footer className="footer">
        <div className="footer-left">
          <span>&copy; {new Date().getFullYear()} ToTstore. All Rights Reserved.</span>
          <span className="footer-divider">|</span>
          <Link href="/terms" className="footer-link">
            T&C
          </Link>
        </div>
        <div className="footer-center">
          <span>
            Made with ❤️ -{' '}
            <a
              href="https://instagram.com/trippy_tot"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-instagram-link"
            >
              @trippy_tot
            </a>
          </span>
        </div>
        <div className="footer-right">
          <button
            onClick={() => {
              setShowChat(true);
              setChatStatus('idle');
            }}
            className="footer-get-help-btn"
            aria-label="Get Help Support Request"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <span>Get Help</span>
          </button>
        </div>
      </footer>

      {/* Support Chat Request Modal */}
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
          border: '1px solid #3e4042',
          fontFamily: 'inherit'
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
              style={{ background: 'transparent', border: 'none', color: '#b0b3b8', cursor: 'pointer', fontSize: '20px', lineHeight: '1', minWidth: '44px', minHeight: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              aria-label="Close support chat"
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
                  Hi there! 👋 How can we help you today?
                </p>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="Your Email"
                  defaultValue={user?.email || ''}
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
                  placeholder="How can we help?"
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
    </>
  );
}
