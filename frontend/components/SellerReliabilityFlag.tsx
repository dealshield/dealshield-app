"use client";

import { useEffect, useState } from "react";
import { Flag } from "lucide-react";
import { supabase } from "@/utils/supabase/client";

interface SellerReliabilityFlagProps {
  sellerWallet: string;
  size?: number;
  showTooltip?: boolean;
}

export default function SellerReliabilityFlag({ sellerWallet, size = 20, showTooltip = true }: SellerReliabilityFlagProps) {
  const [missedCount, setMissedCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReliability = async () => {
      if (!sellerWallet) return;

      try {
        // Count orders that are cancelled due to missed delivery for this seller
        // AND orders that are completed but were late
        
        const { data: orders, error } = await supabase
           .from("orders")
           .select('status, is_late_delivery, cancellation_reason_title, listing:listings!inner(seller_wallet)')
           .eq('listing.seller_wallet', sellerWallet);

        if (error) {
            console.error("Error fetching reliability:", error);
            console.error("Error details:", JSON.stringify(error, null, 2));
            setMissedCount(0);
        } else {
            let count = 0;
            orders?.forEach((o: any) => {
                // 1. Refunded (Missed Deadline)
                const isRefunded = o.status === 'refunded';
                
                // 2. Cancelled (Denied by Seller or other issues)
                // We assume 'cancelled' status implies an unsuccessful order regardless of reason for now,
                // or we could check cancellation_reason_title if we want to be specific.
                const isCancelled = o.status === 'cancelled' || o.status === 'cancelled_missed';

                // 3. Late Delivery (Completed but late)
                const isLateCompleted = o.status === 'completed' && o.is_late_delivery === true;
                
                if (isRefunded || isCancelled || isLateCompleted) {
                    count++;
                }
            });
            setMissedCount(count);
        }
      } catch (err) {
        console.error("Error in reliability fetch:", err);
        setMissedCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchReliability();
  }, [sellerWallet]);

  if (loading) return <div className="animate-pulse bg-gray-200 rounded-full" style={{ width: size, height: size }} />;
  if (missedCount === null) return null;

  let colorClass = "text-green-500 fill-green-500"; // Default Green (0-2 missed)
  let tooltipText = "Reliable Seller: Good delivery history";

  if (missedCount >= 5) {
    colorClass = "text-red-500 fill-red-500";
    tooltipText = `High Risk: ${missedCount} unsuccessful orders`;
  } else if (missedCount >= 3) {
    colorClass = "text-yellow-500 fill-yellow-500";
    tooltipText = `Caution: ${missedCount} unsuccessful orders`;
  } else if (missedCount > 0) {
      // 1-2 misses, still considered relatively safe/green but maybe lighter?
      // Keeping it green as per instruction "green if he has never missed" (strictly 0)
      // But user didn't define 1-2. I'll make it Green but mention the count in tooltip.
      colorClass = "text-green-500 fill-green-500"; 
      tooltipText = `Reliable: ${missedCount} unsuccessful order(s)`;
  } else {
      // 0 misses
      tooltipText = "Highly Reliable: 0 unsuccessful orders";
  }

  return (
    <div className="group relative inline-flex items-center cursor-help">
      <Flag className={`${colorClass}`} size={size} />
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-lg">
          {tooltipText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      )}
    </div>
  );
}
