"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI, saveAuth, isAuthenticated } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Check if already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.login({
        email: email.trim(),
        password,
      });

      if (response.success) {
        // Save auth data to localStorage
        saveAuth(response);

        // Redirect to dashboard/manage properties
        router.push("/dashboard");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      // Provide user-friendly error messages
      if (errorMessage.includes("401") || errorMessage.includes("credentials") || errorMessage.includes("password")) {
        setError("Invalid email or password. Please try again.");
      } else if (errorMessage.includes("404") || errorMessage.includes("not found")) {
        setError("Account not found. Please check your email or sign up.");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        setError("Unable to connect to server. Please check your internet connection.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="dark relative min-h-screen w-full flex items-center justify-center bg-[#0f0f0f] p-4">
      {/* Main Card Container */}
      <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/10 shadow-2xl">
        <div className="flex flex-col p-8 sm:p-12">
          <div className="mx-auto w-full">
            {/* Logo inside card */}
            <div className="mb-8 flex justify-center">
              <Image
                src="/Logo.svg"
                alt="Viano Systems"
                width={155}
                height={52}
                style={{ height: "auto" }}
                priority
              />
            </div>

            <h2 className="mb-8 text-center text-2xl font-semibold text-gray-300">
              Login
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-400 outline-none transition-all focus:border-[#E8730A] focus:ring-2 focus:ring-[#E8730A]/30 disabled:bg-white/5 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 pr-12 text-sm text-white placeholder:text-gray-400 outline-none transition-all focus:border-[#E8730A] focus:ring-2 focus:ring-[#E8730A]/30 disabled:bg-white/5 disabled:cursor-not-allowed relative z-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-gray-200 transition-colors pointer-events-auto inline-flex w-auto"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} className="pointer-events-none" /> : <Eye size={20} className="pointer-events-none" />}
                </button>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-end text-xs text-gray-400">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-white/20 text-[#E8730A] focus:ring-[#E8730A] cursor-pointer"
                  />
                  <span className="text-gray-400">Remember Me</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Log In
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-gray-400">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-white underline decoration-gray-500 underline-offset-2 hover:text-[#E8730A] transition-colors"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
