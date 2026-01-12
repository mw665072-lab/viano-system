"use client";

import { Eye, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function SignupPage() {
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
            src="/auth-bg.jpg" // Uses the same image as login
            alt="City Night"
            fill
            className="object-cover"
            priority
          />
        </div>

        {/* RIGHT SIDE: Signup Form */}
        <div className="flex w-full flex-col justify-center bg-blue-50/30 p-12 md:w-1/2">
          <div className="mx-auto w-full max-w-sm">
            <h2 className="mb-8 text-center text-2xl font-semibold text-slate-900">
              Signup
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

               {/* Username Input */}
               <div>
                <input
                  type="text"
                  placeholder="Username"
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

              {/* Signup Button */}
              <button
                type="submit"
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#003366] py-3 text-sm font-semibold text-white transition-all hover:bg-blue-900"
              >
                Signup
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </form>

            {/* Login Link */}
            <p className="mt-8 text-center text-sm text-slate-600">
              Already have an account?{" "}
              <Link href="/login" className="font-semibold text-slate-800 underline decoration-slate-400 underline-offset-2 hover:text-blue-900">
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}