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

export default function OrdersClient({ user, orders }: { user: User, orders: Order[] }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState<number | null>(null);

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

  const handleCancelOrder = async (orderId: number) => {
    if (window.confirm('Are you sure you want to cancel this order?')) {
      setIsProcessing(orderId);
      const res = await cancelOrder(orderId);
      if (res.success) {
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
        <Link href="/" className="nav-brand">ToTToys</Link>
        <div className="nav-actions">
           <Link href="/profile" className="nav-link">Profile</Link>
           <Link href="/" className="nav-link">Shop</Link>
        </div>
      </nav>

      <main className="orders-content">
        <header className="page-header">
          <h1>Track Your Orders</h1>
          <p>Real-time delivery status for your toy collection.</p>
        </header>

        <div className="orders-list">
          {orders.length === 0 ? (
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
              const date = new Date(order.created_at).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric'
              });

              return (
                <div key={order.id} className={`order-tracking-card ${isCancelled ? 'cancelled' : ''}`}>
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

                  {!isCancelled ? (
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
                  ) : (
                    <div className="cancelled-message">
                      <span className="cancelled-icon">🚫</span>
                      <p>This order was cancelled and will not be shipped.</p>
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
          )}
        </div>
      </main>
    </div>
  );
}
