"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { Shield, Lock, Zap } from "lucide-react";
import { SolIcon } from "@/components/SolIcon";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/utils/supabase/client";
import { getPreferredCategory } from "@/utils/userPreferences";
import { checkMissedDeliveries } from "@/utils/checkMissedDeliveries";
import Starfield from "@/components/Starfield";
import { Loader } from "@/components/Loader";
import { useLoading } from "@/context/LoadingContext";
import { useLayoutEffect } from "react";

export default function Home() {
  const { isLoading, setIsLoading } = useLoading();
  const [listings, setListings] = useState<any[]>([]);
  const [otherListings, setOtherListings] = useState<any[]>([]);
  const [personalizationLabel, setPersonalizationLabel] = useState<string>("Featured Listings");

  useLayoutEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [setIsLoading]);

  useEffect(() => {
    const fetchListings = async () => {
      // Check for missed deliveries first to ensure data consistency
      await checkMissedDeliveries();

      const preferredCategory = getPreferredCategory();
      let query = supabase
        .from("listings")
        .select("*")
        .neq("status", "deleted")
        .neq("status", "sold")
        .neq("status", "shadowed")
        .order("created_at", { ascending: false });

      if (preferredCategory) {
        // Fetch items from preferred category first
        // Note: For a real app, you might want a mix, but here we prioritize the category
        query = query.eq("category", preferredCategory);
        setPersonalizationLabel("Recommended for you");
      } else {
        // Limit for home page if just random/latest
        query = query.limit(8);
      }

      const { data, error } = await query;
      let currentListings: any[] = [];

      if (error) {
        console.error("Error fetching listings:", error);
      } else {
        // Filter out deleted and sold items (handling null status as visible)
        // Redundant with .neq in query but safe
        const visibleListings = (data || []).filter(item => item.status !== 'deleted' && item.status !== 'sold');
        
        // If preferred category yields few results, fallback to latest?
        // For now, let's keep it simple. If 0 results, maybe fetch latest.
        if (visibleListings.length === 0 && preferredCategory) {
             const { data: fallbackData } = await supabase
              .from("listings")
              .select("*")
              .neq("status", "deleted")
              .neq("status", "sold")
              .order("created_at", { ascending: false })
              .limit(8);
             currentListings = fallbackData || [];
             setListings(currentListings);
             setPersonalizationLabel("Featured Listings");
        } else {
             currentListings = visibleListings;
             setListings(currentListings);
        }

        // Fetch "Others" (Listings not in the main list)
        if (currentListings.length > 0) {
          const excludedIds = currentListings.map(item => item.id);
          const { data: othersData } = await supabase
            .from("listings")
            .select("*")
            .neq("status", "deleted")
            .neq("status", "sold")
            .neq("status", "shadowed")
            .not('id', 'in', `(${excludedIds.join(',')})`)
            .order("created_at", { ascending: false })
            .limit(12);
            
          setOtherListings(othersData || []);
        } else {
           // If main list is empty (very rare), just fetch latest as others
           const { data: othersData } = await supabase
            .from("listings")
            .select("*")
            .neq("status", "deleted")
            .neq("status", "sold")
            .neq("status", "shadowed")
            .order("created_at", { ascending: false })
            .limit(12);
           setOtherListings(othersData || []);
        }
      }
    };

    fetchListings();
  }, []);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="flex flex-col gap-20 pb-20">
      
      {/* Hero Section */}
      <section className="relative flex flex-col h-[850px] w-full items-center justify-center overflow-hidden pt-20">
        <div className="absolute inset-0 z-0">
          <Starfield />
        </div>
        <div className="absolute top-0 left-0 w-full h-full z-[1] object-cover opacity-60">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="w-full h-full object-cover"
            >
              <source src="/blackhole.webm" type="video/webm" /> 
            </video>
        </div>
        
        {/* Fallback/Overlay Gradients */}
        <div className="absolute top-[-35%] left-[-10%] w-[600px] h-[600px] bg-[#7042f8]/40 rounded-full blur-[120px] opacity-40 mix-blend-screen z-0 animate-pulse-slow"></div>
        <div className="absolute bottom-[20%] right-[-20%] w-[500px] h-[500px] bg-[#00d4ff]/30 rounded-full blur-[120px] opacity-40 mix-blend-screen z-0 animate-pulse-slow delay-1000"></div>

        <div className="relative z-20 container mx-auto px-6 flex flex-col items-center justify-center text-center">
          <div className="py-[8px] px-[15px] border border-[#7042f8]/50 rounded-[15px] bg-[#030014]/50 backdrop-blur-md mb-6 animate-slide-down max-w-[90vw]" style={{animationFillMode: 'forwards', animationDelay: '0.2s'}}>
            <span className="text-[#00d4ff] text-[11px] md:text-[13px] font-medium tracking-wide uppercase flex items-center justify-center gap-2 text-center">
              <Zap className="w-3 h-3 md:w-4 md:h-4 text-[#7042f8] flex-shrink-0" /> 
              Decentralized Escrow Marketplace
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight max-w-4xl animate-slide-up" style={{animationFillMode: 'forwards', animationDelay: '0.5s'}}>
            Buy & Sell with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8] animate-pulse-slow">
              Absolute Confidence
            </span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-up" style={{animationFillMode: 'forwards', animationDelay: '0.8s'}}>
            The decentralized marketplace where your funds are safe. 
            Smart contract escrow ensures you get what you pay for, every single time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full sm:w-auto animate-slide-up" style={{animationFillMode: 'forwards', animationDelay: '1.1s'}}>
            <Link href="/explore" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#2a0e61] to-[#7042f8] text-white rounded-xl font-bold hover:shadow-[0_0_30px_rgba(112,66,248,0.5)] transition-all border border-[#7042f8]/50 backdrop-blur-sm group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center gap-2">
                  Explore Listings
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] opacity-0 group-hover:opacity-20 transition-opacity"></div>
              </button>
            </Link>
            <Link href="/how-it-works" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-8 py-4 bg-transparent text-white border border-[#7042f8]/30 rounded-xl font-medium hover:bg-[#7042f8]/10 hover:border-[#00d4ff]/50 transition-all shadow-[0_0_15px_rgba(0,0,0,0.2)]">
                How it Works
              </button>
            </Link>
            
            {/* Mobile-only $DSHIELD Token Link */}
            <Link href="/token" className="w-full sm:hidden text-center mt-2">
              <span className="text-[#00d4ff] font-bold text-sm hover:text-[#7042f8] transition-colors underline underline-offset-4">
                View $DSHIELD Token →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-6 md:px-20 relative z-20 -mt-20">
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Lock,
              title: "On-Chain Escrow",
              desc: "Funds are locked in a smart contract and only released when you confirm delivery. No middleman risk.",
              color: "text-[#00d4ff]",
              bg: "bg-[#00d4ff]/10"
            },
            {
              icon: Shield,
              title: "Dispute Protection",
              desc: "If something goes wrong, our decentralized resolution system helps ensure fair outcomes.",
              color: "text-[#7042f8]",
              bg: "bg-[#7042f8]/10"
            },
            {
              icon: Zap,
              title: "Instant Payments",
              desc: <span>Pay with <SolIcon size={12} className="inline mx-0.5" />. Transactions settle in seconds on the Solana blockchain.</span>,
              color: "text-[#ab42f8]",
              bg: "bg-[#ab42f8]/10"
            }
          ].map((feature, idx) => (
            <div key={idx} className="glass-card p-8 rounded-3xl hover:-translate-y-2 transition-transform duration-300 group">
              <div className={`w-14 h-14 ${feature.bg} rounded-2xl flex items-center justify-center ${feature.color} mb-6 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(0,0,0,0.2)]`}>
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3 group-hover:text-[#00d4ff] transition-colors">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed text-sm">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Listings */}
      <section className="container mx-auto px-6 md:px-20 py-10">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
            {personalizationLabel}
          </h2>
          <Link href="/explore" className="text-[#00d4ff] font-medium hover:text-[#7042f8] transition-colors flex items-center gap-1">
            View All <span className="text-lg">→</span>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.length === 0 ? (
            <div className="col-span-full flex flex-col items-center justify-center text-gray-500 py-20 glass-card rounded-3xl">
              <p className="text-lg mb-4">No listings found yet.</p>
              <Link href="/create">
                <button className="px-6 py-2 bg-[#7042f8]/20 text-[#00d4ff] rounded-lg border border-[#7042f8]/50 hover:bg-[#7042f8]/30 transition-all">
                  Be the first to list!
                </button>
              </Link>
            </div>
          ) : (
            listings.map((item) => (
              <ProductCard 
                key={item.id} 
                id={item.id}
                title={item.title}
                price={item.price}
                image={item.image_url || "https://via.placeholder.com/400"}
                seller={item.seller_wallet}
                category={item.category}
                status={item.status}
              />
            ))
          )}
        </div>
      </section>

      {/* Others Section */}
      {otherListings.length > 0 && (
        <section className="container mx-auto px-6 md:px-20 py-10 pt-0">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
              Others
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {otherListings.map((item) => (
              <ProductCard 
                key={item.id} 
                id={item.id}
                title={item.title}
                price={item.price}
                image={item.image_url || "https://via.placeholder.com/400"}
                seller={item.seller_wallet}
                category={item.category}
                status={item.status}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
