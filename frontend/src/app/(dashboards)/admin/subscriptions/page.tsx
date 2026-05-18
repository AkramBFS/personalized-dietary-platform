"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Save, DollarSign, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/Card";
import { DEFAULT_SUBSCRIPTION_PRICES, getSubscriptionAmount } from "@/lib/payment";

export default function AdminSubscriptionsPage() {
  const [monthlyPrice, setMonthlyPrice] = useState<string>("");
  const [yearlyPrice, setYearlyPrice] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setMonthlyPrice(getSubscriptionAmount("monthly").toString());
    setYearlyPrice(getSubscriptionAmount("yearly").toString());
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    try {
      const parsedMonthly = parseFloat(monthlyPrice);
      const parsedYearly = parseFloat(yearlyPrice);

      if (isNaN(parsedMonthly) || parsedMonthly < 0) {
        toast.error("Please enter a valid positive number for the monthly price.");
        setIsSaving(false);
        return;
      }

      if (isNaN(parsedYearly) || parsedYearly < 0) {
        toast.error("Please enter a valid positive number for the yearly price.");
        setIsSaving(false);
        return;
      }

      const pricesToSave = {
        monthly: parsedMonthly,
        yearly: parsedYearly,
      };

      localStorage.setItem("admin_subscription_prices", JSON.stringify(pricesToSave));
      
      toast.success("Subscription prices updated successfully.");
    } catch (error) {
      console.error("Failed to save prices", error);
      toast.error("An error occurred while saving prices.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setMonthlyPrice(DEFAULT_SUBSCRIPTION_PRICES.monthly.toString());
    setYearlyPrice(DEFAULT_SUBSCRIPTION_PRICES.yearly.toString());
    localStorage.removeItem("admin_subscription_prices");
    toast.success("Prices reset to default values.");
  };

  if (!mounted) {
    return null; // Avoid hydration mismatch by waiting to render on the client
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10 pt-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription Configuration</h1>
          <p className="text-muted-foreground mt-1">
            Manage the pricing for premium subscriptions offered to clients.
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle>Global Subscription Pricing</CardTitle>
            <CardDescription>
              Set the base monthly and yearly prices. These changes will reflect immediately on the frontend for new subscribers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="monthly-price">
                  Monthly Plan Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="monthly-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-9"
                    placeholder="19"
                    value={monthlyPrice}
                    onChange={(e) => setMonthlyPrice(e.target.value)}
                  />
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  The amount charged per month for a monthly subscription.
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70" htmlFor="yearly-price">
                  Yearly Plan Price ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="yearly-price"
                    type="number"
                    min="0"
                    step="0.01"
                    className="pl-9"
                    placeholder="190"
                    value={yearlyPrice}
                    onChange={(e) => setYearlyPrice(e.target.value)}
                  />
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  The amount charged per year for an annual subscription.
                </p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6 mt-2">
            <Button variant="outline" onClick={handleReset} type="button" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>

        <Card className="border-border shadow-sm bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-4">
              <p>
                <strong>Note:</strong> Payment processing on this platform is currently simulated. Any price updates made here are saved in your local browser state to demonstrate how dynamic pricing would work in a real environment.
              </p>
              <p>
                When a user visits the subscription page or navigates to the payment flow, the system will read the prices set on this page. If you clear your browser data or use a different device, the prices will revert to their default values (Monthly: ${DEFAULT_SUBSCRIPTION_PRICES.monthly}, Yearly: ${DEFAULT_SUBSCRIPTION_PRICES.yearly}).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
