require('dotenv').config();
const nodemailer = require('nodemailer');

const mockOrder = {
  id: 99999,
  total_amount: 144.98,
  items: [
    {
      product_id: 1,
      name: "Galactic Voyager Spaceship",
      price: 49.99,
      original_price: 49.99,
      quantity: 1
    },
    {
      product_id: 7,
      name: "Star Gazer Telescope",
      price: 89.99,
      original_price: 89.99,
      quantity: 1
    }
  ],
  shipping_details: {
    name: "Alex Explorer",
    phone: "+1 555-0199",
    address: "123 Space Station Way",
    city: "Nebula City",
    zipcode: "90210",
    payment_method: "RAZORPAY",
    payment_id: "pay_mock123456789"
  },
  created_at: new Date().toISOString()
};

async function testEmail() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587');
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"ToTStore" <no-reply@totstore.example.com>`;

  const args = process.argv.slice(2);
  const recipient = args[0] || user;
  const type = args[1] || 'placed'; // 'placed', 'cancelled', 'refunded', 'shipped', 'delivered'

  console.log('--- ToTStore SMTP Test Script ---');
  console.log(`SMTP Host: ${host}`);
  console.log(`SMTP Port: ${port}`);
  console.log(`SMTP User: ${user}`);
  console.log(`SMTP Pass: ${pass ? '****' : 'Not Set'}`);
  console.log(`SMTP From: ${from}`);
  console.log(`Recipient: ${recipient}`);
  console.log(`Email Type: ${type}`);
  console.log('--------------------------------');

  if (!host || !user || !pass) {
    console.error('❌ Error: SMTP variables are not configured in your .env file.');
    console.error('Please configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS first.');
    process.exit(1);
  }

  if (!recipient) {
    console.error('❌ Error: Recipient email is not specified.');
    console.error('Usage: node test-email.js <recipient-email> [email-type]');
    process.exit(1);
  }

  // Format currency
  const formatCurrency = (amount) => `₹${Number(amount).toFixed(2)}`;

  // Generate Items Table HTML
  let itemsHtml = '';
  let subtotal = 0;
  let totalSavings = 0;

  mockOrder.items.forEach((item) => {
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
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #9ca3af;">${quantity}</td>
        <td style="padding: 12px 8px; text-align: right; color: #00f2ff; font-weight: 600;">${formatCurrency(price)}</td>
        <td style="padding: 12px 8px; text-align: right; color: #ffffff; font-weight: 600;">${formatCurrency(itemTotal)}</td>
      </tr>
    `;
  });

  const shippingCost = subtotal - totalSavings >= 999 ? 0 : 69;
  const grandTotal = (subtotal - totalSavings) + shippingCost;

  // Header and styling depending on type
  let statusTitle = 'Order Confirmed';
  let statusSubtitle = 'Thank you for your purchase! We are preparing your toys.';
  let themeColor = '#00f2ff';
  let statusBanner = '🎉 ORDER CONFIRMED';

  if (type === 'cancelled') {
    statusTitle = 'Order Cancelled';
    statusSubtitle = 'Your order has been cancelled as requested.';
    themeColor = '#ff3366';
    statusBanner = '🚫 ORDER CANCELLED';
  } else if (type === 'processing') {
    statusTitle = 'Order Processing';
    statusSubtitle = 'We are packaging your toys and getting them ready for shipment!';
    themeColor = '#f59e0b';
    statusBanner = '⚡ ORDER PROCESSING';
  } else if (type === 'refunded') {
    statusTitle = 'Refund Processed';
    statusSubtitle = 'A refund has been initiated for your order.';
    themeColor = '#10b981';
    statusBanner = '💰 REFUND PROCESSED';
  } else if (type === 'shipped') {
    statusTitle = 'Order Shipped';
    statusSubtitle = 'Great news! Your toys are on their way.';
    themeColor = '#3b82f6';
    statusBanner = '🚚 ORDER SHIPPED';
  } else if (type === 'delivered') {
    statusTitle = 'Order Delivered';
    statusSubtitle = 'Your order has been delivered. Enjoy your toys!';
    themeColor = '#10b981';
    statusBanner = '🎁 ORDER DELIVERED';
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${statusTitle}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; color: #f3f4f6;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0b0f19; min-height: 100vh; padding: 20px 0;">
        <tr>
          <td align="center" valign="top">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #111827; border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 24px; overflow: hidden;">
              <tr>
                <td align="center" style="background: linear-gradient(135deg, #111827 0%, #1f2937 100%); padding: 30px 20px; border-bottom: 1px solid rgba(255, 255, 255, 0.05);">
                  <div style="font-size: 2.5rem; font-weight: 800; letter-spacing: 2px; color: #ffffff;">
                    <span style="background: linear-gradient(45deg, #ff3366, #00f2ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">ToTStore</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 25px 20px 10px 20px;">
                  <div style="display: inline-block; padding: 8px 18px; border-radius: 30px; background-color: rgba(255, 255, 255, 0.03); border: 1px solid ${themeColor}; color: ${themeColor}; font-weight: 700; font-size: 0.85rem; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 15px;">
                    ${statusBanner}
                  </div>
                  <h1 style="margin: 0 0 10px 0; color: #ffffff; font-size: 1.8rem; font-weight: 800;">${statusTitle}</h1>
                  <p style="margin: 0; color: #9ca3af; font-size: 0.95rem; line-height: 1.5;">${statusSubtitle}</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 30px 20px 30px;">
                  <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 16px; padding: 20px; margin-bottom: 25px;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td style="color: #9ca3af; font-size: 0.85rem; text-transform: uppercase;">Order Number</td>
                        <td align="right" style="color: #ffffff; font-weight: 700;">#NT-${mockOrder.id}</td>
                      </tr>
                      <tr>
                        <td style="color: #9ca3af; font-size: 0.85rem; text-transform: uppercase;">Payment Method</td>
                        <td align="right" style="color: #ffffff; font-weight: 600;">${mockOrder.shipping_details.payment_method}</td>
                      </tr>
                    </table>
                  </div>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                      <tr style="border-bottom: 2px solid rgba(255, 255, 255, 0.1);">
                        <th style="padding: 8px; text-align: left; color: #9ca3af; font-size: 0.8rem; text-transform: uppercase;">Toy</th>
                        <th style="padding: 8px; text-align: center; color: #9ca3af; font-size: 0.8rem; text-transform: uppercase;">Qty</th>
                        <th style="padding: 8px; text-align: right; color: #9ca3af; font-size: 0.8rem; text-transform: uppercase;">Price</th>
                        <th style="padding: 8px; text-align: right; color: #9ca3af; font-size: 0.8rem; text-transform: uppercase;">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid rgba(255, 255, 255, 0.1); padding-top: 15px;">
                    <tr>
                      <td style="color: #9ca3af;">Subtotal</td>
                      <td align="right" style="color: #ffffff; font-weight: 600;">${formatCurrency(subtotal)}</td>
                    </tr>
                    <tr>
                      <td style="color: #9ca3af;">Shipping</td>
                      <td align="right" style="color: #ffffff; font-weight: 600;">${shippingCost === 0 ? 'FREE' : formatCurrency(shippingCost)}</td>
                    </tr>
                    <tr style="border-top: 1px dashed rgba(255, 255, 255, 0.1);">
                      <td style="padding: 15px 0 0 0; color: #ffffff; font-size: 1.1rem; font-weight: 800;">Total Payable</td>
                      <td align="right" style="padding: 15px 0 0 0; color: #00f2ff; font-size: 1.25rem; font-weight: 800;">${formatCurrency(grandTotal)}</td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td align="center" style="padding: 10px 30px 40px 30px;">
                  <p style="color: #6b7280; font-size: 0.8rem;">ToTStore Test Email Delivery</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const info = await transporter.sendMail({
      from,
      to: recipient,
      subject: `[TEST] ${statusTitle} #${mockOrder.id}`,
      html: htmlContent
    });

    console.log(`✅ Success! Test email sent successfully.`);
    console.log(`Recipient: ${recipient}`);
    console.log(`Message ID: ${info.messageId}`);
  } catch (error) {
    console.error('❌ SMTP Error:', error.message);
  }
}

testEmail();
