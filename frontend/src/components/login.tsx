"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Logo } from "./logo";
import { loginSchema } from "@/lib/constants";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  const animationSpeed = 0.8;

  // ✅ single source of truth (Zod)
  const isFormValid = loginSchema.safeParse({
    email,
    password,
  }).success;

  const handleLogin = (e: React.FormEvent) => {
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
    console.log("Login attempt with:", result.data);
  };

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
          key="background"
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        >
          <Image
            src="/branding/login-bg.jpg"
            alt="Login background"
            fill
            priority
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      <div className="min-h-screen w-full flex items-center justify-center p-4">
        <motion.div
          className="relative w-full max-w-4xl h-[600px] bg-white rounded-3xl overflow-hidden shadow-lg flex"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {/* Left panel */}
          <div
            className="hidden md:flex relative w-2/5 p-8 flex-col justify-center bg-cover bg-center"
            style={{
              backgroundImage: "url('/branding/login-div.jpg')",
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
                className="relative h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow flex items-center justify-center"
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
                <Logo />
              </motion.div>
            </div>

            <motion.div className="mb-8" variants={itemVariants}>
              <h2 className="text-4xl text-gray-700 font-medium mb-2">
                Dieton account
              </h2>
              <p className="text-xl text-gray-600">Sign in to continue</p>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Email */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full px-4 py-3 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 transition
                    ${
                      errors.email
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:ring-emerald-400"
                    }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 mt-1">{errors.email}</p>
                )}
              </motion.div>

              {/* Password */}
              <motion.div variants={itemVariants}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={`w-full px-4 py-3 rounded-lg border bg-gray-50 focus:outline-none focus:ring-2 transition
                    ${
                      errors.password
                        ? "border-red-400 focus:ring-red-400"
                        : "border-gray-200 focus:ring-emerald-400"
                    }`}
                />
                {errors.password && (
                  <p className="text-sm text-red-500 mt-1">{errors.password}</p>
                )}
              </motion.div>

              {/* Submit */}
              <motion.button
                type="submit"
                disabled={!isFormValid}
                variants={buttonHoverVariants}
                initial="rest"
                whileHover={isFormValid ? "hover" : undefined}
                whileTap={isFormValid ? "tap" : undefined}
                className={`w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-base font-medium text-white
                  bg-gradient-to-r from-emerald-400 to-emerald-300
                  transition-opacity
                  ${
                    isFormValid
                      ? "opacity-100 cursor-pointer"
                      : "opacity-50 cursor-not-allowed"
                  }`}
              >
                Sign in
              </motion.button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
