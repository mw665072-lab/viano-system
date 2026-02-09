"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle, XCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI, isAuthenticated } from "@/lib/api";

// Password requirement validation
interface PasswordRequirement {
  label: string;
  test: (password: string) => boolean;
}

const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  { label: "At least 8 characters", test: (p) => p.length >= 8 },
  { label: "One uppercase letter (A-Z)", test: (p) => /[A-Z]/.test(p) },
  { label: "One lowercase letter (a-z)", test: (p) => /[a-z]/.test(p) },
  { label: "One number (0-9)", test: (p) => /[0-9]/.test(p) },
  { label: "One special character (!@#$%^&*)", test: (p) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(p) },
];

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
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Password validation state
  const passwordValidation = useMemo(() => {
    return PASSWORD_REQUIREMENTS.map((req) => ({
      ...req,
      passed: req.test(password),
    }));
  }, [password]);

  const isPasswordValid = useMemo(() => {
    return passwordValidation.every((req) => req.passed);
  }, [passwordValidation]);

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
    if (!isPasswordValid) {
      const failedRequirements = passwordValidation
        .filter((req) => !req.passed)
        .map((req) => req.label);
      setError(`Password must include: ${failedRequirements.join(", ")}`);
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
        setError("Password must include: at least 8 characters, one uppercase letter (A-Z), one lowercase letter (a-z), one number (0-9), and one special character (!@#$%^&*).");
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
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 py-10">
      {/* Main Card Container */}
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex flex-col p-6 sm:p-8">
          <div className="mx-auto w-full">
            {/* Logo inside card */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/Logo Web.svg"
                alt="Viano Systems"
                width={140}
                height={46}
                priority
              />
            </div>

            <h2 className="mb-4 text-center text-2xl font-semibold text-slate-400">
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
                    id="first_name"
                    name="first_name"
                    type="text"
                    placeholder="First Name *"
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      clearError();
                    }}
                    disabled={isLoading || success}
                    autoComplete="given-name"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
                <div className="flex-1">
                  <input
                    id="last_name"
                    name="last_name"
                    type="text"
                    placeholder="Last Name *"
                    value={lastName}
                    onChange={(e) => {
                      setLastName(e.target.value);
                      clearError();
                    }}
                    disabled={isLoading || success}
                    autoComplete="family-name"
                    required
                    className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Email Input */}
              <div className="relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email *"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="email"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Username Input */}
              <div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username *"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="username"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Mobile Number Input */}
              <div>
                <input
                  id="mobile_number"
                  name="mobile_number"
                  type="tel"
                  placeholder="Mobile Number *"
                  value={mobileNumber}
                  onChange={(e) => {
                    setMobileNumber(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="tel"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password *"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => {
                    // Hide requirements after a delay to allow clicking on them
                    setTimeout(() => setShowPasswordRequirements(false), 200);
                  }}
                  disabled={isLoading || success}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed relative z-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto inline-flex w-auto"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} className="pointer-events-none" /> : <Eye size={18} className="pointer-events-none" />}
                </button>
              </div>

              {/* Password Requirements Indicator */}
              {(showPasswordRequirements || password.length > 0) && (
                <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                  <p className="text-xs font-medium text-slate-600 mb-2">Password must include:</p>
                  <ul className="space-y-1">
                    {passwordValidation.map((req, index) => (
                      <li
                        key={index}
                        className={`flex items-center gap-2 text-xs transition-colors ${req.passed ? 'text-green-600' : 'text-slate-500'
                          }`}
                      >
                        {req.passed ? (
                          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircle size={14} className="text-slate-400 flex-shrink-0" />
                        )}
                        <span>{req.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confirm Password Input */}
              <div className="relative">
                <input
                  id="confirm_password"
                  name="confirm_password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password *"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    clearError();
                  }}
                  disabled={isLoading || success}
                  autoComplete="new-password"
                  required
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed relative z-0"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 p-2 text-gray-400 hover:text-gray-600 transition-colors pointer-events-auto inline-flex w-auto"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={18} className="pointer-events-none" /> : <Eye size={18} className="pointer-events-none" />}
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
