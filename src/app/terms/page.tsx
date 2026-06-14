import React from 'react';
import { getTermsAndConditions } from '@/lib/db';
import Link from 'next/link';
import type { Metadata } from 'next';

export const revalidate = 0; // Dynamic rendering, always fetch fresh terms on request

export const metadata: Metadata = {
  title: "Terms & Conditions | ToTStore",
  description: "Read the official terms and conditions for using the ToTStore online store.",
};

export default async function TermsPage() {
  const data = await getTermsAndConditions();
  const termsContent = data?.content || `# Terms and Conditions
Last Updated: June 12, 2026

Welcome to ToTStore!

These Terms and Conditions ("Terms") govern your use of the ToTStore website and store. By accessing or using our services, you agree to be bound by these Terms.

## 1. User Accounts
When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.

## 2. Purchases and Payments
All purchases made through our store are subject to product availability. We reserve the right to limit the quantities of any products or services that we offer. Prices for our products are subject to change without notice. We accept payments through secure checkout providers.

## 3. Shipping and Delivery
Delivery times may vary depending on the destination. We are not responsible for delays caused by the shipping carrier or customs clearance processes.

## 4. Returns and Refunds
Please review our Refund Policy prior to making any purchases. Products can be returned within 30 days of purchase in their original condition and packaging.

## 5. Intellectual Property
All content included on this site, such as text, graphics, logos, images, digital downloads, and software, is the property of ToTStore or its content suppliers and is protected by international copyright laws.

## 6. Limitation of Liability
To the maximum extent permitted by law, ToTStore shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues.

## 7. Governing Law
These Terms shall be governed and construed in accordance with the laws of the country of operation, without regard to its conflict of law provisions.

## 8. Changes to Terms
We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will notify you of any changes by posting the new Terms on this page.

## 9. Contact Us
If you have any questions about these Terms, please contact us at support@totstore.com.`;

  const updatedAt = data?.updated_at ? new Date(data.updated_at) : new Date('2026-06-12');

  // Simple Markdown parser to convert seeded Markdown text to neat semantic HTML elements
  const parseMarkdown = (text: string) => {
    return text.split('\n').map((line, i) => {
      const trimmed = line.trim();
      if (trimmed.startsWith('# ')) {
        return <h1 key={i} className="terms-h1">{trimmed.substring(2)}</h1>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="terms-h2">{trimmed.substring(3)}</h2>;
      }
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="terms-h3">{trimmed.substring(4)}</h3>;
      }
      if (trimmed.startsWith('- ')) {
        return <li key={i} className="terms-li">{trimmed.substring(2)}</li>;
      }
      if (trimmed === '') {
        return <div key={i} className="terms-spacer" />;
      }
      return <p key={i} className="terms-p">{trimmed}</p>;
    });
  };

  return (
    <div className="terms-container">
      <nav className="navbar">
        <Link href="/" className="nav-brand">ToTStore</Link>
        <div className="nav-actions">
           <Link href="/profile" className="nav-link">Profile</Link>
           <Link href="/" className="nav-link">Shop</Link>
        </div>
      </nav>

      <main className="terms-content">
        <div className="terms-card">
          <header className="terms-header">
            <div className="terms-icon-wrapper">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <div className="terms-title-area">
              <h1>Terms & Conditions</h1>
              <p className="last-updated">Last Updated: {updatedAt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
          </header>

          <div className="terms-body">
            {parseMarkdown(termsContent)}
          </div>
        </div>
      </main>
    </div>
  );
}
