"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Check, Menu, X } from "lucide-react";

// Custom Star Icon Component matching Figma
const StarIcon = ({ className = "", size = 24 }: { className?: string; size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
  </svg>
);

// Animated Counter Component with intersection observer
const AnimatedCounter = ({ end, suffix = "", duration = 2000 }: { end: number; suffix?: string; duration?: number }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isVisible) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};

// Fade in on scroll component
const FadeInOnScroll = ({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
    >
      {children}
    </div>
  );
};

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 2);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-white font-[var(--font-inter)] overflow-x-hidden scroll-smooth">
      {/* Navigation - Matching Figma */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0B1A2F]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="text-white font-bold text-lg tracking-tight">
              viano systems<sup className="text-[10px] ml-0.5">®</sup>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#products" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Products
              </Link>
              <Link href="#pricing" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Pricing
              </Link>
              <Link href="#company" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">
                Company
              </Link>
              <Link
                href="/signup"
                className="bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-[#7C5CFC]/25 active:scale-95"
              >
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-white p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden bg-[#0B1A2F] border-t border-white/10 overflow-hidden transition-all duration-300 ${mobileMenuOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="px-4 py-4 space-y-3">
            <Link href="#products" className="block text-gray-300 hover:text-white py-2 transition-colors">Products</Link>
            <Link href="#pricing" className="block text-gray-300 hover:text-white py-2 transition-colors">Pricing</Link>
            <Link href="#company" className="block text-gray-300 hover:text-white py-2 transition-colors">Company</Link>
            <Link
              href="/signup"
              className="block bg-[#7C5CFC] text-white text-center px-5 py-3 rounded-full font-medium mt-4 hover:bg-[#6B4FE0] transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Matching Figma exactly */}
      <section className="relative min-h-[90vh] flex items-center pt-16 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/hero-bg.png"
            alt="City Skyline"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B1A2F]/85 via-[#0B1A2F]/70 to-[#0B1A2F]" />
        </div>

        {/* Animated Stars - Figma style positioned on right */}
        <div className="absolute top-32 right-[10%] sm:right-[15%] z-10">
          <StarIcon className="text-[#A78BFA] animate-[pulse_2s_ease-in-out_infinite]" size={32} />
        </div>
        <div className="absolute top-48 right-[20%] sm:right-[25%] z-10">
          <StarIcon className="text-[#7C5CFC] animate-[pulse_2s_ease-in-out_infinite_0.5s]" size={20} />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="max-w-lg">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-bold text-white leading-[1.15] mb-8">
              <span className="inline-block animate-[fadeInUp_0.6s_ease-out_forwards]">Property Intelligence AI</span>
              <br />
              <span className="inline-block animate-[fadeInUp_0.6s_ease-out_0.2s_forwards] opacity-0">for Elite Realtors</span>
            </h1>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#7C5CFC]/30 active:scale-95 animate-[fadeInUp_0.6s_ease-out_0.4s_forwards] opacity-0 group"
            >
              Get Started
              <ArrowRight className="group-hover:translate-x-1 transition-transform duration-300" size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section - Matching Figma exactly */}
      <section className="py-16 sm:py-20 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Carousel with navigation */}
          <div className="relative">
            {/* Navigation arrows */}
            <div className="absolute -right-2 sm:right-0 top-0 flex items-center gap-2 z-10">
              <button
                onClick={() => setCurrentSlide(0)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentSlide === 0 ? 'bg-[#7C5CFC] text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={() => setCurrentSlide(1)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${currentSlide === 1 ? 'bg-[#7C5CFC] text-white' : 'bg-white text-gray-400 border border-gray-200 hover:border-gray-300'}`}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-5 mb-8 pt-12 sm:pt-0">
              {/* Card 1 - "Focus on what you do best" - Dark card */}
              <FadeInOnScroll>
                <div className="bg-[#0B1A2F] rounded-2xl p-5 sm:p-6 h-full transition-all duration-500 hover:shadow-xl">
                  <span className="text-gray-400 text-[11px] uppercase tracking-wider mb-3 block">Our Pitch</span>
                  <h3 className="text-white text-lg sm:text-xl font-semibold mb-5">
                    Focus on what you do best.
                  </h3>
                  <div className="relative h-52 sm:h-64 rounded-xl overflow-hidden bg-gradient-to-br from-[#1A2744] via-[#0F1B2E] to-[#0B1A2F] flex items-center justify-center">
                    {/* Ambient glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#7C5CFC]/10 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-[#7C5CFC]/20 rounded-full blur-3xl" />

                    {/* iPhone mockup with 3D perspective */}
                    <div className="relative transform hover:scale-105 transition-transform duration-500" style={{ perspective: '1000px' }}>
                      <div
                        className="relative w-[130px] sm:w-[150px] bg-gradient-to-b from-[#2A2A2C] to-[#1C1C1E] rounded-[28px] p-[3px] shadow-2xl"
                        style={{
                          transform: 'rotateY(-5deg) rotateX(2deg)',
                          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 30px rgba(124, 92, 252, 0.15), inset 0 1px 1px rgba(255,255,255,0.1)'
                        }}
                      >
                        <div className="bg-[#000000] rounded-[25px] overflow-hidden">
                          {/* Dynamic Island */}
                          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[60px] h-[18px] bg-black rounded-full z-20 flex items-center justify-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-[#1C1C1E] ring-1 ring-[#2C2C2E]" />
                            <div className="w-1.5 h-1.5 rounded-full bg-[#0D47A1]" />
                          </div>

                          {/* Status bar */}
                          <div className="flex justify-between items-center px-4 pt-1 pb-2 text-white text-[9px] font-semibold">
                            <span>9:41</span>
                            <div className="flex items-center gap-0.5">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M2 17h2v4H2v-4zm4-5h2v9H6v-9zm4-4h2v13h-2V8zm4-3h2v16h-2V5zm4-2h2v18h-2V3z" />
                              </svg>
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" />
                              </svg>
                              <div className="flex items-center ml-0.5">
                                <div className="w-5 h-2.5 border border-white/60 rounded-sm flex items-center p-px">
                                  <div className="w-3/4 h-full bg-white rounded-sm" />
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Notification header */}
                          <div className="text-center pt-1 pb-2 border-b border-white/5">
                            <div className="w-6 h-6 mx-auto mb-1 rounded-lg bg-gradient-to-br from-[#7C5CFC] to-[#5B3FD9] flex items-center justify-center text-white text-[8px] font-bold shadow-lg">
                              V
                            </div>
                            <span className="text-gray-300 text-[8px] font-medium">Viano Alert</span>
                            <p className="text-gray-500 text-[6px]">iMessage • Today 1:25 AM</p>
                          </div>

                          {/* Message bubble */}
                          <div className="p-2">
                            <div className="bg-gradient-to-br from-[#2C2C2E] to-[#1F1F21] rounded-2xl p-2.5 text-[6.5px] text-white leading-[1.4] space-y-0.5 shadow-inner border border-white/5">
                              <p className="font-semibold text-[7px]">🏠 David Citro - 123 41st Avenue</p>
                              <p className="text-gray-300 font-medium">HVAC Approaching Replacement</p>
                              <p className="text-gray-400">📅 Installed: 2015 (9 years old)</p>
                              <p className="text-gray-400">⏰ Lifespan: 10-15 years</p>
                              <p className="text-gray-300 mt-0.5 font-medium">🔧 Contractors:</p>
                              <p className="text-gray-400 pl-1.5 text-[6px]">• ABC HVAC ⭐4.8</p>
                              <p className="text-gray-400 pl-1.5 text-[6px]">• Cool Air Pros ⭐4.9</p>
                              <p className="text-[#7C5CFC] mt-1 font-semibold text-[7px]">→ Forward this to David</p>
                            </div>
                          </div>

                          {/* Home indicator */}
                          <div className="pb-2 flex justify-center">
                            <div className="w-20 h-1 bg-white/30 rounded-full" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>

              {/* Card 2 - "We text YOU" - Light card */}
              <FadeInOnScroll delay={150}>
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-lg border border-gray-100 h-full transition-all duration-500 hover:shadow-xl">
                  <span className="text-gray-400 text-[11px] uppercase tracking-wider mb-3 block">Our Promise</span>
                  <h3 className="text-gray-900 text-lg sm:text-xl font-semibold mb-5">
                    We text YOU. You forward it. You look like a hero.
                  </h3>
                  <div className="bg-[#F1F5F9] rounded-xl p-4">
                    <div className="space-y-3">
                      {/* Viano message bubble */}
                      <div className="flex gap-3 items-start">
                        <div className="w-7 h-7 rounded-full bg-[#7C5CFC] flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">V</div>
                        <div className="bg-[#7C5CFC] text-white px-3.5 py-2.5 rounded-2xl rounded-tl-none text-[13px] leading-relaxed max-w-[85%]">
                          Hi! The Johnson property at 123 Oak St might need roof attention based on the inspection. Perfect time to reach out! 🏠
                        </div>
                      </div>
                      {/* Reply indicator */}
                      <div className="flex justify-end">
                        <div className="bg-white text-gray-500 px-3 py-1.5 rounded-full text-[11px] border border-gray-200 shadow-sm">
                          Forwarded ✓
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeInOnScroll>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center gap-2">
              {[0, 1].map((index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${currentSlide === index ? 'bg-[#7C5CFC] w-6' : 'bg-gray-300 w-2 hover:bg-gray-400'}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section - Figma exact text */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInOnScroll>
            <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-snug mb-16">
              <span className="text-[#7C5CFC]">88%</span> of your past clients will use a different realtor. Viano keeps you top of mind for the{" "}
              <span className="text-[#7C5CFC]">next 5 years</span>.
            </p>
          </FadeInOnScroll>

          {/* Chat Bubbles - Figma style */}
          <div className="flex flex-col items-center gap-4 mb-16 max-w-md mx-auto">
            <FadeInOnScroll delay={200}>
              <div className="bg-[#7C5CFC] text-white px-6 py-3 rounded-2xl rounded-bl-none text-sm font-medium shadow-lg">
                Would you use our services again?
              </div>
            </FadeInOnScroll>
            <FadeInOnScroll delay={400}>
              <div className="bg-white text-gray-700 px-6 py-3 rounded-2xl rounded-br-none text-sm border border-gray-200 shadow-sm self-end">
                Oh, I definitely would
              </div>
            </FadeInOnScroll>
          </div>

          <FadeInOnScroll delay={600}>
            <p className="text-xl sm:text-2xl font-bold text-gray-900 mb-8">
              Reality? Only <span className="text-red-500">12%</span> come back again
            </p>
          </FadeInOnScroll>

          <FadeInOnScroll delay={700}>
            <div className="flex justify-center py-6">
              <div className="relative">
                <StarIcon className="text-[#7C5CFC] animate-[spin_8s_linear_infinite]" size={48} />
                <StarIcon className="text-[#A78BFA] absolute -top-2 -right-2 animate-[ping_2s_ease-in-out_infinite]" size={16} />
              </div>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={800}>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">
              Viano keeps you <span className="text-[#7C5CFC]">top of mind</span>
              <br />for years to come.
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Business Changes Section - Figma exact text */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeInOnScroll>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Here&apos;s what changes in your{" "}
              <span className="text-[#7C5CFC]">business</span>
            </h2>
          </FadeInOnScroll>

          <FadeInOnScroll delay={150}>
            <p className="text-gray-500 mb-12 max-w-xl mx-auto text-base">
              You don&apos;t log into another platform. You don&apos;t remember to follow up. You don&apos;t write messages 📝.
            </p>
          </FadeInOnScroll>

          <FadeInOnScroll delay={300}>
            <div className="bg-white rounded-2xl shadow-lg p-8 mb-16 hover:shadow-xl transition-shadow duration-500 border border-gray-100">
              <p className="text-lg sm:text-xl text-gray-700 font-medium">
                We text YOU. You forward it. You look like a hero <span className="text-xl">👋</span>.
              </p>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={450}>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 leading-relaxed max-w-2xl mx-auto">
              Everyone tells you to buy more leads. Spend more on ads. Cold call more prospects.
            </p>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Data Section - Figma exact text */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-12">
              <span className="text-gray-400 text-sm uppercase tracking-wider">The Viano Fact File</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">
                The Data tells something <span className="text-[#7C5CFC]">different</span>..
              </h2>
            </div>
          </FadeInOnScroll>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Market Reality Card - Figma exact */}
            <FadeInOnScroll delay={100}>
              <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0B1A2F] rounded-2xl p-6 text-white group hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#7C5CFC]/30 flex items-center justify-center">
                    <StarIcon className="text-[#A78BFA]" size={10} />
                  </div>
                  <span className="text-[#7C5CFC] text-sm font-medium">Market Reality</span>
                </div>
                <h3 className="text-5xl font-bold mb-2">
                  <AnimatedCounter end={85} suffix="%" />
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  of the market comes from repeat + referrals
                </p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7C5CFC] rounded-full w-0 group-hover:w-[85%] transition-all duration-1000 ease-out" />
                </div>
                <p className="text-gray-400 text-xs mt-4">Source: NAR Profile of Buyers</p>
              </div>
            </FadeInOnScroll>

            {/* The Gap Card - Figma exact */}
            <FadeInOnScroll delay={200}>
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 group hover:scale-[1.02] transition-all duration-500 hover:shadow-xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                    <StarIcon className="text-red-500" size={10} />
                  </div>
                  <span className="text-red-500 text-sm font-medium">The Gap</span>
                </div>
                <h3 className="text-5xl font-bold text-gray-900 mb-2">
                  <AnimatedCounter end={12} suffix="%" />
                </h3>
                <span className="inline-block bg-red-100 text-red-600 text-xs px-3 py-1 rounded-full mb-4 font-medium">Low</span>
                <p className="text-gray-600 text-sm">
                  is what most agents actually capture without follow-up
                </p>
                <p className="text-gray-400 text-xs mt-4">QRC research 2022</p>
              </div>
            </FadeInOnScroll>

            {/* Critical Window Card - Figma exact */}
            <FadeInOnScroll delay={300}>
              <div className="bg-gradient-to-br from-[#1E3A5F] to-[#0B1A2F] rounded-2xl p-6 text-white group hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-[#7C5CFC]/30 flex items-center justify-center">
                    <StarIcon className="text-[#A78BFA]" size={10} />
                  </div>
                  <span className="text-[#7C5CFC] text-sm font-medium">Critical Window</span>
                </div>
                <h3 className="text-5xl font-bold mb-2">
                  <AnimatedCounter end={81} suffix="%" />
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  of sellers said they&apos;d &ldquo;definitely&rdquo; use the same agent
                </p>
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-[#7C5CFC] rounded-full w-0 group-hover:w-[81%] transition-all duration-1000 ease-out" />
                </div>
                <p className="text-gray-400 text-xs mt-4">But attention fades. Fast.</p>
              </div>
            </FadeInOnScroll>

            {/* Opportunity Card - Figma exact */}
            <FadeInOnScroll delay={400}>
              <div className="bg-gradient-to-br from-[#FCD34D] to-[#F59E0B] rounded-2xl p-6 text-gray-900 group hover:scale-[1.02] transition-all duration-500 hover:shadow-2xl hover:shadow-yellow-500/20">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 rounded-full bg-white/40 flex items-center justify-center">
                    <StarIcon className="text-gray-900" size={10} />
                  </div>
                  <span className="text-gray-800 text-sm font-medium">Your Opportunity</span>
                </div>
                <h3 className="text-4xl font-bold mb-2">$15K-130K</h3>
                <p className="text-gray-800 text-sm font-medium">
                  additional annual revenue per agent with Viano
                </p>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Value Proposition Section - Figma exact */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="bg-gradient-to-br from-[#0B1A2F] to-[#1A2744] rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden group hover:shadow-2xl transition-all duration-500">
              {/* Animated Stars */}
              <div className="absolute top-8 right-8">
                <StarIcon className="text-[#A78BFA] animate-bounce" size={32} />
              </div>
              <div className="absolute bottom-16 right-20 animate-bounce" style={{ animationDelay: '0.3s' }}>
                <StarIcon className="text-[#7C5CFC]" size={24} />
              </div>
              <div className="absolute bottom-8 right-8 animate-bounce" style={{ animationDelay: '0.6s' }}>
                <StarIcon className="text-[#A78BFA]" size={16} />
              </div>

              <p className="text-xl sm:text-2xl text-white font-medium leading-relaxed mb-8 max-w-2xl mx-auto">
                Viano keeps you top-of-mind with automated, valuable follow-up using inspection data only <span className="text-[#A78BFA] font-bold">YOU</span> have.
              </p>

              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white px-8 py-4 rounded-full font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-[#7C5CFC]/30 active:scale-95 group/btn"
              >
                See How It Works
                <ArrowRight className="group-hover/btn:translate-x-1 transition-transform duration-300" size={18} />
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Pricing Section - Figma exact */}
      <section id="pricing" className="py-20 bg-[#0B1A2F]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInOnScroll>
            <div className="text-center mb-12">
              <span className="text-[#7C5CFC] text-sm font-medium uppercase tracking-wider">No Hidden Charges</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">
                Pay According To Your Usage
              </h2>
              <p className="text-gray-400 mt-4 max-w-lg mx-auto text-sm">
                Streamlined real estate solutions with automated document analysis, customizable insights, and 2-year property timeline to engage clients at key moments.
              </p>
            </div>
          </FadeInOnScroll>

          <FadeInOnScroll delay={200}>
            <div className="bg-[#1A2744] rounded-2xl p-8 max-w-md mx-auto hover:shadow-2xl hover:shadow-[#7C5CFC]/10 transition-all duration-500 border border-white/5">
              <div className="flex items-center gap-2 mb-4">
                <StarIcon className="text-[#7C5CFC]" size={20} />
                <span className="text-white font-semibold">Property Intelligence</span>
              </div>

              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-bold text-white">$7</span>
                <span className="text-gray-400">/mo/property</span>
              </div>

              <ul className="space-y-4 mb-8">
                {[
                  "Automated document analysis",
                  "2-year property timeline",
                  "Smart follow-up reminders",
                  "Client engagement insights",
                  "Email & SMS notifications"
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-300 text-sm">
                    <div className="w-5 h-5 rounded-full bg-[#7C5CFC]/20 flex items-center justify-center flex-shrink-0">
                      <Check className="text-[#7C5CFC]" size={12} />
                    </div>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="block w-full bg-[#7C5CFC] hover:bg-[#6B4FE0] text-white text-center py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg hover:shadow-[#7C5CFC]/25"
              >
                Start for Free
              </Link>
            </div>
          </FadeInOnScroll>
        </div>
      </section>

      {/* Contact Section - Figma exact */}
      <section className="py-20 bg-[#F8FAFC]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <FadeInOnScroll>
              <div>
                <span className="text-[#7C5CFC] text-sm font-medium">Viano Demo</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-4">
                  Get Your Team Started with Viano
                </h2>
                <p className="text-gray-600 mb-8">
                  Discover how Viano can transform your client relationships with intelligent, automated follow-ups that keep you top of mind.
                </p>

                <form className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="First Name"
                      className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/20 outline-none transition-all duration-300 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="Last Name"
                      className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/20 outline-none transition-all duration-300 text-sm"
                    />
                  </div>
                  <input
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/20 outline-none transition-all duration-300 text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Company"
                    className="w-full px-4 py-3.5 rounded-lg border border-gray-200 focus:border-[#7C5CFC] focus:ring-2 focus:ring-[#7C5CFC]/20 outline-none transition-all duration-300 text-sm"
                  />
                  <button
                    type="submit"
                    className="w-full bg-[#EF4444] hover:bg-[#DC2626] text-white py-4 rounded-lg font-semibold transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] hover:shadow-lg hover:shadow-red-500/25"
                  >
                    Request A Demo
                  </button>
                </form>
              </div>
            </FadeInOnScroll>

            <FadeInOnScroll delay={200}>
              <div className="relative hidden lg:block">
                <div className="relative h-[500px] rounded-2xl overflow-hidden shadow-2xl">
                  <Image
                    src="/contact-woman.png"
                    alt="Professional Realtor"
                    fill
                    className="object-cover object-center"
                  />
                </div>
              </div>
            </FadeInOnScroll>
          </div>
        </div>
      </section>

      {/* Footer - Figma exact */}
      <footer className="bg-[#0B1A2F] py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* Logo */}
            <div className="lg:col-span-2">
              <Link href="/" className="text-white font-bold text-xl">
                viano systems<sup className="text-[10px] ml-0.5">®</sup>
              </Link>
              <p className="text-gray-400 text-sm mt-4 max-w-xs">
                AI-powered property intelligence for elite realtors.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Product</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">How It Works</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Pricing</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Integrations</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Company</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">About</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Careers</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-white font-semibold mb-4 text-sm">Legal</h4>
              <ul className="space-y-3">
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Privacy Policy</Link></li>
                <li><Link href="#" className="text-gray-400 hover:text-white text-sm transition-colors duration-300">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 text-center">
            <p className="text-gray-500 text-sm">
              © 2024 Viano Systems®. All Rights Reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Global Keyframe Animations */}
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
