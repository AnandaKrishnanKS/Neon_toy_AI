import React from 'react';
import { CartItem } from '@/lib/types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQty: (productId: number, newQty: number) => void;
  total: number;
  savedItems?: any[];
  onAddSavedToCart?: (product: any) => void;
  onUnsaveProduct?: (productId: number) => void;
}

export default function CartDrawer({ 
  isOpen, 
  onClose, 
  items, 
  onUpdateQty, 
  total,
  savedItems = [],
  onAddSavedToCart,
  onUnsaveProduct
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
                  <img src={item.image_url} alt={item.name} className="cart-item-image" />
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

          {savedItems && savedItems.length > 0 && (
            <div className="saved-items-section" style={{ marginTop: '2rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1.5rem' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '1.2rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="var(--accent-pink)" stroke="var(--accent-pink)">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
                Saved for Later ({savedItems.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {savedItems.map(item => (
                  <div key={item.id} className="cart-item" style={{ borderStyle: 'dashed', borderColor: 'var(--glass-border)', background: 'rgba(255, 255, 255, 0.02)' }}>
                    <img src={item.image_url} alt={item.name} className="cart-item-image" />
                    <div className="cart-item-details">
                      <div className="cart-item-title-wrapper" style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                        <div className="cart-item-title" style={{ fontSize: '0.95rem', fontWeight: '600' }}>{item.name}</div>
                      </div>
                      <div className="cart-item-price-wrapper" style={{ margin: '4px 0' }}>
                        <span className="cart-item-price" style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>₹{Number(item.price).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        {onAddSavedToCart && (
                          item.stock_count !== undefined && item.stock_count <= 0 ? (
                            <span 
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                color: 'var(--text-secondary)',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                border: '1px solid var(--glass-border)',
                                display: 'inline-block'
                              }}
                            >
                              Out of Stock
                            </span>
                          ) : (
                            <button 
                              onClick={() => onAddSavedToCart(item)}
                              style={{
                                padding: '6px 12px',
                                backgroundColor: 'rgba(0, 210, 255, 0.15)',
                                color: 'var(--accent-cyan)',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                              onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 210, 255, 0.25)'}
                              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 210, 255, 0.15)'}
                            >
                              Add to Cart
                            </button>
                          )
                        )}
                        {onUnsaveProduct && (
                          <button 
                            onClick={() => onUnsaveProduct(item.id)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: 'rgba(255, 51, 102, 0.1)',
                              color: 'var(--accent-pink)',
                              border: 'none',
                              borderRadius: '6px',
                              fontWeight: '600',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 51, 102, 0.2)'}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 51, 102, 0.1)'}
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
