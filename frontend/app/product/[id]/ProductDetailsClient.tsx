"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { ShieldCheck, Truck, Clock, AlertCircle, Edit, Trash2, X, ZoomIn, Share2, Check, Star, ChevronRight } from "lucide-react";
import { supabase } from "@/utils/supabase/client";
import { CopyAddress } from "@/components/CopyAddress";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import Link from "next/link";
import { formatDistanceToNow } from 'date-fns';
import { getImages } from "@/utils/imageHelper";
import { ProductCard } from "@/components/ProductCard";
import { trackCategoryView } from "@/utils/userPreferences";
import SellerReliabilityFlag from "@/components/SellerReliabilityFlag";
import { SolIcon } from "@/components/SolIcon";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, NATIVE_MINT, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getProgram, getEscrowPDA } from "@/utils/anchor";
import { BN } from "@project-serum/anchor";


export default function ProductDetails() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey } = wallet;
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transactionState, setTransactionState] = useState<'idle' | 'pending'>('idle');
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string>("");
  const [images, setImages] = useState<string[]>([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [sellerAvatar, setSellerAvatar] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);
  const [deniedOrder, setDeniedOrder] = useState<any>(null);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportDescription, setReportDescription] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    name: "",
    address: "",
    phone: "",
  });
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isOverdue, setIsOverdue] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [relatedTitle, setRelatedTitle] = useState("Products You May Like");
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  


  const handleShare = async () => {
    if (!product) return;
    
    const shareUrl = `https://thedealshield.com/product/${id}`;
    
    const shareData = {
      title: product.title,
      text: `Check out ${product.title} on DealShield!`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  useEffect(() => {
    if (!id) return;

    // Real-time subscription for orders and listing
    const channel = supabase
      .channel(`product-updates-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `listing_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setOrder(payload.new as any);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'listings',
          filter: `id=eq.${id}`,
        },
        (payload) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          setProduct((prev: any) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;

      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching product:", error);
      } else if (data.status === 'deleted') {
        // Treat deleted items as not found
        setProduct(null);
      } else {
        setProduct(data);
        if (data.category) {
          trackCategoryView(data.category);
        }
        const productImages = getImages(data.image_url);
        setImages(productImages);
        if (productImages.length > 0) {
          setSelectedImage(productImages[0]);
        } else {
          setSelectedImage("https://via.placeholder.com/600");
        }

        // Fetch seller profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("wallet_address", data.seller_wallet)
          .maybeSingle();
          
        if (profileData) {
          setSellerAvatar(profileData.avatar_url);
        }

        // Fetch order if item is sold or pending
        if (data.status === 'sold' || data.status === 'pending') {
          const { data: orderData } = await supabase
            .from("orders")
            .select("*")
            .eq("listing_id", id)
            .neq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (orderData) {
            setOrder(orderData);
          }
        }

        // If user is connected, check if they have a denied order for this item
        // This is important because the listing status might be 'active' again
        if (publicKey) {
          const { data: deniedData } = await supabase
            .from("orders")
            .select("*")
            .eq("listing_id", id)
            .eq("buyer_wallet", publicKey.toString())
            .eq("status", "cancelled")
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

          if (deniedData) {
            setDeniedOrder(deniedData);
          }
        }

        // Fetch related products based on category (keyword match)
        let fetchedRelated: any[] = [];
        let title = "Products You May Like";

        if (data.category) {
          const { data: relatedData } = await supabase
            .from("listings")
            .select("*")
            .eq("category", data.category)
            .neq("id", id) // Exclude current product
            .neq("status", "sold") // Exclude sold items
            .neq("status", "deleted") // Exclude deleted items
            .limit(4);
          
          if (relatedData && relatedData.length > 0) {
            fetchedRelated = relatedData;
          }
        }

        // Fallback: If no related products in same category, fetch other latest products
        if (fetchedRelated.length === 0) {
          const { data: otherData } = await supabase
            .from("listings")
            .select("*")
            .neq("id", id)
            .neq("status", "sold")
            .neq("status", "deleted")
            .order("created_at", { ascending: false })
            .limit(4);
            
          if (otherData && otherData.length > 0) {
            fetchedRelated = otherData;
            title = "Other Products";
          }
        }

        setRelatedProducts(fetchedRelated);
        setRelatedTitle(title);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [id, publicKey]);

  useEffect(() => {
    if (order && order.accepted_at && product?.delivery_time_hours) {
      const calculateTimeLeft = () => {
        const acceptedDate = new Date(order.accepted_at);
        const deadline = new Date(acceptedDate.getTime() + product.delivery_time_hours * 60 * 60 * 1000);
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
    }
  }, [order, product]);

  const handleClaimRefund = async () => {
    if (!confirm("Are you sure you want to cancel this order? This will unfreeze your funds and return them to your wallet.")) return;

    try {
      if (!publicKey) throw new Error("Wallet not connected");

      // 1. Blockchain Refund
      const program = getProgram(connection, wallet);
      const listingIdShort = id.slice(0, 32);
      const sellerPubkey = new PublicKey(product.seller_wallet);
      const [escrowPda] = getEscrowPDA(publicKey, sellerPubkey, listingIdShort);
      
      const mint = NATIVE_MINT;
      const escrowVault = await getAssociatedTokenAddress(mint, escrowPda, true);
      const buyerAta = await getAssociatedTokenAddress(mint, publicKey);
      
      // Treasury handling
      let treasuryPubkey: PublicKey;
      const envTreasury = process.env.NEXT_PUBLIC_TREASURY_WALLET;
      
      if (envTreasury && envTreasury.length > 0) {
        try {
          treasuryPubkey = new PublicKey(envTreasury);
        } catch (e) {
          console.error("Invalid Treasury Wallet in .env, falling back to buyer");
          treasuryPubkey = publicKey;
        }
      } else {
        treasuryPubkey = publicKey;
      }

      const treasuryAta = await getAssociatedTokenAddress(mint, treasuryPubkey);
      
      const preInstructions = [];
      
      // Ensure Treasury ATA exists
      const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta);
      if (!treasuryAtaInfo) {
          preInstructions.push(createAssociatedTokenAccountInstruction(publicKey, treasuryAta, treasuryPubkey, mint));
      }

      const tx = await program.methods
        .refundTimeout()
        .accounts({
          buyer: publicKey,
          escrowAccount: escrowPda,
          escrowVault: escrowVault,
          buyerTokenAccount: buyerAta,
          treasuryTokenAccount: treasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();
        
      await connection.confirmTransaction(tx, "confirmed");
      alert(`Refund processed on chain! Transaction: ${tx.slice(0, 8)}...`);

      // 2. Update order status to refunded
      const { error: orderError } = await supabase
        .from('orders')
        .update({ 
          status: 'refunded',
          cancellation_reason_title: 'Delivery Deadline Missed',
          cancellation_reason_description: 'Seller failed to deliver within the guaranteed time frame.'
        })
        .eq('id', order.id);

      if (orderError) throw orderError;

      // 2. Reactivate the listing so it can be bought again
      const { error: listingError } = await supabase
        .from("listings")
        .update({ status: 'active' })
        .eq("id", id);

      if (listingError) {
        console.error("Error reactivating listing:", listingError);
        // We continue even if listing update fails, as the refund is the priority
      }

      // 3. Create notification for seller
      await supabase.from('notifications').insert({
        user_wallet: product.seller_wallet,
        message: `Order for "${product.title}" was cancelled and refunded due to missed delivery deadline.`,
        type: 'order_denied',
        link: `/product/${id}`
      });

      alert("Order cancelled. Funds have been unfrozen and returned to your wallet.");
      window.location.reload();
    } catch (error) {
      console.error("Error claiming refund:", error);
      alert("Failed to process refund. Please try again.");
    }
  };

  const handleBuy = async () => {
    if (!publicKey) {
      alert("Please connect your wallet to purchase.");
      return;
    }
    setIsBuyModalOpen(true);
  };

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingOrder(true);

    try {
      if (!publicKey) throw new Error("Wallet not connected");

      // 1. Initialize Escrow on Blockchain
      const program = getProgram(connection, wallet);
      
      // Values
      // Use first 32 chars of ID for seed (limit)
      const listingIdShort = id.slice(0, 32);
      const priceVal = parseFloat(product.price);
      // Fixed 0.01 SOL fee
      const feeInSol = 0.01;
      
      const amount = new BN(priceVal * 1e9);
      const fee = new BN(feeInSol * 1e9);

      const sellerPubkey = new PublicKey(product.seller_wallet);
      const mint = NATIVE_MINT; // wSOL

      const [escrowPda] = getEscrowPDA(publicKey, sellerPubkey, listingIdShort);
      
      const buyerAta = await getAssociatedTokenAddress(mint, publicKey);
      const escrowVault = await getAssociatedTokenAddress(mint, escrowPda, true);

      // Check buyer ATA
      const buyerAtaInfo = await connection.getAccountInfo(buyerAta);
      
      const preInstructions = [];
      
      if (!buyerAtaInfo) {
        preInstructions.push(
          createAssociatedTokenAccountInstruction(
            publicKey,
            buyerAta,
            publicKey,
            mint
          )
        );
      }

      // Fund buyer ATA with SOL (Amount + Fee)
      const totalLamports = BigInt(amount.add(fee).toString());
      
      preInstructions.push(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: buyerAta,
          lamports: totalLamports
        }),
        createSyncNativeInstruction(buyerAta)
      );

      console.log("Initializing Escrow...");
      // Call Smart Contract
      const tx = await program.methods
        .initializeEscrow(amount, fee, listingIdShort)
        .accounts({
          buyer: publicKey,
          seller: sellerPubkey,
          escrowAccount: escrowPda,
          buyerTokenAccount: buyerAta,
          escrowVault: escrowVault,
          mint: mint,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .preInstructions(preInstructions)
        .rpc();

      console.log("Transaction signature", tx);
      await connection.confirmTransaction(tx, "confirmed");

      // 2. Create Order in Supabase
      const { error } = await supabase
        .from('orders')
        .insert({
          listing_id: id,
          buyer_wallet: publicKey!.toString(),
          buyer_name: orderDetails.name,
          shipping_address: orderDetails.address,
          phone_number: orderDetails.phone
          // tx_signature: tx // Add if column exists
        });

      if (error) {
        console.error("Error creating order (backend might be missing 'orders' table):", error);
        if (error.code === '42P01') { // undefined_table
           alert("System Warning: 'orders' table missing. Purchase recorded on chain.");
        } else {
           console.warn("Order recorded on chain but DB update failed.");
        }
      }

      // 3. Update listing status to pending
      await supabase
        .from('listings')
        .update({ status: 'pending' })
        .eq('id', id);

      // 4. Create notification for seller
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert({
          user_wallet: product.seller_wallet,
          message: `New order received for "${product.title}" from ${orderDetails.name}`,
          type: 'new_order',
          link: '/profile'
        });

      if (notificationError) {
        console.error("Error creating notification:", notificationError);
      }

      // 5. Update local state
      setProduct({ ...product, status: 'pending' });
      setOrder({ 
        listing_id: id,
        buyer_wallet: publicKey!.toString(),
        buyer_name: orderDetails.name,
        shipping_address: orderDetails.address,
        phone_number: orderDetails.phone
      });
      setTransactionState('pending');
      setIsBuyModalOpen(false);
      alert(`Order placed successfully! Transaction: ${tx.slice(0, 8)}...`);
    } catch (error: any) {
      console.error("Error creating order:", error);
      alert(`Failed to place order: ${error.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  const handleConfirmReceipt = async () => {
    if (!order) return;
    
    // Check if late
    const isLate = isOverdue;

    try {
      if (!publicKey) throw new Error("Wallet not connected");

      // 1. Confirm on Blockchain
      const program = getProgram(connection, wallet);
      const listingIdShort = id.slice(0, 32);
      const sellerPubkey = new PublicKey(product.seller_wallet);
      const [escrowPda] = getEscrowPDA(publicKey, sellerPubkey, listingIdShort);
      
      const mint = NATIVE_MINT;
      const escrowVault = await getAssociatedTokenAddress(mint, escrowPda, true);
      const sellerAta = await getAssociatedTokenAddress(mint, sellerPubkey);
      
      // Treasury handling
      let treasuryPubkey: PublicKey;
      const envTreasury = process.env.NEXT_PUBLIC_TREASURY_WALLET;
      
      if (envTreasury && envTreasury.length > 0) {
        try {
          treasuryPubkey = new PublicKey(envTreasury);
        } catch (e) {
          console.error("Invalid Treasury Wallet in .env, falling back to buyer");
          treasuryPubkey = publicKey;
        }
      } else {
        // Fallback for development/testing if no treasury set
        console.warn("No Treasury Wallet set in .env, using buyer as placeholder");
        treasuryPubkey = publicKey;
      }

      const treasuryAta = await getAssociatedTokenAddress(mint, treasuryPubkey);

      const preInstructions = [];
      const sellerAtaInfo = await connection.getAccountInfo(sellerAta);
      if (!sellerAtaInfo) {
          preInstructions.push(createAssociatedTokenAccountInstruction(publicKey, sellerAta, sellerPubkey, mint));
      }
      
      // Check/Create Treasury ATA if needed (likely needed if it's a new wallet)
      const treasuryAtaInfo = await connection.getAccountInfo(treasuryAta);
      if (!treasuryAtaInfo) {
          preInstructions.push(createAssociatedTokenAccountInstruction(publicKey, treasuryAta, treasuryPubkey, mint));
      }

      const tx = await program.methods
        .confirmDelivery()
        .accounts({
          buyer: publicKey,
          escrowAccount: escrowPda,
          escrowVault: escrowVault,
          sellerTokenAccount: sellerAta,
          treasuryTokenAccount: treasuryAta,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .preInstructions(preInstructions)
        .rpc();
        
      await connection.confirmTransaction(tx, "confirmed");
      alert(`Receipt confirmed on chain! Transaction: ${tx.slice(0, 8)}...`);

      // 2. Database Update
      const { error } = await supabase
        .from("orders")
        .update({ 
          status: 'completed',
          is_late_delivery: isLate
        })
        .eq("id", order.id);

      if (error) throw error;

      // Update listing status to sold
      const { error: listingError } = await supabase
        .from("listings")
        .update({ status: 'sold' })
        .eq("id", id);

      if (listingError) throw listingError;

      alert("Receipt confirmed! Funds have been released to the seller.");
      setIsReviewModalOpen(true);
    } catch (error: any) {
      console.error("Error confirming receipt:", error);
      alert(`Failed to confirm receipt: ${error.message}`);
    }
  };

  const handleSubmitReview = async () => {
    if (!order || !product) return;
    setSubmittingReview(true);

    try {
      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: order.id,
          reviewer_wallet: publicKey?.toString(),
          reviewee_wallet: product.seller_wallet,
          rating: reviewRating,
          comment: reviewComment
        });

      if (error) throw error;

      alert("Review submitted successfully!");
      setIsReviewModalOpen(false);
      window.location.reload();
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    } finally {
      setSubmittingReview(false);
    }
  };


  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason) return;
    
    setSubmittingReport(true);
    try {
      const { error } = await supabase.from('reports').insert({
        listing_id: id,
        seller_wallet: product.seller_wallet,
        reporter_wallet: publicKey ? publicKey.toString() : 'anonymous',
        reason: reportReason,
        description: reportDescription,
        status: 'pending'
      });

      if (error) throw error;

      alert("Report submitted successfully. Administrators will review the listing.");
      setIsReportModalOpen(false);
      setReportReason("");
      setReportDescription("");
    } catch (err: any) {
      console.error("Error submitting report:", err);
      alert("Failed to submit report: " + err.message);
    } finally {
      setSubmittingReport(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this listing? This action cannot be undone.")) return;

    try {
      // Attempt soft delete (update status to 'deleted')
      const { data, error } = await supabase
        .from("listings")
        .update({ status: 'deleted' })
        .eq("id", id)
        .select();

      if (error) throw error;

      // Fallback to hard delete if update returns empty (e.g. if status column doesn't exist or RLS issue)
      if (!data || data.length === 0) {
          const { error: deleteError } = await supabase.from("listings").delete().eq("id", id);
          if (deleteError) throw deleteError;
      }

      alert("Listing deleted successfully.");
      router.push("/profile");
    } catch (error) {
      console.error("Error deleting listing:", error);
      alert("Failed to delete listing.");
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500">Loading product...</div>;
  if (!product) return <div className="p-20 text-center text-red-500">Product not found</div>;

  return (
    <div className="container mx-auto px-8 md:px-20 pb-12 pt-28">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Image Section */}
        <div className="space-y-4">
          <div 
            className="relative aspect-square rounded-3xl overflow-hidden bg-[#0a0f1c] border border-white/10 cursor-zoom-in group shadow-2xl shadow-black/50"
            onClick={() => setIsImageModalOpen(true)}
          >
            <Image 
              src={selectedImage || "https://via.placeholder.com/600"} 
              alt={product.title} 
              fill 
              className="object-cover"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center pointer-events-none">
              <ZoomIn className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-[0_0_10px_rgba(0,212,255,0.8)]" />
            </div>
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.map((img, index) => (
                <div 
                  key={index} 
                  onClick={() => setSelectedImage(img)}
                  className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImage === img ? 'border-[#00d4ff] ring-2 ring-[#00d4ff]/20 shadow-[0_0_10px_rgba(0,212,255,0.3)]' : 'border-white/10 hover:border-white/30'
                  }`}
                >
                  <Image src={img} alt={`View ${index + 1}`} fill className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Section */}
        <div className="space-y-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-[#00d4ff]/10 text-[#00d4ff] rounded-full text-xs font-bold uppercase tracking-wide border border-[#00d4ff]/20 shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                {product.category || "General"}
              </span>
              {product.item_type && (
                <span className="px-3 py-1 bg-white/5 text-gray-300 rounded-full text-xs font-medium border border-white/10">
                  {product.item_type}
                  {product.item_type === "Used" && product.condition ? ` - ${product.condition}` : ""}
                </span>
              )}
            </div>
            <h1 className={`text-4xl font-bold mb-4 flex items-center gap-3 flex-wrap ${
              product.status === 'sold' ? 'text-red-500' : 'text-white'
            }`}>
              {product.title}
              {Array.isArray(product.edited_fields) && product.edited_fields.includes('title') && (
                <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full font-medium border border-white/10">
                  Edited
                </span>
              )}
              <button 
                onClick={handleShare}
                className="ml-2 p-2 text-gray-400 hover:text-[#00d4ff] hover:bg-[#00d4ff]/10 rounded-full transition-all"
                title="Share product"
              >
                {isCopied ? <Check className="w-6 h-6 text-green-500" /> : <Share2 className="w-6 h-6" />}
              </button>
              {publicKey && publicKey.toString() !== product.seller_wallet && (
                <button 
                  onClick={() => setIsReportModalOpen(true)}
                  className="ml-2 p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                  title="Report Listing"
                >
                  <AlertCircle className="w-6 h-6" />
                </button>
              )}
            </h1>
            <div className="flex items-center gap-4 text-gray-400 text-sm">
              <span className="flex items-center gap-1 text-[#00d4ff]">
                <ShieldCheck className="w-4 h-4" />
                Escrow Protected
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                Listed {product.created_at ? formatDistanceToNow(new Date(product.created_at), { addSuffix: true }) : 'recently'}
              </span>
            </div>
          </div>

          <div className="text-3xl font-bold text-white flex items-center gap-3">
            <span className="text-xl text-gray-400 font-medium">Price:</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8] flex items-center gap-2">
              {Number(product.price).toFixed(2)} 
              <SolIcon size={24} />
            </span>
            {Array.isArray(product.edited_fields) && product.edited_fields.includes('price') && (
              <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full font-medium border border-white/10">
                Edited
              </span>
            )}
          </div>

          <div className="relative">
            {Array.isArray(product.edited_fields) && product.edited_fields.includes('description') && (
              <div className="flex justify-end mb-1">
                <span className="text-xs bg-white/10 text-gray-400 px-2 py-1 rounded-full font-medium border border-white/10">
                  Edited
                </span>
              </div>
            )}
            <p className="text-gray-300 leading-relaxed text-lg">
              {product.description && product.description.length > 200 && !isDescriptionExpanded
                ? `${product.description.slice(0, 200)}...`
                : (product.description || "No description provided.")}
            </p>
            {product.description && product.description.length > 200 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-[#00d4ff] font-bold text-sm mt-2 hover:text-[#7042f8] hover:underline transition-all"
              >
                {isDescriptionExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>

          <div className="glass-card p-4 rounded-xl border border-white/10 flex items-start gap-3 bg-[#0a0f1c]/50">
            <div className="bg-[#00d4ff]/10 p-2 rounded-lg shadow-sm text-[#00d4ff]">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-1">Delivery Method</p>
              <div className="font-bold text-white flex items-center gap-2">
                {product.delivery_method || "Home Delivery"}
                {product.delivery_method === "Pickup" && product.pickup_location && (
                  <span className="text-[#00d4ff] font-medium">
                    (at {product.pickup_location})
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#00d4ff]/5 p-6 rounded-2xl border border-[#00d4ff]/20 flex gap-4 shadow-[0_0_20px_rgba(0,212,255,0.05)]">
            <AlertCircle className="w-6 h-6 text-[#00d4ff] flex-shrink-0" />
            <div className="text-sm text-blue-100">
              <p className="font-semibold mb-1 text-[#00d4ff]">Safety First</p>
              Your funds are held in a smart contract until you confirm you've received the item as described.
            </div>
          </div>

          {deniedOrder && (
            <div className="bg-red-500/10 p-6 rounded-2xl border border-red-500/20 flex gap-4 animate-in fade-in slide-in-from-top-4">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
              <div className="text-sm text-red-200">
                <p className="font-semibold mb-1 text-red-400">Order Denied</p>
                <p className="mb-2">Your previous order for this item was denied by the seller.</p>
                {deniedOrder.cancellation_reason_title && (
                  <div className="bg-black/20 p-3 rounded-lg border border-red-500/10">
                    <p className="font-bold text-red-400 text-xs uppercase tracking-wide mb-1">Reason: {deniedOrder.cancellation_reason_title}</p>
                    <p className="text-red-300">{deniedOrder.cancellation_reason_description}</p>
                  </div>
                )}
              </div>
            </div>
          )}



          {/* Review Modal */}
          {isReviewModalOpen && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
              <div className="glass-card bg-[#030014] rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-[#00d4ff]/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-[#00d4ff]/20 shadow-[0_0_15px_rgba(0,212,255,0.3)]">
                    <Star className="w-8 h-8 text-[#00d4ff] fill-[#00d4ff]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Rate your experience</h3>
                  <p className="text-gray-400 mt-2">
                    How was your experience with this seller? Your feedback helps others.
                  </p>
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className="p-1 focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-10 h-10 ${star <= reviewRating ? 'text-[#00d4ff] fill-[#00d4ff] drop-shadow-[0_0_5px_rgba(0,212,255,0.5)]' : 'text-white/20'}`} 
                      />
                    </button>
                  ))}
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-300 mb-2">Write a review (optional)</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Tell us about the item quality and seller communication..."
                    className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#7042f8] focus:ring-2 focus:ring-[#7042f8]/20 outline-none transition-all placeholder-gray-500 resize-none h-32"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 py-3 px-6 rounded-xl border border-white/10 font-bold text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
                  >
                    Skip
                  </button>
                  <button
                    onClick={handleSubmitReview}
                    disabled={submittingReview}
                    className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#7042f8] text-white font-bold hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submittingReview ? "Submitting..." : "Submit Review"}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-4">
            {publicKey && product.seller_wallet === publicKey.toString() && (
              <div className="flex gap-4">
                <Link href={`/edit/${id}`} className="flex-1">
                  <button className="w-full py-3 bg-[#0a0f1c] text-white border border-white/20 rounded-xl font-bold text-lg hover:bg-white/5 hover:border-[#00d4ff]/50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-black/20">
                    <Edit className="w-5 h-5" />
                    Edit Listing
                  </button>
                </Link>
                {product.status !== 'sold' && (
                  <button 
                    onClick={handleDelete}
                    className="px-6 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold text-lg hover:bg-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                    title="Delete Listing"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            )}
            {product.status === 'sold' ? (
              <button 
                disabled
                className="w-full py-4 bg-white/5 text-gray-500 border border-white/10 rounded-xl font-bold text-lg cursor-not-allowed"
              >
                Item Sold
              </button>
            ) : product.status === 'pending' || transactionState === 'pending' ? (
              <>
                {(publicKey && order && order.buyer_wallet === publicKey.toString()) || transactionState === 'pending' ? (
                  <div className="space-y-4">
                    {order && order.delivery_started ? (
                      <>
                        <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 flex gap-3 text-amber-200 text-sm">
                           <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                           <div>
                             <p className="font-bold text-amber-400 mb-1">Action Required</p>
                             <p>You have not confirmed receipt yet. Once you receive the item, please click the button below to release funds to the seller.</p>
                           </div>
                        </div>
                        <button 
                          onClick={handleConfirmReceipt}
                          className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all shadow-lg flex items-center justify-center gap-2 border border-white/20"
                        >
                          <ShieldCheck className="w-5 h-5" />
                          Confirm Receipt & Release Funds
                        </button>
                        
                        {isOverdue && (
                          <div className="animate-in fade-in slide-in-from-top-2 pt-2">
                             <div className="bg-red-500/10 p-3 rounded-lg border border-red-500/20 flex gap-2 text-red-200 text-sm mb-2">
                                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
                                <p>The delivery deadline has passed. You can either confirm receipt (if you received it) or cancel the order for a full refund.</p>
                             </div>
                             <button 
                               onClick={handleClaimRefund}
                               className="w-full py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold text-lg hover:bg-red-500/20 transition-all shadow-sm flex items-center justify-center gap-2 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                             >
                               <AlertCircle className="w-5 h-5" />
                               Cancel Order & Refund
                             </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-[#00d4ff]/10 p-4 rounded-xl border border-[#00d4ff]/20 flex gap-3 text-blue-200 text-sm">
                         <Clock className="w-5 h-5 flex-shrink-0 text-[#00d4ff]" />
                         <div>
                           <p className="font-bold text-[#00d4ff] mb-1">Waiting for Seller</p>
                           <p>
                             {product.delivery_method === "Pickup" 
                               ? "Please wait for the seller to mark the item as ready for pickup."
                               : "Please wait for the seller to start the delivery process."}
                           </p>
                         </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                     {publicKey && product.seller_wallet === publicKey.toString() && (
                        <div className="bg-[#00d4ff]/10 p-4 rounded-xl border border-[#00d4ff]/20 flex gap-3 text-[#00d4ff] text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 text-[#00d4ff]" />
                  <div>
                    <p className="font-bold text-[#00d4ff] mb-1">Order Pending</p>
                    <p>The buyer has not confirmed receipt yet. Funds will be released to your wallet once the buyer confirms delivery.</p>
                  </div>
                </div>
             )}
            
            {/* Delivery/Pickup Timer for Buyer */}
            {order && order.accepted_by_seller && product.seller_wallet !== publicKey?.toString() && (
              <div className={`p-4 rounded-xl border flex gap-3 text-sm ${
                isOverdue 
                  ? "bg-red-500/10 border-red-500/20 text-red-200" 
                  : "bg-[#00d4ff]/10 border-[#00d4ff]/20 text-blue-200"
              }`}>
                <Clock className={`w-5 h-5 flex-shrink-0 ${isOverdue ? "text-red-500" : "text-[#00d4ff]"}`} />
                <div className="w-full">
                  <p className={`font-bold mb-1 ${isOverdue ? "text-red-400" : "text-[#00d4ff]"}`}>
                    {isOverdue 
                      ? (product.delivery_method === "Pickup" ? "Pickup Deadline Missed" : "Delivery Deadline Missed") 
                      : (product.delivery_method === "Pickup" ? "Pickup Deadline" : "Delivery Timer")}
                  </p>
                  <p className="mb-2">
                    {isOverdue 
                      ? (product.delivery_method === "Pickup" 
                          ? "You missed the pickup window. You can now claim a full refund." 
                          : "The seller has failed to deliver within the guaranteed time frame.")
                      : (product.delivery_method === "Pickup" 
                          ? `You must pick up the item at ${product.pickup_location || "the agreed location"} within: ${timeLeft}`
                          : `The seller has guaranteed delivery within: ${timeLeft}`)}
                  </p>

                  {/* Show Seller Contact for Pickup */}
                  {product.delivery_method === "Pickup" && (product.seller_name || product.seller_phone) && !isOverdue && (
                    <div className="mt-3 bg-black/20 p-3 rounded-lg border border-white/10">
                      <p className="font-bold text-xs uppercase tracking-wide opacity-70 mb-2">Seller Contact</p>
                      {product.seller_name && <p><span className="font-semibold">Name:</span> {product.seller_name}</p>}
                      {product.seller_phone && <p><span className="font-semibold">Phone:</span> {product.seller_phone}</p>}
                    </div>
                  )}
                  
                  {isOverdue && (
                    <button 
                      onClick={handleClaimRefund}
                      className="w-full py-2 bg-red-500/80 text-white rounded-lg font-bold hover:bg-red-600 transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                    >
                      <AlertCircle className="w-5 h-5" />
                      Refund / Cancel Order (Unfreeze Funds)
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Delivery/Pickup Timer for Seller */}
            {order && order.accepted_by_seller && product.seller_wallet === publicKey?.toString() && (
              <div className={`p-4 rounded-xl border flex gap-3 text-sm ${
                isOverdue 
                  ? "bg-red-500/10 border-red-500/20 text-red-200" 
                  : "bg-amber-500/10 border-amber-500/20 text-amber-200"
              }`}>
                <Clock className={`w-5 h-5 flex-shrink-0 ${isOverdue ? "text-red-500" : "text-amber-500"}`} />
                <div>
                  <p className={`font-bold mb-1 ${isOverdue ? "text-red-400" : "text-amber-400"}`}>
                    {isOverdue 
                      ? (product.delivery_method === "Pickup" ? "Pickup Deadline Missed" : "Delivery Overdue")
                      : (product.delivery_method === "Pickup" ? "Time Remaining for Pickup" : "Time Remaining to Deliver")}
                  </p>
                  <p>
                    {isOverdue 
                      ? (product.delivery_method === "Pickup" 
                          ? "The buyer failed to pickup in time. They can now claim a refund." 
                          : "You have missed the delivery deadline. The buyer can now claim a full refund.")
                      : (product.delivery_method === "Pickup" 
                          ? `The buyer has ${timeLeft} to pick up the item at ${product.pickup_location || "your location"}.`
                          : `You have ${timeLeft} to complete this order.`)}
                  </p>
                </div>
              </div>
            )}

            <button 
              disabled
              className="w-full py-4 bg-amber-500/10 text-amber-500 rounded-xl font-bold text-lg cursor-not-allowed border border-amber-500/20"
            >
              Sale Pending
            </button>
                  </div>
                )}
              </>
            ) : (
              (!publicKey || product.seller_wallet !== publicKey.toString()) && (
                <div className="space-y-3">
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 flex items-center gap-2 text-yellow-200 text-sm">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-yellow-500" />
                    <p>The Payment is not workable right now, this is in development phase</p>
                  </div>
                  <button 
                    onClick={handleBuy}
                    className="w-full py-4 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] border border-white/20 backdrop-blur-sm text-white rounded-xl font-bold text-lg transition-all shadow-lg shadow-[#00d4ff]/20 hover:shadow-[#00d4ff]/40"
                  >
                    Buy Now with Escrow
                  </button>
                </div>
              )
            )}
          </div>

          <div className="border-t border-white/10 pt-8 mt-8">
            <h3 className="font-semibold text-white mb-4">Seller Information</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6 bg-[#0a0f1c] p-5 rounded-2xl border border-white/10 hover:border-[#00d4ff]/50 hover:shadow-[0_0_15px_rgba(0,212,255,0.1)] transition-all group">
              <Link href={`/profile/${product.seller_wallet}`} className="flex items-center gap-4 w-full sm:w-auto flex-1">
                <div className="w-12 h-12 shrink-0 bg-gradient-to-br from-[#00d4ff] to-[#7042f8] rounded-full flex items-center justify-center text-white font-bold shadow-sm group-hover:scale-110 transition-transform overflow-hidden relative border-2 border-white/20">
                  {sellerAvatar ? (
                    <Image src={sellerAvatar} alt="Seller" fill className="object-cover rounded-full" />
                  ) : (
                    product.seller_wallet.slice(0, 2)
                  )}
                </div>
                <div>
                  <div className="font-bold text-white flex items-center gap-2 group-hover:text-[#00d4ff] transition-colors">
                    Seller Profile
                    <div onClick={(e) => e.stopPropagation()}>
                       <SellerReliabilityFlag sellerWallet={product.seller_wallet} size={16} />
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1 group-hover:text-gray-300 transition-colors">
                    View full profile & listings
                    <ChevronRight className="w-3 h-3 text-[#00d4ff]" />
                  </div>
                </div>
              </Link>
              
              <div className="w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-6 flex items-center justify-between sm:justify-start gap-3">
                 <span className="text-xs text-gray-500 font-medium sm:hidden">Wallet Address</span>
                 <CopyAddress address={product.seller_wallet} className="text-gray-400 hover:text-[#00d4ff]" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Products Section */}
      {relatedProducts.length > 0 && (
        <div className="mt-24 border-t border-white/10 pt-16">
          <h2 className="text-3xl font-bold text-white mb-8">{relatedTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((item) => (
              <ProductCard 
                key={item.id}
                id={item.id}
                title={item.title}
                price={item.price}
                image={item.image_url}
                seller={item.seller_wallet}
                category={item.category}
                status={item.status}
              />
            ))}
          </div>
        </div>
      )}
      
      {/* Buy Modal */}
      {isBuyModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsBuyModalOpen(false)}
        >
          <div 
            className="glass-card bg-[#030014] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-white/10" 
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] shadow-[0_0_10px_rgba(0,212,255,0.5)]"></div>
            
            <button 
              onClick={() => setIsBuyModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">
              {product.delivery_method === "Pickup" ? "Pickup Confirmation" : "Shipping Details"}
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              {product.delivery_method === "Pickup" 
                ? "Please review the pickup details below." 
                : "Please provide your delivery information for the seller."}
            </p>
            
            {product.delivery_method === "Pickup" && (
              <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 mb-6 text-amber-200 text-sm">
                <p className="font-bold mb-1 text-amber-400">Pickup Location:</p>
                <p>{product.pickup_location || "Contact seller for location"}</p>
                
                {(product.seller_name || product.seller_phone) && (
                  <div className="mt-3 pt-3 border-t border-amber-500/20">
                    {product.seller_name && (
                      <div className="mb-2">
                        <span className="font-bold block text-xs uppercase tracking-wide opacity-70 text-amber-400">Contact Person</span>
                        <span>{product.seller_name}</span>
                      </div>
                    )}
                    {product.seller_phone && (
                      <div>
                        <span className="font-bold block text-xs uppercase tracking-wide opacity-70 text-amber-400">Phone Number</span>
                        <span>{product.seller_phone}</span>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-3 text-xs text-amber-400 font-medium">
                  Please ensure you can travel to this location before purchasing.
                </p>
              </div>
            )}
            
            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                <input 
                  type="text" 
                  required
                  value={orderDetails.name}
                  onChange={(e) => setOrderDetails({...orderDetails, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder-gray-600"
                  placeholder="John Doe"
                />
              </div>
              
              <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 flex gap-2 text-amber-200 text-sm">
                 <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
                 <p>Please ensure you provide the correct shipping address to guarantee successful delivery.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Shipping Address</label>
                <textarea 
                  required
                  value={orderDetails.address}
                  onChange={(e) => setOrderDetails({...orderDetails, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder-gray-600"
                  placeholder="123 Main St, City, Country"
                  rows={3}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  required
                  value={orderDetails.phone}
                  onChange={(e) => setOrderDetails({...orderDetails, phone: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-[#00d4ff] focus:ring-2 focus:ring-[#00d4ff]/20 outline-none transition-all placeholder-gray-600"
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="bg-[#00d4ff]/10 p-4 rounded-xl flex items-start gap-3 text-blue-200 text-xs mt-4 border border-[#00d4ff]/20">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#00d4ff]" />
                <p>
                  Your funds will be held in escrow until you confirm receipt.
                  The seller will only see these details after the order is placed.
                </p>
              </div>

              <button 
                type="submit" 
                disabled={submittingOrder}
                className="w-full py-4 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] text-white rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all shadow-lg shadow-[#00d4ff]/20 flex items-center justify-center gap-2 border border-white/20 backdrop-blur-sm"
              >
                {submittingOrder ? (
                  <>Processing...</>
                ) : (
                  <div className="flex items-center gap-1">Confirm & Pay {product?.price} <SolIcon size={18} /></div>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200"
          onClick={() => setIsReportModalOpen(false)}
        >
          <div 
            className="glass-card bg-[#030014] rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden border border-white/10" 
            onClick={e => e.stopPropagation()}
          >
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
              <AlertCircle className="w-6 h-6 text-red-500" />
              Report Listing
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Please provide details about why this listing should be reviewed.
            </p>
            
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Reason</label>
                <select
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all"
                >
                  <option value="">Select a reason</option>
                  <option value="scam">Potential Scam</option>
                  <option value="counterfeit">Counterfeit Item</option>
                  <option value="prohibited">Prohibited Item</option>
                  <option value="offensive">Offensive Content</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                <textarea 
                  required
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0f1c] border border-white/10 text-white focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none transition-all placeholder-gray-600"
                  placeholder="Please provide more details..."
                  rows={4}
                />
              </div>

              <button 
                type="submit" 
                disabled={submittingReport}
                className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-bold text-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 border border-white/20"
              >
                {submittingReport ? "Submitting..." : "Submit Report"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {isImageModalOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageModalOpen(false)}
        >
          <button 
            onClick={() => setIsImageModalOpen(false)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-2 backdrop-blur-sm z-50"
          >
            <X className="w-8 h-8" />
          </button>

          {/* Previous Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = images.indexOf(selectedImage);
                const prevIndex = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
                setSelectedImage(images[prevIndex]);
              }}
              className="absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-4 backdrop-blur-sm z-50 group"
            >
              <ChevronRight className="w-8 h-8 rotate-180 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <div 
            className="relative w-full h-full max-w-7xl max-h-[90vh] flex items-center justify-center" 
            onClick={e => e.stopPropagation()}
          >
            <Image 
              src={selectedImage || "https://via.placeholder.com/600"} 
              alt={product.title} 
              fill 
              className="object-contain drop-shadow-2xl"
              quality={100}
              priority
            />
          </div>

          {/* Next Button */}
          {images.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const currentIndex = images.indexOf(selectedImage);
                const nextIndex = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
                setSelectedImage(images[nextIndex]);
              }}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-4 backdrop-blur-sm z-50 group"
            >
              <ChevronRight className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {/* Thumbnails in Modal */}
          {images.length > 1 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 z-50 overflow-x-auto max-w-[90vw] p-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedImage(img);
                  }}
                  className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === img ? 'border-[#00d4ff] scale-110' : 'border-white/20 hover:border-white/50 opacity-50 hover:opacity-100'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${index + 1}`} fill className="object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
