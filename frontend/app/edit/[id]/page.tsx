"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, DollarSign, Tag, Info, Coins, X, ArrowLeft } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { SolIcon } from "@/components/SolIcon";
import { getImages } from "@/utils/imageHelper";
import { PRODUCT_CATEGORIES } from "@/utils/categories";

export default function EditListing() {
  const { publicKey, connected } = useWallet();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [itemType, setItemType] = useState<"Brand New" | "Used">("Brand New");
  const [condition, setCondition] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"Home Delivery" | "Pickup">("Home Delivery");
  const [pickupLocation, setPickupLocation] = useState("");
  const [sellerName, setSellerName] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [deliveryTime, setDeliveryTime] = useState<number>(24);
  const [solPrice, setSolPrice] = useState<number | null>(null);
  
  // Image state
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Original data for comparison
  const [originalData, setOriginalData] = useState<any>(null);

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json();
        setSolPrice(data.solana.usd);
      } catch (err) {
        console.warn("Failed to fetch SOL price:", err);
      }
    };

    fetchSolPrice();
  }, []);

  useEffect(() => {
    const fetchListing = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching listing:", error);
        alert("Listing not found");
        router.push("/profile");
        return;
      }

      setTitle(data.title);
      setDescription(data.description);
      setPrice(data.price.toString());
      setCategory(data.category);
      setItemType(data.item_type || "Brand New");
      setCondition(data.condition || "");
      setDeliveryMethod(data.delivery_method || "Home Delivery");
      setPickupLocation(data.pickup_location || "");
      setDeliveryTime(data.delivery_time_hours || 24);
      
      const images = getImages(data.image_url);
      setExistingImages(images);
      
      // Store original data to track edits
      setOriginalData(data);
      setFetching(false);
    };

    fetchListing();
  }, [id, router]);

  // Check ownership after data is loaded and wallet connected
  useEffect(() => {
    if (!fetching && originalData && connected && publicKey) {
        if (originalData.seller_wallet !== publicKey.toString()) {
            alert("You are not authorized to edit this listing.");
            router.push("/");
        }
    }
  }, [fetching, originalData, connected, publicKey, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const totalCurrentImages = existingImages.length + newImageFiles.length;
      const remainingSlots = 5 - totalCurrentImages;
      const filesToAdd = files.slice(0, remainingSlots);

      if (filesToAdd.length === 0) return;

      const newPreviews = filesToAdd.map(file => URL.createObjectURL(file));

      setNewImageFiles(prev => [...prev, ...filesToAdd]);
      setNewImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeExistingImage = (index: number) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeNewImage = (index: number) => {
    const newFiles = [...newImageFiles];
    const newPreviews = [...newImagePreviews];
    
    // Revoke object URL
    URL.revokeObjectURL(newPreviews[index]);

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setNewImageFiles(newFiles);
    setNewImagePreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      alert("Please connect your wallet first.");
      return;
    }

    if (existingImages.length === 0 && newImageFiles.length === 0) {
      alert("Please have at least one image.");
      return;
    }

    setLoading(true);

    try {
      const finalImageUrls = [...existingImages];

      // 1. Upload new images
      if (newImageFiles.length > 0) {
        for (const file of newImageFiles) {
          const fileExt = file.name.split('.').pop();
          const fileName = `${uuidv4()}.${fileExt}`;
          const filePath = `${publicKey.toString()}/${fileName}`;

          const { error: uploadError } = await supabase.storage
            .from('listing-images')
            .upload(filePath, file);

          if (uploadError) throw uploadError;

          const { data } = supabase.storage
            .from('listing-images')
            .getPublicUrl(filePath);
            
          finalImageUrls.push(data.publicUrl);
        }
      }

      // Convert to JSON string for storage
      const finalImageString = JSON.stringify(finalImageUrls);

      // 2. Determine edited fields
      // Use existing edited_fields if available, or start empty
      const existingEdits = Array.isArray(originalData.edited_fields) 
        ? originalData.edited_fields 
        : [];
      const currentEditedFields = new Set<string>(existingEdits);
      
      if (title !== originalData.title) currentEditedFields.add('title');
      if (description !== originalData.description) currentEditedFields.add('description');
      if (parseFloat(price) !== parseFloat(originalData.price)) currentEditedFields.add('price');
      if (itemType !== originalData.item_type) currentEditedFields.add('item_type');
      if (condition !== originalData.condition) currentEditedFields.add('condition');
      if (deliveryMethod !== originalData.delivery_method) currentEditedFields.add('delivery_method');
      
      // Check if images changed (naive check: string comparison of arrays)
      const originalImages = getImages(originalData.image_url);
      if (JSON.stringify(finalImageUrls) !== JSON.stringify(originalImages)) {
        currentEditedFields.add('image_url');
      }
      
      // 3. Update listing
      try {
        const { error: updateError } = await supabase
          .from('listings')
          .update({
            title,
            description,
            price: parseFloat(price),
            category,
            item_type: itemType,
            condition: itemType === "Used" ? condition : null,
            delivery_method: deliveryMethod,
            pickup_location: deliveryMethod === "Pickup" ? pickupLocation : null,
            seller_name: deliveryMethod === "Pickup" ? sellerName : null,
            seller_phone: deliveryMethod === "Pickup" ? sellerPhone : null,
            delivery_time_hours: deliveryTime,
            image_url: finalImageString,
            updated_at: new Date().toISOString(),
            edited_fields: Array.from(currentEditedFields) // Update the tracking column
          })
          .eq('id', id);

        if (updateError) throw updateError;
      } catch (error: any) {
        // Graceful fallback: If 'edited_fields' column is missing, try updating without it
        if (error.message?.includes("edited_fields")) {
          console.warn("Column 'edited_fields' missing, retrying without tracking edits...");
          
          const { error: retryError } = await supabase
            .from('listings')
            .update({
              title,
              description,
              price: parseFloat(price),
              category,
              item_type: itemType,
              condition: itemType === "Used" ? condition : null,
              delivery_method: deliveryMethod,
              pickup_location: deliveryMethod === "Pickup" ? pickupLocation : null,
              delivery_time_hours: deliveryTime,
              image_url: finalImageString,
              updated_at: new Date().toISOString()
            })
            .eq('id', id);
            
          if (retryError) throw retryError;
          
          alert("Listing updated successfully! (Note: 'Edited' badge may not appear until database is updated)");
          router.push(`/product/${id}`);
          return;
        }
        throw error;
      }

      alert("Listing updated successfully!");
      router.push(`/product/${id}`);
    } catch (error: any) {
      console.error("Error updating listing:", error);
      alert(`Error updating listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return <div className="min-h-screen flex items-center justify-center text-gray-400">Loading...</div>;
  }

  if (!connected) {
    return (
        <div className="container mx-auto px-8 md:px-20 py-12 text-center">
            <div className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 p-6 rounded-xl text-[#00d4ff] inline-block backdrop-blur-sm shadow-[0_0_20px_rgba(0,212,255,0.1)]">
                <p>Please connect your wallet to edit your listing.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-8 md:px-20 pt-28 pb-12 max-w-3xl">
      <Link href={`/product/${id}`} className="flex items-center gap-2 text-gray-400 hover:text-[#00d4ff] mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Listing
      </Link>
      
      <h1 className="text-3xl font-bold text-white mb-8">Edit Listing</h1>
      
      <form onSubmit={handleSubmit} className="space-y-8 glass-card p-8 rounded-2xl border border-white/10 shadow-xl">
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Product Images (Max 5)</label>
            
            {(existingImages.length > 0 || newImagePreviews.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {/* Existing Images */}
                {existingImages.map((url, index) => (
                  <div key={`existing-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <Image src={url} alt={`Existing ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeExistingImage(index)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm text-white text-xs p-1 text-center">Existing</div>
                  </div>
                ))}
                
                {/* New Images */}
                {newImagePreviews.map((preview, index) => (
                  <div key={`new-${index}`} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <Image src={preview} alt={`New ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeNewImage(index)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-[#00d4ff]/80 text-white text-xs p-1 text-center backdrop-blur-sm">New</div>
                  </div>
                ))}
                
                {/* Add More Button */}
                {(existingImages.length + newImagePreviews.length) < 5 && (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-[#00d4ff] hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors cursor-pointer"
                  >
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-xs">Add more</span>
                  </div>
                )}
              </div>
            )}

            {(existingImages.length === 0 && newImagePreviews.length === 0) && (
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/10 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-[#00d4ff] hover:bg-[#00d4ff]/10 transition-colors cursor-pointer relative overflow-hidden"
              >
                <Upload className="w-8 h-8 mb-3" />
                <span className="text-sm">Click to upload or drag and drop (Max 5)</span>
              </div>
            )}
            
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </div>

          {/* Title */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Title</label>
            <input 
              type="text" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Vintage Sony Walkman" 
              className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
              required
            />
          </div>

          {/* Item Type & Condition */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Item Type</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setItemType("Brand New");
                    setCondition("");
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all font-medium ${
                    itemType === "Brand New"
                      ? "border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "border-white/10 hover:border-[#00d4ff]/50 text-gray-400 hover:text-white"
                  }`}
                >
                  Brand New
                </button>
                <button
                  type="button"
                  onClick={() => setItemType("Used")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all font-medium ${
                    itemType === "Used"
                      ? "border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "border-white/10 hover:border-[#00d4ff]/50 text-gray-400 hover:text-white"
                  }`}
                >
                  Used
                </button>
              </div>
            </div>

            {itemType === "Used" && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Condition</label>
                <div className="relative">
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all appearance-none"
                    required={itemType === "Used"}
                  >
                    <option value="">Select Condition</option>
                    <option value="Best">Best</option>
                    <option value="Good">Good</option>
                    <option value="Fair">Fair</option>
                    <option value="Poor">Poor</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Delivery Method & Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Delivery Method</label>
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("Home Delivery")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all font-medium ${
                    deliveryMethod === "Home Delivery"
                      ? "border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "border-white/10 hover:border-[#00d4ff]/50 text-gray-400 hover:text-white"
                  }`}
                >
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("Pickup")}
                  className={`flex-1 py-3 px-4 rounded-xl border transition-all font-medium ${
                    deliveryMethod === "Pickup"
                      ? "border-[#00d4ff] bg-[#00d4ff]/10 text-[#00d4ff]"
                      : "border-white/10 hover:border-[#00d4ff]/50 text-gray-400 hover:text-white"
                  }`}
                >
                  Pickup
                </button>
              </div>
            </div>

            {deliveryMethod === "Pickup" ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-300">Pickup Location</label>
                  <input 
                    type="text" 
                    value={pickupLocation}
                    onChange={(e) => setPickupLocation(e.target.value)}
                    placeholder="e.g. 123 Main St, New York, NY" 
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Contact Name</label>
                    <input 
                      type="text" 
                      value={sellerName}
                      onChange={(e) => setSellerName(e.target.value)}
                      placeholder="Who to ask for" 
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-300">Phone Number</label>
                    <input 
                      type="tel" 
                      value={sellerPhone}
                      onChange={(e) => setSellerPhone(e.target.value)}
                      placeholder="e.g. +1 234 567 8900" 
                      className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Delivery Guarantee</label>
                <div className="relative">
                  <select
                    value={deliveryTime}
                    onChange={(e) => setDeliveryTime(parseFloat(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all appearance-none"
                    required
                  >
                    <option value="0.016667">1 Minute</option>
                    <option value="1">1 Hour</option>
                    <option value="6">6 Hours</option>
                    <option value="12">12 Hours</option>
                    <option value="24">24 Hours (1 Day)</option>
                    <option value="48">2 Days</option>
                    <option value="72">3 Days</option>
                    <option value="120">5 Days</option>
                    <option value="168">7 Days (1 Week)</option>
                    <option value="240">10 Days</option>
                    <option value="336">14 Days (2 Weeks)</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
                <p className="text-xs text-gray-500">
                  You must complete the order within this time frame after accepting it.
                </p>
              </div>
            )}
          </div>
          
          {deliveryMethod === "Pickup" && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Pickup Window (Buyer Deadline)</label>
              <div className="relative">
                <select
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(parseFloat(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all appearance-none"
                  required
                >
                  <option value="0.016667">1 Minute</option>
                  <option value="24">24 Hours (1 Day)</option>
                  <option value="48">2 Days</option>
                  <option value="72">3 Days</option>
                  <option value="120">5 Days</option>
                  <option value="168">7 Days (1 Week)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
              <p className="text-xs text-gray-500">
                The buyer must pick up the item within this time frame after you accept the order.
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Description</label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your item..." 
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
              required
            />
          </div>

          {/* Price & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Price</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 flex items-center justify-center">
                  <SolIcon size={16} />
                </div>
                <input 
                  type="number" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00" 
                  step="0.000000001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
                  required
                />
              </div>
              {price && solPrice && (
                <p className="text-xs text-[#00d4ff]">
                  ≈ ${(parseFloat(price) * solPrice).toFixed(2)} USD
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-300">Category</label>
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all appearance-none"
                  required
                >
                  <option value="">Select Category</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4">
            <Link href={`/product/${id}`}>
              <button
                type="button"
                className="px-6 py-3 rounded-xl border border-white/10 text-gray-300 font-bold hover:bg-white/5 hover:text-white transition-all"
              >
                Cancel
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7042f8] text-white font-bold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Updating..." : "Save Changes"}
            </button>
          </div>
      </form>
    </div>
  );
}
