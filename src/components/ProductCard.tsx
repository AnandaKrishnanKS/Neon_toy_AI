import React from 'react';
import { Product } from '@/lib/types';
import Link from 'next/link';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onQuickView: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart, onQuickView }: ProductCardProps) {
  return (
    <div key={product.id} className="product-card tilt-effect">
      <div className="product-image-container">
        <Link href={`/product/${product.id}`} className="product-link">
          <img src={product.image_url} alt={product.name} className="product-image" />
        </Link>
        <button 
          className="quick-view-btn" 
          onClick={(e) => { e.preventDefault(); onQuickView(product); }}
        >
          Quick View
        </button>
      </div>
      <div className="product-info">
        <Link href={`/product/${product.id}`} className="product-link">
          <h2 className="product-title">{product.name}</h2>
        </Link>
        <p className="product-desc">{product.description}</p>
        <div className="product-footer">
          <span className="product-price">₹{Number(product.price).toFixed(2)}</span>
          <button 
            className="add-to-cart-btn"
            onClick={() => onAddToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
