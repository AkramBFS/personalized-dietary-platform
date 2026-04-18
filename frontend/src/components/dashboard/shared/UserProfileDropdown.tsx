"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronDown, User, Settings, LogOut, Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

interface UserProfileDropdownProps {
  user: {
    username: string;
    email: string;
    avatarUrl?: string;
  };
  role: string;
}

export function UserProfileDropdown({ user, role }: UserProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { setTheme, resolvedTheme } = useTheme();

  // useEffect to avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Fallback initial
  const initial = user.username.charAt(0).toUpperCase();

  return (
    <DropdownMenu onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-3 p-1 pl-2 pr-3 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          aria-label="User Profile Menu"
          aria-expanded={isOpen}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 font-semibold text-sm">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block dark:text-gray-200">
            {user.username}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 dark:bg-[#1a2027] border-gray-200 dark:border-gray-800 shadow-xl"
      >
        <DropdownMenuLabel className="font-normal py-3">
          <div className="flex flex-col space-y-1 text-sm">
            <p className="font-semibold text-gray-900 dark:text-white leading-none">
              {user.username}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
        {role !== "high_admin" ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-gray-800/50 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2.5 group"
          >
            <Link
              href={`/${role === "high_admin" ? "admin" : role}/profile`}
              className="flex items-center w-full"
            >
              <User className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-gray-800/50 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2.5 group"
        >
          <Link
            href={`/${role === "high_admin" ? "admin" : role}/settings`}
            className="flex items-center w-full"
          >
            <Settings className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />

        {/* Theme Toggle */}
        <DropdownMenuItem
          className="cursor-pointer hover:bg-emerald-50 dark:hover:bg-gray-800/50 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-2.5 group"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted && resolvedTheme === "dark" ? (
            <>
              <Sun className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>Light Mode</span>
            </>
          ) : (
            <>
              <Moon className="mr-2 h-4 w-4 text-gray-500 dark:text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              <span>Dark Mode</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-gray-100 dark:bg-gray-800" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-red-600 dark:text-red-400 hover:bg-red-50 focus:bg-red-50 dark:hover:bg-red-950/30 dark:focus:bg-red-950/30 py-2.5"
        >
          <Link href="/login" className="flex items-center w-full">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
