"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/context";
import type { Notification, NotificationType } from "@/lib/database/types";

interface NotificationContent {
  title: string;
  message: string;
  link?: string;
}

export interface NotificationWithContent extends Notification {
  parsedContent: NotificationContent;
}

interface NotificationsContextType {
  notifications: NotificationWithContent[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refetch: () => Promise<void>;
}

const NotificationsContext = createContext<
  NotificationsContextType | undefined
>(undefined);

function getNotificationDetails(
  type: NotificationType,
  content: Record<string, unknown>
): NotificationContent {
  switch (type) {
    case "match_proposal":
      return {
        title: "New Match Proposal",
        message: `${content.matchmaker_name || "Someone"} proposed a match for you`,
        link: "/matches",
      };
    case "match_accepted":
      return {
        title: "Match Accepted!",
        message: `Your match proposal was accepted`,
        link: "/matches",
      };
    case "match_rejected":
      return {
        title: "Match Declined",
        message: `Your match proposal was declined`,
        link: "/matches",
      };
    case "bet_placed":
      return {
        title: "New Bet Placed",
        message: `Someone placed a bet on your match`,
        link: "/wallet",
      };
    case "bet_won":
      return {
        title: "Bet Won!",
        message: `Congratulations! You won $${content.amount || 0}`,
        link: "/wallet",
      };
    case "bet_lost":
      return {
        title: "Bet Lost",
        message: `Your bet didn't win this time`,
        link: "/wallet",
      };
    case "milestone_reached":
      return {
        title: "Milestone Reached!",
        message: `A match you made reached ${content.milestone || "a milestone"}`,
        link: "/matches",
      };
    case "payout_processed":
      return {
        title: "Payout Received",
        message: `$${content.amount || 0} has been added to your wallet`,
        link: "/wallet",
      };
    case "friend_request":
      return {
        title: "Friend Request",
        message: `${content.from_name || "Someone"} sent you a friend request`,
        link: "/dashboard",
      };
    case "friend_accepted":
      return {
        title: "Friend Request Accepted",
        message: `${content.friend_name || "Your friend request"} was accepted`,
        link: "/dashboard",
      };
    default:
      return {
        title: "Notification",
        message: "You have a new notification",
        link: "/dashboard",
      };
  }
}

export function NotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithContent[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const supabase = useMemo(() => createClient(), []);

  const fetchNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Error fetching notifications:", error);
      setIsLoading(false);
      return;
    }

    const notificationsWithContent: NotificationWithContent[] = (
      (data || []) as Notification[]
    ).map((notification) => ({
      ...notification,
      parsedContent: getNotificationDetails(
        notification.type,
        (notification.content as Record<string, unknown>) || {}
      ),
    }));

    setNotifications(notificationsWithContent);
    setIsLoading(false);
  }, [user, supabase]);

  useEffect(() => {
    const loadNotifications = async () => {
      if (!user) {
        setNotifications([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching notifications:", error);
        setIsLoading(false);
        return;
      }

      const notificationsWithContent: NotificationWithContent[] = (
        (data || []) as Notification[]
      ).map((notification) => ({
        ...notification,
        parsedContent: getNotificationDetails(
          notification.type,
          (notification.content as Record<string, unknown>) || {}
        ),
      }));

      setNotifications(notificationsWithContent);
      setIsLoading(false);
    };

    loadNotifications();
  }, [user, supabase]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          const withContent: NotificationWithContent = {
            ...newNotification,
            parsedContent: getNotificationDetails(
              newNotification.type,
              (newNotification.content as Record<string, unknown>) || {}
            ),
          };
          setNotifications((prev) => [withContent, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, supabase]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (!error) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
        );
      }
    },
    [supabase]
  );

  const markAllAsRead = useCallback(async () => {
    if (!user) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .eq("read", false);

    if (!error) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  }, [user, supabase]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        markAllAsRead,
        refetch: fetchNotifications,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationsProvider"
    );
  }
  return context;
}
