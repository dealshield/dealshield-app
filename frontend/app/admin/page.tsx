"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { 
  LayoutDashboard, 
  Users, 
  User,
  ShoppingBag, 
  AlertCircle, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle, 
  XCircle, 
  Clock, 
  ChevronRight, 
  Shield, 
  Flag, 
  X, 
  Copy, 
  LogOut, 
  Settings, 
  Package,
  Bell,
  Trash2,
  Eye,
  Ban,
  MoreHorizontal
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { format, subDays, startOfDay, eachDayOfInterval } from 'date-fns';
import { CopyAddress } from '@/components/CopyAddress';
import { getImages } from "@/utils/imageHelper";
import Link from 'next/link';
import Image from 'next/image';

const DeleteListingModal = ({ 
  listing, 
  onClose, 
  onConfirm, 
  isDeleting 
}: { 
  listing: any, 
  onClose: () => void, 
  onConfirm: (reason: string) => void,
  isDeleting: boolean
}) => {
  const [reason, setReason] = useState("");

  const handleConfirm = () => {
    if (!reason.trim()) {
        alert("Please provide a reason for deletion.");
        return;
    }
    onConfirm(reason);
  };

  return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[110] p-4 backdrop-blur-sm" onClick={onClose}>
          <div className="glass-card bg-[#030014] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10 relative" onClick={e => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-white mb-4">Delete Listing</h2>
              <p className="text-gray-400 mb-6">Are you sure you want to delete "{listing.title}"? This action cannot be undone.</p>
              
              <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-400 mb-2">Reason for Deletion</label>
                  <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white placeholder-gray-500 focus:outline-none focus:border-red-500/50 transition-colors"
                      rows={4}
                      placeholder="Please explain why this listing is being deleted..."
                  />
              </div>

              <div className="flex gap-3">
                  <button
                      onClick={onClose}
                      className="flex-1 py-3 px-4 bg-white/5 text-white border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-all"
                      disabled={isDeleting}
                  >
                      Cancel
                  </button>
                  <button
                      onClick={handleConfirm}
                      className="flex-1 py-3 px-4 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
                      disabled={isDeleting}
                  >
                      {isDeleting ? "Deleting..." : "Delete Listing"}
                  </button>
              </div>
          </div>
      </div>
  );
};

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authUsername, setAuthUsername] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const auth = localStorage.getItem("admin_auth");
      if (auth === "true") {
        setIsAuthenticated(true);
      }
      setIsAuthChecking(false);
    };
    checkAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (authUsername === "dealshield" && authPassword === "hereinnepal1!") {
      setIsAuthenticated(true);
      localStorage.setItem("admin_auth", "true");
      setAuthError("");
    } else {
      setAuthError("Invalid credentials");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("admin_auth");
    setIsAuthenticated(false);
    window.location.href = "/";
  };

  const [activeTab, setActiveTab] = useState('overview');
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalListings: 0,
    activeReports: 0,
    totalOrders: 0,
    totalVolume: 0
  });
  const [chartData, setChartData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedListing, setSelectedListing] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [listingToDelete, setListingToDelete] = useState<any>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  const filteredReports = reports.filter(report => 
    String(report.id ?? '').includes(searchQuery) ||
    report.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.reporter_wallet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.seller_wallet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = users.filter(user => 
    String(user.id ?? '').includes(searchQuery) ||
    user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.wallet_address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredListings = listings.filter(listing => 
    String(listing.id ?? '').includes(searchQuery) ||
    listing.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    listing.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredOrders = orders.filter(order => 
    String(order.id ?? '').includes(searchQuery) ||
    order.buyer_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.buyer_wallet?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.listings?.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );


  useEffect(() => {
    fetchDashboardData();

    // Real-time subscriptions
    const channels = [
      supabase
        .channel('admin-reports')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, () => {
          fetchDashboardData();
        })
        .subscribe(),
      supabase
        .channel('admin-users')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
          fetchDashboardData();
        })
        .subscribe(),
      supabase
        .channel('admin-listings')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'listings' }, () => {
          fetchDashboardData();
        })
        .subscribe(),
      supabase
        .channel('admin-orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
          fetchDashboardData();
        })
        .subscribe()
    ];

    return () => {
      channels.forEach(channel => supabase.removeChannel(channel));
    };
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch stats
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact' });
      const { count: listingsCount } = await supabase.from('listings').select('*', { count: 'exact' });
      const { count: reportsCount } = await supabase.from('reports').select('*', { count: 'exact' }).eq('status', 'pending');
      const { count: ordersCount } = await supabase.from('orders').select('*', { count: 'exact' });
      
      setStats({
        totalUsers: usersCount || 0,
        totalListings: listingsCount || 0,
        activeReports: reportsCount || 0,
        totalOrders: ordersCount || 0,
        totalVolume: 0 // Placeholder
      });

      // Fetch data
      const { data: reportsData } = await supabase
        .from('reports')
        .select('*, listings(*)')
        .order('created_at', { ascending: false });
      
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, listings(*)')
        .order('created_at', { ascending: false })
        .limit(50);

      // Process reports to include images
      const processedReports = (reportsData || []).map(report => ({
        ...report,
        listings: report.listings ? {
          ...report.listings,
          images: getImages(report.listings.image_url)
        } : null
      }));

      // Process listings to include images
      const processedListings = (listingsData || []).map(listing => ({
        ...listing,
        images: getImages(listing.image_url)
      }));

      setReports(processedReports);
      setUsers(usersData || []);
      setListings(processedListings);
      setOrders(ordersData || []);

      // Fetch chart data (last 30 days)
      const thirtyDaysAgo = subDays(new Date(), 30);
      
      const { data: usersHistory } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: listingsHistory } = await supabase
        .from('listings')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { data: ordersHistory } = await supabase
        .from('orders')
        .select('created_at')
        .gte('created_at', thirtyDaysAgo.toISOString());

      // Process chart data
      const days = eachDayOfInterval({ start: thirtyDaysAgo, end: new Date() });
      const dailyData = days.map(day => {
        const dateStr = format(day, 'MMM dd');
        const dayStart = startOfDay(day);
        const nextDay = new Date(dayStart);
        nextDay.setDate(dayStart.getDate() + 1);

        const usersCount = (usersHistory || []).filter(u => {
            const d = new Date(u.created_at);
            return d >= dayStart && d < nextDay;
        }).length;

        const listingsCount = (listingsHistory || []).filter(l => {
            const d = new Date(l.created_at);
            return d >= dayStart && d < nextDay;
        }).length;
        
        const ordersCount = (ordersHistory || []).filter(o => {
            const d = new Date(o.created_at);
            return d >= dayStart && d < nextDay;
        }).length;

        return {
          name: dateStr,
          users: usersCount,
          listings: listingsCount,
          orders: ordersCount
        };
      });

      setChartData(dailyData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveReport = async (reportId: number) => {
    try {
      const { error } = await supabase
        .from('reports')
        .update({ status: 'resolved' })
        .eq('id', reportId);

      if (error) throw error;

      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
      setStats(prev => ({ ...prev, activeReports: Math.max(0, prev.activeReports - 1) }));
    } catch (error) {
      console.error('Error resolving report:', error);
    }
  };

  const flagUser = async (wallet: string) => {
    if (!wallet) return;
    if (confirm(`Are you sure you want to flag user ${wallet}?`)) {
        // Implement flag logic here
        console.log('Flagging user:', wallet);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if (error) throw error;
        setUsers(users.filter(u => u.id !== userId));
        setStats(prev => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Failed to delete user');
    }
  };

  const handleDeleteListing = async (listingId: string, listingObject?: any) => {
    const listing = listingObject || listings.find(l => l.id === listingId) || (selectedListing?.id === listingId ? selectedListing : null);
    if (!listing) return false;
    
    setListingToDelete(listing);
    setIsDeleteModalOpen(true);
    return false;
  };

  const handleConfirmDeleteListing = async (reason: string) => {
    if (!listingToDelete) return;
    setIsDeleting(true);
    try {
        // 1. Update listing status
        const { error: updateError } = await supabase
            .from('listings')
            .update({ status: 'deleted' })
            .eq('id', listingToDelete.id);

        if (updateError) throw updateError;

        // 2. Create notification
        const { error: notifError } = await supabase
            .from('notifications')
            .insert({
                user_wallet: listingToDelete.seller_wallet,
                message: `Your listing "${listingToDelete.title}" was deleted by admin. Reason: ${reason}`,
                type: 'listing_deleted',
                link: '/profile'
            });
        
        if (notifError) console.error("Error creating notification:", notifError);

        // 3. Update local state
        setListings(listings.filter(l => l.id !== listingToDelete.id));
        setStats(prev => ({ ...prev, totalListings: Math.max(0, prev.totalListings - 1) }));
        
        // Update reports state if the deleted listing is part of any report
        setReports(prevReports => prevReports.map(report => {
            if (report.listings && report.listings.id === listingToDelete.id) {
                return {
                    ...report,
                    listings: {
                        ...report.listings,
                        status: 'deleted'
                    }
                };
            }
            return report;
        }));

        // Update selected report if it contains the deleted listing
        if (selectedReport?.listings?.id === listingToDelete.id) {
            setSelectedReport((prev: any) => ({
                ...prev,
                listings: {
                    ...prev.listings,
                    status: 'deleted'
                }
            }));
        }

        setIsDeleteModalOpen(false);
        setListingToDelete(null);
        
        // Close details modal if open
        if (selectedListing?.id === listingToDelete.id) {
            setSelectedListing(null);
        }
    } catch (error) {
        console.error("Error deleting listing:", error);
        alert("Failed to delete listing.");
    } finally {
        setIsDeleting(false);
    }
  };

  const ListingDetailsModal = ({ listing, onClose }: { listing: any, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-card bg-[#030014] rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10 relative" onClick={e => e.stopPropagation()}>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
              <ShoppingBag className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Listing Details</h2>
              <p className="text-gray-400 text-sm">ID: {listing.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div className="aspect-square relative rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                {listing.images && listing.images[0] ? (
                  <Image
                    src={listing.images[0]}
                    alt={listing.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-600">
                    <ShoppingBag className="w-12 h-12 opacity-20" />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Price</p>
                  <p className="text-xl font-bold text-white">{listing.price} SOL</p>
                </div>
                <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                    listing.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                    listing.status === 'deleted' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                  }`}>
                    {listing.status || 'active'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Item Info</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-bold text-white mb-2">{listing.title}</h4>
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                      <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                        {listing.description || "No description provided."}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Seller Wallet</p>
                    {listing.seller_wallet ? (
                      <CopyAddress address={listing.seller_wallet} className="text-gray-300" />
                    ) : (
                      <span className="text-gray-400 text-sm font-mono">N/A</span>
                    )}
                  </div>

                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Created At</p>
                    <p className="text-white text-sm">
                      {listing.created_at && !isNaN(new Date(listing.created_at).getTime()) 
                        ? format(new Date(listing.created_at), 'PPP p')
                        : 'Unknown date'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Link 
                  href={`/product/${listing.id}`} 
                  target="_blank"
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold text-white transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  View Public
                </Link>
                <button
                  onClick={async () => {
                    const success = await handleDeleteListing(listing.id);
                    if (success) onClose();
                  }}
                  className="flex-1 py-3 px-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ReportDetailsModal = ({ report, onClose }: { report: any, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-card bg-[#030014] rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10 relative" onClick={e => e.stopPropagation()}>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Report Details</h2>
              <p className="text-gray-400 text-sm">ID: {report.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Report Info</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Reason</p>
                    <p className="text-white font-medium">{report.reason}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                      report.status === 'pending' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      report.status === 'resolved' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                      'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                    }`}>
                      {report.status}
                    </span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Date</p>
                    <p className="text-white">{format(new Date(report.created_at), 'PPP p')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Parties Involved</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Reporter</p>
                    <CopyAddress address={report.reporter_wallet} className="text-gray-300" />
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                    <p className="text-xs text-gray-500 mb-1">Seller</p>
                    <CopyAddress address={report.seller_wallet || report.listings?.seller_wallet} className="text-gray-300" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Description</h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5 h-full">
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {report.description || "No additional description provided."}
                  </p>
                </div>
              </div>

              {report.listings && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Reported Listing</h3>
                  <Link href={`/product/${report.listings.id}`} target="_blank" className="block bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      {report.listings.images && report.listings.images[0] && (
                        <img src={report.listings.images[0]} alt="" className="w-12 h-12 rounded-lg object-cover" />
                      )}
                      <div>
                        <p className="text-white font-medium group-hover:text-cyan-400 transition-colors line-clamp-1">{report.listings.title}</p>
                        <p className="text-sm text-gray-400">{report.listings.price} SOL</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-500 ml-auto group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {report.status === 'pending' && (
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-white/10">
              <button
                onClick={() => {
                  handleResolveReport(report.id);
                  onClose();
                }}
                className="flex-1 py-3 px-4 bg-green-500/10 text-green-400 border border-green-500/20 rounded-xl font-bold hover:bg-green-500/20 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                Resolve
              </button>
              
              {report.listings && report.listings.status !== 'deleted' && (
                <button
                  onClick={() => handleDeleteListing(String(report.listings.id), report.listings)}
                  className="flex-1 py-3 px-4 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Item
                </button>
              )}

              <button
                onClick={() => {
                  flagUser(report.seller_wallet || report.listings?.seller_wallet);
                  onClose();
                }}
                className="flex-1 py-3 px-4 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-xl font-bold hover:bg-orange-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Flag className="w-5 h-5" />
                Flag Seller
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const OrderDetailsModal = ({ order, onClose }: { order: any, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm" onClick={onClose}>
        <div className="glass-card bg-[#030014] rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in fade-in zoom-in duration-200 border border-white/10 relative" onClick={e => e.stopPropagation()}>
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
              <Package className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Order Details</h2>
              <p className="text-gray-400 text-sm">ID: {order.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Buyer Info</h3>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                    <p className="text-white font-medium mb-1">{order.buyer_name || 'Anonymous'}</p>
                    <CopyAddress address={order.buyer_wallet} className="text-gray-400 text-sm" />
                    <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-1">Shipping Address</p>
                        <p className="text-gray-300 text-sm">{order.shipping_address || 'N/A'}</p>
                    </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Order Info</h3>
                <div className="space-y-3">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between">
                    <span className="text-gray-400 text-sm">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold capitalize ${
                      order.status === 'completed' ? 'bg-green-500/10 text-green-400' :
                      order.status === 'cancelled' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between">
                    <span className="text-gray-400 text-sm">Date</span>
                    <span className="text-white text-sm">{format(new Date(order.created_at), 'MMM d, yyyy')}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Item Details</h3>
                {order.listings ? (
                    <Link href={`/product/${order.listings.id}`} target="_blank" className="block bg-white/5 p-4 rounded-xl border border-white/5 group hover:bg-white/10 transition-colors">
                        <div className="aspect-video relative rounded-lg overflow-hidden mb-3 bg-black/50">
                            {order.listings.images && order.listings.images[0] && (
                                <img src={order.listings.images[0]} alt="" className="w-full h-full object-cover" />
                            )}
                        </div>
                        <h4 className="font-bold text-white mb-1 group-hover:text-cyan-400 transition-colors">{order.listings.title}</h4>
                        <p className="text-purple-400 font-bold">{order.listings.price} SOL</p>
                    </Link>
                ) : (
                    <div className="bg-white/5 p-4 rounded-xl border border-white/5 text-gray-500 italic">
                        Item information unavailable
                    </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isAuthChecking) {
    return <div className="min-h-screen bg-[#030014] flex items-center justify-center text-white">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#030014] flex items-center justify-center p-4">
        <div className="glass-card bg-[#030014] rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#00d4ff] to-[#7042f8]"></div>
          
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#7042f8] to-[#00d4ff] flex items-center justify-center text-white font-bold text-2xl mx-auto mb-4 shadow-lg shadow-purple-500/20">
              DS
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Admin Access
            </h1>
            <p className="text-gray-400">Restricted Area. Please log in.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Username</label>
              <div className="relative">
                <input 
                  type="text" 
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
                  placeholder="Enter username"
                />
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input 
                  type="password" 
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-10 text-white placeholder-gray-600 focus:outline-none focus:border-[#00d4ff]/50 transition-colors"
                  placeholder="Enter password"
                />
                <Shield className="w-5 h-5 text-gray-500 absolute left-3 top-3.5" />
              </div>
            </div>

            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {authError}
              </div>
            )}

            <button 
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#00d4ff] to-[#7042f8] text-white rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg shadow-purple-500/25 active:scale-[0.98]"
            >
              Login to Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030014] text-white flex font-sans selection:bg-purple-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-[#030014]/50 backdrop-blur-xl flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#7042f8] to-[#00d4ff] flex items-center justify-center text-white font-bold">
              DS
            </div>
            <span className="text-xl font-bold tracking-tight">
              Deal<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7042f8]">Shield</span>
            </span>
          </Link>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Menu</div>
          
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'overview' 
                ? 'bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/20 text-white border border-white/10 shadow-lg shadow-purple-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'reports' 
                ? 'bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/20 text-white border border-white/10 shadow-lg shadow-purple-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <div className="relative">
              <AlertCircle className="w-5 h-5" />
              {stats.activeReports > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-[#030014]" />
              )}
            </div>
            <span className="font-medium">Reports</span>
            {stats.activeReports > 0 && (
              <span className="ml-auto bg-red-500/20 text-red-400 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.activeReports}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'users' 
                ? 'bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/20 text-white border border-white/10 shadow-lg shadow-purple-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Users</span>
          </button>

          <button
            onClick={() => setActiveTab('listings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'listings' 
                ? 'bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/20 text-white border border-white/10 shadow-lg shadow-purple-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="font-medium">Listings</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === 'orders' 
                ? 'bg-gradient-to-r from-[#7042f8]/20 to-[#00d4ff]/20 text-white border border-white/10 shadow-lg shadow-purple-500/10' 
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Orders</span>
          </button>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Exit Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-[#030014]/80 backdrop-blur-xl border-b border-white/10 px-8 py-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-white capitalize">
            {activeTab}
          </h2>

          {activeTab !== 'overview' && (
            <div className="flex-1 max-w-md relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-5 h-5 text-gray-500 group-focus-within:text-[#00d4ff] transition-colors" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="block w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00d4ff]/50 focus:border-[#00d4ff]/50 focus:bg-white/10 transition-all"
              />
            </div>
          )}

          <div className="flex items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-300">System Online</span>
             </div>
             <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-purple-500 rounded-full" />
             </button>
          </div>
        </header>

        <div className="p-8">
           {/* Tab Content Logic */}
           {activeTab === 'overview' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[
                    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                    { label: 'Active Reports', value: stats.activeReports, icon: AlertCircle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
                    { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
                    { label: 'Total Listings', value: stats.totalListings, icon: ShoppingBag, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                    { label: 'Total Volume', value: `${stats.totalVolume} SOL`, icon: Shield, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
                  ].map((stat, i) => (
                    <div key={i} className={`p-6 rounded-2xl border ${stat.border} ${stat.bg} backdrop-blur-sm relative overflow-hidden group`}>
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <stat.icon className="w-16 h-16" />
                      </div>
                      <div className="relative">
                        <p className="text-gray-400 text-sm font-medium uppercase tracking-wider mb-2">{stat.label}</p>
                        <h3 className={`text-3xl font-bold ${stat.color}`}>{stat.value}</h3>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Growth Chart */}
                  <div className="bg-[#030014]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      Platform Growth
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                            </linearGradient>
                            <linearGradient id="colorListings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            minTickGap={30}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#030014', 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend />
                          <Area 
                            type="monotone" 
                            dataKey="users" 
                            name="New Users"
                            stroke="#3b82f6" 
                            fillOpacity={1} 
                            fill="url(#colorUsers)" 
                            strokeWidth={2}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="listings" 
                            name="New Listings"
                            stroke="#a855f7" 
                            fillOpacity={1} 
                            fill="url(#colorListings)" 
                            strokeWidth={2}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Orders Chart */}
                  <div className="bg-[#030014]/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                      <div className="p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <Package className="w-4 h-4 text-orange-400" />
                      </div>
                      Order Activity
                    </h3>
                    <div className="h-[300px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                          <XAxis 
                            dataKey="name" 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            minTickGap={30}
                          />
                          <YAxis 
                            stroke="#6b7280" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                          />
                          <Tooltip 
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{ 
                              backgroundColor: '#030014', 
                              borderColor: 'rgba(255,255,255,0.1)', 
                              borderRadius: '12px',
                              color: '#fff'
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="orders" 
                            name="Orders"
                            fill="#f97316" 
                            radius={[4, 4, 0, 0]}
                            maxBarSize={40}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
             </div>
           )}

           {activeTab === 'reports' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {filteredReports.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center bg-white/5 rounded-3xl border border-white/10 border-dashed">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                      <Search className="w-8 h-8 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">No reports found</h3>
                    <p className="text-gray-400 max-w-sm">
                      {searchQuery ? "Try adjusting your search terms" : "There are no pending reports at the moment."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredReports.map((report) => (
                      <div 
                        key={report.id} 
                        onClick={() => {
                          setSelectedReport(report);
                        }}
                        className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-6 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                                report.status === 'pending' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                             }`}>
                                <AlertCircle className="w-6 h-6" />
                             </div>
                             <div>
                                <h4 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                                  {report.reason}
                                </h4>
                                <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {format(new Date(report.created_at), 'MMM d, yyyy')}
                                  </span>
                                  <span>•</span>
                                  <span>ID: {report.id}</span>
                                </div>
                             </div>
                          </div>
                          <div className="flex items-center gap-4">
                             <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                report.status === 'pending' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'
                             }`}>
                                {report.status}
                             </span>
                             <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-white transition-colors" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
           )}

           {activeTab === 'users' && (
              <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-6 font-semibold text-gray-400">User</th>
                        <th className="p-6 font-semibold text-gray-400">Wallet</th>
                        <th className="p-6 font-semibold text-gray-400">Joined</th>
                        <th className="p-6 font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-gray-500">
                            No users found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user, i) => (
                        <tr key={user.id || user.wallet_address || i} className="hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                                {user.username?.[0]?.toUpperCase() || <User className="w-5 h-5" />}
                              </div>
                              <span className="font-medium text-white">{user.username || 'Anonymous'}</span>
                            </div>
                          </td>
                          <td className="p-6">
                            <CopyAddress address={user.wallet_address} />
                          </td>
                          <td className="p-6 text-gray-400">
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => flagUser(user.wallet_address)}
                                  className="p-2 hover:bg-yellow-500/10 rounded-lg transition-colors text-gray-400 hover:text-yellow-400"
                                  title="Flag User"
                                >
                                  <Flag className="w-5 h-5" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(user.id)}
                                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
           )}

           {activeTab === 'listings' && (
              <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-6 font-semibold text-gray-400">Item</th>
                        <th className="p-6 font-semibold text-gray-400">Price</th>
                        <th className="p-6 font-semibold text-gray-400">Status</th>
                        <th className="p-6 font-semibold text-gray-400">Created</th>
                        <th className="p-6 font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredListings.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-gray-500">
                            No listings found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredListings.map((listing) => (
                        <tr key={listing.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 rounded-lg overflow-hidden bg-black/50 relative flex-shrink-0">
                                {listing.images && listing.images[0] ? (
                                  <Image
                                    src={listing.images[0]}
                                    alt={listing.title}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full text-gray-600">
                                    <ShoppingBag className="w-6 h-6 opacity-20" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="font-bold text-white line-clamp-1">{listing.title}</h3>
                                <p className="text-gray-400 text-xs line-clamp-1 max-w-[200px]">{listing.description}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                            <span className="font-bold text-white">{listing.price} SOL</span>
                          </td>
                          <td className="p-6">
                             <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                                listing.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                                listing.status === 'deleted' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                             }`}>
                                {listing.status || 'active'}
                             </span>
                          </td>
                          <td className="p-6 text-gray-400">
                            {format(new Date(listing.created_at), 'MMM d, yyyy')}
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-2">
                                <Link 
                                  href={`/product/${listing.id}`} 
                                  target="_blank" 
                                  className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" 
                                  title="View Details"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                   <Eye className="w-5 h-5" />
                                </Link>
                                <button 
                                   onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteListing(listing.id);
                                   }}
                                   className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors"
                                   title="Delete Listing"
                                >
                                   <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
           )}

           {activeTab === 'orders' && (
              <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/10">
                        <th className="p-6 font-semibold text-gray-400">Order ID</th>
                        <th className="p-6 font-semibold text-gray-400">Buyer</th>
                        <th className="p-6 font-semibold text-gray-400">Item</th>
                        <th className="p-6 font-semibold text-gray-400">Status</th>
                        <th className="p-6 font-semibold text-gray-400">Date</th>
                        <th className="p-6 font-semibold text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-gray-500">
                            No orders found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/5 transition-colors">
                          <td className="p-6">
                            <div className="font-mono text-sm text-gray-400">
                              {order.id.slice(0, 8)}...
                            </div>
                          </td>
                          <td className="p-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                {order.buyer_name?.[0]?.toUpperCase() || <User className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="font-medium text-white">{order.buyer_name || 'Anonymous'}</p>
                                <CopyAddress address={order.buyer_wallet} className="text-xs text-gray-500" />
                              </div>
                            </div>
                          </td>
                          <td className="p-6">
                             {order.listings ? (
                               <Link href={`/product/${order.listings.id}`} target="_blank" className="flex items-center gap-3 group">
                                 {order.listings.images && order.listings.images[0] ? (
                                   <div className="w-10 h-10 rounded-lg overflow-hidden bg-black/50 relative">
                                      <Image 
                                        src={order.listings.images[0]} 
                                        alt="" 
                                        fill 
                                        className="object-cover"
                                      />
                                   </div>
                                 ) : (
                                   <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                                     <ShoppingBag className="w-5 h-5 text-gray-500" />
                                   </div>
                                 )}
                                 <div>
                                   <p className="font-medium text-white group-hover:text-cyan-400 transition-colors line-clamp-1">{order.listings.title}</p>
                                   <p className="text-xs text-gray-500">{order.listings.price} SOL</p>
                                 </div>
                               </Link>
                             ) : (
                               <span className="text-gray-500 italic">Item deleted</span>
                             )}
                          </td>
                          <td className="p-6">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold capitalize ${
                              order.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              order.status === 'cancelled' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                              'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {order.status || 'pending'}
                            </span>
                          </td>
                          <td className="p-6 text-gray-400">
                            {format(new Date(order.created_at), 'MMM d, p')}
                          </td>
                          <td className="p-6">
                            <button 
                              onClick={() => setSelectedOrder(order)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                              title="View Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                    </tbody>
                  </table>
                </div>
              </div>
           )}
        </div>
      </main>

      {/* Modal */}
      {selectedReport && (
        <ReportDetailsModal 
          report={selectedReport} 
          onClose={() => {
            setSelectedReport(null);
          }} 
        />
      )}

      {selectedOrder && (
        <OrderDetailsModal 
          order={selectedOrder} 
          onClose={() => setSelectedOrder(null)} 
        />
      )}

      {selectedListing && (
        <ListingDetailsModal 
          listing={selectedListing} 
          onClose={() => setSelectedListing(null)} 
        />
      )}

      {isDeleteModalOpen && listingToDelete && (
        <DeleteListingModal 
          listing={listingToDelete} 
          onClose={() => {
            setIsDeleteModalOpen(false);
            setListingToDelete(null);
          }}
          onConfirm={handleConfirmDeleteListing}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}