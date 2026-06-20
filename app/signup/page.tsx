"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, EyeOff, ArrowRight, Loader2, CheckCircle, XCircle, ArrowLeft, Mail, Smartphone } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { authAPI, isAuthenticated, saveAuth, LoginResponse } from "@/lib/api";
import { OTPInput } from "@/components/ui/otp-input";

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

type SignupStep = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();

  // Step state
  const [currentStep, setCurrentStep] = useState<SignupStep>(1);

  // Step 1: Account Info
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");

  // Step 2: OTP Verification
  const [emailOtp, setEmailOtp] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [emailOtpAvailable, setEmailOtpAvailable] = useState(true);
  const [emailResendTimer, setEmailResendTimer] = useState(0);
  const [phoneResendTimer, setPhoneResendTimer] = useState(0);

  // Step 3: Password
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
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

  // Resend countdown timers
  useEffect(() => {
    let emailInterval: NodeJS.Timeout;
    if (emailResendTimer > 0) {
      emailInterval = setInterval(() => {
        setEmailResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(emailInterval);
  }, [emailResendTimer]);

  useEffect(() => {
    let phoneInterval: NodeJS.Timeout;
    if (phoneResendTimer > 0) {
      phoneInterval = setInterval(() => {
        setPhoneResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(phoneInterval);
  }, [phoneResendTimer]);

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
    if (!phone.trim()) return true;
    const phoneRegex = /^[\d\s\-+()]{10,}$/;
    return phoneRegex.test(phone);
  };

  const parseErrorMessage = (msg: string): string[] => {
    try {
      if (msg.includes('{"errors":[')) {
        const errorData = JSON.parse(msg.substring(msg.indexOf('{')));
        if (errorData.errors && Array.isArray(errorData.errors)) {
          return errorData.errors.map((e: any) => e.long_message || e.message);
        }
      }
    } catch (e) {
      // If parsing fails, use the original message
    }

    if (msg.includes("email") && msg.includes("already")) {
      return ["An account with this email already exists."];
    }
    if (msg.includes("username") && msg.includes("already")) {
      return ["This username is already taken. Please choose another one."];
    }

    return [msg];
  };

  const clearErrors = () => setErrors([]);

  // Step 1: Validate and send phone OTP (required), then email OTP (optional)
  const handleStep1Continue = async () => {
    clearErrors();

    if (!firstName.trim()) {
      setErrors(["Please enter your first name"]);
      return;
    }
    if (!lastName.trim()) {
      setErrors(["Please enter your last name"]);
      return;
    }
    if (!email.trim()) {
      setErrors(["Please enter your email"]);
      return;
    }
    if (!validateEmail(email.trim())) {
      setErrors(["Please enter a valid email address"]);
      return;
    }
    if (!username.trim()) {
      setErrors(["Please enter a username"]);
      return;
    }
    if (username.trim().length < 3) {
      setErrors(["Username must be at least 3 characters"]);
      return;
    }
    if (!mobileNumber.trim()) {
      setErrors(["Please enter your mobile number"]);
      return;
    }
    if (!validatePhone(mobileNumber)) {
      setErrors(["Please enter a valid mobile number"]);
      return;
    }

    setIsLoading(true);
    try {
      // Send phone OTP first (always required)
      const phoneRes = await authAPI.sendPreRegisterOTP({ phone: mobileNumber.trim() });
      if (phoneRes.success) {
        setPhoneOtpSent(true);
        setPhoneResendTimer(60);
      }

      // Try to send email OTP (optional - returns 200 with success: false if not configured)
      const emailRes = await authAPI.sendPreRegisterOTP({ email: email.trim() });
      if (emailRes.success) {
        setEmailOtpSent(true);
        setEmailResendTimer(60);
        setEmailOtpAvailable(true);
      } else {
        // Email channel not available - disable email OTP
        setEmailOtpAvailable(false);
        setEmailOtpSent(false);
      }

      setCurrentStep(2);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to send verification code";
      setErrors(parseErrorMessage(rawMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmailOTP = async () => {
    if (emailResendTimer > 0) return;
    clearErrors();
    setIsLoading(true);
    try {
      const res = await authAPI.sendPreRegisterOTP({ email: email.trim() });
      if (res.success) {
        setEmailOtpSent(true);
        setEmailOtpAvailable(true);
        setEmailResendTimer(60);
      } else {
        // Email channel not available - hide silently
        setEmailOtpAvailable(false);
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to resend email code";
      setErrors(parseErrorMessage(rawMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPhoneOTP = async () => {
    if (phoneResendTimer > 0) return;
    clearErrors();
    setIsLoading(true);
    try {
      await authAPI.sendPreRegisterOTP({ phone: mobileNumber.trim() });
      setPhoneOtpSent(true);
      setPhoneResendTimer(60);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Failed to resend phone code";
      setErrors(parseErrorMessage(rawMessage));
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Validate OTPs and proceed
  const handleStep2Continue = () => {
    clearErrors();

    // Phone OTP is always required
    if (phoneOtp.length !== 6) {
      setErrors(["Please enter the 6-digit phone verification code"]);
      return;
    }
    // Email OTP is only required if email OTP is available
    if (emailOtpAvailable && emailOtp.length !== 6) {
      setErrors(["Please enter the 6-digit email verification code"]);
      return;
    }

    setCurrentStep(3);
  };

  // Step 3: Submit signup
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    if (!password) {
      setErrors(["Please enter a password"]);
      return;
    }
    if (!isPasswordValid) {
      const failedRequirements = passwordValidation
        .filter((req) => !req.passed)
        .map((req) => req.label);
      setErrors([`Password must include: ${failedRequirements.join(", ")}`]);
      return;
    }
    if (password !== confirmPassword) {
      setErrors(["Passwords do not match"]);
      return;
    }

    setIsLoading(true);

    try {
      const signupPayload: {
        email: string;
        username: string;
        password: string;
        first_name: string;
        last_name: string;
        mobile_number: string;
        phone_otp: string;
        email_otp?: string;
      } = {
        email: email.trim(),
        username: username.trim(),
        password,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        mobile_number: mobileNumber.trim(),
        phone_otp: phoneOtp,
      };

      // Only include email_otp if it was provided and email OTP is available
      if (emailOtpAvailable && emailOtp.length === 6) {
        signupPayload.email_otp = emailOtp;
      }

      const response = await authAPI.signup(signupPayload);

      if (response.success) {
        setSuccess(true);

        if (response.access_token) {
          const authData: LoginResponse = {
            success: true,
            user_id: response.user_id,
            email: email.trim(),
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            access_token: response.access_token
          };
          saveAuth(authData);

          setTimeout(() => {
            router.push("/dashboard");
          }, 2000);
        } else {
          setTimeout(() => {
            router.push("/login");
          }, 2000);
        }
      } else {
        setErrors(["Signup failed. Please try again."]);
      }
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "Signup failed";
      setErrors(parseErrorMessage(rawMessage));
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setEmailOtp("");
      setPhoneOtp("");
    } else if (currentStep === 3) {
      setCurrentStep(2);
      setPassword("");
      setConfirmPassword("");
    }
    clearErrors();
  };

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
              currentStep === step
                ? "bg-primary text-white"
                : currentStep > step
                  ? "bg-green-500 text-white"
                  : "bg-gray-200 text-gray-500"
            }`}
          >
            {currentStep > step ? <CheckCircle size={16} /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-8 h-0.5 transition-all ${
                currentStep > step ? "bg-green-500" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center bg-gray-50 p-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        <div className="flex flex-col p-6 sm:p-8">
          <div className="mx-auto w-full">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <Image
                src="/logo-dark.svg"
                alt="Viano Systems"
                width={155}
                height={52}
                style={{ height: "auto" }}
                priority
              />
            </div>

            <h2 className="mb-4 text-center text-2xl font-semibold text-slate-400">
              Create Account
            </h2>

            <StepIndicator />

            {/* Success Message */}
            {success && (
              <div className="mb-3 rounded-lg bg-green-50 border border-green-200 px-4 py-2.5 text-sm text-green-600 flex items-center gap-2 animate-in fade-in duration-200">
                <CheckCircle size={16} />
                Account created! Redirecting...
              </div>
            )}

            {/* Error Messages */}
            {errors.length > 0 && (
              <div className="mb-3 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-600 animate-in fade-in duration-200">
                <div className="flex items-start gap-2">
                  <XCircle size={16} className="mt-0.5 flex-shrink-0" />
                  <div className="flex flex-col gap-1">
                    {errors.map((err, idx) => (
                      <span key={idx} className="leading-relaxed">
                        {err}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Account Info */}
            {currentStep === 1 && (
              <div className="space-y-2.5">
                <div className="flex gap-2.5">
                  <div className="flex-1">
                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      placeholder="First Name *"
                      value={firstName}
                      onChange={(e) => { setFirstName(e.target.value); clearErrors(); }}
                      disabled={isLoading}
                      autoComplete="given-name"
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
                      onChange={(e) => { setLastName(e.target.value); clearErrors(); }}
                      disabled={isLoading}
                      autoComplete="family-name"
                      className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Email *"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErrors(); }}
                  disabled={isLoading}
                  autoComplete="email"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Username *"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearErrors(); }}
                  disabled={isLoading}
                  autoComplete="username"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                <input
                  id="mobile_number"
                  name="mobile_number"
                  type="tel"
                  placeholder="Mobile Number *"
                  value={mobileNumber}
                  onChange={(e) => { setMobileNumber(e.target.value); clearErrors(); }}
                  disabled={isLoading}
                  autoComplete="tel"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />

                <button
                  onClick={handleStep1Continue}
                  disabled={isLoading}
                  className="group mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Sending codes...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Step 2: OTP Verification */}
            {currentStep === 2 && (
              <div className="space-y-5">
                {/* Phone OTP - Always required, shown first */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Smartphone size={18} className="text-primary" />
                    <p className="text-sm font-medium text-slate-700">
                      Phone Verification
                    </p>
                    <span className="text-xs text-red-500 bg-red-50 px-2 py-0.5 rounded-full font-medium">
                      Required
                    </span>
                    {phoneOtpSent && (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        Sent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Enter the 6-digit code sent to <span className="font-medium text-slate-700">{mobileNumber}</span>
                  </p>
                  <OTPInput
                    value={phoneOtp}
                    onChange={setPhoneOtp}
                    disabled={isLoading || success}
                  />
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={handleResendPhoneOTP}
                      disabled={phoneResendTimer > 0 || isLoading}
                      className="text-xs text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                    >
                      {phoneResendTimer > 0
                        ? `Resend phone code in ${phoneResendTimer}s`
                        : "Resend phone code"}
                    </button>
                  </div>
                </div>
            
                {/* Email OTP - Optional, hidden when unavailable */}
                {emailOtpAvailable && (
                  <>
                    <div className="border-t border-gray-100" />
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Mail size={18} className="text-primary" />
                        <p className="text-sm font-medium text-slate-700">
                          Email Verification
                        </p>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          Optional
                        </span>
                        {emailOtpSent && (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                            Sent
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">
                        Enter the 6-digit code sent to <span className="font-medium text-slate-700">{email}</span>
                      </p>
                      <OTPInput
                        value={emailOtp}
                        onChange={setEmailOtp}
                        disabled={isLoading || success}
                      />
                      <div className="flex justify-center">
                        <button
                          type="button"
                          onClick={handleResendEmailOTP}
                          disabled={emailResendTimer > 0 || isLoading}
                          className="text-xs text-primary font-medium hover:underline disabled:text-gray-400 disabled:no-underline"
                        >
                          {emailResendTimer > 0
                            ? `Resend email code in ${emailResendTimer}s`
                            : "Resend email code"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
            
                {/* Navigation */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50 disabled:opacity-70"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    onClick={handleStep2Continue}
                    disabled={isLoading || phoneOtp.length !== 6 || (emailOtpAvailable && emailOtp.length !== 6 && emailOtp.length > 0) || (emailOtpAvailable && emailOtpSent && emailOtp.length === 0)}
                    className="group flex-1 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    Continue
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Password */}
            {currentStep === 3 && (
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password *"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); clearErrors(); }}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setTimeout(() => setShowPasswordRequirements(false), 200)}
                    disabled={isLoading || success}
                    autoComplete="new-password"
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

                {/* Password Requirements */}
                {(showPasswordRequirements || password.length > 0) && (
                  <div className="mt-1 p-3 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-xs font-medium text-slate-600 mb-2">Password must include:</p>
                    <ul className="space-y-1">
                      {passwordValidation.map((req, index) => (
                        <li
                          key={index}
                          className={`flex items-center gap-2 text-xs transition-colors ${req.passed ? 'text-green-600' : 'text-slate-500'}`}
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

                <div className="relative">
                  <input
                    id="confirm_password"
                    name="confirm_password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password *"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearErrors(); }}
                    disabled={isLoading || success}
                    autoComplete="new-password"
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

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-2 rounded-full border border-gray-200 px-6 py-2.5 text-sm font-semibold text-slate-700 transition-all hover:bg-gray-50 disabled:opacity-70"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || success}
                    className="group flex-1 flex items-center justify-center gap-2 rounded-full bg-primary py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.98]"
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
                </div>
              </form>
            )}

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
