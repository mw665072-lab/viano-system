"use client";

import { Eye, Check, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    // We use z-50 and bg-white to make sure this covers any existing sidebars/layouts
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
            src="/auth-bg.jpg" // This looks for the image you put in the public folder
            alt="City Night"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="flex w-full flex-col justify-center bg-blue-50/30 p-12 md:w-1/2">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">
              Login
            </h2>

            <form className="space-y-4">
              {/* Email Input */}
              <div>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>

              {/* Password Input */}
              <div className="relative">
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <Eye size={20} />
                </button>
              </div>

              {/* Forgot Password & Remember Me */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <Link href="#" className="font-medium text-slate-700 underline decoration-slate-400 underline-offset-2">
                  Forgot Password?
                </Link>
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className="flex h-4 w-4 items-center justify-center rounded border border-slate-400 bg-transparent text-white peer-checked:bg-blue-900 peer-checked:border-blue-900">
                     <Check size={12} className="hidden" /> 
                     {/* Note: Real checkbox logic would go here, styling simplistic for visual match */}
                     <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-blue-900 focus:ring-blue-900" />
                  </div>
                  <span>Remember Me</span>
                </label>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#003366] py-3 text-sm font-semibold text-white transition-all hover:bg-blue-900"
              >
                Log In
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {/* Sign Up Link */}
            <p className="mt-8 text-center text-sm text-slate-600">
              Don't have an account?{" "}
              <Link href="/signup" className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 hover:text-blue-900">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}