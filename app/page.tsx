"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Star } from "lucide-react";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-white font-manrope">
            {/* Navigation Header */}
            <header className="w-full h-[99px] border-b border-gray-200/50 px-6 lg:px-16 flex items-center justify-between bg-white sticky top-0 z-50">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-lg font-bold text-[#0B1120]">vianosystems.ai</span>
                </div>

                <nav className="hidden md:flex items-center gap-8">
                    <a href="#features" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Features</a>
                    <a href="#pricing" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
                    <a href="#demo" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">Demo</a>
                </nav>

                <Link
                    href="/login"
                    className="bg-[#4B7BF5] hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-300"
                >
                    Get Started
                </Link>
            </header>

            {/* Hero Section */}
            <section className="relative w-full min-h-[600px] lg:min-h-[697px] overflow-hidden bg-gradient-to-br from-[#0B1120] via-[#101828] to-[#0B1120]">
                <div className="max-w-7xl mx-auto px-6 lg:px-16 py-16 lg:py-20 flex flex-col lg:flex-row items-center gap-12">
                    {/* Left Content */}
                    <div className="flex-1 z-10">
                        <div className="inline-flex items-center gap-2 mb-6">
                            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M16 0L20 12L32 16L20 20L16 32L12 20L0 16L12 12L16 0Z" fill="url(#star-gradient)" />
                                <defs>
                                    <linearGradient id="star-gradient" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                        <stop stopColor="#A855F7" />
                                        <stop offset="1" stopColor="#6366F1" />
                                    </linearGradient>
                                </defs>
                            </svg>
                        </div>

                        <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-8">
                            Property Intelligence AI
                            <br />
                            for Elite Realtors
                        </h1>

                        <Link
                            href="/signup"
                            className="inline-flex items-center justify-center gap-2 bg-[#4B7BF5] hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300"
                        >
                            Get Started <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>

                    {/* Right - Building Image */}
                    <div className="flex-1 relative">
                        <div className="relative w-full h-[400px] lg:h-[500px] rounded-2xl overflow-hidden">
                            <Image
                                src="/landing/Rectangle 72.png"
                                alt="Modern Property Building"
                                fill
                                className="object-cover"
                                priority
                            />
                        </div>
                    </div>
                </div>

                {/* Navigation Dots */}
                <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
                    <div className="w-3 h-3 rounded-full bg-white" />
                    <div className="w-3 h-3 rounded-full bg-white/40" />
                </div>
            </section>

            {/* Feature Cards Section */}
            <section id="features" className="py-16 lg:py-20 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Card 1 - Focus on what you do best */}
                        <div className="bg-white rounded-[17px] p-8 lg:p-10 shadow-lg border border-gray-100">
                            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">viANO. Property Intelligence</p>
                            <h3 className="text-xl lg:text-2xl font-bold text-[#0B1120] mb-6">
                                Focus on what you do best
                            </h3>

                            {/* Property Image */}
                            <div className="relative h-[240px] lg:h-[280px] rounded-xl overflow-hidden">
                                <Image
                                    src="/landing/Rectangle 72.png"
                                    alt="Property"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>

                        {/* Card 2 - We text YOU */}
                        <div className="bg-white rounded-[17px] p-8 lg:p-10 shadow-lg border border-gray-100 relative overflow-hidden">
                            {/* We text YOU heading */}
                            <div className="mb-4">
                                <Image
                                    src="/landing/Frame 45.png"
                                    alt="We text YOU. You forward it. You look like a hero."
                                    width={380}
                                    height={70}
                                    className="object-contain"
                                />
                            </div>

                            {/* Phone mockup */}
                            <div className="relative h-[280px] flex items-end justify-start">
                                <div className="relative w-[200px] h-[250px]">
                                    <Image
                                        src="/landing/image 1.png"
                                        alt="Phone showing Viano message"
                                        fill
                                        className="object-contain"
                                    />
                                </div>
                                {/* Chat bubble */}
                                <div className="absolute top-0 right-0 w-[180px]">
                                    <Image
                                        src="/landing/Frame 23.png"
                                        alt="Message bubble"
                                        width={180}
                                        height={140}
                                        className="object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* 88% Statistics Section */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-[#0B1120] leading-tight mb-12">
                        88% of your past clients will use a different realtor.
                        <span className="text-[#4B7BF5]"> Viano keeps you top of mind for the next 5 years.</span>
                    </h2>

                    {/* Chat bubbles */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <Image
                            src="/landing/Frame 74.png"
                            alt="Would you use our services again - Ofc, I definitely would"
                            width={450}
                            height={120}
                            className="object-contain"
                        />
                    </div>
                </div>
            </section>

            {/* Reality? Only 12% Section */}
            <section className="py-12 lg:py-16 bg-white">
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 mb-6">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 0L30 18L48 24L30 30L24 48L18 30L0 24L18 18L24 0Z" fill="url(#star-gradient2)" />
                            <defs>
                                <linearGradient id="star-gradient2" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#A855F7" />
                                    <stop offset="1" stopColor="#6366F1" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h3 className="text-2xl lg:text-4xl font-bold text-[#0B1120]">
                        Reality? Only 12% come back again
                    </h3>
                </div>
            </section>

            {/* Viano keeps you top of mind */}
            <section className="py-12 lg:py-16 bg-white">
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <div className="flex justify-center items-center gap-2 mb-6">
                        <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M24 0L30 18L48 24L30 30L24 48L18 30L0 24L18 18L24 0Z" fill="url(#star-gradient3)" />
                            <defs>
                                <linearGradient id="star-gradient3" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#A855F7" />
                                    <stop offset="1" stopColor="#8B5CF6" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 0L20 12L32 16L20 20L16 32L12 20L0 16L12 12L16 0Z" fill="url(#star-gradient4)" />
                            <defs>
                                <linearGradient id="star-gradient4" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#C084FC" />
                                    <stop offset="1" stopColor="#A855F7" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <h3 className="text-2xl lg:text-4xl font-bold text-[#0B1120]">
                        Viano keeps you top of mind
                        <br />
                        <span className="text-[#4B7BF5]">for years to come.</span>
                    </h3>
                </div>
            </section>

            {/* How It Helps Your Business */}
            <section className="py-12 lg:py-16 bg-white">
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">How It Helps Your Business</p>
                    <h2 className="text-2xl lg:text-4xl font-bold text-[#0B1120] mb-8">
                        Here&apos;s what changes in your business
                    </h2>

                    <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-lg border border-gray-100 max-w-2xl mx-auto">
                        <p className="text-base lg:text-lg text-gray-700">
                            Everyone tells you to buy more leads. Spend more ads. Cold call more prospects.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Data tells something different */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-6xl mx-auto px-6 lg:px-16">
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 mb-6">
                            <span className="text-sm text-gray-600">The Numbers Don&apos;t Lie</span>
                        </div>
                        <h2 className="text-2xl lg:text-5xl font-bold text-[#0B1120]">
                            The Data tells something <span className="text-[#4B7BF5]">different..</span>
                        </h2>
                    </div>

                    {/* Statistics Cards Image */}
                    <div className="max-w-5xl mx-auto">
                        <Image
                            src="/landing/Frame 115.png"
                            alt="Statistics - Market Reality 85%, The Gap 12%, Critical Window 81%, Your Opportunity $15K-130K"
                            width={1200}
                            height={500}
                            className="w-full object-contain"
                        />
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-16 lg:py-24" style={{ background: "radial-gradient(50.99% 50.99% at 50% 50.99%, #0B1120 0%, #000000 48.48%, #0B1120 93.75%)" }}>
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <p className="text-xs text-blue-400 uppercase tracking-wider mb-4">PRICING PLANS</p>
                    <h2 className="text-2xl lg:text-5xl font-bold text-white mb-4">
                        Pay According To Your Usage
                    </h2>
                    <p className="text-gray-400 mb-12 max-w-xl mx-auto text-sm lg:text-base">
                        Get started with our affordable plans. No hidden fees. Scale as you grow. Cancel anytime.
                    </p>

                    {/* Pricing Card */}
                    <div className="flex justify-center">
                        <Image
                            src="/landing/Frame 32.png"
                            alt="Property Intelligence - $8/mo Per Client - Trending"
                            width={320}
                            height={480}
                            className="object-contain"
                        />
                    </div>
                </div>
            </section>

            {/* CTA Banner */}
            <section className="py-6 lg:py-8 bg-[#0B1120]">
                <div className="max-w-5xl mx-auto px-6 lg:px-16">
                    <Image
                        src="/landing/Frame 72.png"
                        alt="Viano keeps you top-of-mind with automated, valuable follow-up using inspection data only YOU have. Get Started with Viano"
                        width={1000}
                        height={100}
                        className="w-full object-contain"
                    />
                </div>
            </section>

            {/* Contact / Demo Section */}
            <section id="demo" className="py-16 lg:py-24 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="bg-white rounded-[32px] p-6 lg:p-12 shadow-xl border border-gray-100 flex flex-col lg:flex-row gap-8 lg:gap-12 items-center">
                        {/* Form Side */}
                        <div className="flex-1 w-full">
                            <p className="text-xs text-[#4B7BF5] uppercase tracking-wider mb-2">GET STARTED</p>
                            <h2 className="text-2xl lg:text-4xl font-bold text-[#0B1120] mb-3">
                                Get Your Team Started with Viano
                            </h2>
                            <p className="text-gray-500 mb-8 text-sm lg:text-base">
                                Experience the future of real estate client engagement. Book a demo today.
                            </p>

                            <form className="space-y-4">
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="John"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="john@company.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white text-sm text-gray-600">
                                        <option>1-5 agents</option>
                                        <option>6-20 agents</option>
                                        <option>21-50 agents</option>
                                        <option>50+ agents</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-[#4B7BF5] hover:bg-blue-600 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 text-sm lg:text-base"
                                >
                                    Request a Demo
                                </button>
                            </form>
                        </div>

                        {/* Image Side - Professional woman */}
                        <div className="flex-1 w-full max-w-md">
                            <div className="relative h-[300px] lg:h-[450px] rounded-2xl overflow-hidden">
                                <Image
                                    src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80"
                                    alt="Professional realtor"
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

