"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/utils/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { 
  Package, 
  PlusCircle, 
  User, 
  LogOut, 
  Camera, 
  LayoutGrid, 
  List, 
  Activity, 
  DollarSign, 
  Star,
  Settings,
  ShieldCheck,
  ShoppingBag,
  X,
  AlertTriangle,
  Ban,
  Bell,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle
} from "lucide-react";
import dynamic from "next/dynamic";
import { CopyAddress } from "@/components/CopyAddress";
import { useUserBalance } from "@/hooks/useUserBalance";
import { SolIcon } from "@/components/SolIcon";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const OrderTimer = ({ order }: { order: any }) => {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);

  useEffect(() => {
    if (!order.accepted_at || !order.listing?.delivery_time_hours) return;

    const calculateTimeLeft = () => {
      const acceptedDate = new Date(order.accepted_at);
      const deadline = new Date(acceptedDate.getTime() + order.listing.delivery_time_hours * 60 * 60 * 1000);
      const now = new Date();
      const diff = deadline.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("00:00:00");
        setIsOverdue(true);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        if (days > 0) {
          setTimeLeft(`${days}d ${hours}h left`);
        } else if (hours > 0) {
          setTimeLeft(`${hours}h ${minutes}m left`);
        } else {
          setTimeLeft(`${minutes}m ${seconds}s left`);
        }
        setIsOverdue(false);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000); // Update every second
    return () => clearInterval(timer);
  }, [order]);

  if (!order.accepted_at || (!timeLeft && !isOverdue)) return null;

  return (
    <div className={`mt-4 p-4 rounded-xl border flex items-center gap-4 ${
      isOverdue ? "bg-red-500/10 border-red-500/20 text-red-400" : "bg-amber-500/10 border-amber-500/20 text-amber-400"
    }`}>
      <div className={`p-2 rounded-lg ${isOverdue ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400"}`}>
        <Clock className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs font-bold uppercase tracking-wide opacity-70 mb-1">
          Time to Deliver: {order.listing?.title}
        </p>
        <p className="font-bold text-lg">
          {isOverdue 
            ? "Deadline Missed" 
            : timeLeft
          }
        </p>
      </div>
    </div>
  );
};

export default function ProfilePage() {
  const { publicKey, connected, disconnect } = useWallet();
  const { balance } = useUserBalance();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"listings" | "orders" | "purchases" | "activity" | "settings" | "notifications" | "reviews">("listings");
  const [isDenyModalOpen, setIsDenyModalOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [purchases, setPurchases] = useState<any[]>([]);
  const [denialReason, setDenialReason] = useState({ title: "", description: "" });
  const [submittingDenial, setSubmittingDenial] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [notifications, setNotifications] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviews, setReviews] = useState<any[]>([]);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [viewingOrder, setViewingOrder] = useState<any>(null);
  const [isOrderDetailsModalOpen, setIsOrderDetailsModalOpen] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!connected || !publicKey) {
        setLoading(false);
        return;
      }

      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_wallet", publicKey.toString())
        .order("created_at", { ascending: false });

      if (listingsError) {
        console.error("Error fetching listings:", listingsError);
      } else {
        // Filter out deleted items client-side to handle nulls
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const validListings = (listingsData || []).filter((item: any) => item.status !== 'deleted');
        setListings(validListings);

        // Fetch orders directly with listing details
        const { data: ordersData, error: ordersError } = await supabase
          .from("orders")
          .select(`
            *,
            listing:listings!inner(*)
          `)
          .eq("listing.seller_wallet", publicKey.toString())
          .neq("listing.status", "deleted")
          .order("created_at", { ascending: false });

        if (ordersError) {
          console.error("Error fetching orders:", ordersError);
        } else if (ordersData) {
          setOrders(ordersData);
        }
      }

      // Fetch purchases (orders where user is buyer)
      const { data: purchasesData, error: purchasesError } = await supabase
        .from("orders")
        .select(`
          *,
          listing:listings(*)
        `)
        .eq("buyer_wallet", publicKey.toString())
        .order("created_at", { ascending: false });

      if (purchasesError) {
        console.error("Error fetching purchases:", purchasesError);
      } else {
        setPurchases(purchasesData || []);
      }

      // Fetch profile
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { data: profileData, error: _profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("wallet_address", publicKey.toString())
        .maybeSingle();

      if (profileData) {
        setAvatarUrl(profileData.avatar_url);
      }

      // Fetch notifications
      const { data: notifData } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_wallet", publicKey.toString())
        .order("created_at", { ascending: false });

      if (notifData) {
        setNotifications(notifData);
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_wallet", publicKey.toString())
        .order("created_at", { ascending: false });

      if (reviewsError) {
        console.error("Error fetching reviews:", reviewsError);
      } else {
        setReviews(reviewsData || []);
        if (reviewsData && reviewsData.length > 0) {
          const total = reviewsData.reduce((acc, review) => acc + review.rating, 0);
          setAverageRating(total / reviewsData.length);
        }
      }

      // Real-time subscription for orders
      const channel = supabase
        .channel(`profile-order-updates-${publicKey.toString()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
          },
          (payload) => {
            // Update orders (sales)
            if (payload.new && 'listing_id' in payload.new) {
                // If it's an update to one of our sales
                setOrders(prev => {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const exists = prev.find((o: any) => o.id === (payload.new as any).id);
                    if (exists) {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        return prev.map((o: any) => o.id === (payload.new as any).id ? { ...o, ...payload.new } : o);
                    }
                    // If it's a new order for one of our listings (complex to check listing ownership here without more data, but safe to ignore if we rely on refresh for new orders or fetch explicit listing IDs)
                    return prev;
                });

                // Update purchases
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                if ((payload.new as any).buyer_wallet === publicKey.toString()) {
                    setPurchases(prev => {
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const exists = prev.find((o: any) => o.id === (payload.new as any).id);
                        if (exists) {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            return prev.map((o: any) => o.id === (payload.new as any).id ? { ...o, ...payload.new } : o);
                        }
                        return [payload.new, ...prev];
                    });
                }
            }
          }
        )
        .subscribe();

      setLoading(false);
      
      return () => {
        supabase.removeChannel(channel);
      };
    };

    fetchProfile();
  }, [connected, publicKey]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !publicKey) return;
    
    setUploading(true);
    const file = e.target.files[0];
    const fileExt = file.name.split(".").pop();
    const fileName = `${publicKey.toString()}-${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    try {
      // 1. Upload image to Storage
      const { error: uploadError } = await supabase.storage
        .from("listing-images") // Reusing existing bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from("listing-images")
        .getPublicUrl(filePath);

      // 3. Update/Insert Profile
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert({ 
          wallet_address: publicKey.toString(), 
          avatar_url: publicUrl 
        }, { onConflict: "wallet_address" });

      if (upsertError) throw upsertError;

      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      alert("Error uploading avatar. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    // Optimistically update UI
    setListings(prev => prev.filter(item => item.id !== listingId));

    try {
      // Attempt soft delete (update status to 'deleted')
      const { data, error } = await supabase
        .from("listings")
        .update({ status: 'deleted' })
        .eq("id", listingId)
        .select();

      if (error) {
        console.error("Supabase soft delete error:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        // If update failed (e.g. RLS), try actual delete as fallback? 
        // Or maybe the item doesn't exist.
        console.warn("No rows updated. Trying hard delete...");
        
        const { error: deleteError } = await supabase
            .from("listings")
            .delete()
            .eq("id", listingId);
            
        if (deleteError) {
             console.error("Hard delete also failed:", deleteError);
             // Revert on error
             const { data: currentData } = await supabase.from("listings").select("*").eq("id", listingId).single();
             if (currentData) setListings(prev => [...prev, currentData]);
             throw deleteError;
        }
      }

      alert("Listing deleted successfully.");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing.");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDenyClick = (order: any) => {
    setSelectedOrder(order);
    setDenialReason({ title: "", description: "" });
    setIsDenyModalOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAgreeToOrder = async (order: any) => {
    if (!confirm(`Are you sure you want to accept this order?`)) return;

    try {
      // 1. Update order status to accepted and set accepted_at timestamp
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          accepted_by_seller: true,
          accepted_at: new Date().toISOString()
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Create notification for buyer
      const actionText = order.listing.delivery_method === 'Pickup' ? 'hand over' : 'deliver';
      const notificationMessage = `Great news! The seller has agreed to ${actionText} your item "${order.listing.title}".`;
      
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_wallet: order.buyer_wallet,
          message: notificationMessage,
          type: 'order_accepted',
          link: `/product/${order.listing_id}`
        });

      if (notifError) throw notifError;

      // 3. Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, accepted_by_seller: true } : o
      ));
      
      alert(`Order accepted! The buyer has been notified.`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error accepting order:", error);
      if (error?.code === '42703' || error?.message?.includes('notifications')) {
        alert("Database schema mismatch. Please run the update_schema_notifications.sql script in Supabase.");
      } else {
        alert("Failed to accept order. See console for details.");
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleDeliveryStart = async (order: any) => {
    const isPickup = order.listing?.delivery_method === 'Pickup';
    const actionText = isPickup ? 'handover' : 'delivery';
    if (!confirm(`Are you sure you want to mark this order as ready for ${actionText}? The buyer will be notified.`)) return;

    try {
      // 1. Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          delivery_started: true
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Create notification for buyer
      const notificationMessage = isPickup
        ? `The seller is ready to hand over "${order.listing.title}". Please meet at the agreed location.`
        : `The seller has started delivery for "${order.listing.title}". It's on its way!`;
      
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_wallet: order.buyer_wallet,
          message: notificationMessage,
          type: 'delivery_started',
          link: `/product/${order.listing_id}`
        });

      if (notifError) throw notifError;

      // 3. Update local state
      setOrders(prev => prev.map(o => 
        o.id === order.id ? { ...o, delivery_started: true } : o
      ));
      
      alert(`Status updated! Buyer notified.`);
    } catch (error: any) {
      console.error("Error updating status:", error);
      alert(`Failed to update status: ${error?.message || "Unknown error"}`);
    }
  };

  const handleConfirmReceipt = async (purchase: any) => {
    if (!confirm("Are you sure you have received the item? This will release funds to the seller.")) return;

    try {
      // 1. Update listing status to sold
      const { data, error } = await supabase
        .from("listings")
        .update({ status: 'sold' })
        .eq("id", purchase.listing_id)
        .select();

      if (error) throw error;
      
      if (!data || data.length === 0) {
         throw new Error("Update failed: No rows affected. Check RLS policies.");
      }

      // 2. Update order status to completed
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: 'completed' })
        .eq("id", purchase.id);

      if (orderError) console.error("Error updating order status:", orderError);

      // 3. Update local state
      setPurchases(prev => prev.map(p => 
        p.id === purchase.id ? { ...p, status: 'completed' } : p
      ));

      alert("Funds released to seller! Transaction complete.");
    } catch (error) {
      console.error("Error confirming receipt:", error);
      alert("Failed to confirm receipt.");
    }
  };

  const handleClaimRefund = async (purchase: any) => {
    if (!confirm("Are you sure you want to cancel this order? This will unfreeze your funds and return them to your wallet.")) return;

    try {
      // 1. Update order status to refunded
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'refunded',
          cancellation_reason_title: 'Delivery Deadline Missed',
          cancellation_reason_description: 'Seller failed to deliver within the guaranteed time frame.'
        })
        .eq('id', purchase.id);

      if (orderError) throw orderError;

      // 2. Reactivate the listing so it can be bought again
      const { error: listingError } = await supabase
        .from("listings")
        .update({ status: 'active' })
        .eq("id", purchase.listing_id);

      if (listingError) {
        console.error("Error reactivating listing:", listingError);
      }

      // 3. Create notification for seller
      if (purchase.listing?.seller_wallet) {
          await supabase.from('notifications').insert({
            user_wallet: purchase.listing.seller_wallet,
            message: `Order for "${purchase.listing.title}" was cancelled and refunded due to missed delivery deadline.`,
            type: 'order_denied',
            link: `/product/${purchase.listing_id}`
          });
      }

      // 4. Update local state
      setPurchases(prev => prev.map(p => 
        p.id === purchase.id ? { ...p, status: 'refunded' } : p
      ));

      alert("Order cancelled. Funds have been unfrozen and returned to your wallet.");
    } catch (error) {
      console.error("Error claiming refund:", error);
      alert("Failed to process refund. Please try again.");
    }
  };

  const submitDenial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setSubmittingDenial(true);

    try {
      // 1. Update order status
      const { error: orderError } = await supabase
        .from('orders')
        .update({
          status: 'cancelled',
          cancellation_reason_title: denialReason.title,
          cancellation_reason_description: denialReason.description
        })
        .eq('id', selectedOrder.id);

      if (orderError) throw orderError;

      // 2. Update listing status back to active
      // Only if the listing is currently pending or sold (though usually pending)
      const { error: listingError } = await supabase
        .from('listings')
        .update({ status: 'active' })
        .eq('id', selectedOrder.listing_id);

      if (listingError) throw listingError;

      // 3. Update local state
      setOrders(prev => prev.map(o => 
        o.id === selectedOrder.id ? { ...o, status: 'cancelled' } : o
      ));
      
      // Update listings list if needed
      setListings(prev => prev.map(l => 
          l.id === selectedOrder.listing_id ? { ...l, status: 'active' } : l
      ));

      setIsDenyModalOpen(false);
      alert("Order denied and listing reactivated.");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("Error denying order:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      
      if (error.code === '42703') { // undefined_column
        alert("System Error: The database is missing required columns. Please run the migration script 'update_schema_orders.sql'.");
      } else if (error.code === '42P01') { // undefined_table
        alert("System Error: The 'orders' table is missing. Please run the migration script.");
      } else {
        alert(`Failed to deny order: ${error.message || "Unknown error"}`);
      }
    } finally {
      setSubmittingDenial(false);
    }
  };

  if (!connected) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 pt-24 bg-[#030014]">
        <div className="glass-card p-12 rounded-3xl border border-white/10 shadow-xl text-center max-w-lg w-full relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#7042f8] to-[#00d4ff]"></div>
          <div className="w-20 h-20 bg-[#00d4ff]/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(0,212,255,0.2)]">
            <User className="w-10 h-10 text-[#00d4ff]" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Connect Wallet</h2>
          <p className="text-gray-400 mb-8 text-lg">Please connect your wallet to access your profile dashboard and manage your listings.</p>
          <div className="flex justify-center">
             <WalletMultiButton className="!bg-gradient-to-r !from-[#7042f8] !to-[#00d4ff] !border !border-white/20 !backdrop-blur-sm !text-white !shadow-lg !shadow-[#7042f8]/20 hover:!shadow-[#00d4ff]/40 !rounded-xl !font-bold !transition-all !h-12 !px-8 !text-base" />
          </div>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isOrderOverdue = (order: any) => {
      if (!order.accepted_at || !order.listing?.delivery_time_hours) return false;
      const acceptedDate = new Date(order.accepted_at);
      const deadline = new Date(acceptedDate.getTime() + order.listing.delivery_time_hours * 60 * 60 * 1000);
      return new Date() > deadline;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/20 flex items-center gap-4 hover:shadow-[#7042f8]/10 transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-lg shadow-black/20`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030014] pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7042f8]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00d4ff]/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* Profile Header Background */}
      <div className="bg-[#0a0f1c]/50 h-auto md:h-80 relative overflow-hidden border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#030014] to-[#0a0f1c]"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d4ff]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#7042f8]/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>
        
        <div className="container mx-auto px-8 md:px-20 pt-28 relative z-10">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 pb-12">
             <div className="relative group">
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-2xl shadow-[#7042f8]/20 overflow-hidden border-4 border-[#0a0f1c] bg-gradient-to-br from-[#00d4ff] to-[#7042f8] text-white">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{publicKey?.toString().slice(0, 2)}</span>
                )}
              </div>
              <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl cursor-pointer backdrop-blur-sm">
                <Camera className="w-8 h-8 text-white drop-shadow-lg" />
                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
              </label>
              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl backdrop-blur-sm">
                  <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="flex-1 mb-2 text-center md:text-left w-full md:w-auto">
              <h1 className="text-4xl font-bold text-white mb-3">My Profile</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  <CopyAddress 
                    address={publicKey?.toString() || ""} 
                    className="text-gray-300 hover:text-white text-sm" 
                    truncate={true} 
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
              <button
                onClick={() => disconnect()}
                className="flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 px-5 py-3 rounded-xl font-medium transition-all backdrop-blur-md"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </button>
               <Link 
            href="/create" 
            className="flex items-center gap-2 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] border border-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-[#7042f8]/20 hover:shadow-[#7042f8]/40"
          >
            <PlusCircle className="w-5 h-5" />
            <span>New Listing</span>
          </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-8 md:px-20 -mt-12 relative z-20">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard 
            icon={Package} 
            label="Total Listings" 
            value={listings.length} 
            color="bg-blue-500" 
          />
          <StatCard 
            icon={DollarSign} 
            label="Wallet Balance" 
            value={
              balance !== null ? (
                <span className="flex items-center gap-1">
                  {balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })} 
                  <SolIcon size={20} />
                </span>
              ) : "Loading..."
            }
            color="bg-teal-500" 
          />
          <StatCard 
            icon={Star} 
            label="Reputation Score" 
            value="100%" 
            color="bg-amber-500" 
          />
        </div>

        {/* Tabs & Content */}
        <div className="glass-card rounded-3xl border border-white/10 shadow-xl overflow-hidden min-h-[500px]">
          <div className="border-b border-white/10">
            <div className="flex items-center gap-4 md:gap-8 px-4 md:px-8 overflow-x-auto">
              <button 
                onClick={() => setActiveTab("listings")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "listings" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden md:inline">My Listings</span>
              </button>
              <button 
                onClick={() => setActiveTab("orders")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "orders" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <ShoppingBag className="w-4 h-4" />
                <span className="hidden md:inline">Orders Received</span>
              </button>
              <button 
                onClick={() => setActiveTab("purchases")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "purchases" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Truck className="w-4 h-4" />
                <span className="hidden md:inline">My Purchases</span>
              </button>
              <button 
                onClick={() => setActiveTab("activity")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "activity" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Activity className="w-4 h-4" />
                <span className="hidden md:inline">Recent Activity</span>
              </button>
              <button 
                onClick={() => setActiveTab("settings")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "settings" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </button>
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "notifications" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden md:inline">Notifications</span>
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === "reviews" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Star className="w-4 h-4" />
                <span className="hidden md:inline">Reviews</span>
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === "listings" && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Your Listings</h2>
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-[#00d4ff] transition-colors">
                      <LayoutGrid className="w-5 h-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-[#00d4ff] transition-colors">
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-20">
                     <div className="w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-gray-400">Loading your listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed backdrop-blur-sm">
                    <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No listings yet</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      You haven&apos;t created any listings yet. Start selling your items securely with DealShield.
                    </p>
                    <Link 
                      href="/create" 
                      className="text-[#00d4ff] font-bold hover:text-[#00d4ff]/80"
                    >
                      Create your first listing &rarr;
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {listings.map((item) => (
                      <ProductCard 
                        key={item.id} 
                        id={item.id}
                        title={item.title}
                        price={item.price}
                        image={item.image_url || "https://via.placeholder.com/400"}
                        seller={item.seller_wallet.slice(0, 4) + "..." + item.seller_wallet.slice(-4)}
                        category={item.category}
                        status={item.status}
                        isOwner={true}
                        onDelete={handleDeleteListing}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "orders" && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Incoming Orders</h2>
                </div>

                {loading ? (
                  <div className="text-center py-20">
                     <div className="w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-gray-400">Loading orders...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed backdrop-blur-sm">
                    <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No orders yet</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      You haven&apos;t received any orders yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="glass-card p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/20 flex flex-col md:flex-row gap-6 hover:shadow-[#7042f8]/10 transition-shadow">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h3 className="font-bold text-white text-lg mb-1">
                                {order.listing?.title || "Unknown Item"}
                              </h3>
                              <p className="text-sm text-gray-400">
                                Order ID: <span className="font-mono text-xs text-[#00d4ff]">{order.id.slice(0, 8)}</span>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              {(order.is_late_delivery || (order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'refunded' && isOrderOverdue(order))) && (
                                <div className="relative group">
                                  <AlertTriangle className="w-5 h-5 text-red-500 cursor-help" />
                                  <div className="absolute bottom-full mb-2 right-0 w-48 bg-[#0a0f1c] border border-white/10 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-10 shadow-lg">
                                    You exceeded the agreed delivery time for this order.
                                  </div>
                                </div>
                              )}
                              {order.status === 'completed' ? (
                                <div className="bg-green-500/20 text-green-400 border border-green-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                                  <ShieldCheck className="w-3 h-3" />
                                  Completed
                                </div>
                              ) : (order.status === 'cancelled' || order.status === 'refunded') ? (
                                <div className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(248,113,113,0.2)]">
                                  <Ban className="w-3 h-3" />
                                  {order.status === 'refunded' ? 'Refunded' : 'Cancelled'}
                                </div>
                              ) : order.accepted_by_seller ? (
                                  <div className="bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                                    <Truck className="w-3 h-3" />
                                    Processing
                                  </div>
                              ) : (
                                <div className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1 shadow-[0_0_10px_rgba(251,191,36,0.2)]">
                                  <Activity className="w-3 h-3" />
                                  Pending
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 border border-white/10 p-4 rounded-xl backdrop-blur-sm">
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Buyer Details</h4>
                              <p className="font-medium text-white">{order.buyer_name}</p>
                              <p className="text-sm text-gray-400">{order.phone_number}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-gray-500">Wallet:</span>
                                <CopyAddress address={order.buyer_wallet} className="text-gray-400 hover:text-[#00d4ff] break-all" truncate={false} />
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Shipping Address</h4>
                              <p className="text-sm text-gray-400 whitespace-pre-line">{order.shipping_address}</p>
                            </div>
                          </div>

                          {(order.status === 'cancelled' || order.status === 'refunded') && (
                            <div className="mt-4 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                              <p className="text-xs font-bold text-red-400 uppercase mb-1 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {order.status === 'refunded' ? 'Refund Reason' : 'Cancellation Reason'}
                              </p>
                              <p className="text-sm font-bold text-red-300">{order.cancellation_reason_title || "Order Cancelled"}</p>
                              {order.cancellation_reason_description && (
                                <p className="text-sm text-red-400/80 mt-1">{order.cancellation_reason_description}</p>
                              )}
                            </div>
                          )}

                          {order.accepted_by_seller && order.status !== 'completed' && order.status !== 'cancelled' && order.status !== 'refunded' && (
                             <OrderTimer order={order} />
                          )}
                        </div>
                        
                        <div className="flex flex-col justify-between items-end border-l border-white/10 pl-6 min-w-[220px]">
                           <div className="text-right">
                             <p className="text-xs text-gray-500 mb-1">Total Amount</p>
                             <div className="text-xl font-bold text-[#00d4ff] flex items-center justify-end gap-1">
                               <span className="text-sm text-gray-400 font-medium mr-1">Price:</span> {order.listing?.price} <SolIcon size={16} />
                             </div>
                           </div>
                           <div className="flex flex-col gap-2 mt-4 w-full">
                             <Link href={`/product/${order.listing_id}`}>
                               <button className="w-full text-[#00d4ff] font-medium text-sm hover:text-[#00d4ff]/80 hover:underline border border-[#00d4ff]/20 rounded-lg py-2 bg-[#00d4ff]/5 transition-colors">
                                 View Listing
                               </button>
                             </Link>
                             {order.status !== 'cancelled' && order.status !== 'sold' && !order.accepted_by_seller && (
                               <>
                                <button 
                                  onClick={() => handleAgreeToOrder(order)}
                                  className="w-full bg-gradient-to-r from-[#00d4ff] to-[#00d4ff]/80 text-[#0a0f1c] font-bold text-sm hover:shadow-[#00d4ff]/40 rounded-lg py-2 transition-all flex items-center justify-center gap-1 shadow-lg shadow-[#00d4ff]/20 border border-white/20"
                                >
                                  {order.listing?.delivery_method === 'Pickup' ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4" />
                                      Agree to Handover
                                    </>
                                  ) : (
                                    <>
                                      <Truck className="w-4 h-4" />
                                      Agree to Deliver
                                    </>
                                  )}
                                </button>
                                 <button 
                                   onClick={() => handleDenyClick(order)}
                                   className="w-full text-red-400 font-medium text-sm hover:text-red-300 hover:bg-red-500/10 border border-red-500/20 rounded-lg py-2 transition-colors flex items-center justify-center gap-1"
                                 >
                                   <Ban className="w-4 h-4" />
                                   Deny Order
                                 </button>
                               </>
                             )}
                             {order.status === 'completed' ? (
                               <div className="w-full text-center py-2 bg-green-500/10 text-green-400 rounded-lg text-xs font-bold border border-green-500/20 flex items-center justify-center gap-2">
                                 <ShieldCheck className="w-4 h-4" />
                                 Transaction Completed
                               </div>
                             ) : order.accepted_by_seller && !order.delivery_started ? (
                               <button 
                                 onClick={() => handleDeliveryStart(order)}
                                 className="w-full bg-[#7042f8] text-white font-medium text-sm hover:bg-[#7042f8]/80 rounded-lg py-2 transition-colors flex items-center justify-center gap-1 shadow-lg shadow-[#7042f8]/20 border border-white/10"
                               >
                                 {order.listing?.delivery_method === 'Pickup' ? (
                                   <>
                                     <CheckCircle2 className="w-4 h-4" />
                                     Mark Ready for Pickup
                                   </>
                                 ) : (
                                   <>
                                     <Truck className="w-4 h-4" />
                                     Mark as Shipped
                                   </>
                                 )}
                               </button>
                             ) : order.delivery_started ? (
                               <div className="w-full text-center py-2 bg-[#00d4ff]/10 text-[#00d4ff] rounded-lg text-sm font-medium border border-[#00d4ff]/20 flex items-center justify-center gap-2">
                                 <Truck className="w-4 h-4" />
                                 {order.listing?.delivery_method === 'Pickup' ? 'Ready for Pickup' : 'Delivery Started'}
                               </div>
                             ) : order.accepted_by_seller && (
                               <div className="w-full text-center py-2 bg-[#00d4ff]/10 text-[#00d4ff] rounded-lg text-sm font-medium border border-[#00d4ff]/20 flex items-center justify-center gap-2">
                                 <CheckCircle2 className="w-4 h-4" />
                                 Order Accepted
                               </div>
                             )}
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Deny Order Modal */}
            {isDenyModalOpen && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200"
                onClick={() => setIsDenyModalOpen(false)}
              >
                <div 
                  className="glass-card rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-white/10" 
                  onClick={e => e.stopPropagation()}
                >
                   <div className="absolute top-0 left-0 right-0 h-1.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
                  
                  <button 
                    onClick={() => setIsDenyModalOpen(false)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>

                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 border border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                      <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">Deny Order</h2>
                      <p className="text-sm text-gray-400">Provide a reason for cancelling this order.</p>
                    </div>
                  </div>
                  
                  <form onSubmit={submitDenial} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Reason Title</label>
                      <input 
                        type="text" 
                        required
                        value={denialReason.title}
                        onChange={(e) => setDenialReason({...denialReason, title: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-500"
                        placeholder="e.g., Item Damaged, Out of Stock"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                      <textarea 
                        required
                        value={denialReason.description}
                        onChange={(e) => setDenialReason({...denialReason, description: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all placeholder-gray-500"
                        placeholder="Please explain why you are denying this order..."
                        rows={4}
                      />
                    </div>

                    <div className="bg-red-500/10 p-4 rounded-xl text-red-400 text-xs mt-4 border border-red-500/20">
                      <p>
                        Cancelling this order will release the item back to the marketplace as &quot;Active&quot;. 
                        The buyer will be notified.
                      </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button 
                        type="button"
                        onClick={() => setIsDenyModalOpen(false)}
                        className="flex-1 py-3 bg-white/5 text-gray-300 rounded-xl font-bold hover:bg-white/10 transition-all border border-white/10"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit" 
                        disabled={submittingDenial}
                        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                      >
                        {submittingDenial ? "Processing..." : "Confirm Denial"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === "purchases" && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {purchases.length === 0 ? (
                  <div className="col-span-full text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed backdrop-blur-sm">
                    <ShoppingBag className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No purchases yet</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      Items you purchase will appear here. Start exploring to find great deals!
                    </p>
                    <Link href="/explore">
                      <button className="mt-6 px-6 py-3 bg-gradient-to-r from-[#00d4ff] to-[#00d4ff]/80 text-[#0a0f1c] rounded-xl font-bold hover:shadow-[#00d4ff]/40 transition-all shadow-lg shadow-[#00d4ff]/20 border border-white/20">
                        Explore Marketplace
                      </button>
                    </Link>
                  </div>
                ) : (
                  purchases.map((purchase) => (
                    <div key={purchase.id} className="glass-card rounded-2xl border border-white/10 hover:shadow-[#7042f8]/10 transition-all group relative z-0 hover:z-10 shadow-lg shadow-black/20">
                      <div className="p-4 border-b border-white/10 bg-white/5 flex justify-between items-center rounded-t-2xl">
                        <span className="text-xs font-medium text-gray-400">
                          {new Date(purchase.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-2">
                          {(purchase.is_late_delivery || (purchase.status !== 'completed' && purchase.status !== 'cancelled' && purchase.status !== 'refunded' && isOrderOverdue(purchase))) && (
                             <div className="relative group">
                               <AlertTriangle className="w-5 h-5 text-red-500 cursor-help" />
                               <div className="absolute bottom-full mb-2 right-0 w-48 bg-[#0a0f1c] border border-white/10 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center z-50 shadow-lg">
                                 Seller exceeded the agreed delivery time.
                               </div>
                             </div>
                          )}
                          <div className={`px-2 py-1 rounded-full text-xs font-bold border ${
                            purchase.status === 'completed' 
                              ? "bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]" 
                              : (purchase.status === 'cancelled' || purchase.status === 'refunded')
                              ? "bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(248,113,113,0.2)]"
                              : purchase.accepted_by_seller
                              ? "bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30 shadow-[0_0_10px_rgba(0,212,255,0.2)]"
                              : "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_10px_rgba(251,191,36,0.2)]"
                          }`}>
                            {purchase.status === 'completed' 
                              ? "Completed" 
                              : (purchase.status === 'cancelled' || purchase.status === 'refunded')
                              ? (purchase.status === 'refunded' ? "Refunded" : "Cancelled")
                              : purchase.accepted_by_seller
                              ? "In Progress"
                              : "Pending Seller"}
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-5">
                        <h3 className="font-bold text-white mb-1 line-clamp-1">{purchase.listing?.title || "Unknown Item"}</h3>
                        <p className="text-[#00d4ff] font-bold mb-4"><span className="text-gray-500 font-medium mr-1">Price:</span>{purchase.listing?.price} SOL</p>
                        
                        <div className="space-y-2 text-sm text-gray-400 mb-4">
                          <div className="flex justify-between">
                            <span>Delivery:</span>
                            <span className="font-medium text-white">{purchase.listing?.delivery_method}</span>
                          </div>
                          {purchase.accepted_by_seller && purchase.listing?.delivery_time_hours && (
                             <div className="flex justify-between">
                               <span>Guarantee:</span>
                               <span className="font-medium text-white">
                                 {purchase.listing.delivery_time_hours < 1 
                                   ? `${Math.round(purchase.listing.delivery_time_hours * 60)} Minute${Math.round(purchase.listing.delivery_time_hours * 60) !== 1 ? 's' : ''}`
                                   : `${purchase.listing.delivery_time_hours} Hour${purchase.listing.delivery_time_hours !== 1 ? 's' : ''}`
                                 }
                               </span>
                             </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2">
                           <button 
                             onClick={() => {
                               setViewingOrder(purchase);
                               setIsOrderDetailsModalOpen(true);
                             }}
                             className="w-full py-2 bg-white/5 text-gray-300 rounded-lg font-medium hover:bg-white/10 hover:text-white transition-all border border-white/10"
                           >
                             View Order Details
                           </button>
                           {purchase.status !== 'completed' && purchase.status !== 'cancelled' && purchase.status !== 'refunded' && purchase.accepted_by_seller && (
                            <>
                              <button 
                                onClick={() => handleConfirmReceipt(purchase)}
                                className="w-full py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                              >
                                <ShieldCheck className="w-4 h-4" />
                                Confirm Receipt
                              </button>

                              {isOrderOverdue(purchase) && (
                                <button 
                                  onClick={() => handleClaimRefund(purchase)}
                                  className="w-full py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/20"
                                >
                                  <AlertCircle className="w-4 h-4" />
                                  Refund / Cancel
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "activity" && (
              <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed backdrop-blur-sm">
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No recent activity</h3>
                <p className="text-gray-400 max-w-sm mx-auto">Your transaction history and recent actions will appear here.</p>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="max-w-2xl">
                <h3 className="text-lg font-bold text-white mb-6">Account Settings</h3>
                <div className="space-y-6">
                  <div className="glass-card p-6 rounded-xl border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Profile Information</h4>
                    <p className="text-sm text-gray-400 mb-4">Update your profile details and public information.</p>
                    <button className="text-[#00d4ff] font-semibold text-sm hover:underline hover:text-[#00d4ff]/80 transition-colors">Edit Profile Details</button>
                  </div>
                  
                  <div className="glass-card p-6 rounded-xl border border-white/10">
                    <h4 className="font-semibold text-white mb-2">Notification Preferences</h4>
                    <p className="text-sm text-gray-400 mb-4">Manage how you receive updates about your listings and sales.</p>
                    <button className="text-[#00d4ff] font-semibold text-sm hover:underline hover:text-[#00d4ff]/80 transition-colors">Manage Notifications</button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "notifications" && (
              <div className="max-w-4xl mx-auto">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#00d4ff]" />
                  Your Notifications
                </h3>
                
                {notifications.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed backdrop-blur-sm">
                    <Bell className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No notifications yet</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      Updates about your orders and listings will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`p-6 rounded-xl border transition-all ${
                          notification.is_read 
                            ? "bg-white/5 border-white/10" 
                            : "bg-[#00d4ff]/10 border-[#00d4ff]/20 shadow-lg shadow-[#00d4ff]/5"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full border ${
                            notification.type === 'order_accepted' 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : notification.type === 'order_denied'
                              ? "bg-red-500/20 text-red-400 border-red-500/30"
                              : "bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30"
                          }`}>
                            {notification.type === 'order_accepted' ? (
                              <Truck className="w-5 h-5" />
                            ) : notification.type === 'order_denied' ? (
                              <Ban className="w-5 h-5" />
                            ) : (
                              <Bell className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-white font-medium mb-1">{notification.message}</p>
                            <p className="text-xs text-gray-400 mb-3">
                              {new Date(notification.created_at).toLocaleDateString()} at {new Date(notification.created_at).toLocaleTimeString()}
                            </p>
                            {notification.link && (
                              <Link 
                                href={notification.link}
                                className="inline-flex items-center gap-1 text-sm font-semibold text-[#00d4ff] hover:text-[#00d4ff]/80 hover:underline transition-colors"
                              >
                                View Details &rarr;
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === "reviews" && (
              <div className="max-w-4xl mx-auto">
                 <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    Reviews Received
                  </h3>
                  {averageRating && (
                    <div className="bg-amber-500/10 px-4 py-2 rounded-full border border-amber-500/20 flex items-center gap-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-amber-500">{averageRating.toFixed(1)}</span>
                      <span className="text-amber-500/60 text-sm">({reviews.length} reviews)</span>
                    </div>
                  )}
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed backdrop-blur-sm">
                    <Star className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No reviews yet</h3>
                    <p className="text-gray-400 max-w-sm mx-auto">
                      Reviews from buyers will appear here after they confirm receipt of their orders.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="glass-card p-6 rounded-2xl border border-white/10 shadow-lg shadow-black/20 hover:border-white/20 transition-all">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-[0_0_10px_rgba(0,212,255,0.3)]">
                              {review.reviewer_wallet.slice(0, 2)}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-white">
                                {review.reviewer_wallet.slice(0, 4)}...{review.reviewer_wallet.slice(-4)}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(review.created_at).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/20"}`} 
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                            {review.comment}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {isOrderDetailsModalOpen && viewingOrder && (
              <div 
                className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                onClick={() => setIsOrderDetailsModalOpen(false)}
              >
                <div 
                  className="glass-card rounded-3xl w-full max-w-lg relative max-h-[80vh] flex flex-col shadow-2xl border border-white/10"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00d4ff] via-blue-500 to-purple-600 shadow-[0_0_10px_rgba(0,212,255,0.5)]"></div>

                  {/* Fixed Header */}
                  <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5 rounded-t-3xl shrink-0">
                    <h3 className="text-2xl font-bold text-white">Order Details</h3>
                    <button 
                      onClick={() => setIsOrderDetailsModalOpen(false)}
                      className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Scrollable Content */}
                  <div className="p-8 overflow-y-auto custom-scrollbar">
                    <div className="space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-16 h-16 bg-white/5 rounded-lg border border-white/10 overflow-hidden relative">
                         {viewingOrder.listing?.image_urls && viewingOrder.listing.image_urls[0] && (
                           // eslint-disable-next-line @next/next/no-img-element
                           <img 
                             src={viewingOrder.listing.image_urls[0]} 
                             alt={viewingOrder.listing.title} 
                             className="w-full h-full object-cover"
                           />
                         )}
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{viewingOrder.listing?.title}</h4>
                        <div className="text-[#00d4ff] font-bold flex items-center gap-1">
                          <span className="text-gray-500 font-medium mr-1">Price:</span>{viewingOrder.listing?.price} <SolIcon size={14} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold border ${
                          viewingOrder.status === 'completed' 
                            ? "bg-green-500/20 text-green-400 border-green-500/30" 
                            : viewingOrder.status === 'cancelled'
                            ? "bg-red-500/20 text-red-400 border-red-500/30"
                            : viewingOrder.accepted_by_seller
                            ? "bg-[#00d4ff]/20 text-[#00d4ff] border-[#00d4ff]/30"
                            : "bg-amber-500/20 text-amber-400 border-amber-500/30"
                        }`}>
                          {viewingOrder.status === 'completed' 
                            ? "Completed" 
                            : viewingOrder.status === 'cancelled'
                            ? "Cancelled"
                            : viewingOrder.accepted_by_seller
                            ? "In Progress"
                            : "Pending Seller"}
                        </span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Order ID</span>
                        <span className="font-mono text-sm text-gray-300">{viewingOrder.id.slice(0, 8)}...</span>
                      </div>

                      <div className="flex justify-between py-2 border-b border-white/10">
                        <span className="text-gray-400">Date Placed</span>
                        <span className="text-white">{new Date(viewingOrder.created_at).toLocaleDateString()}</span>
                      </div>
                      
                      {viewingOrder.accepted_at && (
                         <div className="flex justify-between py-2 border-b border-white/10">
                           <span className="text-gray-400">Accepted At</span>
                           <span className="text-white">{new Date(viewingOrder.accepted_at).toLocaleString()}</span>
                         </div>
                      )}

                      <div className="py-2 border-b border-white/10">
                        <span className="block text-gray-400 mb-1">Delivery Method</span>
                        <span className="text-white font-medium">{viewingOrder.listing?.delivery_method}</span>
                      </div>

                      {viewingOrder.shipping_address && (
                        <div className="py-2 border-b border-white/10">
                          <span className="block text-gray-400 mb-1">Shipping Address</span>
                          <p className="text-gray-300 bg-white/5 p-3 rounded-lg text-sm border border-white/5">
                            {viewingOrder.shipping_address}
                          </p>
                        </div>
                      )}

                      {viewingOrder.contact_info && (
                        <div className="py-2 border-b border-white/10">
                          <span className="block text-gray-400 mb-1">Contact Info</span>
                          <p className="text-white font-medium">{viewingOrder.contact_info}</p>
                        </div>
                      )}

                      <div className="py-2">
                        <span className="block text-gray-400 mb-1">Seller Wallet</span>
                        <div className="flex items-center gap-2">
                           <span className="font-mono text-xs bg-white/10 px-2 py-1 rounded text-gray-300 border border-white/10">
                             {viewingOrder.listing?.seller_wallet}
                           </span>
                           <CopyAddress address={viewingOrder.listing?.seller_wallet || ""} />
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                       <Link href={`/product/${viewingOrder.listing_id}`} className="flex-1">
                         <button className="w-full py-3 bg-white/5 text-gray-300 rounded-xl font-bold hover:bg-white/10 hover:text-white transition-all border border-white/10">
                           View Product Page
                         </button>
                       </Link>
                       {viewingOrder.status !== 'completed' && viewingOrder.status !== 'cancelled' && viewingOrder.accepted_by_seller && (
                         <button 
                           onClick={() => {
                             handleConfirmReceipt(viewingOrder);
                             setIsOrderDetailsModalOpen(false);
                           }}
                           className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                         >
                           <ShieldCheck className="w-5 h-5" />
                           Confirm Receipt
                         </button>
                       )}
                    </div>
                  </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
