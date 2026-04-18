"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import api from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bell, CheckCircle2, ChevronRight, Loader2, Monitor, Moon, Palette, Sun, User } from "lucide-react";

interface AppNotification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

interface SettingsPanelProps {
  profileHref?: string;
  hideProfile?: boolean;
}

export function SettingsPanel({ profileHref, hideProfile = false }: SettingsPanelProps) {
  const initialTab = hideProfile ? "notifications" : "profile";
  const [activeTab, setActiveTab] = useState<"profile" | "notifications" | "appearance">(initialTab);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Settings</h1>
        <p className="text-muted-foreground dark:text-gray-400">Manage notification preferences and display behavior.</p>
      </div>

      <div className="flex bg-card p-1 rounded-xl w-fit border border-gray-200 dark:bg-gray-800 dark:border-gray-800">
        {!hideProfile ? (
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === "profile"
                ? "bg-emerald-600 text-white shadow-sm"
                : "text-muted-foreground hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            <User className="w-4 h-4" /> Profile
          </button>
        ) : null}
        <button
          onClick={() => setActiveTab("notifications")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "notifications"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Bell className="w-4 h-4" /> Notifications
        </button>
        <button
          onClick={() => setActiveTab("appearance")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === "appearance"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-muted-foreground hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          <Palette className="w-4 h-4" /> Appearance
        </button>
      </div>

      {activeTab === "profile" && !hideProfile ? <ProfileTab profileHref={profileHref} /> : null}
      {activeTab === "notifications" ? <NotificationsTab /> : null}
      {activeTab === "appearance" ? <AppearanceTab /> : null}
    </div>
  );
}

function ProfileTab({ profileHref }: { profileHref?: string }) {
  return (
    <Card className="dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] shadow-sm">
      <CardHeader>
        <CardTitle className="dark:text-white flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-500" /> Profile Settings
        </CardTitle>
        <CardDescription className="dark:text-gray-400">View and update your account profile information.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 bg-gray-50 dark:bg-[#12161b] rounded-xl border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 w-14 h-14 rounded-full flex items-center justify-center">
              <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">Your Profile</p>
              <p className="text-sm text-muted-foreground dark:text-gray-400">Open your profile page to edit details and preferences.</p>
            </div>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-lg">
            <Link href={profileHref ?? "#"}>
              Edit Profile
              <ChevronRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationsTab() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications/");
        setNotifications(response.data.results || response.data || []);
      } catch {
        setNotifications([
          { id: 101, title: "System Update", message: "New dashboard capabilities are now available.", is_read: false, created_at: new Date().toISOString() },
          { id: 102, title: "Reminder", message: "You have unresolved items that need attention.", is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
        ]);
      } finally {
        setLoading(false);
      }
    };
    void fetchNotifications();
  }, []);

  const markAsRead = async (id: number) => {
    try {
      await api.patch(`/notifications/${id}/read/`);
    } catch {
      // Optimistic update even when backend action fails.
    } finally {
      setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all/");
    } catch {
      // Optimistic update even when backend action fails.
    } finally {
      setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <Card className="dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] shadow-sm flex flex-col max-h-[800px]">
      <CardHeader className="border-b border-gray-100 dark:border-gray-800 flex flex-row items-center justify-between pb-4">
        <CardTitle className="dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-500" />
          Notifications
          {unreadCount > 0 ? <span className="text-xs bg-emerald-500 text-white rounded-full px-2 py-0.5 ml-2">{unreadCount}</span> : null}
        </CardTitle>
        {unreadCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-muted-foreground hover:text-emerald-600">
            Mark all read
          </Button>
        ) : null}
      </CardHeader>
      <CardContent className="p-0 overflow-y-auto flex-1">
        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">You are all caught up.</div>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800">
            {notifications.map((item) => (
              <li key={item.id} className={`p-5 transition-colors ${item.is_read ? "opacity-70 bg-transparent" : "bg-emerald-50/50 dark:bg-emerald-950/10"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      {!item.is_read ? <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" /> : null}
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                  {!item.is_read ? (
                    <Button variant="ghost" size="icon" onClick={() => markAsRead(item.id)} title="Mark as read" className="shrink-0 rounded-full hover:bg-emerald-100 hover:text-emerald-700 dark:hover:bg-emerald-900/50 dark:hover:text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </Button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function AppearanceTab() {
  const [mounted, setMounted] = useState(false);
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const themes = [
    { id: "light", label: "Light", icon: Sun, description: "Classic bright interface" },
    { id: "dark", label: "Dark", icon: Moon, description: "Easy on the eyes" },
    { id: "system", label: "System", icon: Monitor, description: "Match your device settings" },
  ];

  return (
    <Card className="dark:bg-[#1a2027] border-gray-200 dark:border-[#2a3038] shadow-sm">
      <CardHeader>
        <CardTitle className="dark:text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-500" /> Appearance
        </CardTitle>
        <CardDescription className="dark:text-gray-400">Choose the theme mode for your dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {themes.map((item) => {
            const isActive = mounted && theme === item.id;
            const IconComp = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTheme(item.id)}
                className={`group relative p-6 rounded-xl border-2 text-left transition-all duration-200 ${
                  isActive
                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 shadow-sm"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-[#12161b]"
                }`}
              >
                {isActive ? (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                ) : null}
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${
                    isActive
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                  }`}
                >
                  <IconComp className="w-6 h-6" />
                </div>
                <p className={`font-semibold text-sm mb-1 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>{item.label}</p>
                <p className="text-xs text-muted-foreground dark:text-gray-500">{item.description}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
