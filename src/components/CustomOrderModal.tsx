import React, { useState, useEffect } from 'react';
import { Product, User } from '@/lib/types';
import { submitCustomEnquiry } from '@/app/actions';

interface CustomOrderModalProps {
  product: Product;
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function CustomOrderModal({
  product,
  user,
  isOpen,
  onClose
}: CustomOrderModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
    } else {
      setName('');
      setEmail('');
      setPhone('');
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
        message
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
          maxWidth: '550px', 
          padding: '30px', 
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
              <div className="form-group">
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
              <div className="form-group">
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
 
            <div className="form-group">
              <label htmlFor="custom-order-message">Customization Details / Enquiry *</label>
              <textarea
                id="custom-order-message"
                rows={4}
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
