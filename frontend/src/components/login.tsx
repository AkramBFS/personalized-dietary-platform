"use client";
import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { Logo } from "./logo";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const animationSpeed = 0.8;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Login attempt with:", { email, password });
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

  const blobVariants: Variants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: {
        duration: 0.7 * animationSpeed,
        ease: "easeOut",
      },
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

  const inputHoverVariants: Variants = {
    rest: { boxShadow: "0 0 0 rgba(0, 0, 0, 0)" },
    hover: {
      boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
      transition: { duration: 0.3 * animationSpeed, ease: "easeInOut" },
    },
  };

  return (
    <main>
      <AnimatePresence>
        <motion.div
          key={"background"}
          className="absolute inset-0 -z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1.2,
            ease: "easeOut",
          }}
        >
          <Image
            src={"/branding/login-bg.jpg"}
            alt={`login Background`}
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
          layoutId="authCard"
        >
          <div
            className="relative w-2/5 p-8 flex flex-col justify-center overflow-hidden bg-cover bg-center"
            style={{
              backgroundImage: "url('/branding/login-div.jpg')",

              backgroundColor: "rgba(0,0,0,0.2)",
              backgroundBlendMode: "overlay",
            }}
          >
            <motion.h1
              className="text-4xl font-mono md:text-6xl lg:text-7xl font-bold text-white mb-4 relative z-10 leading-tight"
              variants={itemVariants}
            >
              Welcome Back!
            </motion.h1>
          </div>

          <style jsx global>{`
            @keyframes snakeMove {
              0%,
              100% {
                transform: translate(0, 0);
              }
              20% {
                transform: translate(15px, 15px);
              }
              40% {
                transform: translate(-10px, 25px);
              }
              60% {
                transform: translate(10px, 5px);
              }
              80% {
                transform: translate(-5px, -15px);
              }
            }
            @keyframes snakeFloat {
              0%,
              100% {
                transform: translate(0, 0) rotate(0deg);
              }
              25% {
                transform: translate(-15px, -20px) rotate(10deg);
              }
              50% {
                transform: translate(10px, -30px) rotate(-5deg);
              }
              75% {
                transform: translate(5px, -10px) rotate(5deg);
              }
            }
          `}</style>

          {/* Right side with login form */}
          <motion.div
            className="w-3/5 p-10 flex flex-col justify-center"
            variants={containerVariants}
          >
            <div className="flex items-start">
              <motion.div
                className="flex justify-center mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <motion.div
                  className="relative h-16 w-16 rounded-xl bg-gradient-to-br from-emerald-400 to-yellow flex items-center justify-center"
                  animate={{
                    rotate: [0, 5, -5, 0],
                    scale: [1, 1.05, 0.95, 1],
                  }}
                  transition={{
                    duration: 4,
                    ease: "easeInOut",
                    times: [0, 0.25, 0.75, 1],
                    repeat: Infinity,
                    repeatType: "reverse",
                  }}
                >
                  <Logo />
                </motion.div>
              </motion.div>
            </div>

            <motion.div className="mb-8" variants={itemVariants}>
              <motion.h2 className="text-4xl text-gray-700 font-medium mb-3">
                Dieton account
              </motion.h2>
              <motion.p className="text-xl text-gray-600">
                Sign in to continue
              </motion.p>
            </motion.div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-4">
                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <motion.div
                    className="relative"
                    variants={inputHoverVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-300"
                      placeholder="example@email.com"
                      required
                    />
                  </motion.div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <motion.div
                    className="relative"
                    variants={inputHoverVariants}
                    initial="rest"
                    whileHover="hover"
                  >
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all duration-300"
                      placeholder="••••••••"
                      required
                    />
                  </motion.div>
                </motion.div>
              </div>

              <motion.div variants={itemVariants}>
                <motion.button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-emerald-400 to-emerald-300 hover:bg-emerald-500 transition-colors duration-200"
                  variants={buttonHoverVariants}
                  initial="rest"
                  whileHover="hover"
                  whileTap="tap"
                >
                  Sign in
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </main>
  );
}
