import React from 'react';
import { CartItem } from '@/lib/types';
import { optimizeUnsplashUrl } from '@/lib/utils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: number, newQty: number) => void;
  total: number;
}

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQty, 
  total 
}: CartDrawerProps) {
  return (
    <div className={`cart-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className="cart-sidebar" onClick={e => e.stopPropagation()}>
        <div className="cart-header">
          <h2>Your Cart</h2>
          <button className="close-cart" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        <div className="shipping-progress">
          {total >= 100 ? (
            <p className="shipping-text success">🎉 You've unlocked <strong>FREE Premium Shipping!</strong></p>
          ) : (
            <p className="shipping-text">You are <strong>₹{(100 - total).toFixed(2)}</strong> away from FREE shipping!</p>
          )}
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${total >= 100 ? 'complete' : ''}`} 
              style={{ width: `${Math.min((total / 100) * 100, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="empty-cart">Your cart is empty.</div>
          ) : (
            items.map(item => {
              const hasDiscount = item.discount_percentage && item.discount_percentage > 0;
              const originalPrice = item.original_price || item.price;
              return (
                <div key={item.product_id} className="cart-item">
                  <img src={optimizeUnsplashUrl(item.image_url, 160, 75)} alt={item.name} className="cart-item-image" />
                  <div className="cart-item-details">
                    <div className="cart-item-title-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                      <div className="cart-item-title">{item.name}</div>
                      {hasDiscount && (
                        <span className="cart-item-discount-badge" style={{ background: 'rgba(255, 51, 102, 0.15)', color: 'var(--accent-pink)', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold', border: '1px solid rgba(255, 51, 102, 0.3)' }}>
                          {item.badge_text || `${item.discount_percentage}% OFF`}
                        </span>
                      )}
                    </div>
                    <div className="cart-item-price-wrapper" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="cart-item-price">₹{Number(item.price).toFixed(2)}</span>
                      {hasDiscount && (
                        <span className="cart-item-price-original" style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                          ₹{Number(originalPrice).toFixed(2)}
                        </span>
                      )}
                    </div>
                    <div className="cart-item-actions">
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => onUpdateQty(item.product_id, item.quantity - 1)} aria-label="Decrease quantity">-</button>
                        <span>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => onUpdateQty(item.product_id, item.quantity + 1)} aria-label="Increase quantity">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
            <button 
              className="checkout-btn" 
              onClick={() => window.location.href = '/checkout'}
            >
              Checkout Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
