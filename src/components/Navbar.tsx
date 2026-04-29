import React from 'react';
import { User } from '@/lib/types';

interface NavbarProps {
  headerVisible: boolean;
  user: User | null;
  onLogin: () => void;
  onOpenCart: () => void;
  cartCount: number;
}

export default function Navbar({ 
  headerVisible, 
  user, 
  onLogin, 
  onOpenCart, 
  cartCount 
}: NavbarProps) {
  return (
    <nav className={`navbar ${!headerVisible ? 'navbar--hidden' : ''}`}>
      <a href="/" className="nav-brand">NeonToys</a>
      
      <div className="nav-actions">
        {user ? (
          <>
            <a href="/orders" className="nav-orders-link">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
              </svg>
              <span className="orders-text">Orders</span>
            </a>
            <a href="/profile" className="nav-profile">
              <img src={user.avatar} alt={user.name} className="nav-avatar" />
              <span className="profile-name">{user.name}</span>
            </a>
          </>
        ) : (
          <a href="/login" className="nav-login-btn" style={{ textDecoration: 'none' }}>Log In</a>
        )}

        <button className="nav-cart-btn" onClick={onOpenCart}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <span className="cart-text">Cart</span> <span className="cart-badge">{cartCount}</span>
        </button>
      </div>
    </nav>
  );
}
