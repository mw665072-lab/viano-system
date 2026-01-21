"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI, isAuthenticated } from "@/lib/api";

export default function SignupPage() {
  const router = useRouter();

  // Form state - all fields from SignUpRequest schema
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const validatePhone = (phone: string) => {
    // Allow empty or valid phone number (at least 10 digits)
    if (!phone.trim()) return true;
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!firstName.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!lastName.trim()) {
      setError("Please enter your last name");
      return;
    }
    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }
    if (!validateEmail(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
    if (!username.trim()) {
      setError("Please enter a username");
      return;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (!mobileNumber.trim()) {
      setError("Please enter your mobile number");
      return;
    }
    if (!validatePhone(mobileNumber)) {
      setError("Please enter a valid mobile number");
      return;
    }
    if (!password) {
      setError("Please enter a password");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.signup({
        email: email.trim(),
        username: username.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile_number: mobileNumber.trim(),
      });

      if (response.success) {
        setSuccess(true);
        // Redirect to login after short delay
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError("Signup failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Signup failed";
      // Provide user-friendly error messages
      if (errorMessage.includes("already") || errorMessage.includes("exists") || errorMessage.includes("duplicate")) {
        setError("An account with this email already exists. Please login instead.");
      } else if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
        setError("Unable to connect to server. Please check your internet connection.");
      } else if (errorMessage.includes("password")) {
        setError("Password does not meet requirements. Please use a stronger password.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    if (error) setError("");
  };

  return (
    <div className="fixed inset-0 z-50 flex h-screen w-screen items-center justify-center bg-gray-50 p-4">
      {/* Brand Logo - Top Left */}
      <div className="absolute top-8 left-8 text-xl font-bold text-slate-900">
        viano systems®
      </div>

      {/* Main Card Container */}
      <div className="flex w-full max-w-[900px] overflow-hidden rounded-2xl bg-white shadow-2xl max-h-[90vh]">

        {/* LEFT SIDE: Image */}
        <div className="relative hidden w-1/2 md:block">
          <Image
            src="/auth-background.png"
            alt="City Night"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* RIGHT SIDE: Signup Form */}
        <div className="flex w-full flex-col justify-center bg-blue-50/30 p-6 sm:p-8 md:w-1/2 overflow-y-auto">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="mb-4 text-center text-2xl font-semibold text-slate-900">
              Create Account
            </h2>

            {/* Success Message */}
            {success && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-600 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle size={16} />
                Account created! Redirecting to login...
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2.5 text-sm text-red-600 animate-in fade-in duration-200">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              {/* First Name & Last Name Row */}
              <div className="flex gap-2.5">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="First Name *"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearError();
                    }}
                    disabled={isLoading || success}
                    autoComplete="given-name"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Last Name *"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearError();
                    }}
                    disabled={isLoading || success}
                    autoComplete="family-name"
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Email *"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Username Input */}
              <div>
                <input
                  type="text"
                  placeholder="Username *"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mobile Number Input */}
              <div>
                <input
                  type="tel"
                  placeholder="Mobile Number *"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password * (min. 6 characters)"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password *"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="new-password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* Signup Button */}
              <button
                type="submit"
                disabled={isLoading || success}
                className="group mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#003366] py-2.5 text-sm font-semibold text-white transition-all hover:bg-blue-900 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle size={16} />
                    Account Created!
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-4 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 hover:text-blue-900 transition-colors"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}