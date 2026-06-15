'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { updateProfile, logout } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    city: user.city || '',
    zipCode: user.zipCode || ''
  });
  const [theme, setTheme] = useState('dark');
  const [showChat, setShowChat] = useState(false);
  const [chatStatus, setChatStatus] = useState<'idle' | 'sending' | 'sent'>('idle');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    setTimeout(() => {
      setTheme(savedTheme);
    }, 0);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await updateProfile(formData);
    if (res.success) {
      setIsEditing(false);
      router.refresh(); // refresh the server component to get new cookie data
    } else {
      alert('Failed to update profile.');
    }
  };

  const handleLogout = async () => {
    await logout();
    router.refresh();
  };

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
            text: `🛎️ *User Support Request*\n*From:* ${email}\n*Message:* ${message}`
          })
        });
      } catch (err) {
        console.error('Failed to send to Slack:', err);
      }
    }

    setChatStatus('sent');
  };

  return (
    <div className="profile-container">
      <nav className="navbar">
        <Link href="/" className="nav-brand" aria-label="ToTStore">
          <span className="sr-only">ToTStore</span>
          <span className="brand-text" aria-hidden="true">T</span>
          <img src="/logo-o.jpg" alt="" className="brand-o" aria-hidden="true" />
          <span className="brand-text" aria-hidden="true">TStore</span>
        </Link>
        <div className="nav-actions">
           <Link href="/" className="nav-link">Back to Shop</Link>
        </div>
      </nav>

      <main className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <img src={user.avatar} alt={user.name} className="profile-avatar" />
            <div className="profile-title">
              <h1>User Profile</h1>
              <p>Manage your account settings and view your orders.</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginLeft: 'auto' }}>
              <button 
                className="edit-profile-btn" 
                onClick={toggleTheme}
                style={{ margin: 0, width: '130px' }}
              >
                {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
              </button>
              {!isEditing && (
                <button 
                  className="edit-profile-btn" 
                  onClick={() => setIsEditing(true)}
                  style={{ margin: 0, width: '130px' }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {isEditing ? (
            <form className="profile-form" onSubmit={handleSave}>
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              
              <h2 className="form-section-title">Shipping Address</h2>
              <div className="form-group">
                <label>Street Address</label>
                <input type="text" name="address" value={formData.address} onChange={handleChange} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input type="text" name="city" value={formData.city} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label>Pin Code (Digits only)</label>
                  <input 
                    type="number" 
                    name="zipCode" 
                    value={formData.zipCode} 
                    onChange={handleChange} 
                    placeholder="e.g. 110001"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                <button type="submit" className="save-btn">Save Changes</button>
              </div>
            </form>
          ) : (
            <div className="profile-details">
              <div className="detail-item">
                <label>Full Name</label>
                <span>{user.name}</span>
              </div>
              <div className="detail-item">
                <label>Email Address</label>
                <span>{user.email}</span>
              </div>
              <div className="detail-item">
                <label>Phone Number</label>
                <span>{user.phone || 'Not provided'}</span>
              </div>
              <div className="detail-item">
                <label>Shipping Address</label>
                <span>
                  {user.address 
                    ? `${user.address}, ${user.city || ''} - ${user.zipCode || ''}` 
                    : 'Not provided'}
                </span>
              </div>
              <div className="detail-item">
                <label>Account Status</label>
                <span className="status-badge">Active Member</span>
              </div>
            </div>
          )}

          <div className="profile-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button onClick={handleLogout} className="logout-btn">Log Out</button>
            <button 
              onClick={() => {
                setShowChat(true);
                setChatStatus('idle');
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#3a3b3c',
                color: '#e4e6eb',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 210, 255, 0.15)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 210, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3a3b3c';
                e.currentTarget.style.color = '#e4e6eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>Get Help</span>
            </button>
            <Link 
              href="/terms"
              title="Terms & Conditions"
              aria-label="Terms & Conditions"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                backgroundColor: '#3a3b3c',
                color: '#e4e6eb',
                fontSize: '15px',
                fontWeight: '600',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textDecoration: 'none'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 210, 255, 0.15)';
                e.currentTarget.style.color = 'var(--accent-cyan)';
                e.currentTarget.style.boxShadow = '0 0 10px rgba(0, 210, 255, 0.3)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#3a3b3c';
                e.currentTarget.style.color = '#e4e6eb';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
              <span>T&C</span>
            </Link>
          </div>
        </div>
      </main>

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
                  defaultValue={user.email}
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
    </div>
  );
}
