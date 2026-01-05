"use client";

import { useEffect, useState, Suspense } from "react";
import { ProductCard } from "@/components/ProductCard";
import { supabase } from "@/utils/supabase/client";
import { Search, Filter, Package, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { trackSearch, trackCategoryView } from "@/utils/userPreferences";

import { PRODUCT_CATEGORIES } from "@/utils/categories";

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc">("newest");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    // Sync searchTerm with URL param if it changes
    const searchParam = searchParams.get("search");
    if (searchParam !== null) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm) trackSearch(searchTerm);
      if (selectedCategory) trackCategoryView(selectedCategory);
    }, 1000);

    const fetchListings = async () => {
      setLoading(true);
      let query = supabase
        .from("listings")
        .select("*")
        .neq("status", "deleted") // Exclude deleted items
        .neq("status", "sold") // Exclude sold items
        .neq("status", "shadowed") // Exclude moderated items
        .neq("status", "blocked"); // Exclude blocked items

      // Apply sorting
      if (sortBy === "newest") {
        query = query.order("created_at", { ascending: false });
      } else if (sortBy === "price_asc") {
        query = query.order("price", { ascending: true });
      } else if (sortBy === "price_desc") {
        query = query.order("price", { ascending: false });
      }

      if (selectedCategory) {
        query = query.eq("category", selectedCategory);
      }

      if (searchTerm) {
        // Simple search on title
        query = query.ilike("title", `%${searchTerm}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching listings:", error);
      } else {
        setListings(data || []);
      }
      setLoading(false);
    };

    fetchListings();

    return () => clearTimeout(timer);
  }, [searchTerm, selectedCategory, sortBy]);

  const categories = [
    "All",
    ...PRODUCT_CATEGORIES
  ];

  return (
    <div className="min-h-screen pb-20 pt-20">
      {/* Header Section */}
      <div className="glass-nav shadow-lg shadow-purple-900/5">
        <div className="container mx-auto px-4 md:px-8 py-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between md:hidden">
                <h1 className="text-2xl font-bold text-white">Explore</h1>
                <button 
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-white border border-white/10 relative"
                >
                  <SlidersHorizontal className="w-5 h-5" />
                  {(selectedCategory || sortBy !== 'newest') && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00d4ff] rounded-full shadow-[0_0_5px_#00d4ff]"></span>
                  )}
                </button>
            </div>
            
            <div className="flex items-center justify-between lg:justify-center relative gap-4">
                <h1 className="text-2xl font-bold text-white hidden md:block lg:absolute lg:left-0">Explore</h1>
                
                <div className="flex-1 lg:flex-none w-full max-w-2xl flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                      type="text"
                      placeholder="Search for items..."
                      className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 focus:bg-white/10 focus:border-[#7042f8] rounded-xl outline-none transition-all text-white placeholder-gray-500"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <button 
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="hidden md:flex lg:hidden p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-white border border-white/10"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 md:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="glass-card p-6 rounded-2xl sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-white flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#00d4ff]" />
                  Filters
                </h3>
                {(selectedCategory || sortBy !== 'newest') && (
                  <button 
                    onClick={() => { setSelectedCategory(null); setSortBy("newest"); }}
                    className="text-xs text-[#00d4ff] font-semibold hover:text-[#7042f8] transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>

              <div className="mb-8">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Sort By</h4>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full p-2.5 bg-[#0a0f1c] border border-white/10 rounded-lg text-sm text-gray-300 focus:border-[#7042f8] outline-none"
                >
                  <option value="newest">Newest Listed</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Categories</h4>
                <div className="space-y-1 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2 overscroll-contain" data-lenis-prevent>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat === "All" ? null : cat)}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between group ${
                        (cat === "All" && !selectedCategory) || cat === selectedCategory
                          ? "bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/10 text-[#00d4ff] font-bold border border-[#7042f8]/30 shadow-lg shadow-[#7042f8]/10"
                          : "text-gray-400 hover:bg-white/5 hover:text-white hover:pl-5"
                      }`}
                    >
                      {cat}
                      {((cat === "All" && !selectedCategory) || cat === selectedCategory) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff]"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile Filters Drawer */}
          {showMobileFilters && (
            <div className="fixed inset-0 z-[100] lg:hidden">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileFilters(false)}></div>
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-[#0a0f1c] border-l border-white/10 p-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-white">Filters</h3>
                  <button onClick={() => setShowMobileFilters(false)} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-8">
                  <h4 className="font-bold text-white mb-4">Sort By</h4>
                  <div className="space-y-2">
                    {[
                      { label: "Newest Listed", value: "newest" },
                      { label: "Price: Low to High", value: "price_asc" },
                      { label: "Price: High to Low", value: "price_desc" }
                    ].map((option) => (
                      <label key={option.value} className="flex items-center gap-3 p-3 rounded-xl border border-white/10 cursor-pointer hover:bg-white/5 bg-white/5">
                        <input 
                          type="radio" 
                          name="sort"
                          checked={sortBy === option.value}
                          onChange={() => setSortBy(option.value as any)}
                          className="w-4 h-4 text-[#7042f8] focus:ring-[#7042f8] bg-transparent border-white/20"
                        />
                        <span className="text-sm font-medium text-gray-300">{option.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-4">Categories</h4>
                  <div className="grid grid-cols-1 gap-1 max-h-[50vh] overflow-y-auto custom-scrollbar pr-2 overscroll-contain" data-lenis-prevent>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat === "All" ? null : cat);
                          setShowMobileFilters(false);
                        }}
                        className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 flex items-center justify-between ${
                          (cat === "All" && !selectedCategory) || cat === selectedCategory
                            ? "bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/10 text-[#00d4ff] font-bold border border-[#7042f8]/30 shadow-lg shadow-[#7042f8]/10"
                            : "text-gray-400 hover:bg-white/5 border border-transparent hover:border-white/5 hover:pl-5"
                        }`}
                      >
                        {cat}
                        {((cat === "All" && !selectedCategory) || cat === selectedCategory) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] shadow-[0_0_10px_#00d4ff]"></span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/5 p-4 rounded-2xl border border-white/5 backdrop-blur-sm">
              <p className="text-gray-400 text-sm">
                Showing <span className="font-bold text-white">{listings.length}</span> results
                {selectedCategory && <span> in <span className="text-[#00d4ff] font-bold">{selectedCategory}</span></span>}
                {searchTerm && <span> for "<span className="text-white font-bold">{searchTerm}</span>"</span>}
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-3 sm:p-4 h-[280px] sm:h-[350px] animate-pulse border border-white/5">
                    <div className="w-full h-32 sm:h-48 bg-white/5 rounded-xl mb-4"></div>
                    <div className="h-4 sm:h-5 bg-white/5 rounded w-3/4 mb-3"></div>
                    <div className="h-3 sm:h-4 bg-white/5 rounded w-1/2 mb-4"></div>
                    <div className="flex justify-between mt-auto">
                        <div className="h-5 sm:h-6 w-16 sm:w-20 bg-white/5 rounded-lg"></div>
                        <div className="h-5 sm:h-6 w-16 sm:w-20 bg-white/5 rounded-lg"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-24 glass-card rounded-3xl border border-dashed border-white/10 bg-gradient-to-b from-white/5 to-transparent relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-[#7042f8]/5 to-[#00d4ff]/5 pointer-events-none" />
                <div className="relative z-10">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-white/10">
                        <Package className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No listings found</h3>
                    <p className="text-gray-400 max-w-md mx-auto mb-8 text-lg">
                    We couldn't find any items matching your criteria. Try adjusting your filters or search terms.
                    </p>
                    <button 
                    onClick={() => { setSearchTerm(""); setSelectedCategory(null); setSortBy("newest"); }}
                    className="px-8 py-3 bg-gradient-to-r from-[#2a0e61] to-[#7042f8] text-white rounded-xl font-bold hover:shadow-[0_0_20px_rgba(112,66,248,0.4)] transition-all border border-[#7042f8]/50 hover:scale-105 active:scale-95"
                    >
                    Clear all filters
                    </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
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
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#030014] flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin shadow-[0_0_15px_rgba(0,212,255,0.3)]"></div></div>}>
      <ExploreContent />
    </Suspense>
  );
}
