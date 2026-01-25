"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Trash2 } from "lucide-react";
import { CopyAddress } from "@/components/CopyAddress";
import { getFirstImage } from "@/utils/imageHelper";
import { supabase } from "@/utils/supabase/client";
import { SolIcon } from "./SolIcon";

interface ProductCardProps {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
  category: string;
  status?: "active" | "sold" | "deleted" | "pending";
  isOwner?: boolean;
  onStatusChange?: (id: string, newStatus: "active" | "sold" | "deleted" | "pending") => void;
  onDelete?: (id: string) => void;
}

export const ProductCard = ({ 
  id, 
  title, 
  price, 
  image, 
  seller, 
  category,
  status = "active",
  isOwner = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onStatusChange,
  onDelete
}: ProductCardProps) => {
  const displayImage = getFirstImage(image);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);

  useEffect(() => {
    const fetchSellerAvatar = async () => {
      if (!seller) return;
      
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("wallet_address", seller)
        .single();
        
      if (data) {
        setSellerAvatar(data.avatar_url);
      }
    };

    fetchSellerAvatar();
  }, [seller]);

  return (
    <div className="group relative bg-[#0a0f1c]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/5 hover:border-[#00d4ff]/50 transition-all duration-500 flex flex-col h-full hover:shadow-[0_0_40px_rgba(0,212,255,0.15)] hover:-translate-y-1">
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#7042f8]/5 to-[#00d4ff]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      <Link href={`/product/${id}`} className="block relative aspect-[4/3] overflow-hidden bg-[#030014]">
        <Image 
          src={displayImage} 
          alt={title} 
          fill 
          className={`object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${status === 'sold' || status === 'pending' ? 'grayscale opacity-75' : ''}`} 
        />
        
        {/* Gradient Overlay for Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0f1c] via-transparent to-transparent opacity-60" />

        {/* Status Badges - Top Left */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
          {status === 'active' && (
            <div className="bg-[#030014]/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-[#00d4ff] flex items-center gap-1 border border-[#00d4ff]/30 shadow-[0_0_15px_rgba(0,212,255,0.3)] uppercase tracking-wider">
              <ShieldCheck className="w-3 h-3" />
              Escrow
            </div>
          )}
        </div>

        {/* Category Badge - Top Right */}
        <div className="absolute top-3 right-3 z-10 max-w-[50%]">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#7042f8]/20 text-white border border-[#7042f8]/50 backdrop-blur-md uppercase tracking-wider shadow-lg block truncate">
                {category}
            </span>
        </div>

        {/* Status Overlays */}
        {status === 'sold' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-20">
            <span className="bg-red-500/20 text-red-500 px-6 py-1.5 rounded-xl font-black text-lg transform -rotate-6 border-2 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.4)] tracking-widest backdrop-blur-md">
              SOLD
            </span>
          </div>
        )}

        {status === 'pending' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-20">
            <span className="bg-amber-500/20 text-amber-500 px-6 py-1.5 rounded-xl font-black text-lg transform -rotate-6 border-2 border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.4)] tracking-widest backdrop-blur-md">
              PENDING
            </span>
          </div>
        )}
      </Link>

      <div className="p-4 flex flex-col flex-grow relative z-10">
        {/* Title */}
        <Link href={`/product/${id}`} className="mb-2 block">
          <h3 className="text-white font-bold text-base leading-snug line-clamp-2 group-hover:text-[#00d4ff] transition-colors duration-300">
            {title}
          </h3>
        </Link>

        {/* Price */}
        <div className="mb-4 flex items-baseline gap-1">
             <span className="text-xs font-medium text-gray-400 mr-1">Price:</span>
             <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8] drop-shadow-[0_0_5px_rgba(0,212,255,0.3)]">
                {price.toFixed(2)}
             </span>
             <span className="text-xs font-medium text-gray-400">
               <SolIcon size={14} />
             </span>
        </div>

        {/* Footer: Seller & Actions */}
        <div className="mt-auto pt-3 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 group/seller">
            <div className="w-6 h-6 rounded-full bg-[#1a1f2e] border border-white/10 flex items-center justify-center text-[10px] text-gray-400 overflow-hidden relative group-hover/seller:border-[#00d4ff]/50 transition-colors shadow-sm">
              {sellerAvatar ? (
                <Image 
                  src={sellerAvatar} 
                  alt="Seller" 
                  fill 
                  className="object-cover rounded-full"
                />
              ) : (
                seller.slice(0, 2)
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-gray-500 font-medium uppercase tracking-wider leading-none mb-0.5">Seller</span>
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-medium text-gray-300 group-hover/seller:text-[#00d4ff] transition-colors">
                  {seller.slice(0, 4)}...{seller.slice(-4)}
                </span>
                <CopyAddress address={seller} showText={false} className="text-gray-500 hover:text-[#00d4ff] w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
        
        {isOwner && status !== 'sold' && (
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={`/edit/${id}`} className="block">
              <button className="w-full py-2 text-sm font-medium text-gray-300 bg-[#7042f8]/10 rounded-xl hover:bg-[#7042f8]/30 hover:text-white transition-colors border border-[#7042f8]/30">
                Edit
              </button>
            </Link>
            {onDelete && (
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(id);
                }}
                className="w-full py-2 text-sm font-medium text-red-400 bg-red-500/10 rounded-xl hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center gap-1 border border-red-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
