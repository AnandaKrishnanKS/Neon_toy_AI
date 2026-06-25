'use client';

import React, { useState, useEffect } from 'react';
import { addToCart, getCart, updateCartItemQuantity, toggleSaveProduct, getSavedProducts } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Product, CartItem, User } from '@/lib/types';
import Navbar from './Navbar';
import CartDrawer from './CartDrawer';
import CustomOrderModal from './CustomOrderModal';

export default function ProductClient({
  product,
  initialCart = [],
  dbConnected,
  user: initialUser = null
}: {
  product: Product,
  initialCart?: CartItem[],
  dbConnected: boolean,
  user?: User | null
}) {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [user, setUser] = useState<User | null>(initialUser);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [savedProducts, setSavedProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!dbConnected) return;
    let active = true;
    const load = async () => {
      try {
        const [cartRes, userRes, savedRes] = await Promise.all([
          fetch('/api/cart').then(r => r.json()),
          fetch('/api/user').then(r => r.json()),
          getSavedProducts()
        ]);
        if (!active) return;
        setTimeout(() => {
          if (cartRes && cartRes.items) {
            setCartItems(cartRes.items);
          }
          setUser(userRes);
          if (savedRes && savedRes.success) {
            setSavedProducts(savedRes.items);
          }
        }, 0);
      } catch (e) {
        console.error('Failed to fetch user/cart data:', e);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [dbConnected]);

  useEffect(() => {
    if (!dbConnected) return;
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        const load = async () => {
          try {
            const [cartRes, userRes, savedRes] = await Promise.all([
              fetch('/api/cart').then(r => r.json()),
              fetch('/api/user').then(r => r.json()),
              getSavedProducts()
            ]);
            setTimeout(() => {
              if (cartRes && cartRes.items) {
                setCartItems(cartRes.items);
              }
              setUser(userRes);
              if (savedRes && savedRes.success) {
                setSavedProducts(savedRes.items);
              }
            }, 0);
          } catch (e) {
            console.error('Failed to fetch user/cart data:', e);
          }
        };
        load();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [dbConnected]);
  const [localCart, setLocalCart] = useState<CartItem[]>([]);
  const [viewers, setViewers] = useState<number>(12);
  const [stock, setStock] = useState<number>(product.stock_count !== undefined ? product.stock_count : 5);
  const [selectedImage, setSelectedImage] = useState(product.image_url);
  const [customOrderOpen, setCustomOrderOpen] = useState(false);
  const isHandmadeOrCustom = product.category?.toLowerCase() === 'hand made' || product.category?.toLowerCase() === 'custom made';

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
    setTimeout(() => {
      setViewers(Math.floor(Math.random() * 20) + 5);
      if (!dbConnected) {
        setStock(Math.floor(Math.random() * 8) + 1);
      }
    }, 0);
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

  const handleToggleSave = async () => {
    if (!user) {
      alert('Please log in to save products.');
      router.push('/login');
      return;
    }

    const res = await toggleSaveProduct(product.id);
    if (res.success) {
      const savedRes = await getSavedProducts();
      if (savedRes.success) {
        setSavedProducts(savedRes.items);
      }
    } else {
      alert(res.error || 'Failed to update wishlist');
    }
  };

  const handleAddSavedToCart = async (savedProd: any) => {
    if (dbConnected) {
      const res = await addToCart(savedProd.id, 1);
      if (res.success) {
        const updated = await getCart();
        setCartItems(updated.items || []);
        await toggleSaveProduct(savedProd.id);
        const savedRes = await getSavedProducts();
        if (savedRes.success) {
          setSavedProducts(savedRes.items);
        }
        setCartOpen(true);
      } else {
        alert('Error adding to cart: ' + res.error);
      }
    }
  };

  const handleUnsaveProduct = async (productId: number) => {
    const res = await toggleSaveProduct(productId);
    if (res.success) {
      const savedRes = await getSavedProducts();
      if (savedRes.success) {
        setSavedProducts(savedRes.items);
      }
    }
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
                <img
                  src={selectedImage}
                  alt={product.name}
                  fetchPriority="high"
                  loading="eager"
                />
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
                <p>Enjoy free shipping on orders over ₹999 and a 10-day replacement guarantee on all our premium products*.</p>
              </div>
              <div className="product-actions" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {stock <= 0 ? (
                  isHandmadeOrCustom ? (
                    <button
                      className="add-to-cart-big"
                      onClick={() => {
                        if (!user) {
                          alert('Please log in to request a custom order.');
                          router.push('/login');
                          return;
                        }
                        setCustomOrderOpen(true);
                      }}
                      style={{
                        background: 'linear-gradient(45deg, var(--accent-cyan), #7f00ff)',
                        margin: 0,
                        boxShadow: '0 4px 15px rgba(0, 210, 255, 0.4)'
                      }}
                    >
                      Custom Order
                    </button>
                  ) : (
                    <button
                      className="add-to-cart-big"
                      disabled={true}
                      style={{
                        opacity: 0.5,
                        cursor: 'not-allowed',
                        background: '#ccc',
                        margin: 0
                      }}
                    >
                      Out of Stock
                    </button>
                  )
                ) : (
                  <button
                    className="add-to-cart-big"
                    onClick={() => handleAddToCart(1)}
                    style={{ margin: 0 }}
                  >
                    Add to Cart
                  </button>
                )}
                {dbConnected && (
                  <button
                    onClick={handleToggleSave}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '56px',
                      height: '56px',
                      backgroundColor: '#3a3b3c',
                      color: savedProducts.some(p => p.id === product.id) ? 'var(--accent-pink)' : '#e4e6eb',
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
                    title={savedProducts.some(p => p.id === product.id) ? "Remove from Saved" : "Save for Later"}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill={savedProducts.some(p => p.id === product.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                    </svg>
                  </button>
                )}
              </div>
              <div className="product-meta">
                <div className="meta-item">
                  <strong>SKU:</strong> NT-{product.id.toString().padStart(4, '0')}
                </div>
                <div className="meta-item">
                  <strong>Category:</strong> {product.category || 'Premium Toys'}
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
        savedItems={dbConnected ? savedProducts : []}
        onAddSavedToCart={handleAddSavedToCart}
        onUnsaveProduct={handleUnsaveProduct}
      />

      <CustomOrderModal
        product={product}
        user={user}
        isOpen={customOrderOpen}
        onClose={() => setCustomOrderOpen(false)}
      />
    </>
  );
}
