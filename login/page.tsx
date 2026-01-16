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
      router.replace("/manage-properties");
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
        router.push("/manage-properties");
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
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-gray-50 p-4">
      {/* Brand Logo - Top Left */}
      <div className="absolute top-8 left-8 text-xl font-bold text-slate-900">
        viano systems®
      </div>

      {/* Main Card Container */}
      <div className="flex w-full max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-2xl">

        {/* LEFT SIDE: Image */}
        <div className="relative hidden w-1/2 md:block">
          <Image
            src="/auth-bg.jpg"
            alt="City Night"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="flex w-full flex-col justify-center bg-blue-50/30 p-8 sm:p-12 md:w-1/2">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">
              Login
            </h2>

            {/* Error Message */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading}
                  autoComplete="current-password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Forgot Password & Remember Me */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <Link
                  href="#"
                  className="font-medium text-slate-700 underline decoration-slate-400 underline-offset-2 hover:text-blue-900 transition-colors"
                >
                  Forgot Password?
                </Link>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900 cursor-pointer"
                  />
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#003366] py-3 text-sm font-semibold text-white transition-all hover:bg-blue-900 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
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
            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link
                href="/signup"
                className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 hover:text-blue-900 transition-colors"
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