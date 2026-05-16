"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  getAdminUsers,
  getAdminUserDetail,
  banUser,
  deleteUser,
  type AdminUser,
} from "@/lib/admin";
import { toast } from "sonner";
import GenericDropdown from "@/components/ui/GenericDropdown";
import { Eye, Search, X, Trash2, User, Mail, Calendar, Shield, Activity, UserCircle } from "lucide-react";

const getDisplayRole = (role?: string) => {
  if (!role) return "Unknown";
  if (role === "high_admin") return "Admin";
  return role.replace("_", " ");
};

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getAdminUsers();
        setUsers(data);
      } catch (error) {
        toast.error("Failed to fetch users");
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  const filtered = useMemo(() => {
    return users
      .filter((user) => {
        const matchesQuery =
          user.username.toLowerCase().includes(query.toLowerCase()) ||
          user.email.toLowerCase().includes(query.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesQuery && matchesRole;
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(), // Changed here
      );
  }, [users, query, roleFilter]);

  const handleViewDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const data = await getAdminUserDetail(user.id);
      setUserDetails(data);
    } catch (error) {
      console.error("Failed to fetch user details", error);
      setUserDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteUser = async (user: AdminUser) => {
    if (!confirm(`Are you sure you want to delete user ${user.username}? This action is irreversible.`)) {
      return;
    }

    try {
      await deleteUser(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setIsModalOpen(false);
      toast.success("User deleted successfully");
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  const handleBanToggle = async (user: AdminUser) => {
    try {
      await banUser(user.id, user.is_active);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, is_active: !user.is_active } : u,
        ),
      );
      if (userDetails && userDetails.id === user.id) {
        setUserDetails({ ...userDetails, is_active: !user.is_active });
      }
      toast.success(
        `User ${user.is_active ? "banned" : "unbanned"} successfully`,
      );
    } catch (error) {
      toast.error(`Failed to ${user.is_active ? "ban" : "unban"} user`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Review users by role and account status.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <GenericDropdown
            value={roleFilter}
            onChange={setRoleFilter}
            options={[
              { label: "All Roles", value: "all" },
              { label: "Client", value: "client" },
              { label: "Nutritionist", value: "nutritionist" },
              { label: "Admin", value: "high_admin" },
            ]}
            placeholder="Filter by role"
            className="w-40 py-2 px-4 text-sm"
          />
          <div className="relative w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 h-14"
              placeholder="Search users..."
            />
          </div>
        </div>
      </div>

      <Card className="border-border shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Join Date</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 6 }).map((_, idx) => (
                    <TableRow key={idx}>
                      <TableCell colSpan={6}>
                        <Skeleton className="h-8 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : filtered.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.username}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="capitalize">
                        {getDisplayRole(user.role)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            user.is_active
                              ? "text-primary border-primary/30"
                              : "text-destructive border-destructive/30"
                          }
                        >
                          {user.is_active ? "Active" : "Banned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(user)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                          <Button
                            variant={user.is_active ? "destructive" : "outline"}
                            size="sm"
                            onClick={() => handleBanToggle(user)}
                          >
                            {user.is_active ? "Ban" : "Unban"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-card rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-border flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-border bg-muted/30">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <UserCircle className="w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-xl font-bold leading-tight">
                    {selectedUser?.username}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    User ID: #{selectedUser?.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {detailsLoading ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                    <Skeleton className="h-20 w-full rounded-xl" />
                  </div>
                  <Skeleton className="h-40 w-full rounded-xl" />
                </div>
              ) : userDetails ? (
                <>
                  {/* Quick Info Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Shield className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Role</span>
                      </div>
                      <p className="font-bold capitalize">{getDisplayRole(userDetails.role)}</p>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Status</span>
                      </div>
                      <Badge
                        variant="outline"
                        className={
                          userDetails.is_active
                            ? "text-primary border-primary/30"
                            : "text-destructive border-destructive/30"
                        }
                      >
                        {userDetails.is_active ? "Active" : "Banned"}
                      </Badge>
                    </div>
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50">
                      <div className="flex items-center gap-2 text-muted-foreground mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Joined</span>
                      </div>
                      <p className="font-bold">
                        {new Date(userDetails.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Account Details
                    </h3>
                    <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">Email Address</span>
                        <span className="text-sm font-medium">{userDetails.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">Username</span>
                        <span className="text-sm font-medium">{userDetails.username}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                        <span className="text-sm text-muted-foreground">Staff Status</span>
                        <Badge variant="secondary" className="font-mono">
                          {userDetails.is_staff ? "Yes" : "No"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Role Specific Content */}
                  {userDetails.role === "client" && userDetails.client && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Client Physical Profile
                      </h3>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-center">
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="text-lg font-bold text-primary">{userDetails.client.age}</p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-center">
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-lg font-bold text-primary">{userDetails.client.weight}kg</p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-center">
                          <p className="text-xs text-muted-foreground">Height</p>
                          <p className="text-lg font-bold text-primary">{userDetails.client.height}cm</p>
                        </div>
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 text-center">
                          <p className="text-xs text-muted-foreground">BMI</p>
                          <p className="text-lg font-bold text-primary">{userDetails.client.bmi}</p>
                        </div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-xl border border-border">
                         <p className="text-sm font-medium mb-1">Health History</p>
                         <p className="text-sm text-muted-foreground italic">
                           {userDetails.client.health_history || "No recorded history"}
                         </p>
                      </div>
                    </div>
                  )}

                  {userDetails.role === "nutritionist" && userDetails.nutritionist && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
                        Professional Profile
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Specialization</p>
                          <p className="font-medium">{userDetails.nutritionist.specialization?.name || "N/A"}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Experience</p>
                          <p className="font-medium">{userDetails.nutritionist.years_experience} Years</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Rate</p>
                          <p className="font-medium text-emerald-600">${userDetails.nutritionist.consultation_price}/session</p>
                        </div>
                      </div>
                      <div className="bg-muted/20 p-4 rounded-xl border border-border">
                         <p className="text-sm font-medium mb-1">Professional Bio</p>
                         <p className="text-sm text-muted-foreground">
                           {userDetails.nutritionist.bio}
                         </p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center text-destructive mb-4">
                    <X className="w-6 h-6" />
                  </div>
                  <p className="text-muted-foreground font-medium">
                    Failed to load detailed information for this user.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-border bg-muted/30 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="rounded-full px-6"
              >
                Close
              </Button>
              <div className="flex gap-3">
                 <Button
                    variant={(userDetails?.is_active ?? selectedUser?.is_active) ? "outline" : "default"}
                    onClick={() => selectedUser && handleBanToggle(selectedUser)}
                    className="rounded-full px-6"
                    disabled={detailsLoading}
                  >
                    {(userDetails?.is_active ?? selectedUser?.is_active) ? "Ban User" : "Unban User"}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => selectedUser && handleDeleteUser(selectedUser)}
                    className="rounded-full px-6 flex items-center gap-2"
                    disabled={detailsLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Permanent
                  </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
