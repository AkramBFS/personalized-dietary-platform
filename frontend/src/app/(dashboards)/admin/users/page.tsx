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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Search, X } from "lucide-react";
import { getAdminUsers, type AdminUser } from "@/lib/admin";
import api from "@/lib/api";

const getDisplayRole = (role: string) => {
  if (role === "high_admin") return "Admin";
  return role.replace("_", " ");
};

const mockUsers: AdminUser[] = [
  {
    id: 1,
    username: "amira_h",
    email: "amira@example.com",
    role: "client",
    is_active: true,
    date_joined: "2026-01-11T00:00:00Z",
  },
  {
    id: 2,
    username: "dr_kareem",
    email: "kareem@example.com",
    role: "nutritionist",
    is_active: true,
    date_joined: "2026-01-28T00:00:00Z",
  },
  {
    id: 3,
    username: "admin_test",
    email: "admin@example.com",
    role: "high_admin",
    is_active: true,
    date_joined: "2026-02-04T00:00:00Z",
  },
  {
    id: 4,
    username: "banned_user",
    email: "banned@example.com",
    role: "client",
    is_active: false,
    date_joined: "2025-12-20T00:00:00Z",
  },
];

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
      } catch {
        setUsers(mockUsers);
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
          new Date(b.date_joined).getTime() - new Date(a.date_joined).getTime(),
      );
  }, [users, query, roleFilter]);

  const handleViewDetails = async (user: AdminUser) => {
    setSelectedUser(user);
    setIsModalOpen(true);
    setDetailsLoading(true);
    try {
      const response = await api.get(`/admin/users/${user.id}/`);
      setUserDetails(response.data);
    } catch (error) {
      console.error("Failed to fetch user details", error);
      setUserDetails(null);
    } finally {
      setDetailsLoading(false);
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
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="client">Client</SelectItem>
              <SelectItem value="nutritionist">Nutritionist</SelectItem>
              <SelectItem value="high_admin">Admin</SelectItem>
            </SelectContent>
          </Select>
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

      <Card className="border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
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
                              ? "text-emerald-600 border-emerald-200"
                              : "text-red-600 border-red-200"
                          }
                        >
                          {user.is_active ? "Active" : "Banned"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(user.date_joined).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(user)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-lg font-semibold">
                User Details - {selectedUser?.username}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
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
