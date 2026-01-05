"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Image from "next/image";
import { PlusCircle, Search, User } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserBalance } from "@/hooks/useUserBalance";
import { supabase } from "@/utils/supabase/client";
import { NotificationBell } from "./NotificationBell";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { connected, publicKey } = useWallet();
  const { balance } = useUserBalance();

  const [mounted, setMounted] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      router.push(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      if (!connected || !publicKey) {
        setAvatarUrl(null);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("wallet_address", publicKey.toString())
        .maybeSingle();

      if (data) {
        setAvatarUrl(data.avatar_url);
      } else {
        // If profile doesn't exist, create it automatically
        const { error: insertError } = await supabase
            .from("profiles")
            .insert([{ wallet_address: publicKey.toString() }]);
            
        if (insertError) {
            console.error("Error creating profile:", insertError);
        }
      }
    };

    fetchProfile();
    
    // Subscribe to profile changes for real-time updates
    if (connected && publicKey) {
      const channel = supabase
        .channel(`profile-${publicKey.toString()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `wallet_address=eq.${publicKey.toString()}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.new) {
            setAvatarUrl(payload.new.avatar_url);
          }
        }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [connected, publicKey]);

  if (pathname?.startsWith('/admin')) {
    return null;
  }

  return (
    <nav className="fixed top-0 w-full z-50 glass-nav transition-all duration-300">
      <div className="container mx-auto px-6 md:px-20 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group relative">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#7042f8] to-[#00d4ff] opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500 rounded-full"></div>
          <span className="relative text-2xl font-bold tracking-tight text-white transition-colors">
            Deal<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8]">Shield</span>
          </span>
        </Link>

        {pathname === '/' && (
          <div className="hidden md:flex items-center bg-[#030014]/60 rounded-full px-5 py-2.5 w-96 border border-[#7042f8]/30 focus-within:border-[#00d4ff]/50 focus-within:bg-[#030014]/80 focus-within:shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all duration-300">
            <Search className="w-4 h-4 text-gray-400 group-focus-within:text-[#00d4ff] transition-colors" />
            <input 
              type="text" 
              placeholder="Search ecosystem..." 
              className="bg-transparent border-none outline-none w-full text-sm text-gray-200 placeholder-gray-500 focus:text-white ml-3 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        )}

        <div className="flex items-center gap-5">
          <Link href="/token" className="flex items-center gap-2 text-sm font-bold text-[#00d4ff] hover:text-[#7042f8] transition-colors">
            $DSHIELD
          </Link>
          <NotificationBell />
          {connected && (
            <Link href="/create" className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/20 hover:from-[#7042f8]/40 hover:to-[#00d4ff]/40 text-[#00d4ff] border border-[#7042f8]/50 px-5 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(112,66,248,0.3)] hover:shadow-[0_0_25px_rgba(0,212,255,0.4)] transition-all duration-300 group">
              <PlusCircle className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
              <span>Sell Item</span>
            </Link>
          )}
          
          {mounted && connected && balance !== null && (
            <div className="hidden md:flex items-center gap-2 bg-[#030014]/80 border border-[#7042f8]/30 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm backdrop-blur-sm">
              <span className="text-[#00d4ff] font-bold">◎</span>
              {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
          )}
          
          {mounted && connected ? (
            <Link 
              href="/profile" 
              className="relative flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-[#7042f8]/20 to-[#00d4ff]/20 hover:from-[#7042f8]/40 hover:to-[#00d4ff]/40 transition-all border border-[#7042f8]/50 text-white shadow-[0_0_15px_rgba(112,66,248,0.3)] overflow-hidden"
              title="My Profile"
            >
              {avatarUrl ? (
                <Image 
                  src={avatarUrl} 
                  alt="Profile" 
                  fill 
                  className="object-cover"
                />
              ) : (
                <User className="w-4 h-4" />
              )}
            </Link>
          ) : (
            <WalletMultiButton className="!bg-[#7042f8]/20 !border !border-[#7042f8]/50 !text-white !rounded-full !font-bold !transition-all !h-10 !px-6 !backdrop-blur-sm !shadow-[0_0_15px_rgba(112,66,248,0.3)] hover:!bg-[#7042f8]/40 hover:!shadow-[0_0_25px_rgba(0,212,255,0.4)]" />
          )}
        </div>
      </div>
    </nav>
  );
};
