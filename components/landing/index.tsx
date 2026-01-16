import React from 'react'
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Check, MessageSquare, Clock, Users, Star, ChevronDown } from "lucide-react";

const LandingUsman = () => {
  return (
 <>
   <header className="w-full h-[99px] border-b border-gray-200/50 px-6 lg:px-16 flex items-center justify-between">
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
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-6 py-2.5 rounded-full transition-all duration-300 shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50"
                >
                    Get Started
                </Link>
            </header>

            {/* Hero Section */}
            <section className="relative w-full min-h-[697px] overflow-hidden">
                {/* Background Image with Overlay */}
                <div className="absolute inset-0">
                    <div className="w-full h-full bg-gradient-to-br from-[#0B1120] via-[#1a2744] to-[#0B1120]">
                        {/* City Skyline Overlay Effect */}
                        <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-[#0B1120]/90 to-transparent z-10" />
                        <div className="w-full h-full bg-cover bg-center opacity-60"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1920&q=80')" }} />
                    </div>
                </div>

                {/* Hero Content */}
                <div className="relative z-20 max-w-7xl mx-auto px-6 lg:px-16 pt-16 lg:pt-24">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 bg-blue-600/20 backdrop-blur-sm border border-blue-500/30 rounded-full px-4 py-2 mb-6">
                            <Star className="w-4 h-4 text-blue-400" />
                            <span className="text-sm text-blue-300 font-medium">Property Intelligence AI</span>
                        </div>

                        <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight mb-6">
                            Property Intelligence AI
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
                                for Elite Realtors
                            </span>
                        </h1>

                        <p className="text-lg text-gray-300 mb-8 max-w-lg">
                            Automate your client follow-ups with AI-powered property intelligence. Keep your clients engaged for years after closing.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                href="/signup"
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-xl shadow-blue-600/30 hover:shadow-blue-600/50 hover:scale-105"
                            >
                                Get Started <ArrowRight className="w-5 h-5" />
                            </Link>
                            <a
                                href="#demo"
                                className="inline-flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-full border border-white/20 transition-all duration-300"
                            >
                                Watch Demo
                            </a>
                        </div>
                    </div>

                    {/* Floating Navigation Dots */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-3">
                        <div className="w-3 h-3 rounded-full bg-white" />
                        <div className="w-3 h-3 rounded-full bg-white/40" />
                    </div>
                </div>
            </section>

            {/* Feature Cards Section */}
            <section id="features" className="py-16 lg:py-24 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
                        {/* Card 1 - Focus on what you do best */}
                        <div className="bg-white rounded-[17px] p-10 shadow-xl shadow-black/5 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">viANO. Property Intelligence</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-[#0B1120] mb-6">
                                Focus on what you do best
                            </h3>

                            {/* Image placeholder with gradient background */}
                            <div className="relative h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-[#0B1120] to-[#1a2744] mb-6">
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-full h-full bg-cover bg-center opacity-80"
                                        style={{ backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80')" }} />
                                </div>
                                <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">AI Analysis</span>
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white text-xs rounded-full">4-Point Inspection</span>
                                </div>
                            </div>

                            <p className="text-gray-600">
                                Let Viano handle the property inspections while you focus on closing deals and building relationships.
                            </p>
                        </div>

                        {/* Card 2 - We text YOU */}
                        <div className="bg-white rounded-[17px] p-10 shadow-xl shadow-black/5 border border-gray-100">
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-4">AI MESSAGING</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-[#0B1120] mb-6">
                                We text YOU. You forward it.
                                <br />
                                <span className="text-blue-600">You look like a hero.</span>
                            </h3>

                            {/* Chat bubbles illustration */}
                            <div className="relative h-[280px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-600 to-purple-600 p-6">
                                <div className="space-y-3">
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                                        <p className="text-white text-sm">
                                            Hey John! Your AC filter is due for a change. Here's a quick tip on maintaining your HVAC system...
                                        </p>
                                    </div>
                                    <div className="bg-white/30 backdrop-blur-sm rounded-2xl rounded-tr-sm p-4 max-w-[80%] ml-auto">
                                        <p className="text-white text-sm">
                                            Thanks! Forwarded to my client. They loved it! 🎉
                                        </p>
                                    </div>
                                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl rounded-tl-sm p-4 max-w-[80%]">
                                        <p className="text-white text-sm">
                                            Water heater maintenance reminder coming up next week...
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Statistics Section */}
            <section className="py-16 lg:py-24 bg-white">
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <h2 className="text-3xl lg:text-5xl font-bold text-[#0B1120] leading-tight mb-12">
                        88% of your past clients will use a different realtor.
                        <span className="text-blue-600"> Viano keeps you top of mind for the next 5 years.</span>
                    </h2>

                    {/* Interactive buttons */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                        <div className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-full font-medium shadow-lg shadow-blue-600/30">
                            <span>Would you use the same realtor again?</span>
                        </div>
                        <div className="flex items-center gap-3 bg-gray-100 text-gray-700 px-6 py-3 rounded-full font-medium border border-gray-200">
                            <span>Uuh. I definitely would</span>
                        </div>
                    </div>

                    {/* Reality Statistics */}
                    <div className="mb-16">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-6">
                            <Star className="w-8 h-8 text-purple-600" />
                        </div>
                        <h3 className="text-2xl lg:text-4xl font-bold text-[#0B1120] mb-4">
                            Reality? Only 12% come back again
                        </h3>
                    </div>

                    {/* Value Proposition */}
                    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 lg:p-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-6 shadow-xl shadow-blue-600/30">
                            <Star className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="text-2xl lg:text-4xl font-bold text-[#0B1120]">
                            Viano keeps you top of mind
                            <br />
                            <span className="text-blue-600">for years to come.</span>
                        </h3>
                    </div>
                </div>
            </section>

            {/* Pricing Section */}
            <section id="pricing" className="py-16 lg:py-24" style={{ background: "radial-gradient(50.99% 50.99% at 50% 50.99%, #0B1120 0%, #000000 48.48%, #0B1120 93.75%)" }}>
                <div className="max-w-4xl mx-auto px-6 lg:px-16 text-center">
                    <p className="text-xs text-blue-400 uppercase tracking-wider mb-4">PRICING PLANS</p>
                    <h2 className="text-3xl lg:text-5xl font-bold text-white mb-4">
                        Pay According To Your Usage
                    </h2>
                    <p className="text-gray-400 mb-12 max-w-2xl mx-auto">
                        Get started with our affordable plans. No hidden fees. Scale as you grow. Cancel anytime.
                    </p>

                    {/* Pricing Card */}
                    <div className="bg-[#1a2744] rounded-3xl p-8 lg:p-10 text-left max-w-md mx-auto border border-blue-500/20">
                        <div className="inline-flex items-center gap-2 bg-blue-600/20 rounded-full px-3 py-1 mb-6">
                            <span className="text-sm text-blue-400 font-medium">Most Popular</span>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-2">Property Intelligence</h3>
                        <div className="flex items-baseline gap-2 mb-6">
                            <span className="text-4xl font-bold text-white">$29</span>
                            <span className="text-gray-400">/month</span>
                        </div>

                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-blue-400" />
                                </div>
                                Unlimited property analysis
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-blue-400" />
                                </div>
                                AI-powered maintenance reminders
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-blue-400" />
                                </div>
                                5-year client engagement
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <div className="w-5 h-5 bg-blue-600/20 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-blue-400" />
                                </div>
                                Priority support
                            </li>
                        </ul>

                        <Link
                            href="/signup"
                            className="w-full inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300"
                        >
                            Get Started <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Contact / Demo Section */}
            <section id="demo" className="py-16 lg:py-24 bg-[#F8FAFC]">
                <div className="max-w-7xl mx-auto px-6 lg:px-16">
                    <div className="bg-white rounded-[32px] p-8 lg:p-12 shadow-xl shadow-black/5 flex flex-col lg:flex-row gap-12 items-center">
                        {/* Form Side */}
                        <div className="flex-1 w-full">
                            <p className="text-xs text-blue-600 uppercase tracking-wider mb-2">GET STARTED</p>
                            <h2 className="text-3xl lg:text-4xl font-bold text-[#0B1120] mb-3">
                                Get Your Team Started with Viano
                            </h2>
                            <p className="text-gray-600 mb-8">
                                Experience the future of real estate client engagement. Book a demo today.
                            </p>

                            <form className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                        <input
                                            type="text"
                                            placeholder="John"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                        <input
                                            type="text"
                                            placeholder="Doe"
                                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        placeholder="john@company.com"
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Team Size</label>
                                    <select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all bg-white">
                                        <option>1-5 agents</option>
                                        <option>6-20 agents</option>
                                        <option>21-50 agents</option>
                                        <option>50+ agents</option>
                                    </select>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 shadow-lg shadow-blue-600/30"
                                >
                                    Request a Demo
                                </button>
                            </form>
                        </div>

                        {/* Image Side */}
                        <div className="flex-1 w-full max-w-md">
                            <div className="relative h-[400px] rounded-2xl overflow-hidden">
                                <div className="w-full h-full bg-cover bg-center"
                                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80')" }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
 </>
  )
}

export default LandingUsman
