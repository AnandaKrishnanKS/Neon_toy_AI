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
  const isOutOfStock = product.stock_count !== undefined && product.stock_count <= 0;

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
        <Link 
          href={`/product/${createProductSlug(product.id, product.name)}`} 
          className="product-link-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 2,
            clipPath: onToggleSave ? 'polygon(0% 0%, calc(100% - 68px) 0%, calc(100% - 68px) 68px, 100% 68px, 100% 100%, 0% 100%)' : 'none',
          }}
          aria-label={`View details for ${product.name}`}
        />
        {hasDiscount && !isOutOfStock && (
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
          {!isOutOfStock && (
            <div className="product-price-wrapper">
              <span className="product-price">₹{discountedPrice.toFixed(2)}</span>
              {hasDiscount && (
                <span className="product-price-original">₹{originalPrice.toFixed(2)}</span>
              )}
            </div>
          )}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: isOutOfStock ? 'auto' : '0' }}>
            <button 
              className="add-to-cart-btn"
              onClick={() => onAddToCart(product)}
              disabled={isOutOfStock}
              style={isOutOfStock ? { opacity: 0.5, cursor: 'not-allowed', background: '#ccc' } : {}}
            >
              {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
            {isOutOfStock && (
              <div className="whatsapp-contact-wrapper">
                <a 
                  href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || '7025915922'}?text=${encodeURIComponent(
                    `Hi! I am interested in "${product.name}" (SKU: NT-${product.id.toString().padStart(4, '0')}). Can you provide more details?`
                  )}`}
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="whatsapp-contact-btn whatsapp-card-btn"
                  aria-label="Contact on WhatsApp for custom orders"
                >
                  <svg viewBox="0 0 24 24" className="whatsapp-icon" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.46h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </a>
                <span className="whatsapp-tooltip">contact for additional details and custom orders</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
