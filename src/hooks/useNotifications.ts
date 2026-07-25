 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 import { useAuth } from "@/contexts/AuthContext";
 
 export interface Notification {
   id: string;
   type: string;
   title: string;
   message: string;
   data: Record<string, unknown>;
   read: boolean;
   created_at: string;
 }
 
 export function useNotifications() {
   const { user } = useAuth();
   const [notifications, setNotifications] = useState<Notification[]>([]);
   const [unreadCount, setUnreadCount] = useState(0);
   const [isLoading, setIsLoading] = useState(true);
 
   const fetchNotifications = useCallback(async () => {
     if (!user) {
       setNotifications([]);
       setUnreadCount(0);
       setIsLoading(false);
       return;
     }
 
     try {
       const { data, error } = await supabase
         .from("notifications")
         .select("*")
         .eq("user_id", user.id)
         .order("created_at", { ascending: false })
         .limit(50);
 
       if (error) throw error;
 
       const notifs = (data || []) as Notification[];
       setNotifications(notifs);
       setUnreadCount(notifs.filter((n) => !n.read).length);
     } catch (error) {
       console.error("Error fetching notifications:", error);
     } finally {
       setIsLoading(false);
     }
   }, [user]);
 
   useEffect(() => {
     fetchNotifications();
   }, [fetchNotifications]);
 
  // Subscribe to realtime notifications (INSERT/UPDATE/DELETE so the
  // unread badge stays in sync across tabs and devices).
  useEffect(() => {
    if (!user) return;
    const filter = `user_id=eq.${user.id}`;

    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter },
        (payload) => {
          const n = payload.new as Notification;
          setNotifications((prev) => (prev.some((p) => p.id === n.id) ? prev : [n, ...prev]));
          if (!n.read) setUnreadCount((prev) => prev + 1);
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter },
        (payload) => {
          const next = payload.new as Notification;
          // Compare against the row we currently hold in state (not
          // payload.old), so optimistic updates from markAsRead /
          // markAllAsRead don't cause a double-decrement of the badge.
          setNotifications((list) => {
            const current = list.find((n) => n.id === next.id);
            if (current) {
              if (current.read === false && next.read === true) {
                setUnreadCount((c) => Math.max(0, c - 1));
              } else if (current.read === true && next.read === false) {
                setUnreadCount((c) => c + 1);
              }
              return list.map((n) => (n.id === next.id ? next : n));
            }
            // Row wasn't in our list yet — add it and count if unread.
            if (!next.read) setUnreadCount((c) => c + 1);
            return [next, ...list];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter },
        (payload) => {
          const old = payload.old as Partial<Notification>;
          setNotifications((list) => {
            const current = list.find((n) => n.id === old.id);
            if (current && !current.read) {
              setUnreadCount((c) => Math.max(0, c - 1));
            }
            return list.filter((n) => n.id !== old.id);
          });
        },
      )

      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
 
   const markAsRead = async (notificationId: string) => {
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ read: true })
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) =>
         prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
       );
       setUnreadCount((prev) => Math.max(0, prev - 1));
     } catch (error) {
       console.error("Error marking notification as read:", error);
     }
   };
 
   const markAllAsRead = async () => {
     if (!user) return;
 
     try {
       const { error } = await supabase
         .from("notifications")
         .update({ read: true })
         .eq("user_id", user.id)
         .eq("read", false);
 
       if (error) throw error;
 
       setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
       setUnreadCount(0);
     } catch (error) {
       console.error("Error marking all as read:", error);
     }
   };
 
   const deleteNotification = async (notificationId: string) => {
     try {
       const notif = notifications.find((n) => n.id === notificationId);
       const { error } = await supabase
         .from("notifications")
         .delete()
         .eq("id", notificationId);
 
       if (error) throw error;
 
       setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
       if (notif && !notif.read) {
         setUnreadCount((prev) => Math.max(0, prev - 1));
       }
     } catch (error) {
       console.error("Error deleting notification:", error);
     }
   };
 
   return {
     notifications,
     unreadCount,
     isLoading,
     markAsRead,
     markAllAsRead,
     deleteNotification,
     refresh: fetchNotifications,
   };
 }