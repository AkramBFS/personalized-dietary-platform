"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Crown, Loader2, Shield, Sparkles, XCircle, Zap, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { ClientSubscriptionStatus, getClientSubscriptionStatus } from "@/lib/client";
import { purchaseClientSubscription } from "@/lib/api";
import { generateTransactionNumber, getSubscriptionAmount } from "@/lib/payment";
import { toast } from "sonner";

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
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handlePurchaseClick = (plan: "monthly" | "yearly") => {
    setSelectedPlan(plan);
    setShowPaymentModal(true);
  };

  const confirmPurchase = async () => {
    setIsProcessing(true);
    try {
      // Simulate bank delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      await purchaseClientSubscription({
        plan_type: selectedPlan,
        amount_paid: getSubscriptionAmount(selectedPlan),
        transaction_number: generateTransactionNumber("subscription"),
      });
      toast.success(`Successfully upgraded to ${selectedPlan} plan!`);
      setShowPaymentModal(false);
      // Reload status
      const status = await getClientSubscriptionStatus();
      setSubscriptionStatus(status);
    } catch (err) {
      console.error("Purchase failed", err);
      toast.error("Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

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

      {!isPremium && (
        <div className="pt-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold">Upgrade Your Experience</h2>
            <p className="text-muted-foreground mt-2">Choose a plan that fits your nutritional goals.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 border-border hover:border-primary/50 transition-all group overflow-hidden relative">
              <CardHeader className="bg-muted/30 pb-8">
                <CardTitle className="text-xl">Monthly Access</CardTitle>
                <CardDescription>Flexible month-to-month tracking</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">$29.99</span>
                  <span className="text-muted-foreground">/mo</span>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <Button 
                  className="w-full py-6 rounded-xl font-bold shadow-lg"
                  onClick={() => handlePurchaseClick("monthly")}
                >
                  Get Started Monthly
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary bg-primary/5 shadow-xl shadow-primary/10 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-[10px] font-bold uppercase tracking-widest rounded-bl-lg">
                Best Value
              </div>
              <CardHeader className="pb-8">
                <CardTitle className="text-xl">Yearly Commitment</CardTitle>
                <CardDescription>Save 20% with annual billing</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-black">$299.99</span>
                  <span className="text-muted-foreground">/yr</span>
                </div>
              </CardHeader>
              <CardContent className="pt-8">
                <Button 
                  className="w-full py-6 rounded-xl font-bold shadow-lg bg-primary hover:bg-primary/90"
                  onClick={() => handlePurchaseClick("yearly")}
                >
                  Upgrade to Yearly
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-card rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden border border-border/50 animate-in zoom-in-95 duration-300">
            <div className="p-8 space-y-6">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                {!isProcessing && (
                  <button onClick={() => setShowPaymentModal(false)} className="text-muted-foreground hover:text-foreground">
                    <XCircle className="w-6 h-6" />
                  </button>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xl font-bold">Secure Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Confirm your upgrade to the <span className="font-bold text-foreground capitalize">{selectedPlan}</span> plan.
                </p>
              </div>

              <div className="bg-muted/50 p-4 rounded-xl space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Selected Plan</span>
                  <span className="font-bold capitalize">{selectedPlan}</span>
                </div>
                <div className="flex justify-between text-lg pt-2 border-t border-border">
                  <span className="font-medium text-foreground">Total Due</span>
                  <span className="font-black text-primary">
                    ${selectedPlan === "monthly" ? "29.99" : "299.99"}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground justify-center uppercase tracking-widest mb-2">
                  <Shield className="w-3 h-3" /> Encrypted Transaction
                </div>
                <Button 
                  className="w-full py-7 rounded-xl text-lg font-bold shadow-xl"
                  disabled={isProcessing}
                  onClick={confirmPurchase}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Processing Payment...
                    </>
                  ) : (
                    "Confirm & Pay Now"
                  )}
                </Button>
                {!isProcessing && (
                  <Button variant="ghost" className="w-full" onClick={() => setShowPaymentModal(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
