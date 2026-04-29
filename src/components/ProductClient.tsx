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
        setCartOpen(true);
      } else {
        alert('Error adding to cart: ' + res.error);
      }
    } else {
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
          price: product.price,
          image_url: product.image_url,
          quantity: qty
        }];
      });
      setCartOpen(true);
    }
  };

  const handleUpdateQty = async (productId: number, newQty: number) => {
    if (dbConnected) {
      const res = await updateCartItemQuantity(productId, newQty);
      if (res.success) {
        const updated = await getCart();
        setCartItems(updated.items || []);
      }
    } else {
      setLocalCart(current => {
        if (newQty <= 0) return current.filter(item => item.product_id !== productId);
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
            <div className="product-detail-image">
              <img src={product.image_url} alt={product.name} />
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
                <span className="badge fire">🔥 {Math.floor(Math.random() * 20) + 5} people are looking at this</span>
                <span className="badge stock">⏳ Only {Math.floor(Math.random() * 8) + 1} left in stock - order soon!</span>
              </div>

              <div className="product-detail-price">₹{Number(product.price).toFixed(2)}</div>
              <div className="product-detail-desc">
                <p>{product.description}</p>
                <p>Enjoy free shipping on orders over ₹100 and a 30-day money-back guarantee on all our premium toys.</p>
              </div>
              <div className="product-actions">
                <button className="add-to-cart-big" onClick={() => handleAddToCart(1)}>
                  Add to Cart
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
