"use client";

import { usePathname } from "next/navigation";
import { useLoading } from "@/context/LoadingContext";

export const Footer = () => {
  const { isLoading } = useLoading();
  const pathname = usePathname();

  // Do not render footer on admin pages or when loading
  if (pathname?.startsWith("/admin") || isLoading) {
    return null;
  }

  return (
    <footer className="bg-[#030014]/80 border-t border-[#7042f8]/20 py-12 mt-20 relative z-10 backdrop-blur-xl">
      <div className="container mx-auto px-6 md:px-20">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-8">
          {/* Logo & Description */}
          <div className="flex flex-col items-center md:items-start gap-4 max-w-sm text-center md:text-left">
            <div className="flex items-center gap-2">
              <img src="/logo_footer.png" alt="DealShield Logo" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold tracking-tight text-white">
                Deal<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8]">Shield</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              The decentralized marketplace for secure, escrow-based peer-to-peer commerce on Solana.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            <a href="/token" className="text-gray-400 hover:text-[#00d4ff] transition-colors text-sm font-medium">$DSHIELD Token</a>
            <a href="/terms" className="text-gray-400 hover:text-[#00d4ff] transition-colors text-sm font-medium">Terms & Conditions</a>
            <a href="/privacy" className="text-gray-400 hover:text-[#00d4ff] transition-colors text-sm font-medium">Privacy Policy</a>
            <a 
              href="https://x.com/dealshieldsol" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] transition-colors text-sm font-medium group"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current group-hover:scale-110 transition-transform">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Follow us
            </a>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <p>© 2025 DealShield. Open Source (MIT).</p>
          <p>Built on Solana</p>
        </div>
      </div>
    </footer>
  );
};
