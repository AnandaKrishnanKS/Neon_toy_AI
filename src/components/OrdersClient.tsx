'use client';

import React, { useState } from 'react';
import { User } from '@/lib/types';
import { cancelOrder } from '@/app/actions';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Order {
  id: number;
  total_amount: string;
  items: any[];
  shipping_details: any;
  status: string;
  created_at: string;
}

interface CustomEnquiry {
  id: number;
  product_id: number;
  user_email: string;
  name: string;
  phone?: string;
  message: string;
  status: string;
  created_at: string;
  product_name: string;
  product_image: string;
  product_price: string;
  product_category: string;
}

export default function OrdersClient({ 
  user, 
  orders, 
  customEnquiries = [] 
}: { 
  user: User; 
  orders: Order[]; 
  customEnquiries?: CustomEnquiry[]; 
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'orders' | 'enquiries'>('orders');

  const getStatusStep = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 1;
      case 'processing': return 2;
      case 'shipped': return 3;
      case 'delivered': return 4;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const getEnquiryStatusStep = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 1;
      case 'in progress': return 2;
      case 'completed': return 3;
      case 'cancelled': return -1;
      default: return 1;
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setIsProcessing(orderId);
      const res = await cancelOrder(orderId);
      if (res.success) {
        if (res.emailSent) {
          alert('Your order status has been sent to your registered mail ID.');
        } else {
          alert('Order cancelled successfully, but there was an issue sending the email notification.');
        }
        router.refresh();
      } else {
        alert('Could not cancel order. It might already be processed.');
      }
      setIsProcessing(null);
    }
  };

  return (
    <div className="orders-container">
      <nav className="navbar">
        <Link href="/" className="nav-brand" aria-label="ToTstore">
          <span className="sr-only">ToTstore</span>
          <span className="brand-text" aria-hidden="true">T</span>
          <img src="/logo-o.jpg" alt="" className="brand-o" aria-hidden="true" />
          <span className="brand-text" aria-hidden="true">Tstore</span>
        </Link>
        <div className="nav-actions">
           <Link href="/profile" className="nav-link">Profile</Link>
           <Link href="/" className="nav-link">Shop</Link>
        </div>
      </nav>

      <main className="orders-content">
        <header className="page-header">
          <h1>Track Your Orders</h1>
          <p>Welcome back, {user.name}! Real-time delivery status for your toy collection.</p>
        </header>

        <div className="category-tags" style={{ marginBottom: '30px', justifyContent: 'flex-start' }}>
          <button 
            type="button"
            className={`category-tag ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Direct Orders ({orders.length})
          </button>
          <button 
            type="button"
            className={`category-tag ${activeTab === 'enquiries' ? 'active' : ''}`}
            onClick={() => setActiveTab('enquiries')}
          >
            Custom Requests ({customEnquiries.length})
          </button>
        </div>

        <div className="orders-list">
          {activeTab === 'orders' ? (
            orders.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-icon">📦</div>
                <h2>No orders yet</h2>
                <p>Looks like you haven't placed any orders yet. Start shopping to fill this space!</p>
                <Link href="/" className="shop-now-btn">Start Shopping</Link>
              </div>
            ) : (
              orders.map(order => {
                const currentStep = getStatusStep(order.status);
                const isCancelled = order.status.toLowerCase() === 'cancelled';
                const isRefunded = order.status.toLowerCase() === 'refunded';
                const date = new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                });

                // Helper to safely extract payment method
                let isPaidOrder = false;
                try {
                  const details = typeof order.shipping_details === 'string'
                    ? JSON.parse(order.shipping_details)
                    : order.shipping_details;
                  const method = (details?.payment_method || 'COD').toUpperCase();
                  isPaidOrder = method !== 'COD';
                } catch {
                  isPaidOrder = false;
                }

                return (
                  <div key={order.id} className={`order-tracking-card ${isCancelled ? 'cancelled' : ''} ${isRefunded ? 'refunded' : ''}`}>
                    <div className="order-card-header">
                      <div className="order-meta">
                        <span className="order-id">Order #NT-{order.id}</span>
                        <span className="order-date">Placed on {date}</span>
                      </div>
                      <div className="order-header-right">
                        {order.status.toLowerCase() === 'pending' && (
                          <button 
                            className="cancel-order-btn" 
                            onClick={() => handleCancelOrder(order.id)}
                            disabled={isProcessing === order.id}
                          >
                            {isProcessing === order.id ? 'Cancelling...' : 'Cancel Order'}
                          </button>
                        )}
                        <div className={`order-status-badge ${order.status.toLowerCase()}`}>
                          {order.status}
                        </div>
                      </div>
                    </div>

                    {!isCancelled && !isRefunded ? (
                      <div className="tracking-timeline">
                        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">Placed</span>
                        </div>
                        <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">Processing</span>
                        </div>
                        <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">Shipped</span>
                        </div>
                        <div className={`step-line ${currentStep >= 4 ? 'active' : ''}`}></div>
                        <div className={`step ${currentStep >= 4 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">Delivered</span>
                        </div>
                      </div>
                    ) : isRefunded ? (
                      <div className="refunded-message">
                        <span className="cancelled-icon">💰</span>
                        <p>This order was refunded.</p>
                      </div>
                    ) : (
                      <div className="cancelled-message">
                        <span className="cancelled-icon">🚫</span>
                        <p>
                          This order was cancelled and will not be shipped.
                          {isPaidOrder && " Refund will be initiated soon. If not, contact us."}
                        </p>
                      </div>
                    )}

                    <div className="order-footer-details">
                      <div className="shipping-to">
                        <label>Shipping To:</label>
                        <span>{order.shipping_details.address}, {order.shipping_details.city}</span>
                      </div>
                      <div className="order-total-info">
                        <label>Total Amount:</label>
                        <span className="total-val">₹{Number(order.total_amount).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          ) : (
            customEnquiries.length === 0 ? (
              <div className="empty-orders">
                <div className="empty-icon">💬</div>
                <h2>No custom requests yet</h2>
                <p>Have a special toy design in mind? Browse out-of-stock custom or handmade items to request a custom order!</p>
                <Link href="/" className="shop-now-btn">Browse Products</Link>
              </div>
            ) : (
              customEnquiries.map(enquiry => {
                const currentStep = getEnquiryStatusStep(enquiry.status);
                const isCancelled = enquiry.status.toLowerCase() === 'cancelled';
                const date = new Date(enquiry.created_at).toLocaleDateString('en-US', {
                  month: 'long', day: 'numeric', year: 'numeric'
                });

                return (
                  <div key={enquiry.id} className={`order-tracking-card ${isCancelled ? 'cancelled' : ''}`}>
                    <div className="order-card-header">
                      <div className="order-meta">
                        <span className="order-id">Custom Request #CR-{enquiry.id}</span>
                        <span className="order-date">Requested on {date}</span>
                      </div>
                      <div className="order-header-right">
                        <div className={`order-status-badge ${enquiry.status.toLowerCase().replace(/\s+/g, '-')}`}>
                          {enquiry.status}
                        </div>
                      </div>
                    </div>

                    <div className="custom-order-product" style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
                      {enquiry.product_image && (
                        <img 
                          src={enquiry.product_image} 
                          alt={enquiry.product_name} 
                          style={{ width: '80px', height: '80px', borderRadius: '12px', objectFit: 'cover', border: '1px solid var(--glass-border)' }} 
                        />
                      )}
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '5px' }}>
                          {enquiry.product_name}
                        </h3>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span className="category-tag active" style={{ fontSize: '0.75rem', padding: '2px 8px', cursor: 'default' }}>
                            {enquiry.product_category}
                          </span>
                          <span style={{ fontSize: '1rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                            ₹{Number(enquiry.product_price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {!isCancelled ? (
                      <div className="tracking-timeline">
                        <div className={`step ${currentStep >= 1 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">Submitted</span>
                        </div>
                        <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
                        <div className={`step ${currentStep >= 2 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">In Progress</span>
                        </div>
                        <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
                        <div className={`step ${currentStep >= 3 ? 'active' : ''}`}>
                          <div className="step-dot"></div>
                          <span className="step-label">Completed</span>
                        </div>
                      </div>
                    ) : (
                      <div className="cancelled-message">
                        <span className="cancelled-icon">🚫</span>
                        <p>This custom request was cancelled.</p>
                      </div>
                    )}

                    <div className="order-footer-details" style={{ flexDirection: 'column', gap: '15px' }}>
                      <div>
                        <label>Your Inquiry Message:</label>
                        <div style={{ 
                          background: 'rgba(0, 0, 0, 0.2)', 
                          padding: '15px', 
                          borderRadius: '10px', 
                          border: '1px solid var(--glass-border)',
                          fontSize: '0.9rem',
                          lineHeight: 1.5,
                          color: 'var(--text-primary)',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {enquiry.message}
                        </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'row', gap: '40px', flexWrap: 'wrap' }}>
                        <div>
                          <label>Contact Name</label>
                          <span>{enquiry.name}</span>
                        </div>
                        {enquiry.phone && (
                          <div>
                            <label>Contact Phone</label>
                            <span>{enquiry.phone}</span>
                          </div>
                        )}
                        <div>
                          <label>Contact Email</label>
                          <span>{enquiry.user_email}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )
          )}
        </div>
      </main>
    </div>
  );
}
