"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, DollarSign, Tag, Info, Coins, X } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { supabase } from "@/utils/supabase/client";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { SolIcon } from "@/components/SolIcon";
import { PRODUCT_CATEGORIES } from "@/utils/categories";
import { getSolPrice } from "@/utils/price";
import { addWatermarkToImage } from "@/utils/imageProcessing";

export default function CreateListing() {
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [moderationBlocking, setModerationBlocking] = useState(false);
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
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [showPriceWidget, setShowPriceWidget] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchPrice = async () => {
      const price = await getSolPrice();
      if (price) setSolPrice(price);
    };

    fetchPrice();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const remainingSlots = 5 - imageFiles.length;
      const filesToAdd = files.slice(0, remainingSlots);

      if (filesToAdd.length === 0) return;

      try {
        const processedFiles = await Promise.all(
          filesToAdd.map(file => addWatermarkToImage(file))
        );

        const newPreviews = processedFiles.map(file => URL.createObjectURL(file));

        setImageFiles(prev => [...prev, ...processedFiles]);
        setImagePreviews(prev => [...prev, ...newPreviews]);
      } catch (error) {
        console.error("Error processing images:", error);
        alert("Failed to process images. Please try again.");
      }
    }
  };

  const removeImage = (index: number) => {
    const newFiles = [...imageFiles];
    const newPreviews = [...imagePreviews];
    
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(newPreviews[index]);

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const fileToBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connected || !publicKey) {
      alert("Please connect your wallet first.");
      return;
    }
    if (imageFiles.length === 0) {
      alert("Please upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      let flagged = false;
      for (const file of imageFiles) {
        const base64 = await fileToBase64(file);
        const resp = await fetch("/api/moderate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: base64 }),
        });
        const json = await resp.json();
        console.log("Moderation result for image:", json);
        const r = json?.result || {};
        if (r.weapons || r.nudity || r.violence || r.blood) {
          flagged = true;
          break;
        }
      }
      setModerationBlocking(flagged);

      if (flagged) {
        alert("Your listing contains prohibited content (weapons, nudity, violence, or blood) and cannot be posted.");
        setLoading(false);
        return;
      }

      // 1. Upload images to Supabase Storage
      const uploadedUrls: string[] = [];

      for (const file of imageFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `${publicKey.toString()}/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('listing-images')
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('listing-images')
          .getPublicUrl(filePath);
        
        uploadedUrls.push(publicUrl);
      }

      // 2. Insert listing into Supabase Database
      // We store the array of URLs as a JSON string in the image_url column
      // This is a workaround if we cannot change the schema to array type
      const imageUrlsString = JSON.stringify(uploadedUrls);

      const { error: insertError } = await supabase
        .from('listings')
        .insert([
          {
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
            image_url: imageUrlsString, // Store JSON string of array
            seller_wallet: publicKey.toString(),
            status: 'active',
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      alert("Listing created successfully!");
      
      // Reset form
      setTitle("");
      setDescription("");
      setPrice("");
      setCategory("");
      setDeliveryMethod("Home Delivery");
      setPickupLocation("");
      setImageFiles([]);
      setImagePreviews([]);
    } catch (error: any) {
      console.error("Error creating listing:", error);
      alert(`Error creating listing: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-8 md:px-20 pt-28 pb-12 max-w-3xl">
      <h1 className="text-3xl font-bold text-white mb-8">Create New Listing</h1>
      
      {!connected ? (
        <div className="bg-[#00d4ff]/10 border border-[#00d4ff]/20 p-6 rounded-xl text-[#00d4ff] text-center backdrop-blur-sm shadow-[0_0_20px_rgba(0,212,255,0.1)]">
          <p className="font-semibold text-lg">Please connect your wallet to create a listing.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 glass-card p-8 rounded-2xl border border-white/10 shadow-xl">
          
          {/* Image Upload */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Product Images (Max 5)</label>
            
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 group">
                    <Image src={preview} alt={`Preview ${index + 1}`} fill className="object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 backdrop-blur-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {imagePreviews.length < 5 && (
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

            {imagePreviews.length === 0 && (
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
                  onFocus={() => setShowPriceWidget(true)}
                  onBlur={() => setShowPriceWidget(false)}
                  placeholder="0.00" 
                  step="0.000000001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500"
                  required
                />
                {showPriceWidget && solPrice && (
                  <div className="absolute top-full left-0 w-full z-50 mt-2 rounded-xl overflow-hidden shadow-2xl border border-white/10 bg-[#0a0f1c] p-4 backdrop-blur-xl">
                    <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                      <span className="text-gray-400 text-xs">Current Rate</span>
                      <span className="text-[#00d4ff] text-xs font-mono">1 SOL ≈ ${solPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm font-medium">Total USD</span>
                      <span className="text-white text-lg font-bold">
                         ${(parseFloat(price || "0") * solPrice).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
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

          <div className="bg-[#00d4ff]/10 p-4 rounded-xl flex items-start gap-3 text-[#00d4ff] text-sm border border-[#00d4ff]/20">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>
              Listing is free. A fixed 0.01 SOL platform fee is added to the purchase price (paid by the buyer).
              Funds are held in escrow until the buyer confirms receipt.
            </p>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#00d4ff] to-blue-600 text-white font-bold py-4 rounded-xl hover:shadow-[#00d4ff]/40 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#00d4ff]/20 border border-white/20 backdrop-blur-sm"
          >
            {loading ? "Creating Listing..." : "Create Listing"}
          </button>
        </form>
      )}
    </div>
  );
}
