import React from 'react';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { createProductSlug } from '@/lib/utils';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
  isSaved?: boolean;
  onToggleSave?: (productId: number) => void;
}

export default function QuickViewModal({ 
  product, 
  isOpen, 
  onClose, 
  onAddToCart,
  isSaved = false,
  onToggleSave
}: QuickViewModalProps) {
  if (!isOpen) return null;

  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = Number(product.price);
  const discountedPrice = hasDiscount 
    ? originalPrice * (1 - product.discount_percentage! / 100) 
    : originalPrice;

  return (
    <div className="quick-view-overlay" onClick={onClose}>
      <div className="quick-view-content" onClick={e => e.stopPropagation()}>
        <button className="close-quick-view" onClick={onClose} aria-label="Close quick view">✕</button>
        <div className="qv-image-container">
          <img src={product.image_url} alt={product.name} />
          {hasDiscount && (
            <span className="discount-tag-badge">
              {product.badge_text || `${product.discount_percentage}% OFF`}
            </span>
          )}
        </div>
        <div className="qv-info">
          <h2>{product.name}</h2>
          <div className="product-detail-rating">
            <span className="stars">★★★★★</span>
            <span className="rating-text">4.8 (124 reviews)</span>
          </div>
          <div className="scarcity-badges">
            <span className="badge fire">🔥 High Demand</span>
            {product.stock_count !== undefined && product.stock_count <= 0 ? (
              <span className="badge stock out-of-stock" style={{ backgroundColor: 'rgba(255, 51, 102, 0.1)', color: 'var(--accent-pink)', border: '1px solid rgba(255, 51, 102, 0.2)' }}>⏳ Out of stock</span>
            ) : (
              <span className="badge stock">⏳ Limited Stock ({product.stock_count !== undefined ? product.stock_count : 'available'})</span>
            )}
          </div>
          <div className="qv-price-wrapper">
            <span className="qv-price">₹{discountedPrice.toFixed(2)}</span>
            {hasDiscount && (
              <span className="qv-price-original">₹{originalPrice.toFixed(2)}</span>
            )}
          </div>
          <p className="qv-desc">{product.description}</p>
          <div className="qv-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button 
              className="add-to-cart-big" 
              onClick={() => { onAddToCart(product); onClose(); }}
              disabled={product.stock_count !== undefined && product.stock_count <= 0}
              style={{
                ...(product.stock_count !== undefined && product.stock_count <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#ccc' } : {}),
                margin: 0,
                flex: 1
              }}
            >
              {product.stock_count !== undefined && product.stock_count <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {onToggleSave && (
              <button 
                onClick={() => onToggleSave(product.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '56px',
                  height: '56px',
                  backgroundColor: '#3a3b3c',
                  color: isSaved ? 'var(--accent-pink)' : '#e4e6eb',
                  border: 'none',
                  borderRadius: '50px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 51, 102, 0.1)';
                  e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 51, 102, 0.2)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#3a3b3c';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                title={isSaved ? "Remove from wishlist" : "Add to wishlist"}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </button>
            )}
            <Link href={`/product/${createProductSlug(product.id, product.name)}`} className="qv-full-details-link" style={{ whiteSpace: 'nowrap' }}>
              View Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
