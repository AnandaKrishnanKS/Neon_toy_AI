'use client';

import React, { useState, useEffect } from 'react';
import { addToCart, getCart, updateCartItemQuantity, getMoreProducts } from '@/app/actions';
import { useRouter } from 'next/navigation';
import { Product, CartItem, User } from '@/lib/types';
import Navbar from './Navbar';
import Hero from './Hero';
import ProductCard from './ProductCard';
import CartDrawer from './CartDrawer';
import ReviewTicker from './ReviewTicker';
import QuickViewModal from './QuickViewModal';

const PAGE_SIZE = 9;
const CATEGORIES = ["All", "Vehicles", "Plush", "STEM", "Action"];

export default function StoreClient({ 
  initialProducts, 
  initialCart,
  dbConnected,
  user,
  totalProducts,
  offers = []
}: { 
  initialProducts: Product[], 
  initialCart: CartItem[],
  dbConnected: boolean,
  user: User | null,
  totalProducts: number,
  offers?: any[]
}) {
  const router = useRouter();
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCart);
  const [headerVisible, setHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  
  // Pagination & Search state
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [visibleCount, setVisibleCount] = useState(initialProducts.length);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeOfferId, setActiveOfferId] = useState<number | null>(null);
  const [showDeals, setShowDeals] = useState(false);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  
  // If no DB, we use local state for prototype
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

  // If the user tries to search or filter, lazily load the rest of the database 
  // so they are searching the entire catalog and not just the first page.
  useEffect(() => {
    if ((searchQuery !== '' || activeCategory !== 'All' || activeOfferId !== null) && products.length < totalProducts && dbConnected) {
      const fetchRemaining = async () => {
        const res = await getMoreProducts(products.length, totalProducts);
        if (res.products.length > 0) {
          setProducts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newProducts = res.products.filter(p => !existingIds.has(p.id));
            return [...prev, ...newProducts];
          });
        }
      };
      fetchRemaining();
    }
  }, [searchQuery, activeCategory, activeOfferId, products.length, totalProducts, dbConnected]);

  const handleLogin = async () => {
    router.push('/login');
  };

  const handleLoadMore = async () => {
    setIsLoadingMore(true);
    const nextLimit = visibleCount + PAGE_SIZE;
    
    // Do we need to fetch more from the database?
    if (products.length < nextLimit && products.length < totalProducts) {
      const res = await getMoreProducts(products.length, PAGE_SIZE);
      if (res.products.length > 0) {
        setProducts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newProducts = res.products.filter(p => !existingIds.has(p.id));
          return [...prev, ...newProducts];
        });
      }
    }
    
    setVisibleCount(nextLimit);
    setIsLoadingMore(false);
  };

  const handleAddToCart = async (product: Product) => {
    if (dbConnected) {
      const res = await addToCart(product.id, 1);
      if (res.success) {
        const updated = await getCart();
        setCartItems(updated.items || []);
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
      if (existingQty + 1 > stockLimit) {
        alert(`Cannot add more items. Only ${stockLimit} units are available.`);
        return;
      }
      setLocalCart(current => {
        const existing = current.find(item => item.product_id === product.id);
        if (existing) {
          return current.map(item => item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...current, { ...product, cart_item_id: Math.random(), product_id: product.id, quantity: 1 }];
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
      } else {
        alert(res.error || 'Failed to update quantity');
      }
    } else {
      const p = products.find(prod => prod.id === productId);
      const stockLimit = p && p.stock_count !== undefined ? p.stock_count : 5;
      if (newQty > stockLimit) {
        alert(`Cannot update quantity. Only ${stockLimit} units are available in stock.`);
        return;
      }
      setLocalCart(current => {
        if (newQty <= 0) return current.filter(item => item.product_id !== productId);
        return current.map(item => item.product_id === productId ? { ...item, quantity: newQty } : item);
      });
    }
  };

  const isFiltering = searchQuery !== '' || activeCategory !== 'All' || activeOfferId !== null;
  // If we are filtering, we search against the entire fetched catalog.
  // If not filtering, we artificially cap the view using visibleCount to preserve the paginated feel.
  const displayProducts = isFiltering ? products : products.slice(0, visibleCount);

  // Filter products based on search, categories, and active offers
  const filteredProducts = displayProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Apply offer filter if one is active
    if (activeOfferId !== null && p.offer_id !== activeOfferId) return false;
    
    if (activeCategory === "All") return true;

    const n = p.name.toLowerCase();
    const d = p.description.toLowerCase();

    if (activeCategory === "Vehicles") {
      return n.includes('car') || n.includes('submarine') || n.includes('spaceship') || n.includes('racer');
    }
    if (activeCategory === "Plush") {
      return n.includes('plush') || n.includes('interactive pet');
    }
    if (activeCategory === "STEM") {
      return n.includes('telescope') || n.includes('solar') || n.includes('tiles') || d.includes('building') || d.includes('archaeology') || n.includes('creator');
    }
    if (activeCategory === "Action") {
      return n.includes('robo') || d.includes('tricks') || n.includes('playset') || n.includes('magician');
    }
    
    return false;
  });

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
        {!dbConnected && (
          <div className="db-error">
            <strong>Database Not Connected</strong>
            <p>Using local state. To use PostgreSQL, set DATABASE_URL in .env and run <code>node setup.js</code>.</p>
          </div>
        )}

        <Hero />

        {offers && offers.length > 0 && (
          <div className="deals-toggle-container" style={{ display: 'flex', justifyContent: 'center', marginBottom: '25px' }}>
            <button 
              className={`deals-toggle-btn ${showDeals ? 'active' : ''}`}
              onClick={() => setShowDeals(!showDeals)}
            >
              {showDeals ? '⚡ Hide Hot Deals' : '🔥 View Hot Deals & Offers'}
              <span className="deals-count-indicator">{offers.length}</span>
            </button>
          </div>
        )}

        {offers && offers.length > 0 && (
          <section className={`deals-section ${showDeals ? 'expanded' : 'collapsed'}`}>
            <div className="deals-grid">
              {offers.map(offer => (
                <div 
                  key={offer.id} 
                  className={`deal-card ${activeOfferId === offer.id ? 'active' : ''}`}
                  onClick={() => setActiveOfferId(activeOfferId === offer.id ? null : offer.id)}
                  style={{ '--bg-image': `url(${offer.banner_url})` } as React.CSSProperties}
                >
                  <div className="deal-card-overlay"></div>
                  <div className="deal-card-badge">{offer.badge_text || `${offer.discount_percentage}% OFF`}</div>
                  <div className="deal-card-content">
                    <h2>{offer.title}</h2>
                    <p>{offer.description}</p>
                  </div>
                  {activeOfferId === offer.id && (
                    <div className="deal-active-indicator">
                      <span>Active Filter</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {activeOfferId !== null && (
              <div className="clear-deal-filter-container">
                <button className="clear-deal-filter-btn" onClick={() => setActiveOfferId(null)}>
                  Showing deals for "{offers.find(o => o.id === activeOfferId)?.title}". Click to view all toys. ✕
                </button>
              </div>
            )}
          </section>
        )}

        <div className="filters-container">
          <input 
            type="text" 
            placeholder="Search toys by name or keyword..." 
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="category-tags">
            {CATEGORIES.map(category => (
              <button 
                key={category}
                className={`category-tag ${activeCategory === category ? 'active' : ''}`}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        <section className="product-grid">
          {filteredProducts.map((product, index) => (
            <ProductCard 
              key={product.id} 
              product={product} 
              onAddToCart={handleAddToCart} 
              onQuickView={setQuickViewProduct}
              priority={index < 2}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="empty-state">No toys found matching your criteria. Try a different search!</div>
          )}
        </section>

        {visibleCount < totalProducts && searchQuery === '' && activeCategory === 'All' && (
          <div className="pagination-container">
            <button 
              className="load-more-btn" 
              onClick={handleLoadMore}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}

        <ReviewTicker />
      </main>

      <CartDrawer 
        isOpen={cartOpen} 
        onClose={() => setCartOpen(false)} 
        items={itemsToRender} 
        onUpdateQty={handleUpdateQty} 
        total={cartTotal}
      />

      {quickViewProduct && (
        <QuickViewModal 
          product={quickViewProduct} 
          isOpen={true} 
          onClose={() => setQuickViewProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}
    </>
  );
}


