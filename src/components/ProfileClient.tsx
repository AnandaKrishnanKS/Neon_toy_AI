'use client';

import React, { useState, useEffect } from 'react';
import { User } from '@/lib/types';
import { updateProfile, logout } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Curated location data structure for dynamic dropdowns
const locationData: Record<string, Record<string, string[]>> = {
  'Kerala': {
    'Ernakulam': ['Kochi', 'Aluva', 'Muvattupuzha', 'Angamaly', 'Perumbavoor', 'Kalamassery', 'Tripunithura'],
    'Thiruvananthapuram': ['Trivandrum', 'Neyyattinkara', 'Attingal', 'Nedumangad', 'Varkala'],
    'Kozhikode': ['Calicut', 'Vadakara', 'Koyilandy', 'Thamarassery', 'Feroke'],
    'Thrissur': ['Thrissur City', 'Chalakudy', 'Kunnamkulam', 'Irinjalakuda', 'Guruvayur'],
    'Kollam': ['Kollam City', 'Punalur', 'Karunagappally', 'Kottarakkara']
  },
  'Karnataka': {
    'Bangalore Urban': ['Bangalore', 'Yelahanka', 'Kengeri', 'Whitefield', 'Electronic City'],
    'Mysore': ['Mysore City', 'Hunsur', 'Nanjangud', 'K.R. Nagar'],
    'Dakshina Kannada': ['Mangalore', 'Ullal', 'Puttur', 'Bantwal']
  },
  'Tamil Nadu': {
    'Chennai': ['Chennai City', 'Tambaram', 'Avadi', 'Ambattur'],
    'Coimbatore': ['Coimbatore City', 'Pollachi', 'Mettupalayam', 'Tiruppur'],
    'Madurai': ['Madurai City', 'Melur', 'Thirumangalam', 'Usilampatti']
  },
  'Maharashtra': {
    'Mumbai': ['Mumbai City', 'Suburban Mumbai', 'Thane', 'Navi Mumbai'],
    'Pune': ['Pune City', 'Pimpri-Chinchwad', 'Baramati', 'Lonavala'],
    'Nagpur': ['Nagpur City', 'Kamthi', 'Umred']
  },
  'Delhi': {
    'New Delhi': ['Connaught Place', 'Chanakyapuri', 'Vasant Kunj', 'Dwarka'],
    'South Delhi': ['Saket', 'Mehrauli', 'Hauz Khas', 'Greater Kailash']
  }
};

export default function ProfileClient({ user }: { user: User }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    address: user.address || '',
    landmark: user.landmark || '',
    state: user.state || '',
    district: user.district || '',
    city: user.city || '',
    zipCode: user.zipCode || ''
  });
  const [theme, setTheme] = useState('dark');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      state: val,
      district: '',
      city: ''
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      district: val,
      city: ''
    }));
  };

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormData(prev => ({
      ...prev,
      city: val
    }));
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
        <Link href="/" className="nav-brand" aria-label="ToTstore">
          <span className="sr-only">ToTstore</span>
          <span className="brand-text" aria-hidden="true">T</span>
          <img src="/logo-o.jpg" alt="" className="brand-o" aria-hidden="true" />
          <span className="brand-text" aria-hidden="true">Tstore</span>
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
                <input type="email" name="email" value={formData.email} onChange={handleChange} required disabled />
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input type="text" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              
              <h2 className="form-section-title">Shipping Address</h2>
              <div className="form-group">
                <label htmlFor="profile-address">Street Address *</label>
                <textarea 
                  id="profile-address"
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  required
                  placeholder="Flat/House No., Building, Street/Locality"
                  style={{ 
                    resize: 'vertical',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    outline: 'none'
                  }}
                  rows={2}
                />
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="profile-landmark">Landmark</label>
                  <input 
                    id="profile-landmark"
                    type="text" 
                    name="landmark" 
                    value={formData.landmark} 
                    onChange={handleChange} 
                    placeholder="e.g. Near Central Park"
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="profile-zipCode">Pin Code *</label>
                  <input 
                    id="profile-zipCode"
                    type="text" 
                    name="zipCode" 
                    value={formData.zipCode} 
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').substring(0, 6);
                      setFormData(prev => ({ ...prev, zipCode: val }));
                    }}
                    required
                    placeholder="6-digit PIN code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="profile-state">State *</label>
                  <select
                    id="profile-state"
                    name="state"
                    value={formData.state}
                    onChange={handleStateChange}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#18191a' }}>Select State</option>
                    {Object.keys(locationData).map((st) => (
                      <option key={st} value={st} style={{ backgroundColor: '#18191a' }}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="profile-district">District *</label>
                  <select
                    id="profile-district"
                    name="district"
                    value={formData.district}
                    onChange={handleDistrictChange}
                    required
                    disabled={!formData.state}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      opacity: formData.state ? 1 : 0.6
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#18191a' }}>Select District</option>
                    {formData.state && Object.keys(locationData[formData.state] || {}).map((dist) => (
                      <option key={dist} value={dist} style={{ backgroundColor: '#18191a' }}>{dist}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="profile-city">City *</label>
                  <select
                    id="profile-city"
                    name="city"
                    value={formData.city}
                    onChange={handleCityChange}
                    required
                    disabled={!formData.district}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--glass-border)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      opacity: formData.district ? 1 : 0.6
                    }}
                  >
                    <option value="" style={{ backgroundColor: '#18191a' }}>Select City</option>
                    {formData.state && formData.district && (locationData[formData.state]?.[formData.district] || []).map((ct) => (
                      <option key={ct} value={ct} style={{ backgroundColor: '#18191a' }}>{ct}</option>
                    ))}
                  </select>
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
                  {user.address ? (
                    <>
                      {user.address}
                      {user.landmark && `, Landmark: ${user.landmark}`}
                      <br />
                      {user.city && `${user.city}`}{user.district && `, ${user.district}`}{user.state && `, ${user.state}`} - {user.zipCode}
                    </>
                  ) : 'Not provided'}
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
          </div>
        </div>
      </main>
    </div>
  );
}
