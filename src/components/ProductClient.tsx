'use client';

import React, { useState, useEffect } from 'react';
import { addToCart, getCart, updateCartItemQuantity } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Product, CartItem, User } from '@/lib/types';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';

export default function ProductClient({ 
  product, 
  initialCart,
  dbConnected,
  user
}: { 
  product: Product, 
  initialCart: CartItem[],
  dbConnected: boolean,
  user: User | null
}) {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [viewers, setViewers] = useState<number>(12);
  const [stock, setStock] = useState<number>(product.stock_count !== undefined ? product.stock_count : 5);
  const [selectedImage, setSelectedImage] = useState(product.image_url);

  const allImages = Array.from(new Set([
    product.image_url,
    ...(product.images || [])
  ].filter(Boolean)));

  const hasDiscount = product.discount_percentage && product.discount_percentage > 0;
  const originalPrice = Number(product.price);
  const discountedPrice = hasDiscount 
    ? originalPrice * (1 - product.discount_percentage! / 100) 
    : originalPrice;

  useEffect(() => {
    setViewers(Math.floor(Math.random() * 20) + 5);
    if (!dbConnected) {
      setStock(Math.floor(Math.random() * 8) + 1);
    }
  }, [dbConnected]);

  const itemsToRender = dbConnected ? cartItems : localCart;
  const cartTotal = itemsToRender.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = itemsToRender.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY < 10) setHeaderVisible(true);
      else if (currentScrollY > lastScrollY && currentScrollY > 100) setHeaderVisible(false);
      else if (currentScrollY < lastScrollY) setHeaderVisible(true);
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const handleLogin = async () => {
    router.push('/login');
  };

  const handleAddToCart = async (qty: number = 1) => {
    if (dbConnected) {
      const res = await addToCart(product.id, qty);
      if (res.success) {
        const updated = await getCart();
        setCartItems(updated.items || []);
        setStock(prev => Math.max(0, prev - qty));
        setCartOpen(true);
      } else {
        alert('Error adding to cart: ' + res.error);
      }
    } else {
      const stockLimit = product.stock_count !== undefined ? product.stock_count : 5;
      let existingQty = 0;
      const existingItem = localCart.find(item => item.product_id === product.id);
      if (existingItem) {
        existingQty = existingItem.quantity;
      }
      if (existingQty + qty > stockLimit) {
        alert(`Cannot add more items. Only ${stockLimit} units are available.`);
        return;
      }
      setLocalCart(current => {
        const existing = current.find(item => item.product_id === product.id);
        if (existing) {
          return current.map(item => item.product_id === product.id 
            ? { ...item, quantity: item.quantity + qty } 
            : item
          );
        }
        return [...current, {
          cart_item_id: Math.random(),
          product_id: product.id,
          name: product.name,
          price: discountedPrice,
          original_price: originalPrice,
          image_url: product.image_url,
          quantity: qty
        }];
      });
      setStock(prev => Math.max(0, prev - qty));
      setCartOpen(true);
    }
  };

  const handleUpdateQty = async (productId: number, newQty: number) => {
    if (dbConnected) {
      const res = await updateCartItemQuantity(productId, newQty);
      if (res.success) {
        const updated = await getCart();
        setCartItems(updated.items || []);
        if (productId === product.id) {
          const maxStock = product.stock_count !== undefined ? product.stock_count : 5;
          setStock(Math.max(0, maxStock - (newQty > 0 ? newQty : 0)));
        }
      } else {
        alert(res.error || 'Failed to update quantity');
      }
    } else {
      const stockLimit = product.stock_count !== undefined ? product.stock_count : 5;
      if (productId === product.id && newQty > stockLimit) {
        alert(`Cannot update quantity. Only ${stockLimit} units are available in stock.`);
        return;
      }
      setLocalCart(current => {
        if (newQty <= 0) {
          if (productId === product.id) setStock(stockLimit);
          return current.filter(item => item.product_id !== productId);
        }
        if (productId === product.id) setStock(stockLimit - newQty);
        return current.map(item => item.product_id === productId ? { ...item, quantity: newQty } : item);
      });
    }
  };

  return (
    <>
      <Navbar 
        headerVisible={headerVisible} 
        user={user} 
        onLogin={handleLogin} 
        onOpenCart={() => setCartOpen(true)}
        cartCount={cartCount}
      />

      <main className="main-content">
        <div className="product-detail-container">
          <div className="product-detail-content">
            <div className={`product-detail-image ${allImages.length > 1 ? 'has-gallery' : ''}`}>
              <div className="product-detail-image-main">
                <img src={selectedImage} alt={product.name} />
              </div>
              {allImages.length > 1 && (
                <div className="product-detail-image-thumbnails">
                  {allImages.map((imgUrl, index) => (
                    <button
                      key={index}
                      className={`product-detail-image-thumbnail-btn ${selectedImage === imgUrl ? 'active' : ''}`}
                      onClick={() => setSelectedImage(imgUrl)}
                      type="button"
                      aria-label={`View product image ${index + 1}`}
                    >
                      <img src={imgUrl} alt={`${product.name} preview ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="product-detail-info">
              <nav className="breadcrumb">
                <a href="/">Products</a> / <span>{product.name}</span>
              </nav>
              <h1>{product.name}</h1>
              <div className="product-detail-rating">
                <span className="stars">★★★★★</span>
                <span className="rating-text">4.8 (124 reviews)</span>
              </div>

              <div className="scarcity-badges">
                <span className="badge fire">🔥 {viewers} people are looking at this</span>
                {stock <= 0 ? (
                  <span className="badge stock out-of-stock" style={{ backgroundColor: 'rgba(255, 51, 102, 0.1)', color: 'var(--accent-pink)', border: '1px solid rgba(255, 51, 102, 0.2)' }}>⏳ Out of stock</span>
                ) : (
                  <span className="badge stock">⏳ Only {stock} left in stock - order soon!</span>
                )}
              </div>

              <div className="product-detail-price-wrapper">
                <span className="product-detail-price">₹{discountedPrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="product-detail-price-original">₹{originalPrice.toFixed(2)}</span>
                )}
              </div>

              {hasDiscount && (
                <div className="special-offer-card">
                  <span className="special-offer-icon">🎉</span>
                  <div className="special-offer-details">
                    <strong>Special Offer: {product.offer_title}</strong>
                    <p>Get a massive {product.discount_percentage}% discount on this item as part of our promotion!</p>
                  </div>
                </div>
              )}

              <div className="product-detail-desc">
                <p>{product.description}</p>
                <p>Enjoy free shipping on orders over ₹100 and a 30-day money-back guarantee on all our premium toys.</p>
              </div>
              <div className="product-actions">
                <button 
                  className="add-to-cart-big" 
                  onClick={() => handleAddToCart(1)}
                  disabled={stock <= 0}
                  style={stock <= 0 ? { opacity: 0.5, cursor: 'not-allowed', background: '#ccc' } : {}}
                >
                  {stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
              <div className="product-meta">
                <div className="meta-item">
                  <strong>SKU:</strong> NT-{product.id.toString().padStart(4, '0')}
                </div>
                <div className="meta-item">
                  <strong>Category:</strong> Premium Toys
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CartDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        items={itemsToRender} 
        onUpdateQty={handleUpdateQty} 
        total={cartTotal}
      />
    </>
  );
}
