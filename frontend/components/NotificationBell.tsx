import { Bell } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabase/client";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface Notification {
  id: string;
  user_wallet: string;
  message: string;
  is_read: boolean;
  type: string;
  link?: string;
  created_at: string;
}

export const NotificationBell = () => {
  const { connected, publicKey } = useWallet();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!connected || !publicKey) return;

    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_wallet", publicKey.toString())
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (data) {
        setNotifications(data);
        setUnreadCount(data.length);
      }
    };

    fetchNotifications();

    // Real-time subscription
    const channel = supabase
      .channel(`notifications-${publicKey.toString()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_wallet=eq.${publicKey.toString()}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newNotification = payload.new as Notification;
            setNotifications((prev) => [newNotification, ...prev]);
            if (!newNotification.is_read) {
              setUnreadCount((prev) => prev + 1);
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedNotification = payload.new as Notification;
            setNotifications((prev) => 
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            );
            // Recalculate unread count
            // This is a bit expensive but accurate. Alternatively we can track diff.
            // But since we only have the updated row, we don't know the *old* status easily unless we look it up in state.
            // Let's just update the list and then re-derive unread count from the list in a separate effect or just here.
            // Actually, calculating from 'prev' is hard inside setNotifications.
            // Let's do it simply:
            setNotifications(prev => {
              const newList = prev.map(n => n.id === updatedNotification.id ? updatedNotification : n);
              setUnreadCount(newList.filter(n => !n.is_read).length);
              return newList;
            });
          } else if (payload.eventType === 'DELETE') {
            const deletedId = payload.old.id; // payload.old contains the id for DELETE
            setNotifications((prev) => {
              const newList = prev.filter((n) => n.id !== deletedId);
              setUnreadCount(newList.filter(n => !n.is_read).length);
              return newList;
            });
          }
        }
      )
      .subscribe();

    // Polling fallback (every 30 seconds) to ensure sync
    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(intervalId);
    };
  }, [connected, publicKey]);

  const markAsRead = async () => {
    if (!connected || !publicKey) return;

    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_wallet", publicKey.toString())
      .eq("is_read", false);

    if (!error) {
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    }
  };

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      markAsRead();
    }
  };

  if (!connected) return null;

  return (
    <div className="relative">
      <button 
        onClick={handleBellClick}
        className="relative p-2 text-gray-400 hover:text-[#00d4ff] transition-all rounded-full hover:bg-[#00d4ff]/10 hover:shadow-[0_0_10px_rgba(0,212,255,0.3)]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#030014] animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]"></span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-2 w-80 bg-[#0a0f1c] border border-white/10 shadow-2xl rounded-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-3 border-b border-white/10 bg-white/5 flex justify-between items-center">
              <h3 className="font-bold text-white text-sm">Notifications</h3>
              <Link href="/profile" onClick={() => setIsOpen(false)} className="text-xs text-[#00d4ff] hover:text-[#00d4ff]/80 font-medium transition-colors">
                View All
              </Link>
            </div>
            <div className="max-h-80 overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500 text-sm">
                  No new notifications
                </div>
              ) : (
                notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="p-4 border-b border-white/5 hover:bg-white/5 transition-colors">
                    <p className="text-sm text-gray-300 mb-1">{notification.message}</p>
                    <span className="text-xs text-gray-500 block">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                    {notification.link && (
                      <Link 
                        href={notification.link} 
                        className="text-xs text-[#00d4ff] font-medium mt-2 block hover:underline"
                        onClick={() => setIsOpen(false)}
                      >
                        View Details
                      </Link>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
