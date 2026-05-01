"use client";

import Link from "next/link";
import { CheckCircle2, Home, Mail } from "lucide-react";
import { motion } from "framer-motion";

export default function PendingReviewPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-xl"
      >
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500/10 p-4 rounded-full">
            <CheckCircle2 className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-foreground mb-4">Registration Submitted</h1>
        
        <p className="text-muted-foreground mb-8 leading-relaxed">
          Your account is currently under review by our medical board. 
          We'll verify your certifications and credentials within <span className="text-foreground font-semibold">1-7 business days</span>.
        </p>

        <div className="bg-muted/30 border border-border rounded-2xl p-4 mb-8 flex items-start gap-3 text-left">
          <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            A confirmation email has been sent to your inbox. Please check it for updates.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link 
            href="/"
            className="w-full bg-button-primary text-button-primary-foreground py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:brightness-105 transition-all shadow-md"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link 
            href="/login"
            className="w-full bg-muted text-muted-foreground py-3 rounded-xl font-semibold hover:bg-muted/80 transition-all"
          >
            Sign in
          </Link>
        </div>
      </motion.div>
    </main>
  );
}
