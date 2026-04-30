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
import { ChevronDown, User, Settings, LogOut, Sun, Moon, Palette } from "lucide-react";
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
          className="flex items-center gap-3 p-1 pl-2 pr-3 rounded-full hover:bg-accent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="User Profile Menu"
          aria-expanded={isOpen}
        >
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.avatarUrl} alt={user.username} />
            <AvatarFallback className="bg-primary/15 text-primary font-semibold text-sm">
              {initial}
            </AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline-block text-foreground">
            {user.username}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-card border-border shadow-xl"
      >
        <DropdownMenuLabel className="font-normal py-3">
          <div className="flex flex-col space-y-1 text-sm">
            <p className="font-semibold text-foreground leading-none">
              {user.username}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-border" />
        {role !== "high_admin" ? (
          <DropdownMenuItem
            asChild
            className="cursor-pointer hover:bg-accent text-foreground hover:text-primary transition-colors py-2.5 group"
          >
            <Link
              href={`/${role === "high_admin" ? "admin" : role}/profile`}
              className="flex items-center w-full"
            >
              <User className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          asChild
          className="cursor-pointer hover:bg-accent text-foreground hover:text-primary transition-colors py-2.5 group"
        >
          <Link
            href={`/${role === "high_admin" ? "admin" : role}/settings`}
            className="flex items-center w-full"
          >
            <Settings className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-border" />

        {/* Theme Toggle */}
        <DropdownMenuItem
          className="cursor-pointer hover:bg-accent text-foreground hover:text-primary transition-colors py-2.5 group"
          onClick={() => {
            if (resolvedTheme === "light") setTheme("dark");
            else if (resolvedTheme === "dark") setTheme("special");
            else setTheme("light");
          }}
        >
          {mounted && resolvedTheme === "light" && (
            <>
              <Moon className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Dark Mode</span>
            </>
          )}
          {mounted && resolvedTheme === "dark" && (
            <>
              <Palette className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Special Mode</span>
            </>
          )}
          {mounted && resolvedTheme === "special" && (
            <>
              <Sun className="mr-2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
              <span>Light Mode</span>
            </>
          )}
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuItem
          asChild
          className="cursor-pointer text-destructive hover:bg-destructive/10 focus:bg-destructive/10 py-2.5"
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
