import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, Coins, Flame, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "$DSHIELD Token | DealShield",
  description: "Utility and governance token powering the DealShield ecosystem.",
  openGraph: {
    title: "$DSHIELD Token | DealShield",
    description: "Utility and governance token powering the DealShield ecosystem.",
    images: [
      {
        url: "/x-card-dshield.png",
        width: 1200,
        height: 630,
        alt: "$DSHIELD Token",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "$DSHIELD Token | DealShield",
    description: "Utility and governance token powering the DealShield ecosystem.",
    images: ["/x-card-dshield.png"],
  },
};

export default function TokenPage() {
  return (
    <div className="min-h-screen pt-24 pb-12 bg-[#030014] relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#7042f8]/10 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#00d4ff]/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#7042f8]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-4 md:px-8 max-w-6xl relative z-10">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors group px-4 py-2 rounded-lg hover:bg-white/5 w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Hero Section */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-12 mb-20">
          <div className="flex-1 space-y-6 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#7042f8]/10 border border-[#7042f8]/30 text-[#00d4ff] text-sm font-medium animate-fade-in-up">
              <ShieldCheck className="w-4 h-4" />
              Native Utility Token
            </div>
            
            <h1 className="text-3xl md:text-7xl font-bold text-white leading-[1.1] tracking-tight">
              Powering Trust in <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#7042f8] to-[#00d4ff] animate-gradient-x">
                Decentralized Commerce
              </span>
            </h1>
            
            <p className="text-base md:text-xl text-gray-300 font-light max-w-2xl leading-relaxed mx-auto md:mx-0">
              The utility and governance token powering the DealShield ecosystem—rewarding trust and securing the future of decentralized commerce.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
               <div className="flex items-center gap-2 px-6 py-3 bg-[#0a0f1c] border border-white/10 rounded-xl">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-gray-400 text-sm">Will be live on Solana</span>
               </div>
               <div className="flex items-center gap-2 px-6 py-3 bg-[#0a0f1c] border border-white/10 rounded-xl">
                 <ShieldCheck className="w-4 h-4 text-[#7042f8]" />
                 <span className="text-gray-400 text-sm">Audited & Secure</span>
               </div>
            </div>
          </div>

          <div className="relative flex-shrink-0 w-64 h-64 md:w-96 md:h-96">
             {/* Token Graphic */}
             <div className="relative w-full h-full flex items-center justify-center group">
               <Image 
                 src="/token_coin.png" 
                 alt="$DSHIELD Token" 
                 fill
                 className="object-contain scale-125 transition-transform duration-700 group-hover:scale-110 drop-shadow-[0_0_50px_rgba(112,66,248,0.6)]"
                 priority
                 unoptimized
               />
             </div>

          </div>
        </div>

        {/* Main Grid Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
          {/* Why $DSHIELD? - Spans 2 cols */}
          <div className="lg:col-span-2 glass-card p-8 md:p-10 rounded-3xl border border-white/10 bg-gradient-to-br from-[#7042f8]/5 to-transparent relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#7042f8]/10 rounded-full blur-3xl -z-10 group-hover:bg-[#7042f8]/20 transition-colors" />
            
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
              Why $DSHIELD?
            </h2>
            <div className="space-y-6 text-lg text-gray-300 leading-relaxed">
              <p>
                In a world of risky P2P trades, DealShield protects users with on-chain escrow. <span className="text-white font-semibold">$DSHIELD rewards those who build trust</span>—turning safe deals into sustainable value.
              </p>
              <p>
                As the platform grows (more listings, higher volume), demand for $DSHIELD increases through utilities and burns. Join the shielded economy.
              </p>
            </div>
          </div>

          {/* Token Overview Stats */}
          <div className="glass-card p-8 rounded-3xl border border-white/10 flex flex-col justify-center bg-[#0a0f1c]/50">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#00d4ff]" />
              Token Overview
            </h3>
            <div className="space-y-5">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-gray-400 text-sm">Ticker</span>
                <span className="font-bold text-[#00d4ff] text-lg">$DSHIELD</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-gray-400 text-sm">Network</span>
                <span className="font-bold text-white">Solana</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-gray-400 text-sm">Total Supply</span>
                <span className="font-bold text-white">100M</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-gray-400 text-sm">Decimals</span>
                <span className="font-bold text-white">9</span>
              </div>
              <div className="pt-2">
                 <div className="text-xs text-gray-500 font-mono mb-1">Contract Address</div>
                 <div className="text-xs text-gray-600 font-mono bg-white/5 p-2 rounded border border-white/5">
                   [Coming Soon]
                 </div>
              </div>
            </div>
          </div>
        </div>



        {/* Tokenomics Section */}
        <div className="glass-card rounded-3xl border border-white/10 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7042f8] via-[#00d4ff] to-[#7042f8]"></div>
           <div className="p-8 md:p-16">
             <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">Tokenomics Breakdown</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24 items-center">
               <div className="space-y-8">
                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 group-hover:border-red-500/50 transition-colors">
                      <Flame className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Deflationary Mechanics</h3>
                      <p className="text-gray-400 leading-relaxed">
                        20% of all platform fees are used to buy back and burn $DSHIELD, permanently reducing supply over time.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-6 group">
                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#00d4ff]/10 flex items-center justify-center border border-[#00d4ff]/20 group-hover:border-[#00d4ff]/50 transition-colors">
                      <Users className="w-7 h-7 text-[#00d4ff]" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-2">Fair Launch</h3>
                      <p className="text-gray-400 leading-relaxed">
                        No presale, no VC allocations. Initial liquidity provided at launch with anti-bot measures to ensure fair distribution.
                      </p>
                    </div>
                  </div>
               </div>

               <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] blur-2xl opacity-20 rounded-3xl"></div>
                  <div className="bg-[#0a0f1c] p-8 md:p-10 rounded-3xl border border-white/10 text-center relative z-10">
                    <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-gray-400 mb-6">
                      ROADMAP Q1 2025
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Launch Details & Airdrops</h3>
                      <p className="text-gray-400 mb-8 leading-relaxed">
                      Token launch details, airdrops for early users, and staking pools are on the way. Don’t miss the snapshot.
                      </p>
                    <a 
                      href="https://x.com/dealshieldsol" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] text-white rounded-xl hover:opacity-90 transition-opacity font-bold shadow-lg shadow-[#7042f8]/25"
                    >
                      Follow on X for Updates
                    </a>
                 </div>
               </div>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
