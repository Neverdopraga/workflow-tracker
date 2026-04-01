"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, CheckCheck, Trash2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Notification } from "@/lib/types";
import { useRealtime } from "@/lib/useRealtime";

const typeColors = {
  info: "bg-primary-50 border-primary-200",
  success: "bg-emerald-50 border-emerald-200",
  warning: "bg-amber-50 border-amber-200",
  error: "bg-red-50 border-red-200",
};

const dotColors = {
  info: "bg-primary-400",
  success: "bg-emerald-400",
  warning: "bg-amber-400",
  error: "bg-red-400",
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);
    if (data) setNotifications(data);
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Real-time notifications
  useRealtime(
    "notifications",
    useCallback(
      (payload) => {
        if (payload.eventType === "INSERT") {
          setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 20));
        }
      },
      []
    )
  );

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    await supabase.from("notifications").update({ read: true }).eq("id", id);
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications").update({ read: true }).eq("read", false);
  };

  const clearAll = async () => {
    setNotifications([]);
    await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="w-9 h-9 rounded-xl border border-border flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition relative"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center min-w-[18px] px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-border shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-bold text-gray-900">Notifications</h3>
            <div className="flex gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[10px] font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 px-2 py-1 rounded-md"
                >
                  <CheckCheck className="w-3 h-3 inline mr-0.5" />
                  Read all
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-[10px] font-semibold text-red-500 hover:text-red-600 bg-red-50 px-2 py-1 rounded-md"
                >
                  <Trash2 className="w-3 h-3 inline mr-0.5" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-border-light hover:bg-gray-50 transition cursor-pointer ${
                    !n.read ? "bg-primary-50/30" : ""
                  }`}
                  onClick={() => !n.read && markRead(n.id)}
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${dotColors[n.type]}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${!n.read ? "font-semibold text-gray-900" : "text-gray-600"}`}>
                      {n.message}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.created_at)}</p>
                  </div>
                  {!n.read && (
                    <button className="text-gray-300 hover:text-primary-500 mt-0.5">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="py-10 text-center text-gray-400 text-xs">
                No notifications yet
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
