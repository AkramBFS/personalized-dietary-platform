"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, ShieldAlert, DollarSign } from "lucide-react";

import { getDashboardStats, type DashboardStats } from "@/lib/admin";

export default function AdminOverviewPage() {
  const [resolved, setResolved] = React.useState<DashboardStats | null>(null);

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        const stats = await getDashboardStats();
        setResolved(stats);
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      }
    };
    void loadStats();
  }, []);

  if (!resolved) {
    return (
      <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
            Admin Overview
          </h1>
          <p className="text-muted-foreground mt-2">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-10 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
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
          value={(resolved.total_users ?? 0).toLocaleString()}
          description="Active accounts"
          icon={Users}
        />
        <StatCard
          title="Active Nutritionists"
          value={(resolved.total_nutritionists ?? 0).toLocaleString()}
          description="Verified experts"
          icon={UserCheck}
        />
        <StatCard
          title="Pending Plans"
          value={(resolved.pending_plans ?? 0).toLocaleString()}
          description="Require moderation"
          icon={ShieldAlert}
        />
        <StatCard
          title="Open Inquiries"
          value={(resolved.unresolved_inquiries ?? 0).toLocaleString()}
          description="Support tickets"
          icon={DollarSign}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card className="border-none shadow-sm shadow-card/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {resolved.recent_activity.length > 0 ? (
              resolved.recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border bg-background/70"
                >
                  <p className="text-sm font-medium">{item.text}</p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {new Date(item.created_at).toLocaleString()}
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground py-4">No recent activity to display.</p>
            )}
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
    <Card className="border-none shadow-sm shadow-card/50">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className="bg-primary/20 p-3 rounded-xl text-primary mt-1">
            <Icon className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {title}
            </p>
            <p className="text-2xl font-bold text-foreground">
              {value}
            </p>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
