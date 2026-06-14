import React, { useRef } from 'react';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { createProductSlug, optimizeUnsplashUrl } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product | null) => void;
  priority?: boolean;
  isSaved?: boolean;
  onToggleSave?: (productId: number) => void;
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onQuickView, 
  priority = false,
  isSaved = false,
  onToggleSave
}: ProductCardProps) {
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = Number(product.price);
  const discountedPrice = hasDiscount 
    ? originalPrice * (1 - product.discount_percentage! / 100) 
    : originalPrice;

  const touchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const touchStartCoordsRef = useRef<{ x: number, y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 1) return;

    // Do not trigger long press if touching interactive elements (buttons, etc.)
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('input')) {
      return;
    }

    const touch = e.touches[0];
    touchStartCoordsRef.current = { x: touch.clientX, y: touch.clientY };

    isLongPressRef.current = false;
    touchTimeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onQuickView(product);
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    touchStartCoordsRef.current = null;

    if (isLongPressRef.current) {
      e.preventDefault();
      onQuickView(null);
      isLongPressRef.current = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartCoordsRef.current || !touchTimeoutRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartCoordsRef.current.x;
    const deltaY = touch.clientY - touchStartCoordsRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If movement exceeds 10px, it's a drag/scroll. Cancel the long press.
    if (distance > 10) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
      touchStartCoordsRef.current = null;
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
    }
  };

  return (
    <div 
      key={product.id} 
      className="product-card tilt-effect"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={handleContextMenu}
    >
      <div className="product-image-container">
        <Link 
          href={`/product/${createProductSlug(product.id, product.name)}`} 
          className="product-link"
          style={onToggleSave ? {
            display: 'block',
            clipPath: 'polygon(0% 0%, calc(100% - 68px) 0%, calc(100% - 68px) 68px, 100% 68px, 100% 100%, 0% 100%)',
          } : { display: 'block' }}
        >
          <picture style={{ display: 'contents' }}>
            <source 
              media="(max-width: 640px)" 
              srcSet={`${optimizeUnsplashUrl(product.image_url, 300, 60)} 1x, ${optimizeUnsplashUrl(product.image_url, 600, 60)} 2x`}
            />
            <img 
              src={optimizeUnsplashUrl(product.image_url, 500, 75)} 
              alt={product.name} 
              className="product-image" 
              fetchPriority={priority ? "high" : undefined}
              loading={priority ? "eager" : "lazy"}
            />
          </picture>
        </Link>
        {hasDiscount && (
          <span className="discount-tag-badge">
            {product.badge_text || `${product.discount_percentage}% OFF`}
          </span>
        )}
        {onToggleSave && (
          <button 
            className="wishlist-toggle-btn"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleSave(product.id); }}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              zIndex: 10,
              background: 'rgba(15, 17, 26, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              width: '48px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isSaved ? 'var(--accent-pink)' : '#e4e6eb',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(4px)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.backgroundColor = 'rgba(15, 17, 26, 0.8)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.backgroundColor = 'rgba(15, 17, 26, 0.6)';
            }}
            title={isSaved ? "Remove from Saved" : "Save for Later"}
            aria-label={isSaved ? "Remove from Saved" : "Save for Later"}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
          </button>
        )}
        <button 
          className="quick-view-btn" 
          onClick={(e) => { e.preventDefault(); onQuickView(product); }}
        >
          Quick View
        </button>
      </div>
      <div className="product-info">
        <Link href={`/product/${createProductSlug(product.id, product.name)}`} className="product-title-link">
          <h2 className="product-title">{product.name}</h2>
        </Link>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <div className="product-price-wrapper">
            <span className="product-price">₹{discountedPrice.toFixed(2)}</span>
            {hasDiscount && (
              <span className="product-price-original">₹{originalPrice.toFixed(2)}</span>
            )}
          </div>
          <button 
            className="add-to-cart-btn"
            onClick={() => onAddToCart(product)}
            disabled={product.stock_count !== undefined && product.stock_count <= 0}
            style={product.stock_count !== undefined && product.stock_count <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#ccc' } : {}}
          >
            {product.stock_count !== undefined && product.stock_count <= 0 ? 'Out of Stock' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
}
