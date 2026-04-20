"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, ShieldAlert, DollarSign } from "lucide-react";

const fallbackStats = {
  total_users: 1284,
  active_nutritionists: 87,
  pending_approvals: 9,
  total_revenue: 98210,
  monthly_growth: [
    { month: "Jan", value: 6 },
    { month: "Feb", value: 8 },
    { month: "Mar", value: 12 },
    { month: "Apr", value: 10 },
    { month: "May", value: 14 },
  ],
  recent_activity: [
    {
      id: 1,
      text: "New nutritionist signed up",
      created_at: new Date().toISOString(),
    },
    {
      id: 2,
      text: "New inquiry received from client",
      created_at: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: 3,
      text: "Community post reported",
      created_at: new Date(Date.now() - 7200000).toISOString(),
    },
  ],
};

export default function AdminOverviewPage() {
  const resolved = useMemo(() => fallbackStats, []);

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white tracking-tight">
          Admin Overview
        </h1>
        <p className="text-muted-foreground mt-2">
          Platform health, approvals pipeline, and recent operations at a
          glance.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={resolved.total_users.toLocaleString()}
          description="Registered accounts"
          icon={Users}
        />
        <StatCard
          title="Active Nutritionists"
          value={resolved.active_nutritionists.toLocaleString()}
          description="Currently active experts"
          icon={UserCheck}
        />
        <StatCard
          title="Pending Approvals"
          value={resolved.pending_approvals.toLocaleString()}
          description="Require admin review"
          icon={ShieldAlert}
        />
        <StatCard
          title="Total Revenue"
          value={`$${resolved.total_revenue.toLocaleString()}`}
          description="All-time gross revenue"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.recent_activity.map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-lg border bg-background/70"
              >
                <p className="text-sm font-medium">{item.text}</p>
                <Badge variant="outline" className="mt-2 text-xs">
                  {new Date(item.created_at).toLocaleString()}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="dark:bg-[#202731] border-none shadow-sm shadow-[#1a2027]/50">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-emerald-600/20 p-3 rounded-xl text-emerald-500 mt-1">
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {value}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
