import nodemailer from 'nodemailer';

// Helper to format currency
const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `₹${num.toFixed(2)}`;
};

// HTML Email Layout Generator
function generateEmailHtml(order: any, type: 'placed' | 'processing' | 'cancelled' | 'refunded' | 'shipped' | 'delivered') {
  const orderId = order.id ? `NT-${order.id}` : 'Pending';
  const totalAmount = order.total_amount;
  const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
  const shipping = typeof order.shipping_details === 'string' ? JSON.parse(order.shipping_details) : order.shipping_details;
  
  // Theme and header colors based on status type
  let statusTitle = 'Order Confirmed';
  let statusSubtitle = 'Thank you for your purchase! We are preparing your toys.';
  let themeColor = '#00f2ff'; // Accent Cyan
  let statusBanner = '🎉 ORDER CONFIRMED';

  if (type === 'cancelled') {
    statusTitle = 'Order Cancelled';
    statusSubtitle = 'Your order has been cancelled as requested.';
    themeColor = '#ff3366'; // Accent Pink
    statusBanner = '🚫 ORDER CANCELLED';
  } else if (type === 'processing') {
    statusTitle = 'Order Processing';
    statusSubtitle = 'We are packaging your toys and getting them ready for shipment!';
    themeColor = '#f59e0b'; // Orange/Amber
    statusBanner = '⚡ ORDER PROCESSING';
  } else if (type === 'refunded') {
    statusTitle = 'Refund Processed';
    statusSubtitle = 'A refund has been initiated for your order.';
    themeColor = '#10b981'; // Green
    statusBanner = '💰 REFUND PROCESSED';
  } else if (type === 'shipped') {
    statusTitle = 'Order Shipped';
    statusSubtitle = 'Great news! Your toys are on their way.';
    themeColor = '#3b82f6'; // Blue
    statusBanner = '🚚 ORDER SHIPPED';
  } else if (type === 'delivered') {
    statusTitle = 'Order Delivered';
    statusSubtitle = 'Your order has been delivered. Enjoy your toys!';
    themeColor = '#10b981'; // Green
    statusBanner = '🎁 ORDER DELIVERED';
  }

  // Generate Items Table HTML
  let itemsHtml = '';
  let subtotal = 0;
  let totalSavings = 0;

  if (Array.isArray(items)) {
    items.forEach((item: any) => {
      const originalPrice = item.original_price || item.price;
      const price = item.price;
      const quantity = item.quantity || 1;
      const itemTotal = price * quantity;
      
      subtotal += originalPrice * quantity;
      totalSavings += (originalPrice - price) * quantity;

      itemsHtml += `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.08);">
          <td style="padding: 12px 8px; text-align: left; vertical-align: middle;">
            <div style="font-weight: 600; color: #ffffff;">${item.name}</div>
            ${item.discount_percentage ? `<div style="font-size: 0.75rem; color: #ff3366; font-weight: bold;">${item.badge_text || `${item.discount_percentage}% OFF`}</div>` : ''}
          </td>
          <td style="padding: 12px 8px; text-align: center; color: #9ca3af;">${quantity}</td>
          <td style="padding: 12px 8px; text-align: right; color: #00f2ff; font-weight: 600;">${formatCurrency(price)}</td>
          <td style="padding: 12px 8px; text-align: right; color: #ffffff; font-weight: 600;">${formatCurrency(itemTotal)}</td>
        </tr>
      `;
    });
  }

  const shippingCost = subtotal - totalSavings >= 100 ? 0 : 10;
  const grandTotal = (subtotal - totalSavings) + shippingCost;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${statusTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; min-height: 100vh; padding: 20px 0;">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);">
              
              <!-- Brand Header -->
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 30px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <div style="font-size: 2.5rem; font-weight: 800; letter-spacing: 2px; color: #ffffff; text-decoration: none; display: inline-block;">
                    <span style="background: linear-gradient(45deg, #ff3366, #00f2ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ToTStore</span>
                  </div>
                  <div style="color: #9ca3af; font-size: 0.85rem; margin-top: 5px; letter-spacing: 1px; font-weight: 600; text-transform: uppercase;">Neon Toy Laboratory</div>
                </td>
              </tr>

              <!-- Status Banner -->
              <tr>
                <td align="center" style="padding: 25px 20px 10px 20px;">
                  <div style="display: inline-block; padding: 8px 18px; border-radius: 30px; background-color: rgba(255, 255, 255, 0.03); border: 1px solid ${themeColor}; color: ${themeColor}; font-weight: 700; font-size: 0.85rem; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 15px;">
                    ${statusBanner}
                  </div>
                  <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 1.8rem; font-weight: 800;">${statusTitle}</h1>
                  <p style="margin: 0; color: #9ca3af; font-size: 0.95rem; line-height: 1.5; max-width: 450px;">${statusSubtitle}</p>
                </td>
              </tr>

              <!-- Main Card Body -->
              <tr>
                <td style="padding: 30px 30px 20px 30px;">
                  
                  <!-- Order Overview Card -->
                  <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="padding: 4px 0; color: #9ca3af; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Order Number</td>
                        <td align="right" style="padding: 4px 0; color: #ffffff; font-size: 0.95rem; font-weight: 700;">#${orderId}</td>
                      </tr>
                      <tr>
                        <td style="padding: 4px 0; color: #9ca3af; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Payment Method</td>
                        <td align="right" style="padding: 4px 0; color: #ffffff; font-size: 0.95rem; font-weight: 600;">${shipping?.payment_method || 'COD'}</td>
                      </tr>
                      ${shipping?.payment_id ? `
                      <tr>
                        <td style="padding: 4px 0; color: #9ca3af; font-size: 0.85rem; font-weight: 600; text-transform: uppercase;">Transaction ID</td>
                        <td align="right" style="padding: 4px 0; color: #00f2ff; font-size: 0.85rem; font-family: monospace;">${shipping.payment_id}</td>
                      </tr>` : ''}
                    </table>
                  </div>

                  <!-- Shipping details -->
                  <h3 style="color: #ffffff; font-size: 1.05rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Delivery Information</h3>
                  <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 25px; color: #d1d5db; font-size: 0.95rem; line-height: 1.5;">
                    <strong style="color: #ffffff; font-size: 1rem; display: block; margin-bottom: 5px;">${shipping?.name || 'Customer'}</strong>
                    <div>Phone: ${shipping?.phone || 'N/A'}</div>
                    <div>Address: ${shipping?.address || 'N/A'}, ${shipping?.city || ''}</div>
                    <div>Pincode: ${shipping?.zipcode || 'N/A'}</div>
                  </div>

                  <!-- Items Table -->
                  <h3 style="color: #ffffff; font-size: 1.05rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 12px 0;">Items Purchased</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                      <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                        <th style="padding: 8px; text-align: left; color: #9ca3af; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Toy</th>
                        <th style="padding: 8px; text-align: center; color: #9ca3af; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Qty</th>
                        <th style="padding: 8px; text-align: right; color: #9ca3af; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Price</th>
                        <th style="padding: 8px; text-align: right; color: #9ca3af; font-size: 0.8rem; font-weight: 700; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>

                  <!-- Totals summary -->
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                    <tr>
                      <td style="padding: 4px 0; color: #9ca3af; font-size: 0.9rem;">Subtotal</td>
                      <td align="right" style="padding: 4px 0; color: #ffffff; font-size: 0.9rem; font-weight: 600;">${formatCurrency(subtotal)}</td>
                    </tr>
                    ${totalSavings > 0 ? `
                    <tr>
                      <td style="padding: 4px 0; color: #10b981; font-size: 0.9rem; font-weight: 600;">Toy Deals Savings</td>
                      <td align="right" style="padding: 4px 0; color: #10b981; font-size: 0.9rem; font-weight: 700;">-${formatCurrency(totalSavings)}</td>
                    </tr>` : ''}
                    <tr>
                      <td style="padding: 4px 0; color: #9ca3af; font-size: 0.9rem;">Shipping</td>
                      <td align="right" style="padding: 4px 0; color: #ffffff; font-size: 0.9rem; font-weight: 600;">${shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}</td>
                    </tr>
                    <tr style="border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                      <td style="padding: 15px 0 0 0; color: #ffffff; font-size: 1.1rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;">Total Payable</td>
                      <td align="right" style="padding: 15px 0 0 0; color: #00f2ff; font-size: 1.25rem; font-weight: 800;">${formatCurrency(grandTotal)}</td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- Call to Action / Support Notes -->
              <tr>
                <td align="center" style="padding: 10px 30px 40px 30px;">
                  <div style="height: 1px; background-color: rgba(255, 255, 255, 0.08); margin-bottom: 25px;"></div>
                  
                  ${type === 'placed' ? `
                    <p style="color: #9ca3af; font-size: 0.85rem; line-height: 1.5; margin: 0 0 20px 0;">You can track the progress of your delivery by visiting your profile on our store.</p>
                  ` : ''}
                  
                  ${type === 'cancelled' && shipping?.payment_method !== 'COD' ? `
                    <div style="background-color: rgba(255, 51, 102, 0.05); border: 1px solid rgba(255, 51, 102, 0.15); border-radius: 12px; padding: 15px; margin-bottom: 20px; color: #ff3366; font-size: 0.85rem; font-weight: 600; line-height: 1.4;">
                      Since this was an online transaction, your refund of ${formatCurrency(totalAmount)} is being processed and will show up in your account in 5-7 business days.
                    </div>
                  ` : ''}

                  ${type === 'refunded' ? `
                    <div style="background-color: rgba(16, 185, 129, 0.05); border: 1px solid rgba(16, 185, 129, 0.15); border-radius: 12px; padding: 15px; margin-bottom: 20px; color: #10b981; font-size: 0.85rem; font-weight: 600; line-height: 1.4;">
                      A refund of ${formatCurrency(totalAmount)} has been credited back to your original payment method. Depending on your bank, it may take 2-5 days to settle.
                    </div>
                  ` : ''}

                  <p style="color: #6b7280; font-size: 0.8rem; margin: 0;">If you have any questions, please contact our support team at <a href="mailto:support@totstore.example.com" style="color: #00f2ff; text-decoration: none;">support@totstore.example.com</a>.</p>
                </td>
              </tr>

              <!-- Footer Banner -->
              <tr>
                <td align="center" style="background-color: rgba(0, 0, 0, 0.2); padding: 20px; border-top: 1px solid rgba(255, 255, 255, 0.05);">
                  <div style="color: #4b5563; font-size: 0.75rem; font-weight: 600;">&copy; 2026 ToTStore Inc. All Rights Reserved.</div>
                  <div style="color: #4b5563; font-size: 0.7rem; margin-top: 4px;">Powered by Neon Toy AI Engine</div>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Main function to send order status email
export async function sendOrderStatusEmail(
  order: any, 
  type: 'placed' | 'processing' | 'cancelled' | 'refunded' | 'shipped' | 'delivered',
  recipientEmail: string
) {
  // Read config from env
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"ToTStore" <no-reply@totstore.example.com>`;

  if (!host || !user || !pass) {
    console.warn('⚠️ SMTP details not configured. Unable to send direct email.');
    return { success: false, error: 'SMTP configuration missing in environment' };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for others
      auth: {
        user,
        pass,
      },
    });

    let subject = 'ToTStore Order Update';
    if (type === 'placed') {
      subject = `Order Confirmed! #${order.id ? `NT-${order.id}` : ''}`;
    } else if (type === 'processing') {
      subject = `Order is Processing #${order.id ? `NT-${order.id}` : ''}`;
    } else if (type === 'cancelled') {
      subject = `Order Cancelled #${order.id ? `NT-${order.id}` : ''}`;
    } else if (type === 'refunded') {
      subject = `Refund Processed for Order #${order.id ? `NT-${order.id}` : ''}`;
    } else if (type === 'shipped') {
      subject = `Your ToTStore Order has Shipped! #${order.id ? `NT-${order.id}` : ''}`;
    } else if (type === 'delivered') {
      subject = `Order Delivered! #${order.id ? `NT-${order.id}` : ''}`;
    }

    const htmlContent = generateEmailHtml(order, type);

    const mailOptions = {
      from,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Direct email sent to ${recipientEmail}. Message ID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('❌ Failed to send direct email:', error);
    return { success: false, error: error.message || error };
  }
}
