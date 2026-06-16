'use client';

import React, { useState } from 'react';
import { User, CartItem } from '@/lib/types';
import { placeOrder, clearCart, createRazorpayOrder, verifyRazorpayPayment } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface CheckoutClientProps {
  user: User | null;
  cartItems: CartItem[];
  cartTotal: number;
}

// Add Razorpay type for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutClient({ user, cartItems, cartTotal }: CheckoutClientProps) {
  const router = useRouter();
  const [isPlacing, setIsPlacing] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [emailSent, setEmailSent] = useState<boolean | null>(null);

  const totalPayable = cartTotal >= 999 ? cartTotal : cartTotal + 69;

  const totalSavings = cartItems.reduce((sum, item) => {
    const original = item.original_price || item.price;
    const saving = original - item.price;
    return sum + (saving * item.quantity);
  }, 0);

  if (!user) {
    return (
      <div className="checkout-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '120px 20px' }}>
        <div style={{ margin: 'auto', textAlign: 'center', background: 'var(--card-bg)', padding: '50px 40px', borderRadius: '24px', border: '1px solid var(--card-border)', maxWidth: '500px', width: '100%' }}>
          <div style={{ fontSize: '3rem', marginBottom: '10px' }}>🔒</div>
          <h1 style={{ marginBottom: '15px', fontSize: '1.5em', fontWeight: 'bold' }}>Authentication Required</h1>
          <p style={{ marginBottom: '30px', color: 'var(--text-secondary)' }}>You must be logged in to securely verify your details and place your order.</p>
          <button 
            className="checkout-btn" 
            onClick={() => router.push('/login')}
            style={{ padding: '15px 40px', fontSize: '1.2rem', marginBottom: '20px' }}
          >
            Sign In with Google
          </button>
          <div>
            <Link href="/" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 'bold' }}>← Return to Shop</Link>
          </div>
        </div>
      </div>
    );
  }

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlaceOrder = async () => {
    if (!user.address || !user.zipCode) {
      alert('Please fill out your shipping address and pin code in your profile before ordering.');
      router.push('/profile');
      return;
    }

    setIsPlacing(true);

    if (paymentMethod === 'cod') {
      const orderData = {
        user_email: user.email || 'guest',
        total_amount: totalPayable,
        items: cartItems,
        shipping_details: {
          name: user.name,
          phone: user.phone,
          address: user.address,
          city: user.city,
          zipcode: user.zipCode,
          payment_method: 'COD'
        }
      };

      const res = await placeOrder(orderData);
      if (res.success) {
        await clearCart();
        setEmailSent(res.emailSent || false);
        setOrderId(res.orderId || Math.floor(Math.random() * 100000) + 10000);
      } else {
        alert(res.error || 'Failed to place order. Please try again.');
      }
      setIsPlacing(false);
    } else {
      // Razorpay Payment
      const res = await loadRazorpayScript();
      if (!res) {
        alert("Razorpay SDK failed to load. Are you online?");
        setIsPlacing(false);
        return;
      }

      const orderRes = await createRazorpayOrder(totalPayable);
      if (!orderRes.success || !orderRes.order) {
        alert("Server error. Please try again.");
        setIsPlacing(false);
        return;
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderRes.order.amount,
        currency: orderRes.order.currency,
        name: "ToTStore",
        description: "Toys Purchase",
        order_id: orderRes.order.id,
        handler: async function (response: any) {
          const verifyRes = await verifyRazorpayPayment({
            orderCreationId: orderRes.order.id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpayOrderId: response.razorpay_order_id,
            razorpaySignature: response.razorpay_signature,
          });

          if (verifyRes.success) {
            const orderData = {
              user_email: user.email || 'guest',
              total_amount: totalPayable,
              items: cartItems,
              shipping_details: {
                name: user.name,
                phone: user.phone,
                address: user.address,
                city: user.city,
                zipcode: user.zipCode,
                payment_method: 'RAZORPAY',
                payment_id: response.razorpay_payment_id
              }
            };
            const placeRes = await placeOrder(orderData);
            if (placeRes.success) {
              await clearCart();
              setEmailSent(placeRes.emailSent || false);
              setOrderId(placeRes.orderId || Math.floor(Math.random() * 100000) + 10000);
            } else {
              alert(placeRes.error || "Failed to place order. Please contact support.");
            }
          } else {
            alert("Payment verification failed. Please contact support.");
          }
          setIsPlacing(false);
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone,
        },
        theme: {
          color: "#00f2ff",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
      paymentObject.on("payment.failed", function (response: any) {
        alert("Payment failed: " + response.error.description);
        setIsPlacing(false);
      });
    }
  };

  if (orderId) {
    return (
      <div className="checkout-success-container">
        <div className="success-content">
          <div className="success-icon">🎉</div>
          <h1>Order Placed Successfully!</h1>
          <p>Thank you for shopping with ToTStore. Your order <strong>#NT-{orderId}</strong> is being processed.</p>
          <div className="order-summary-box">
            <p><strong>Payment Method:</strong> {paymentMethod === 'cod' ? 'Cash on Delivery' : 'Razorpay Secure Payment'}</p>
            <p><strong>Delivery Address:</strong> {user.address}, {user.city} - {user.zipCode}</p>
          </div>
          
          <div className="email-status-banner" style={{
            background: emailSent ? 'rgba(0, 242, 255, 0.08)' : 'rgba(255, 51, 102, 0.08)',
            border: emailSent ? '1px solid var(--accent-cyan)' : '1px solid var(--accent-pink)',
            padding: '16px 20px',
            borderRadius: '16px',
            marginBottom: '30px',
            textAlign: 'center',
            fontSize: '0.95rem',
            color: emailSent ? 'var(--accent-cyan)' : 'var(--accent-pink)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '1.2rem' }}>{emailSent ? '✉️' : '⚠️'}</span>
            <span>
              {emailSent 
                ? 'Your order status has been sent to your registered mail ID.' 
                : 'Order placed, but there was an issue sending the confirmation email.'}
            </span>
          </div>

          <Link href="/" className="back-to-home-btn">Return to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <nav className="navbar">
        <Link href="/" className="nav-brand" aria-label="ToTstore">
          <span className="sr-only">ToTstore</span>
          <span className="brand-text" aria-hidden="true">T</span>
          <img src="/logo-o.jpg" alt="" className="brand-o" aria-hidden="true" />
          <span className="brand-text" aria-hidden="true">Tstore</span>
        </Link>
        <div className="nav-actions">
           <Link href="/" className="nav-link">Cancel</Link>
        </div>
      </nav>

      <main className="checkout-content">
        <header style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}>
          <h1>Secure Checkout</h1>
        </header>
        <div className="checkout-grid">
          <div className="checkout-details-section">
            <section className="checkout-section">
              <h2>1. Shipping Information</h2>
              <div className="checkout-address-card">
                <div className="address-header">
                   <strong>{user.name}</strong>
                   <Link href="/profile" className="edit-addr-link">Edit Address</Link>
                </div>
                {user.address ? (
                  <address>
                    {user.address}<br />
                    {user.city}, {user.zipCode}<br />
                    {user.phone}
                  </address>
                ) : (
                  <p className="no-address-warn">⚠️ No shipping address found. Please update your profile.</p>
                )}
              </div>
            </section>

            <section className="checkout-section">
              <h2>2. Payment Method</h2>
              <div className="payment-options-list">
                <div 
                  className={`payment-option-card ${paymentMethod === 'cod' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('cod')}
                >
                  <div className={`payment-radio ${paymentMethod === 'cod' ? 'checked' : ''}`}></div>
                  <div className="payment-label">
                    <div className="method-title">
                      <span className="icon">💵</span>
                      <strong>Cash on Delivery (COD)</strong>
                    </div>
                    <span>Pay with cash when your toys arrive.</span>
                  </div>
                </div>

                <div 
                  className={`payment-option-card ${paymentMethod === 'razorpay' ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod('razorpay')}
                >
                  <div className={`payment-radio ${paymentMethod === 'razorpay' ? 'checked' : ''}`}></div>
                  <div className="payment-label">
                    <div className="method-title">
                      <span className="icon">💳</span>
                      <strong>Online Payment (Razorpay)</strong>
                    </div>
                    <span>Securely pay with UPI, Cards, Netbanking or Wallets.</span>
                  </div>
                </div>
              </div>

              {paymentMethod === 'razorpay' && (
                <div className="payment-info-box" style={{ marginTop: '20px', padding: '20px', background: 'rgba(0,242,255,0.05)', borderRadius: '12px', border: '1px solid var(--accent-cyan)' }}>
                  <p style={{ color: 'var(--accent-cyan)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>🛡️</span> You will be redirected to Razorpay's secure checkout.
                  </p>
                </div>
              )}
            </section>
          </div>

          <div className="checkout-summary-section">
            <div className="summary-sticky-card">
              <h2 style={{ fontSize: '1.17em', margin: '1em 0', fontWeight: 'bold' }}>Order Summary</h2>
              <div className="summary-items">
                {cartItems.map(item => {
                  const hasDiscount = item.discount_percentage && item.discount_percentage > 0;
                  const originalPrice = item.original_price || item.price;
                  return (
                    <div key={item.product_id} className="summary-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div className="summary-item-name-info" style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className="item-name" style={{ fontWeight: 500 }}>{item.name} x {item.quantity}</span>
                        {hasDiscount && (
                          <span className="item-offer-badge" style={{ color: 'var(--accent-pink)', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            {item.badge_text || `${item.discount_percentage}% OFF`}
                          </span>
                        )}
                      </div>
                      <div className="summary-item-price-info" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {hasDiscount && (
                          <span className="item-price-original" style={{ textDecoration: 'line-through', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                            ₹{(originalPrice * item.quantity).toFixed(2)}
                          </span>
                        )}
                        <span className="item-price" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="summary-totals">
                <div className="summary-row">
                  <span>Subtotal</span>
                  <span>₹{(cartTotal + totalSavings).toFixed(2)}</span>
                </div>
                {totalSavings > 0 && (
                  <div className="summary-row savings" style={{ color: '#4ade80' }}>
                    <span>Your Savings</span>
                    <span>-₹{totalSavings.toFixed(2)}</span>
                  </div>
                )}
                {totalSavings > 0 && (
                  <div className="summary-row">
                    <span>Discounted Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                )}
                <div className="summary-row">
                  <span>Shipping</span>
                  <span>{cartTotal >= 999 ? 'FREE' : '₹69.00'}</span>
                </div>
                <div className="summary-row grand-total">
                  <span>Total Payable</span>
                  <span>₹{totalPayable.toFixed(2)}</span>
                </div>
              </div>
              <button 
                className="place-order-btn" 
                onClick={handlePlaceOrder}
                disabled={isPlacing || cartItems.length === 0}
              >
                {isPlacing ? 'Processing...' : paymentMethod === 'cod' ? 'Place COD Order' : 'Pay via Razorpay'}
              </button>
              <div style={{ marginTop: '15px', textAlign: 'center' }}>
                 <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Safe & Secure Payments by Razorpay</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
