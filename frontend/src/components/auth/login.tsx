"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useTheme } from "next-themes";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Logo } from "../layout/logo";
import { loginSchema } from "@/lib/constants";
import api from "@/lib/api";
import { setAccessToken, setRefreshToken } from "@/lib/auth";
import { Home } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import Link from "next/link";

export default function LoginPage() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const [isLoading, setIsLoading] = useState(false);

  // Wait until mounted to avoid hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  const router = useRouter();

  const animationSpeed = 0.8;

  // ✅ single source of truth (Zod)
  const isFormValid = loginSchema.safeParse({
    email,
    password,
  }).success;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = loginSchema.safeParse({
      email,
      password,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        email: result.data.email,
        password: result.data.password,
      });

      const { data } = response.data;

      const { tokens, user } = data;

      // Store tokens
      setAccessToken(tokens.access);
      setRefreshToken(tokens.refresh);

      // Redirect based on role
      if (user.role === "client") {
        router.push("/client");
      } else if (user.role === "nutritionist") {
        router.push("/nutritionist");
      } else if (user.role === "high_admin") {
        router.push("/admin");
      } else {
        alert("Unknown user role");
      }
    } catch (error: any) {
      console.error("Login failed", error);
      const errorCode = error.response?.data?.code || error.response?.data?.error_code || error.response?.data?.message;

      if (error.response?.status === 403 && (errorCode === "ACCOUNT_PENDING_APPROVAL" || errorCode === "Your account is pending approval.")) {
        alert("Your account is pending approval. Please wait for admin confirmation.");
      } else if (error.response?.status === 403 && errorCode === "ACCOUNT_REJECTED") {
        alert("Your account application was rejected. Please contact support for details.");
      } else if (error.response?.status === 401) {
        setErrors({ email: "Invalid credentials" });
      } else if (error.response?.data?.message) {
        alert(error.response.data.message);
      } else {
        alert("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  let bgImage = "/branding/login-bg.jpg";
  let divImage = "/branding/login-div.jpg";

  if (mounted) {
    if (theme === "special") {
      bgImage = "/branding/login-bg2.png";
      divImage = "/branding/login-div2.png";
    } else if (theme === "dark") {
      bgImage = "/branding/login-bg3.png";
      divImage = "/branding/login-div3.png";
    }
  }

  const containerVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6 * animationSpeed,
        ease: "easeOut",
        when: "beforeChildren",
        staggerChildren: 0.1 * animationSpeed,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 * animationSpeed, ease: "easeOut" },
    },
  };

  const buttonHoverVariants: Variants = {
    rest: { scale: 1 },
    hover: {
      scale: 1.03,
      transition: { duration: 0.2 * animationSpeed, ease: "easeInOut" },
    },
    tap: { scale: 0.98 },
  };

  return (
    <main className="relative min-h-screen overflow-hidden">
      <AnimatePresence>
        <motion.div
          key={bgImage} // Change the key so Framer Motion animates the transition between images
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src={bgImage}
            alt="Login background"
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="absolute top-6 right-6 z-50 flex items-center gap-4">
        <Link
          href="/"
          className="p-2 rounded-full bg-card/50 backdrop-blur-md border border-border hover:bg-accent transition-colors"
          title="Back to Home"
        >
          <Home className="w-5 h-5 text-foreground" />
        </Link>
        <div className="p-1 rounded-full bg-card/50 backdrop-blur-md border border-border">
          <ThemeToggle />
        </div>
      </div>

      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <motion.div
          className="relative w-full max-w-4xl h-[600px] bg-card rounded-3xl overflow-hidden shadow-lg flex border border-border"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left panel */}
          <div
            className="hidden md:flex relative w-2/5 p-8 flex-col justify-center bg-cover bg-center transition-all duration-500"
            style={{
              backgroundImage: `url('${divImage}')`,
              backgroundBlendMode: "overlay",
            }}
          ></div>

          {/* Right panel */}
          <motion.div
            className="w-full md:w-3/5 p-10 flex flex-col justify-center"
            variants={containerVariants}
          >
            <div className="flex items-start mb-6">
              <motion.div
                className=""
                animate={{
                  rotate: [0, 5, -5, 0],
                  scale: [1, 1.05, 0.95, 1],
                }}
                transition={{
                  duration: 4,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              >
                <Logo forceDark />
              </motion.div>
            </div>

            <motion.div className="mb-8" variants={itemVariants}>
              <h2 className="text-4xl text-foreground font-medium mb-2">
                Dieton account
              </h2>
              <p className="text-xl text-muted-foreground">
                Sign in to continue
              </p>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full px-4 py-3 rounded-lg border bg-muted/30 text-foreground focus:outline-none focus:ring-2 transition
                    ${
                      errors.email
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:ring-brand"
                    }`}
                />
                {errors.email && (
                  <p className="text-sm text-destructive mt-1">{errors.email}</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg border bg-muted/30 text-foreground focus:outline-none focus:ring-2 transition
                    ${
                      errors.password
                        ? "border-destructive focus:ring-destructive"
                        : "border-border focus:ring-brand"
                    }`}
                />
                {errors.password && (
                  <p className="text-sm text-destructive mt-1">{errors.password}</p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!isFormValid || isLoading}
                variants={buttonHoverVariants}
                initial="rest"
                whileHover={isFormValid && !isLoading ? "hover" : undefined}
                whileTap={isFormValid && !isLoading ? "tap" : undefined}
                className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-base font-medium text-button-primary-foreground
                  bg-button-primary
                  transition-opacity
                  ${
                    isFormValid && !isLoading
                      ? "opacity-100 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </motion.button>

              <motion.div
                variants={itemVariants}
                className="text-center text-sm text-muted-foreground"
              >
                Not onboard?{" "}
                <Link
                  href="/register"
                  className="text-brand hover:text-brand/80 font-semibold underline underline-offset-4"
                >
                  Sign up!
                </Link>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
