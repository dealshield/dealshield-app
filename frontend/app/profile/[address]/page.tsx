"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/utils/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { 
  Package, 
  LayoutGrid, 
  Activity, 
  DollarSign, 
  Star
} from "lucide-react";
import { CopyAddress } from "@/components/CopyAddress";
import SellerReliabilityFlag from "@/components/SellerReliabilityFlag";
import { SolIcon } from "@/components/SolIcon";

export default function PublicProfilePage() {
  const params = useParams();
  const address = params?.address as string;
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [listings, setListings] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviews, setReviews] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"listings" | "activity" | "reviews">("listings");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!address) return;

      setLoading(true);

      // Fetch listings
      const { data: listingsData, error: listingsError } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_wallet", address)
        .order("created_at", { ascending: false });

      if (listingsError) {
        console.error("Error fetching listings:", listingsError);
      } else {
        setListings(listingsData || []);
      }

      // Fetch profile
      const { data: profileData, error: _profileError } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("wallet_address", address)
        .maybeSingle();

      if (profileData) {
        setAvatarUrl(profileData.avatar_url);
      }

      // Fetch reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_wallet", address)
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

      setLoading(false);
    };

    fetchProfile();
  }, [address]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="glass-card p-6 rounded-2xl border border-white/10 shadow-lg flex items-center gap-4 hover:shadow-[0_0_20px_rgba(0,212,255,0.1)] transition-all duration-300 group">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} shadow-[0_0_15px_rgba(0,0,0,0.3)] group-hover:scale-110 transition-transform`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-400 font-medium">{label}</p>
        <p className="text-2xl font-bold text-white group-hover:text-[#00d4ff] transition-colors">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#030014] text-white pb-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#7042f8]/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#00d4ff]/20 rounded-full blur-[100px] animate-pulse delay-1000"></div>
      </div>

      {/* Profile Header Background */}
      <div className="bg-[#0a0f1c]/50 h-80 relative overflow-hidden z-10 border-b border-white/5">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1c] via-[#030014] to-[#0a0f1c]"></div>
        
        <div className="container mx-auto px-8 md:px-20 pt-28 relative z-10">
          <div className="flex flex-col md:flex-row items-end gap-8 pb-12">
             <div className="relative group">
              <div className="w-32 h-32 rounded-2xl flex items-center justify-center text-4xl font-bold shadow-[0_0_30px_rgba(112,66,248,0.3)] overflow-hidden border-4 border-[#030014] bg-gradient-to-br from-[#7042f8] to-[#00d4ff] text-white relative z-20">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{address?.slice(0, 2)}</span>
                )}
              </div>
            </div>

            <div className="flex-1 mb-2">
              <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">Seller Profile</h1>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md px-4 py-2 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <span className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse shadow-[0_0_10px_#00d4ff]"></span>
                  <p className="text-gray-300 font-mono text-sm">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </p>
                  <CopyAddress address={address || ""} className="text-gray-400 hover:text-white ml-2" truncate={false} />
                  <div className="ml-2 pl-2 border-l border-white/20 flex items-center">
                    <SellerReliabilityFlag sellerWallet={address} size={18} />
                  </div>
                </div>
              </div>
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
            color="bg-gradient-to-br from-blue-500 to-blue-600" 
          />
          <StatCard 
            icon={DollarSign} 
            label="Total Volume" 
            value={
              <span className="flex items-center gap-1">
                0 <SolIcon size={20} />
              </span>
            }
            color="bg-gradient-to-br from-[#7042f8] to-purple-600" 
          />
          <StatCard 
            icon={Star} 
            label="Reputation Score" 
            value="100%" 
            color="bg-gradient-to-br from-amber-500 to-orange-600" 
          />
        </div>

        {/* Tabs & Content */}
        <div className="glass-card rounded-3xl border border-white/10 shadow-xl overflow-hidden min-h-[500px]">
          <div className="border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-8 px-8">
              <button 
                onClick={() => setActiveTab("listings")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "listings" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <LayoutGrid className="w-4 h-4" />
                Active Listings
              </button>
              <button 
                onClick={() => setActiveTab("activity")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "activity" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Activity className="w-4 h-4" />
                Recent Activity
              </button>
              <button 
                onClick={() => setActiveTab("reviews")}
                className={`py-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === "reviews" ? "border-[#00d4ff] text-[#00d4ff]" : "border-transparent text-gray-400 hover:text-white"}`}
              >
                <Star className="w-4 h-4" />
                Reviews
              </button>
            </div>
          </div>

          <div className="p-8">
            {activeTab === "listings" && (
              <>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Listings</h2>
                </div>

                {loading ? (
                  <div className="text-center py-20">
                     <div className="w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                     <p className="text-gray-400">Loading listings...</p>
                  </div>
                ) : listings.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <Package className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No listings found</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      This seller hasn't created any active listings yet.
                    </p>
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
                        seller={item.seller_wallet}
                        category={item.category}
                        status={item.status}
                        isOwner={false}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === "activity" && (
              <div className="text-center py-20 text-gray-400">
                <Activity className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">No recent activity</h3>
                <p className="max-w-sm mx-auto">This seller's recent public activity will appear here.</p>
              </div>
            )}

            {activeTab === "reviews" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-white">Reviews & Ratings</h2>
                </div>

                {reviews.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10 border-dashed">
                    <Star className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-white mb-2">No reviews yet</h3>
                    <p className="text-gray-400 mb-6 max-w-sm mx-auto">
                      This seller hasn't received any reviews yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="glass-card p-6 rounded-2xl border border-white/10 hover:bg-white/5 transition-colors">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#00d4ff] to-[#7042f8] rounded-full flex items-center justify-center text-white font-bold shadow-lg">
                              {review.reviewer_wallet.slice(0, 2)}
                            </div>
                            <div>
                              <p className="font-bold text-white flex items-center gap-2">
                                {review.reviewer_wallet.slice(0, 6)}...{review.reviewer_wallet.slice(-4)}
                                <span className="text-xs font-normal text-[#00d4ff] bg-[#00d4ff]/10 border border-[#00d4ff]/20 px-2 py-0.5 rounded-full">Verified Buyer</span>
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star 
                                key={star} 
                                className={`w-4 h-4 ${star <= review.rating ? 'text-amber-400 fill-amber-400 drop-shadow-glow' : 'text-gray-700'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        {review.comment && (
                          <p className="text-gray-300 leading-relaxed bg-black/20 p-4 rounded-xl text-sm border border-white/5">
                            "{review.comment}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}