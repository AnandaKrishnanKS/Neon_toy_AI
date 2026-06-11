import React from 'react';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { createProductSlug, optimizeUnsplashUrl } from '@/lib/utils';

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

export default function QuickViewModal({ product, isOpen, onClose, onAddToCart }: QuickViewModalProps) {
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
          <img src={optimizeUnsplashUrl(product.image_url, 400, 75)} alt={product.name} />
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
          <div className="qv-actions">
            <button 
              className="add-to-cart-big" 
              onClick={() => { onAddToCart(product); onClose(); }}
              disabled={product.stock_count !== undefined && product.stock_count <= 0}
              style={product.stock_count !== undefined && product.stock_count <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#ccc' } : {}}
            >
              {product.stock_count !== undefined && product.stock_count <= 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <Link href={`/product/${createProductSlug(product.id, product.name)}`} className="qv-full-details-link">
              View Full Details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
