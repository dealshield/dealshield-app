"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyableAddressProps { 
  address: string;
}

export function CopyableAddress({ address }: CopyableAddressProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const displayAddress = address.length > 24 
    ? `${address.slice(0, 10)}...${address.slice(-10)}`
    : address;

  return (
    <div className="pt-2">
      <div className="text-xs text-gray-500 font-mono mb-1">Contract Address</div>
      <div 
        className="group relative text-xs text-gray-400 font-mono bg-white/5 p-2 pr-8 rounded border border-white/5 cursor-pointer hover:bg-white/10 hover:text-white transition-all"
        onClick={handleCopy}
        title={address}
      >
        {displayAddress}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 group-hover:text-white transition-colors">
          {copied ? (
            <Check className="w-3.5 h-3.5 text-green-400" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </div>
      </div>
      {copied && (
        <div className="text-[10px] text-green-400 mt-1 font-medium animate-in fade-in slide-in-from-top-1">
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
