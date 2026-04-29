'use client';

import React, { useState } from 'react';
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

  return (
    <div className="profile-container">
      <nav className="navbar">
        <Link href="/" className="nav-brand">NeonToys</Link>
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
            {!isEditing && (
              <button 
                className="edit-profile-btn" 
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
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
              
              <h3 className="form-section-title">Shipping Address</h3>
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

          <div className="profile-actions">
            <button onClick={handleLogout} className="logout-btn">Log Out</button>
          </div>
        </div>
      </main>
    </div>
  );
}
