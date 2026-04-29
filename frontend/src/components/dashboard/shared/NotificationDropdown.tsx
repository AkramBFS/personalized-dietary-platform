"use client";

import React, { useState, useEffect } from "react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Bell, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";

interface Notification {
  id: number;
  title: string;
  message: string;
  target_type: string;
  target_id: number;
  is_read: boolean;
  created_at: string;
  sender: {
    username: string;
  };
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    
    const fetchNotifications = async () => {
      try {
        const response = await api.get("/notifications/");
        if (!isMounted) return;
        
        let data = response.data;
        if (response.data && response.data.data) {
          data = response.data.data;
        }
        if (data.results) {
          data = data.results;
        }
        
        setNotifications(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Failed to fetch notifications:", err);
        setError("Failed to load notifications.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <DropdownMenu onOpenChange={setIsOpen} open={isOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative rounded-full w-10 h-10 p-0 text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-2.5 right-2.5 h-2 w-2 rounded-full bg-destructive border border-background"></span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto bg-card border-border shadow-xl custom-scrollbar">
        <DropdownMenuLabel className="font-normal py-3 flex justify-between items-center">
          <span className="font-semibold text-foreground">Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">{unreadCount} new</span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        
        {loading && notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">Loading notifications...</div>
        ) : error ? (
          <div className="py-8 px-4 text-center text-sm text-destructive flex flex-col items-center justify-center gap-2">
            <AlertCircle className="w-6 h-6 text-destructive/80" />
            <p>{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-8 text-center text-sm text-gray-500">No new notifications.</div>
        ) : (
          <div className="flex flex-col">
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} className="cursor-pointer focus:bg-accent hover:bg-accent py-3 px-4 flex flex-col items-start gap-1">
                <div className="flex justify-between items-start w-full">
                  <span className={`text-sm font-medium ${!notification.is_read ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {notification.title}
                  </span>
                  {!notification.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-1">{notification.message}</p>
                <div className="flex items-center justify-between w-full mt-2">
                  <p className="text-[10px] text-gray-400">{new Date(notification.created_at).toLocaleDateString()}</p>
                  {notification.sender?.username && (
                    <span className="text-[10px] text-gray-400">from {notification.sender.username}</span>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
