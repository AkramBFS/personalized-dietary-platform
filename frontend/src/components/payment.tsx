"use client";

import {
  Receipt,
  Info,
  CheckCircle,
  Bell,
  Calendar,
  Lock,
  CreditCard,
  Landmark,
  HelpCircle,
  ShieldCheck,
  Eye,
  BadgeCheck,
} from "lucide-react";

export default function SecurePayment() {
  return (
    <main className="max-w-7xl mx-auto px-8 py-20 w-full">
      {/* Header Section */}
      <div className="mb-12 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-primary tracking-tight mb-3">
          Secure Payment
        </h1>
        <p className="text-lg text-muted-foreground leading-relaxed">
          Complete your purchase securely. You’re one step away from accessing
          your selected service.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Column */}
        <div className="lg:col-span-5 flex flex-col gap-12">
          {/* Order Summary Card */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-border">
              <Receipt className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                Order Summary
              </h2>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Product
                  </h3>
                  <p className="text-base text-muted-foreground">
                    1-on-1 Consultation + Personalized Plan
                  </p>
                </div>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Provider
                  </h3>
                  <p className="text-base text-muted-foreground">
                    Nutritionist Sarah Jenkins
                  </p>
                </div>
              </div>
              <div className="pt-6 mt-3 border-t border-border flex justify-between items-end">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Total Due
                  </h3>
                </div>
                <div className="text-3xl font-bold text-primary">$150.00</div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-card rounded-2xl border border-border p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <Info className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-semibold text-foreground">
                What Happens Next
              </h2>
            </div>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    Booking Confirmed
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Your payment secures your consultation slot immediately.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Bell className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    Provider Notified
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Nutritionist Sarah Jenkins will be alerted to prepare for
                    your session.
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-sm font-semibold text-foreground block">
                    Scheduling Details
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Check your email for a link to join your virtual
                    consultation at the scheduled time.
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-7 flex flex-col gap-12">
          {/* Payment Details Card */}
          <div className="bg-card rounded-2xl shadow-sm border border-border p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Lock className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-semibold text-foreground">
                  Payment Details
                </h2>
              </div>
              <div className="flex gap-2 text-muted-foreground opacity-70">
                <CreditCard className="w-6 h-6" />
                <Landmark className="w-6 h-6" />
              </div>
            </div>
            <form className="space-y-6">
              {/* Cardholder Name */}
              <div>
                <label
                  className="block text-sm font-semibold text-foreground mb-2"
                  htmlFor="cardName"
                >
                  Cardholder Name
                </label>
                <input
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  id="cardName"
                  placeholder="Name as it appears on card"
                  type="text"
                />
              </div>

              {/* Card Number */}
              <div>
                <label
                  className="block text-sm font-semibold text-foreground mb-2"
                  htmlFor="cardNumber"
                >
                  Card Number
                </label>
                <div className="relative">
                  <input
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 pl-12 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                    id="cardNumber"
                    placeholder="0000 0000 0000 0000"
                    type="text"
                  />
                  <CreditCard className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Expiry and CVC */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label
                    className="block text-sm font-semibold text-foreground mb-2"
                    htmlFor="expiry"
                  >
                    Expiration Date
                  </label>
                  <input
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                    id="expiry"
                    placeholder="MM/YY"
                    type="text"
                  />
                </div>
                <div>
                  <label
                    className="flex justify-between items-center text-sm font-semibold text-foreground mb-2"
                    htmlFor="cvc"
                  >
                    CVC
                    <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                  </label>
                  <input
                    className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                    id="cvc"
                    placeholder="123"
                    type="text"
                  />
                </div>
              </div>

              {/* Billing Zip */}
              <div>
                <label
                  className="block text-sm font-semibold text-foreground mb-2"
                  htmlFor="zip"
                >
                  Billing Zip/Postal Code
                </label>
                <input
                  className="w-full bg-background border border-input rounded-xl px-4 py-3 text-base text-foreground focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all outline-none"
                  id="zip"
                  placeholder="12345"
                  type="text"
                />
              </div>

              <div className="pt-6 mt-6 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
                <button
                  className="px-6 py-3 text-sm font-semibold text-primary border border-primary/20 rounded-xl hover:bg-muted transition-colors w-full sm:w-auto"
                  type="button"
                >
                  Go Back
                </button>
                <button
                  className="px-6 py-3 text-sm font-semibold text-primary-foreground bg-primary rounded-xl hover:opacity-90 transition-opacity shadow-sm w-full sm:w-auto flex justify-center items-center gap-2"
                  type="button"
                >
                  <Lock className="w-4 h-4" />
                  Confirm Payment - $150
                </button>
              </div>
            </form>
          </div>

          {/* Transparency & Trust */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <ShieldCheck className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Secure Transactions
              </span>
              <span className="text-xs text-muted-foreground">
                Encrypted processing
              </span>
            </div>
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <Eye className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                No Hidden Fees
              </span>
              <span className="text-xs text-muted-foreground">
                What you see is what you pay
              </span>
            </div>
            <div className="bg-muted p-6 rounded-2xl flex flex-col items-center text-center">
              <BadgeCheck className="w-6 h-6 text-primary mb-2" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wider mb-1">
                Clear Pricing
              </span>
              <span className="text-xs text-muted-foreground">
                Transparent professional rates
              </span>
            </div>
          </div>

          {/* Bottom Advisory */}
          <div className="mt-2 text-sm text-muted-foreground leading-relaxed">
            <p className="mb-2">
              <strong className="font-semibold text-foreground">
                Need to Know:
              </strong>{" "}
              This payment covers professional consultation services provided
              independently by the listed provider, not platform usage fees.
            </p>
            <p className="text-xs opacity-80">
              By clicking "Confirm Payment", you agree to our Terms of Service
              and acknowledge that professional advice is intended to
              supplement, not replace, primary medical care.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
