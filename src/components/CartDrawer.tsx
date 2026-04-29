import React from 'react';
import { CartItem } from '@/lib/types';

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
          <button className="close-cart" onClick={onClose}>✕</button>
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
            items.map(item => (
              <div key={item.product_id} className="cart-item">
                <img src={item.image_url} alt={item.name} className="cart-item-image" />
                <div className="cart-item-details">
                  <div className="cart-item-title">{item.name}</div>
                  <div className="cart-item-price">₹{Number(item.price).toFixed(2)}</div>
                  <div className="cart-item-actions">
                    <div className="qty-controls">
                      <button className="qty-btn" onClick={() => onUpdateQty(item.product_id, item.quantity - 1)}>-</button>
                      <span>{item.quantity}</span>
                      <button className="qty-btn" onClick={() => onUpdateQty(item.product_id, item.quantity + 1)}>+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))
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
