import React from 'react';
import { Product } from '@/lib/types';
import Link from 'next/link';
import { createProductSlug } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onQuickView }: ProductCardProps) {
  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = Number(product.price);
  const discountedPrice = hasDiscount 
    ? originalPrice * (1 - product.discount_percentage! / 100) 
    : originalPrice;

  return (
    <div key={product.id} className="product-card tilt-effect">
      <div className="product-image-container">
        <Link href={`/product/${createProductSlug(product.id, product.name)}`} className="product-link">
          <img src={product.image_url} alt={product.name} className="product-image" />
        </Link>
        {hasDiscount && (
          <span className="discount-tag-badge">
            {product.badge_text || `${product.discount_percentage}% OFF`}
          </span>
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
