"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyAddressProps {
  address: string;
  className?: string;
  truncate?: boolean;
  showText?: boolean;
}

export const CopyAddress = ({ address, className = "", truncate = true, showText = true }: CopyAddressProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigating if inside a Link
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayAddress = truncate 
    ? `${address.slice(0, 4)}...${address.slice(-4)}`
    : address;

  return (
    <button 
      onClick={handleCopy}
      className={`flex items-center gap-2 text-gray-500 hover:text-teal-600 transition-colors group ${className}`}
      title="Copy Address"
    >
      {showText && <span className="font-mono">{displayAddress}</span>}
      {copied ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100 transition-opacity" />
      )}
    </button>
  );
};