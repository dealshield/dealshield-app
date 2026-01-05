import React from "react";
import Image from "next/image";

interface SolIconProps {
  className?: string;
  size?: number;
}

export const SolIcon = ({ className = "", size = 20 }: SolIconProps) => {
  return (
    <Image
      src="/Solana_logo.png"
      alt="SOL"
      width={size}
      height={size}
      className={`inline-block align-middle ${className}`}
    />
  );
};
