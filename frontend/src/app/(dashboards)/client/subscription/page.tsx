"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, CheckCircle2, Crown, Loader2, Shield, Sparkles, XCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ClientSubscriptionStatus, getClientSubscriptionStatus } from "@/lib/client";

const PREMIUM_FEATURES = [
  "Manual Calorie Tracking",
  "Basic Meal Plans",
  "Community Access",
  "AI Vision Tracker",
  "Priority Consultations",
  "Advanced Analytics",
];

function formatDate(date?: string): string {
  if (!date) return "Not set";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SubscriptionPage() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<ClientSubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSubscription = async () => {
      try {
        const status = await getClientSubscriptionStatus();
        if (isMounted) setSubscriptionStatus(status);
      } catch (loadError) {
        console.error("Failed to load subscription", loadError);
        if (isMounted) setError("Could not load your subscription status.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadSubscription();

    return () => {
      isMounted = false;
    };
  }, []);

  const isPremium = subscriptionStatus?.is_premium ?? false;
  const subscription = subscriptionStatus?.subscription ?? null;
  const planName = useMemo(() => {
    if (!isPremium) return "Free";
    return subscription?.plan_type ? `${subscription.plan_type[0].toUpperCase()}${subscription.plan_type.slice(1)}` : "Premium";
  }, [isPremium, subscription?.plan_type]);

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Subscription</h1>
        <p className="text-muted-foreground">View your current plan and premium feature access.</p>
      </div>

      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="shadow-sm md:col-span-2">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl p-3 ${isPremium ? "bg-amber-500/15 text-amber-500" : "bg-secondary text-muted-foreground"}`}>
                  <Crown className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-card-foreground">{planName} Plan</CardTitle>
                  <CardDescription>{isPremium ? "Premium features unlocked" : "Basic features only"}</CardDescription>
                </div>
              </div>
              <span
                className={`rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${
                  isPremium ? "bg-accent text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                {subscription?.status ?? "free"}
              </span>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">Your Features</h3>
            <ul className="space-y-3">
              {PREMIUM_FEATURES.map((feature) => {
                const included = isPremium || !["AI Vision Tracker", "Priority Consultations", "Advanced Analytics"].includes(feature);
                return (
                  <li key={feature} className="flex items-center gap-3">
                    {included ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />
                    ) : (
                      <XCircle className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                    )}
                    <span className={`text-sm ${included ? "font-medium text-foreground" : "text-muted-foreground"}`}>{feature}</span>
                    {!included && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                        Premium
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>

            {isPremium && (
              <div className="mt-6 space-y-2 border-t border-border pt-4 text-sm text-muted-foreground">
                <p>
                  Started: <span className="font-semibold text-foreground">{formatDate(subscription?.start_date)}</span>
                </p>
                <p>
                  Ends: <span className="font-semibold text-foreground">{formatDate(subscription?.end_date)}</span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!isPremium && (
            <Card className="relative overflow-hidden border-primary/30 bg-accent shadow-sm">
              <CardContent className="relative p-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-foreground">Go Premium</h3>
                <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                  Unlock AI vision tracking and deeper nutrition analytics.
                </p>
                <Button asChild className="w-full rounded-xl py-5 shadow-sm">
                  <Link href="/subscription">
                    <ArrowUpRight className="mr-2 h-4 w-4" />
                    View Plans
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}

          <Card className="shadow-sm">
            <CardContent className="space-y-4 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">Premium Perks</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Zap className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-sm text-muted-foreground">AI-powered meal analysis from photos</p>
                </div>
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Premium feature access from your client dashboard</p>
                </div>
                <div className="flex items-start gap-3">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <p className="text-sm text-muted-foreground">Daily macro and calorie progress visibility</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
