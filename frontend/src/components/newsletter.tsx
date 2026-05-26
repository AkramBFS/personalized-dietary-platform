"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");

    // Simulate API call
    setTimeout(() => {
      setStatus("success");
      setEmail("");

      // Reset after 3 seconds
      setTimeout(() => {
        setStatus("idle");
      }, 3000);
    }, 1000);
  };

  return (
    <section className="relative overflow-hidden bg-card py-24">
      {/* Background ambient glow */}
      <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-5xl px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7, type: "spring", bounce: 0.2 }}
          className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-background p-8 sm:p-12 md:p-16 shadow-xl"
        >
          <div className="relative z-10 mx-auto max-w-2xl text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner mb-6"
            >
              <Mail className="size-6" />
            </motion.div>

            <h2 className="font-[Syne] text-3xl font-bold tracking-tight text-foreground sm:text-5xl mb-6">
              Smarter nutrition, <br />
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                delivered weekly
              </span>
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed mb-10 mx-auto max-w-xl">
              Join our community of health enthusiasts. Get exclusive AI
              tracking tips, personalized recipe ideas, and the latest nutrition
              science straight to your inbox.
            </p>

            <div className="mx-auto max-w-md">
              <form
                onSubmit={handleSubmit}
                className="relative flex flex-col gap-3 sm:flex-row"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    required
                    disabled={status !== "idle"}
                    className="w-full h-14 rounded-xl border border-input bg-background/50 px-5 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-60"
                  />
                </div>

                <motion.button
                  whileHover={status === "idle" ? { scale: 1.02 } : {}}
                  whileTap={status === "idle" ? { scale: 0.98 } : {}}
                  disabled={status !== "idle"}
                  type="submit"
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 disabled:opacity-80 disabled:cursor-not-allowed sm:w-auto w-full"
                >
                  <AnimatePresence mode="wait">
                    {status === "idle" && (
                      <motion.div
                        key="idle"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center gap-2"
                      >
                        Subscribe
                        <ArrowRight className="size-4" />
                      </motion.div>
                    )}
                    {status === "loading" && (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-r-transparent" />
                        Sending...
                      </motion.div>
                    )}
                    {status === "success" && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        <CheckCircle2 className="size-4" />
                        Subscribed!
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              </form>

              <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="size-4 text-primary/70" />
                <span>No spam. Unsubscribe at any time.</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
