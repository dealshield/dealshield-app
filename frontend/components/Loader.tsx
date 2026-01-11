import React from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';

export const Loader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030014] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#7042f8]/10 via-[#030014] to-[#030014]" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center opacity-20" />
      
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Central Icon Container */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
            {/* Pulsing Glow */}
            <div className="absolute inset-0 bg-[#7042f8]/20 rounded-full blur-3xl animate-pulse-slow"></div>
            
            {/* Rotating Rings */}
            <div className="absolute inset-0 border border-[#7042f8]/30 rounded-full animate-[spin_10s_linear_infinite]"></div>
            <div className="absolute inset-4 border border-[#00d4ff]/30 rounded-full animate-[spin_8s_linear_infinite_reverse]"></div>
            
            {/* Hexagon/Shield Shape Overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
               <div className="w-20 h-20 bg-[#0a0f1c] rounded-2xl border border-[#7042f8]/50 flex items-center justify-center shadow-[0_0_30px_rgba(112,66,248,0.3)] backdrop-blur-xl rotate-45 animate-pulse">
                  <div className="w-full h-full border border-[#00d4ff]/30 rounded-2xl absolute inset-0 -rotate-6 scale-90"></div>
               </div>
            </div>

            {/* Logo */}
            <div className="absolute inset-0 flex items-center justify-center z-20">
                <Image 
                  src="/logo.png" 
                  alt="DealShield" 
                  width={48} 
                  height={48}
                  className="drop-shadow-[0_0_15px_rgba(0,212,255,0.5)]"
                />
            </div>

            {/* Orbiting Dot */}
            <div className="absolute inset-0 animate-[spin_3s_linear_infinite]">
                <div className="h-2 w-2 bg-[#00d4ff] rounded-full absolute top-0 left-1/2 -translate-x-1/2 shadow-[0_0_10px_#00d4ff]"></div>
            </div>
        </div>
        
        {/* Text Content */}
        <div className="text-center space-y-3">
            <h2 className="text-2xl font-bold tracking-tight text-white">
              <span className="inline-block animate-slide-up">Deal</span>
              <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8] animate-slide-up" style={{animationDelay: '0.1s'}}>Shield</span>
            </h2>
            
            <div className="flex items-center gap-2 text-[#00d4ff] text-[10px] font-mono uppercase tracking-[0.2em] bg-[#00d4ff]/5 px-3 py-1.5 rounded-full border border-[#00d4ff]/20">
              <ShieldCheck className="w-3 h-3 animate-pulse" />
              <span className="animate-pulse">Securing Environment...</span>
            </div>
        </div>

        {/* Loading Bar */}
        <div className="mt-6 w-48 h-1 bg-[#1a1f2e] rounded-full overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#7042f8] via-[#00d4ff] to-[#7042f8] animate-[shimmer_2s_linear_infinite] w-[200%]"></div>
        </div>
      </div>
    </div>
  );
};
