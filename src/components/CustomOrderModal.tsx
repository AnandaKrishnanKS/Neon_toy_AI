import React, { useState, useEffect } from 'react';
import { Product, User } from '@/lib/types';
import { submitCustomEnquiry } from '@/app/actions';

interface CustomOrderModalProps {
  product: Product;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

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

export default function CustomOrderModal({
  product,
  user,
  isOpen,
  onClose
}: CustomOrderModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setPincode(user.zipCode || '');
      
      // Auto-infer state and district based on user's city if possible
      let inferredState = '';
      let inferredDistrict = '';
      const userCity = user.city || '';
      
      if (userCity) {
        for (const [st, districts] of Object.entries(locationData)) {
          for (const [dist, cities] of Object.entries(districts)) {
            if (cities.some(c => c.toLowerCase() === userCity.toLowerCase())) {
              inferredState = st;
              inferredDistrict = dist;
              setSelectedCity(cities.find(c => c.toLowerCase() === userCity.toLowerCase()) || userCity);
              break;
            }
          }
          if (inferredState) break;
        }
      }
      
      setSelectedState(inferredState);
      setSelectedDistrict(inferredDistrict);
      if (!inferredState) {
        setSelectedCity('');
      }
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setAddress('');
      setLandmark('');
      setSelectedState('');
      setSelectedDistrict('');
      setSelectedCity('');
      setPincode('');
    }
    setMessage(
      `Hi, I'd like to place a custom order for "${product.name}" (SKU: NT-${product.id.toString().padStart(4, '0')}). Please let me know how we can proceed.`
    );
    setSubmitSuccess(false);
    setSubmitError('');
  }, [user, product, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError('');

    try {
      const res = await submitCustomEnquiry({
        productId: product.id,
        name,
        email,
        phone,
        message,
        address,
        landmark,
        state: selectedState,
        district: selectedDistrict,
        city: selectedCity,
        pincode
      });

      if (res.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          onClose();
        }, 2500);
      } else {
        setSubmitError(res.error || 'Failed to submit your enquiry. Please try again.');
      }
    } catch (err: any) {
      setSubmitError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quick-view-overlay" style={{ display: 'flex', zIndex: 1100 }} onClick={onClose}>
      <div 
        className="quick-view-content" 
        style={{ 
          display: 'block', 
          maxWidth: '600px', 
          padding: '30px', 
          maxHeight: '90vh',
          overflowY: 'auto',
          animation: 'modalIn 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards' 
        }} 
        onClick={e => e.stopPropagation()}
      >
        <button className="close-quick-view" onClick={onClose} aria-label="Close modal">✕</button>
        
        <h2 style={{ 
          fontSize: '1.8rem', 
          fontWeight: '800', 
          marginBottom: '20px', 
          background: 'linear-gradient(to right, var(--accent-pink), var(--accent-cyan))', 
          WebkitBackgroundClip: 'text', 
          backgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          Request Custom Order
        </h2>
        
        {submitSuccess ? (
          <div style={{ textAlign: 'center', padding: '30px 10px' }}>
            <div style={{ fontSize: '3rem', color: '#10b981', marginBottom: '15px' }}>✓</div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px', color: '#e4e6eb' }}>Enquiry Submitted!</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              We have received your custom order enquiry for <strong>{product.name}</strong>. Our team will get back to you shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <p style={{ 
              fontSize: '0.85rem', 
              color: 'var(--text-secondary)', 
              lineHeight: '1.4', 
              background: 'rgba(0, 210, 255, 0.05)', 
              border: '1px solid rgba(0, 210, 255, 0.15)', 
              borderRadius: '8px', 
              padding: '10px', 
              margin: '0 0 10px 0' 
            }}>
              ℹ️ This item is currently out of stock. Since it is a <strong>{product.category}</strong> product, you can request a custom creation. Fill out the details below, and we'll reach out to discuss customization options!
            </p>
 
            <div className="form-group">
              <label htmlFor="custom-order-name">Your Name *</label>
              <input
                id="custom-order-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
            </div>
 
            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="custom-order-email">Email Address *</label>
                <input
                  id="custom-order-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="custom-order-phone">Phone Number</label>
                <input
                  id="custom-order-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9999999999"
                />
              </div>
            </div>

            {/* Address fields */}
            <div className="form-group">
              <label htmlFor="custom-order-address">Delivery Address *</label>
              <textarea
                id="custom-order-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="Flat/House No., Building, Street/Locality"
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="custom-order-landmark">Landmark</label>
                <input
                  id="custom-order-landmark"
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Central Park"
                />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="custom-order-pincode">Pincode *</label>
                <input
                  id="custom-order-pincode"
                  type="text"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').substring(0, 6))}
                  required
                  placeholder="6-digit PIN code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                />
              </div>
            </div>

            {/* State, District, City dropdowns */}
            <div className="form-row" style={{ display: 'flex', gap: '15px' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="custom-order-state">State *</label>
                <select
                  id="custom-order-state"
                  value={selectedState}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedState(val);
                    setSelectedDistrict('');
                    setSelectedCity('');
                  }}
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
                <label htmlFor="custom-order-district">District *</label>
                <select
                  id="custom-order-district"
                  value={selectedDistrict}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedDistrict(val);
                    setSelectedCity('');
                  }}
                  required
                  disabled={!selectedState}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    opacity: selectedState ? 1 : 0.6
                  }}
                >
                  <option value="" style={{ backgroundColor: '#18191a' }}>Select District</option>
                  {selectedState && Object.keys(locationData[selectedState] || {}).map((dist) => (
                    <option key={dist} value={dist} style={{ backgroundColor: '#18191a' }}>{dist}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ flex: 1 }}>
                <label htmlFor="custom-order-city">City *</label>
                <select
                  id="custom-order-city"
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  required
                  disabled={!selectedDistrict}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    opacity: selectedDistrict ? 1 : 0.6
                  }}
                >
                  <option value="" style={{ backgroundColor: '#18191a' }}>Select City</option>
                  {selectedState && selectedDistrict && (locationData[selectedState]?.[selectedDistrict] || []).map((ct) => (
                    <option key={ct} value={ct} style={{ backgroundColor: '#18191a' }}>{ct}</option>
                  ))}
                </select>
              </div>
            </div>
 
            <div className="form-group">
              <label htmlFor="custom-order-message">Customization Details / Enquiry *</label>
              <textarea
                id="custom-order-message"
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                placeholder="Specify any custom requirements (size, color, theme, name engraving...)"
                style={{ resize: 'vertical' }}
              />
            </div>
 
            {submitError && (
              <div style={{ color: '#ff3366', fontSize: '0.85rem', fontWeight: '600', background: 'rgba(255, 51, 102, 0.1)', padding: '8px 12px', borderRadius: '6px', border: '1px solid rgba(255, 51, 102, 0.2)' }}>
                ⚠️ {submitError}
              </div>
            )}
 
            <div className="form-actions" style={{ marginTop: '15px', borderTop: '1px solid var(--glass-border)', paddingTop: '20px' }}>
              <button type="button" className="cancel-btn" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </button>
              <button type="submit" className="save-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Sending Request...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
