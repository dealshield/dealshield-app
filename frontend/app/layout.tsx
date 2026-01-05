import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import SmoothScrolling from "@/components/SmoothScrolling";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DealShield | Decentralized Marketplace",
  description: "Secure, escrow-based marketplace on Solana.",
  openGraph: {
    title: "DealShield | Decentralized Marketplace",
    description: "Secure, escrow-based marketplace on Solana.",
    url: 'https://thedealshield.com',
    siteName: 'DealShield',
    images: [
      {
        url: '/x-card.png',
        width: 1200,
        height: 630,
        alt: 'DealShield Marketplace',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  metadataBase: new URL('https://thedealshield.com'),
  twitter: {
    card: 'summary_large_image',
    title: "DealShield | Decentralized Marketplace",
    description: "Secure, escrow-based marketplace on Solana.",
    images: ['/x-card.png'],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-[#030014] text-white antialiased overflow-y-scroll overflow-x-hidden`}>
        <SmoothScrolling>
          <div className="stars-bg" />
          <WalletContextProvider>
            <Navbar />
            <main className="min-h-screen relative z-10">
              {children}
            </main>
            <Footer />
          </WalletContextProvider>
        </SmoothScrolling>
      </body>
    </html>
  );
}
