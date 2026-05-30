import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Crypto Arbitrage Pro - Zero Gas Fees',
  description: 'Advanced crypto arbitrage platform with Flash Loans, Flash Swaps, and Flash Mint. Zero upfront costs.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-screen bg-dark-900 text-white antialiased">
        {children}
      </body>
    </html>
  );
}
