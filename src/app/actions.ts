'use server';

import { query, isDbConnected } from '@/lib/db';
import { cookies } from 'next/headers';
import { OAuth2Client } from 'google-auth-library';
import { SignJWT, jwtVerify } from 'jose';
import { sendOrderStatusEmail } from '@/lib/email';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'fallback_secret_for_development_do_not_use_in_prod');

// Simple server action to add an item to the cart in Postgres
export async function addToCart(productId: number, quantity: number = 1) {
  if (!isDbConnected) {
    return { success: false, error: 'Database is not connected.' };
  }

  const cookieStore = await cookies();
  let sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    sessionId = Math.random().toString(36).substring(2, 15);
    cookieStore.set('session_id', sessionId, { path: '/' });
  }

  try {
    // Check product stock count
    const productRes = await query('SELECT stock_count, name FROM products WHERE id = $1', [productId]);
    if (productRes.rowCount === 0) {
      return { success: false, error: 'Product not found.' };
    }
    const stockCount = productRes.rows[0].stock_count ?? 0;
    const productName = productRes.rows[0].name;

    // Fetch current quantity in user's cart
    let currentCartQty = 0;
    const cartItemRes = await query(
      `SELECT ci.quantity FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE c.session_id = $1 AND ci.product_id = $2`,
      [sessionId, productId]
    );
    if (cartItemRes.rowCount && cartItemRes.rowCount > 0) {
      currentCartQty = cartItemRes.rows[0].quantity;
    }

    if (currentCartQty + quantity > stockCount) {
      if (stockCount <= 0) {
        return { success: false, error: `Sorry, "${productName}" is out of stock.` };
      }
      const remainingAllowed = stockCount - currentCartQty;
      if (remainingAllowed <= 0) {
        return { success: false, error: `You already have all available stock (${stockCount}) of "${productName}" in your cart.` };
      } else {
        return { success: false, error: `Only ${stockCount} units of "${productName}" are available. You can add at most ${remainingAllowed} more.` };
      }
    }

    // Upsert cart
    const cartRes = await query(
      'INSERT INTO carts (session_id) VALUES ($1) ON CONFLICT (session_id) DO UPDATE SET session_id = EXCLUDED.session_id RETURNING id',
      [sessionId]
    );
    const cartId = cartRes.rows[0].id;

    // Insert or update cart item
    await query(
      `INSERT INTO cart_items (cart_id, product_id, quantity) 
       VALUES ($1, $2, $3) 
       ON CONFLICT (cart_id, product_id) 
       DO UPDATE SET quantity = cart_items.quantity + $3`,
      [cartId, productId, quantity]
    );

    return { success: true };
  } catch (error: any) {
    console.error('Error adding to cart:', error);
    return { success: false, error: error.message };
  }
}

export async function getCart() {
  if (!isDbConnected) {
    return { items: [] };
  }

  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;

  if (!sessionId) {
    return { items: [] };
  }

  try {
    const res = await query(`
      SELECT ci.id as cart_item_id, p.id as product_id, p.name, p.price as original_price, p.image_url, ci.quantity,
             o.discount_percentage, o.badge_text, o.title as offer_title
      FROM carts c
      JOIN cart_items ci ON c.id = ci.cart_id
      JOIN products p ON ci.product_id = p.id
      LEFT JOIN offers o ON p.offer_id = o.id
      WHERE c.session_id = $1
      ORDER BY ci.id ASC
    `, [sessionId]);

    const items = res.rows.map(row => {
      const discount = row.discount_percentage || 0;
      const originalPrice = parseFloat(row.original_price);
      const price = discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;
      return {
        cart_item_id: row.cart_item_id,
        product_id: row.product_id,
        name: row.name,
        price: price, // Discounted price for cart total & math
        original_price: originalPrice,
        image_url: row.image_url,
        quantity: row.quantity,
        discount_percentage: row.discount_percentage,
        badge_text: row.badge_text,
        offer_title: row.offer_title
      };
    });

    return { items };
  } catch (error) {
    console.error('Error getting cart:', error);
    return { items: [] };
  }
}

export async function updateCartItemQuantity(productId: number, quantity: number) {
  if (!isDbConnected) return { success: false, error: 'Database not connected.' };
  
  const cookieStore = await cookies();
  const sessionId = cookieStore.get('session_id')?.value;
  if (!sessionId) return { success: false, error: 'Session not found.' };

  try {
    const cartRes = await query('SELECT id FROM carts WHERE session_id = $1', [sessionId]);
    if (cartRes.rowCount === 0) return { success: false, error: 'Cart not found.' };
    const cartId = cartRes.rows[0].id;

    if (quantity <= 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1 AND product_id = $2', [cartId, productId]);
    } else {
      // Check stock count before updating
      const productRes = await query('SELECT stock_count, name FROM products WHERE id = $1', [productId]);
      if (productRes.rowCount === 0) {
        return { success: false, error: 'Product not found.' };
      }
      const stockCount = productRes.rows[0].stock_count ?? 0;
      const productName = productRes.rows[0].name;

      if (quantity > stockCount) {
        return { success: false, error: `Only ${stockCount} units of "${productName}" are available in stock.` };
      }

      await query('UPDATE cart_items SET quantity = $1 WHERE cart_id = $2 AND product_id = $3', [quantity, cartId, productId]);
    }
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Database error' };
  }
}

export async function verifyGoogleToken(token: string) {
  try {
    const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return { success: false, error: 'No email found in token' };

    // Upsert user in database
    if (isDbConnected) {
      await query(`
        INSERT INTO users (email, name, avatar) 
        VALUES ($1, $2, $3) 
        ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar = EXCLUDED.avatar
      `, [payload.email, payload.name, payload.picture]);
    }

    // Create session JWT
    const jwt = await new SignJWT({ email: payload.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const cookieStore = await cookies();
    cookieStore.set('session', jwt, { 
      httpOnly: true, 
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return { success: true };
  } catch (error: any) {
    console.error('Verify Google Token Error:', error);
    return { success: false, error: 'Failed to verify token' };
  }
}

export async function updateProfile(updatedData: Partial<any>) {
  const user = await getUser();
  if (!user || !user.email) return { success: false };
  
  try {
    if (isDbConnected) {
      await query(`
        UPDATE users 
        SET phone = $1, address = $2, city = $3, zipcode = $4
        WHERE email = $5
      `, [
        updatedData.phone || null, 
        updatedData.address || null, 
        updatedData.city || null, 
        updatedData.zipCode || null, // Map form 'zipCode' to DB 'zipcode'
        user.email
      ]);
    }
    return { success: true };
  } catch (e) {
    console.error('Update Profile Error:', e);
    return { success: false };
  }
}




export async function placeOrder(orderData: { 
  user_email: string, 
  total_amount: number, 
  items: any[], 
  shipping_details: any 
}) {
  if (isDbConnected) {
    try {
      await query('BEGIN');

      for (const item of orderData.items) {
        const productId = item.product_id;
        const buyQty = item.quantity;

        // Fetch current stock and lock the row to avoid race conditions
        const res = await query('SELECT stock_count, name FROM products WHERE id = $1 FOR UPDATE', [productId]);
        if (res.rowCount === 0) {
          throw new Error(`Product with ID ${productId} not found.`);
        }

        const currentStock = res.rows[0].stock_count ?? 0;
        const productName = res.rows[0].name;

        if (currentStock < buyQty) {
          throw new Error(`Sorry, "${productName}" does not have enough stock. Available: ${currentStock}, Requested: ${buyQty}`);
        }

        // Decrement stock
        await query(
          'UPDATE products SET stock_count = stock_count - $1 WHERE id = $2',
          [buyQty, productId]
        );
      }

      const orderRes = await query(`
        INSERT INTO orders (user_email, total_amount, items, shipping_details)
        VALUES ($1, $2, $3, $4)
        RETURNING id, created_at
      `, [
        orderData.user_email, 
        orderData.total_amount, 
        JSON.stringify(orderData.items), 
        JSON.stringify(orderData.shipping_details)
      ]);

      const newOrderId = orderRes.rows[0].id;
      const createdAt = orderRes.rows[0].created_at;

      await query('COMMIT');

      // Send confirmation email asynchronously so it doesn't block the client
      const newOrder = {
        id: newOrderId,
        total_amount: orderData.total_amount,
        items: orderData.items,
        shipping_details: orderData.shipping_details,
        created_at: createdAt
      };
      
      let emailSent = false;
      try {
        const emailRes = await sendOrderStatusEmail(newOrder, 'placed', orderData.user_email);
        emailSent = emailRes?.success || false;
      } catch (emailErr) {
        console.error('Email sending error (non-fatal):', emailErr);
      }

      return { success: true, orderId: newOrderId, emailSent };
    } catch (e: any) {
      await query('ROLLBACK');
      console.error('Place Order Error:', e);
      return { success: false, error: e.message || 'Database error' };
    }
  }
  // If no DB, we just simulate success
  return { success: true };
}

export async function clearCart() {
  if (isDbConnected) {
    const cookieStore = await cookies();
    const sessionId = cookieStore.get('session_id')?.value;
    if (sessionId) {
      try {
        const cartRes = await query('SELECT id FROM carts WHERE session_id = $1', [sessionId]);
        if (cartRes.rowCount && cartRes.rowCount > 0) {
          await query('DELETE FROM cart_items WHERE cart_id = $1', [cartRes.rows[0].id]);
        }
      } catch (e) {
        console.error('Clear Cart Error:', e);
      }
    }
  }
  return { success: true };
}

export async function getUserOrders() {
  const user = await getUser();
  if (!user || !user.email) return [];

  try {
    if (isDbConnected) {
      const res = await query(
        'SELECT * FROM orders WHERE user_email = $1 ORDER BY created_at DESC', 
        [user.email]
      );
      return res.rows;
    }
  } catch (e) {
    console.error('Fetch Orders Error:', e);
  }
  return [];
}

export async function cancelOrder(orderId: number) {
  if (isDbConnected) {
    try {
      // Fetch order details first
      const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
      if (orderRes.rowCount === 0) {
        return { success: false, error: 'Order not found.' };
      }

      const order = orderRes.rows[0];
      if (order.status.toLowerCase() !== 'pending') {
        return { success: false, error: 'Only pending orders can be cancelled.' };
      }

      // Update status
      await query(
        "UPDATE orders SET status = 'Cancelled' WHERE id = $1",
        [orderId]
      );

      // Send cancellation email asynchronously
      let emailSent = false;
      try {
        const emailRes = await sendOrderStatusEmail(order, 'cancelled', order.user_email);
        emailSent = emailRes?.success || false;
      } catch (emailErr) {
        console.error('Email sending error (non-fatal):', emailErr);
      }

      return { success: true, emailSent };
    } catch (e: any) {
      console.error('Cancel Order Error:', e);
      return { success: false, error: e.message || 'Database error' };
    }
  }
  return { success: true };
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
  return { success: true };
}

export async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const email = payload.email as string;

    if (isDbConnected) {
      const res = await query('SELECT * FROM users WHERE email = $1', [email]);
      if (res.rows.length > 0) {
        const dbUser = res.rows[0];
        return {
          ...dbUser,
          zipCode: dbUser.zipcode
        };
      }
    }
    
    // In case there is no DB connected but a valid token exists
    return { email, name: email.split('@')[0], avatar: 'https://i.pravatar.cc/150' };
  } catch (e) {
    return null;
  }
}

export async function getMoreProducts(offset: number, limit: number) {
  const { getProductsPaged } = await import('@/lib/db');
  return await getProductsPaged(offset, limit);
}

export async function createRazorpayOrder(amount: number) {
  try {
    const Razorpay = (await import('razorpay')).default;
    const instance = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const order = await instance.orders.create({
      amount: Math.round(amount * 100), // amount in paisa
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return { success: true, order };
  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return { success: false, error: "Failed to create order" };
  }
}

export async function verifyRazorpayPayment(data: {
  orderCreationId: string;
  razorpayPaymentId: string;
  razorpayOrderId: string;
  razorpaySignature: string;
}) {
  try {
    const crypto = await import('crypto');
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!);
    shasum.update(`${data.orderCreationId}|${data.razorpayPaymentId}`);
    const digest = shasum.digest("hex");

    if (digest !== data.razorpaySignature) {
      return { success: false, message: "Transaction is not legit!" };
    }

    return { success: true, message: "Payment verified successfully" };
  } catch (error) {
    console.error("Razorpay Verification Error:", error);
    return { success: false, message: "Verification failed" };
  }
}

export async function updateOrderStatus(orderId: number, newStatus: string) {
  if (!isDbConnected) {
    return { success: false, error: 'Database is not connected.' };
  }

  try {
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
    if (orderRes.rowCount === 0) {
      return { success: false, error: 'Order not found.' };
    }
    const order = orderRes.rows[0];

    // Update status in database
    await query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, orderId]);
    
    // Send email notification based on the updated status
    const updatedOrder = {
      ...order,
      status: newStatus
    };

    let emailSent = false;
    try {
      const type = newStatus.toLowerCase() as 'placed' | 'processing' | 'cancelled' | 'refunded' | 'shipped' | 'delivered';
      const emailRes = await sendOrderStatusEmail(updatedOrder, type, order.user_email);
      emailSent = emailRes?.success || false;
    } catch (emailErr) {
      console.error('Email sending error (non-fatal):', emailErr);
    }

    return { success: true, emailSent };
  } catch (error: any) {
    console.error('Update Order Status Error:', error);
    return { success: false, error: error.message || 'Database error' };
  }
}
