import type { Metadata } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Crypto Arbitrage Pro — Flash Loan Arbitrage Platform',
  description: 'Advanced crypto arbitrage platform with Flash Loans, Flash Swaps, and Flash Mint across 59 DEXes on 6 chains. Zero gas fees via Biconomy Paymaster.',
  keywords: 'crypto, arbitrage, flash loan, defi, uniswap, sushiswap, aave, ethereum, arbitrum',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className={`${inter.variable} ${jetbrains.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0f" />
      </head>
      <body className="bg-dark-900 text-white font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
