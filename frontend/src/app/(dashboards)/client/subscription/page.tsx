"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Crown, CheckCircle2, XCircle, ArrowUpRight, AlertTriangle, Sparkles, Shield, Zap } from "lucide-react";

export default function SubscriptionPage() {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Mock subscription data — replace with API call
  const subscription = {
    plan: "Free",
    status: "active",
    isPremium: false,
    renewalDate: null,
    features: [
      { name: "Manual Calorie Tracking", included: true },
      { name: "Basic Meal Plans", included: true },
      { name: "Community Access", included: true },
      { name: "AI Vision Tracker", included: false },
      { name: "Priority Consultations", included: false },
      { name: "Advanced Analytics", included: false },
    ],
  };

  const handleCancelSubscription = () => {
    alert("Subscription cancellation requested (Mock).");
    setShowCancelConfirm(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Subscription</h1>
        <p className="text-muted-foreground">View your current plan, upgrade for premium features, or manage your subscription.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Current Plan Card */}
        <Card className="md:col-span-2 shadow-sm">
          <CardHeader className="pb-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl ${subscription.isPremium ? 'bg-amber-500/15 text-amber-500' : 'bg-secondary text-muted-foreground'}`}>
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-card-foreground">{subscription.plan} Plan</CardTitle>
                  <CardDescription>
                    {subscription.isPremium ? "Premium features unlocked" : "Basic features only"}
                  </CardDescription>
                </div>
              </div>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full ${
                subscription.status === "active"
                  ? "bg-accent text-primary"
                  : "bg-destructive/10 text-destructive"
              }`}>
                {subscription.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider mb-4">Your Features</h3>
            <ul className="space-y-3">
              {subscription.features.map((feature) => (
                <li key={feature.name} className="flex items-center gap-3">
                  {feature.included ? (
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  ) : (
                    <XCircle className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                  )}
                  <span className={`text-sm ${feature.included ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {feature.name}
                  </span>
                  {!feature.included && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full">
                      Premium
                    </span>
                  )}
                </li>
              ))}
            </ul>

            {subscription.isPremium && subscription.renewalDate && (
              <div className="mt-6 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Next renewal: <span className="font-semibold text-foreground">{subscription.renewalDate}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upgrade / Actions Sidebar */}
        <div className="space-y-4">
          {/* Upgrade Card */}
          {!subscription.isPremium && (
            <Card className="bg-gradient-to-br from-accent to-accent border-primary/30 shadow-sm overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
              <CardContent className="p-6 relative">
                <div className="bg-primary/15 text-primary w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Go Premium</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                  Unlock AI vision tracking, priority consultations, and advanced analytics.
                </p>
                <Button asChild className="w-full py-5 rounded-xl shadow-sm">
                  <Link href="#">
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    Upgrade Now
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Premium Perks */}
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Premium Perks</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">AI-powered meal analysis from photos</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Priority booking with nutritionists</p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">Detailed macro & micro analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancel Subscription */}
          {subscription.isPremium && (
            <Card className="shadow-sm">
              <CardContent className="p-6">
                {!showCancelConfirm ? (
                  <Button
                    variant="ghost"
                    onClick={() => setShowCancelConfirm(true)}
                    className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    Cancel Subscription
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-amber-600 dark:text-amber-400">
                      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                      <p className="text-sm">Are you sure? You'll lose premium features at the end of your billing period.</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCancelConfirm(false)}
                        className="flex-1"
                      >
                        Keep Plan
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleCancelSubscription}
                        className="flex-1"
                      >
                        Confirm Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
