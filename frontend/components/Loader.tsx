import React from 'react';
import Image from 'next/image';

export const Loader = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#030014] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-gradient-to-b from-[#7042f8]/20 to-transparent pointer-events-none" />
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      
      <div className="relative z-10 flex flex-col items-center">
        <div className="relative w-32 h-32 mb-8">
            <div className="absolute inset-0 rounded-full border-t-4 border-[#00d4ff] animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-4 border-[#7042f8] animate-spin-slow"></div>
            <div className="absolute inset-4 rounded-full border-b-4 border-white animate-spin-reverse"></div>
            
            <div className="absolute inset-0 flex items-center justify-center">
                <Image 
                  src="/logo.png" 
                  alt="DealShield" 
                  width={60} 
                  height={60}
                  className="animate-pulse"
                />
            </div>
        </div>
        
        <h2 className="text-2xl font-bold text-white tracking-wider animate-pulse">
          Deal<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8]">Shield</span>
        </h2>
        <p className="text-gray-400 text-sm mt-2 tracking-widest uppercase">Loading.....</p>
      </div>
    </div>
  );
};
