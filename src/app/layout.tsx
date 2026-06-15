import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://totstore.trippytot.online"),
  title: "ToTstore | Handmade Crafts & Custom Gifts",
  description: "Discover custom gifts and unique handcrafted creations at Totstore.",
};

import ChatBot from "@/components/ChatBot";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-script" strategy="beforeInteractive" dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'dark';
                document.documentElement.setAttribute('data-theme', theme);
              } catch (e) {}
            })();
          `
        }} />
      </head>
      <body className={inter.className}>
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", width: "100%" }}>
          <div style={{ flex: 1 }}>
            {children}
          </div>
          <Footer />
        </div>
        <ChatBot />
      </body>
    </html>
  );
}
