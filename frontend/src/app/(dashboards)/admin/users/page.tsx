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
import { Eye, Search, X } from "lucide-react";
import { getAdminUsers, getAdminUserDetail, banUser, type AdminUser } from "@/lib/admin";
import { toast } from "sonner";
import GenericDropdown from "@/components/ui/GenericDropdown";

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
              className="pl-9"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-card rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-lg font-semibold">
                User Details - {selectedUser?.username}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              {detailsLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : userDetails ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Username</label>
                      <p className="text-sm text-muted-foreground">
                        {userDetails.username}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Email</label>
                      <p className="text-sm text-muted-foreground">
                        {userDetails.email}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Role</label>
                      <p className="text-sm text-muted-foreground capitalize">
                        {getDisplayRole(userDetails.role)}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <p className="text-sm text-muted-foreground">
                        {userDetails.is_active ? "Active" : "Banned"}
                      </p>
                    </div>
                  </div>
                  {userDetails.role === "client" && userDetails.client && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">Client Profile</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium">Age</label>
                          <p className="text-sm text-muted-foreground">
                            {userDetails.client.age}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Weight</label>
                          <p className="text-sm text-muted-foreground">
                            {userDetails.client.weight} kg
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Height</label>
                          <p className="text-sm text-muted-foreground">
                            {userDetails.client.height} cm
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">BMI</label>
                          <p className="text-sm text-muted-foreground">
                            {userDetails.client.bmi}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">BMR</label>
                          <p className="text-sm text-muted-foreground">
                            {userDetails.client.bmr}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium">Goal</label>
                          <p className="text-sm text-muted-foreground">
                            {userDetails.client.goal?.name}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium">
                          Health History
                        </label>
                        <p className="text-sm text-muted-foreground">
                          {userDetails.client.health_history || "None"}
                        </p>
                      </div>
                    </div>
                  )}
                  {userDetails.role === "nutritionist" &&
                    userDetails.nutritionist && (
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Nutritionist Profile
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium">Bio</label>
                            <p className="text-sm text-muted-foreground">
                              {userDetails.nutritionist.bio}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Years Experience
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {userDetails.nutritionist.years_experience}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Consultation Price
                            </label>
                            <p className="text-sm text-muted-foreground">
                              ${userDetails.nutritionist.consultation_price}
                            </p>
                          </div>
                          <div>
                            <label className="text-sm font-medium">
                              Specialization
                            </label>
                            <p className="text-sm text-muted-foreground">
                              {userDetails.nutritionist.specialization?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                </div>
              ) : (
                <p className="text-muted-foreground">
                  Failed to load user details.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
