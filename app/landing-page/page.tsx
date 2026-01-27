"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import "./landing.css";

export default function LandingPage() {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [pricingDropdownOpen, setPricingDropdownOpen] = useState(false);
    const [selectedClients, setSelectedClients] = useState("Select Clients");
    const [teamSizeDropdownOpen, setTeamSizeDropdownOpen] = useState(false);
    const [selectedTeamSize, setSelectedTeamSize] = useState("Team Size");

    const pricingDropdownRef = useRef<HTMLDivElement>(null);
    const teamDropdownRef = useRef<HTMLDivElement>(null);

    // Click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pricingDropdownRef.current && !pricingDropdownRef.current.contains(event.target as Node)) {
                setPricingDropdownOpen(false);
            }
            if (teamDropdownRef.current && !teamDropdownRef.current.contains(event.target as Node)) {
                setTeamSizeDropdownOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const checkScrollPosition = () => {
        if (carouselRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
            setCanScrollLeft(scrollLeft > 10);
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
        }
    };

    useEffect(() => {
        checkScrollPosition();
        const carousel = carouselRef.current;
        if (carousel) {
            carousel.addEventListener('scroll', checkScrollPosition);
            return () => carousel.removeEventListener('scroll', checkScrollPosition);
        }
    }, []);

    const scrollLeft = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: -604, behavior: 'smooth' });
        }
    };

    const scrollRight = () => {
        if (carouselRef.current) {
            carouselRef.current.scrollBy({ left: 604, behavior: 'smooth' });
        }
    };


    // Scroll reveal hook
    useEffect(() => {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('reveal-visible');
                }
            });
        }, observerOptions);

        const revealElements = document.querySelectorAll('.reveal-hidden');
        revealElements.forEach(el => observer.observe(el));

        return () => observer.disconnect();
    }, []);

    return (
        <div className="landing-page">
            {/* ============================================
          STICKY HEADER SECTION
          ============================================ */}
            <header className="landing-header reveal-hidden fade-only">
                {/* Frame 128 - Logo + Nav Container */}
                <div className="main-nav-frame">
                    {/* Logo - image 3 */}
                    <Image
                        src="/Logo.svg"
                        alt="Viano"
                        width={123}
                        height={41}
                        className="viano-main-logo"
                        priority
                    />

                    {/* Frame 127 - Navigation Links */}
                    <nav className="nav-links-frame">
                        {/* Product */}
                        <div className="nav-item-frame">
                            <button
                                className="nav-link"
                                onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Product
                                <ChevronDown className="dropdown-arrow" size={16} />
                            </button>
                        </div>

                        {/* Pricing */}
                        <div className="nav-item-frame">
                            <button
                                className="nav-link"
                                onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Pricing
                                <ChevronDown className="dropdown-arrow" size={16} />
                            </button>
                        </div>

                        {/* Company */}
                        <div className="nav-item-frame">
                            <button
                                className="nav-link"
                                onClick={() => document.getElementById('company')?.scrollIntoView({ behavior: 'smooth' })}
                            >
                                Company
                                <ChevronDown className="dropdown-arrow" size={16} />
                            </button>
                        </div>
                    </nav>
                </div>

                {/* Auth Buttons */}
                <div className="auth-buttons">
                    <Link href="/login">
                        <button className="login-btn">Login</button>
                    </Link>
                    <Link href="/signup">
                        <button className="get-started-btn">
                            Get Started
                            <ArrowRight className="arrow-icon" size={16} />
                        </button>
                    </Link>
                </div>
            </header>

            {/* Page Content - Account for fixed header */}
            <div className="page-content">
                {/* ============================================
            HERO SECTION - Using exact Figma SVG
            ============================================ */}
                <section className="hero-section">
                    {/* Hero Image - Full visible picture */}
                    <div className="hero-image-container reveal-hidden fade-only delay-300">
                        <Image
                            src="/Picture In Hero.png"
                            alt="Team collaboration"
                            width={1862}
                            height={1552}
                            className="hero-image"
                            priority
                            quality={100}
                            unoptimized
                        />
                    </div>

                    {/* Ellipse 8 - Major background shape creating the curve over the image */}
                    <div className="hero-bg-ellipse-8 reveal-hidden fade-only" />

                    {/* Ellipse 7 - Glow effect */}
                    <div className="hero-bg-ellipse-7 reveal-hidden fade-only delay-200" />

                    {/* Frame 50 - Content Container */}
                    <div className="hero-content-frame">
                        {/* Frame 114 - Icon + Headline */}
                        <div className="hero-text-frame">
                            {/* StarFour Icon with gradient */}
                            <div className="star-icon-wrapper reveal-hidden scale-only delay-100">
                                <svg
                                    className="star-icon"
                                    viewBox="0 0 98 98"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M97.6339 48.808C97.6458 50.2391 97.2108 51.637 96.3903 52.8088C95.5698 53.9806 94.4036 54.8687 93.0562 55.3479L65.3966 65.4069L55.3419 93.0622C54.847 94.3971 53.9549 95.5485 52.7857 96.3615C51.6165 97.1746 50.226 97.6104 48.8017 97.6104C47.3775 97.6104 45.987 97.1746 44.8178 96.3615C43.6486 95.5485 42.7565 94.3971 42.2616 93.0622L32.2076 65.402L4.5479 55.3479C3.21295 54.8529 2.06158 53.9608 1.24848 52.7916C0.435386 51.6224 -0.000427246 50.232 -0.000427246 48.8078C-0.000427246 47.3835 0.435386 45.9931 1.24848 44.8239C2.06158 43.6547 3.21295 42.7625 4.5479 42.2676L32.2076 32.2135L42.2616 4.55337C42.7565 3.21843 43.6486 2.06705 44.8178 1.25395C45.987 0.440858 47.3775 0.00500488 48.8017 0.00500488C50.226 0.00500488 51.6165 0.440858 52.7857 1.25395C53.9549 2.06705 54.847 3.21843 55.3419 4.55337L65.4015 32.2135L93.0562 42.2676C94.4036 42.7469 95.5698 43.6349 96.3903 44.8067C97.2108 45.9785 97.6458 47.3764 97.6339 48.808Z"
                                        fill="url(#star-gradient)"
                                    />
                                    <defs>
                                        <linearGradient
                                            id="star-gradient"
                                            x1="0"
                                            y1="48.808"
                                            x2="97.634"
                                            y2="48.808"
                                            gradientUnits="userSpaceOnUse"
                                        >
                                            <stop stopColor="#A23BF6" />
                                            <stop offset="1" stopColor="#96BEFF" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>

                            {/* Headline */}
                            <h1 className="hero-headline reveal-hidden delay-200">
                                Property Intelligence AI
                                <br />
                                for Elite Realtors
                            </h1>
                        </div>

                        {/* Frame 17 - Get Started Button */}
                        <Link href="/signup" className="reveal-hidden delay-300">
                            <button className="hero-cta-button">
                                <span className="hero-cta-text">Get Started</span>
                                <ArrowRight className="hero-cta-arrow" size={24} />
                            </button>
                        </Link>
                    </div>
                </section>

                {/* ============================================
                    FEATURE CARDS SECTION
                    ============================================ */}
                <section id="product" className="features-section reveal-hidden">
                    {/* Section Header with Arrows */}
                    <div className="features-header">
                        <div className="features-header-spacer"></div>
                        <div className="carousel-arrows">
                            <button
                                className={`carousel-arrow ${!canScrollLeft ? 'carousel-arrow-disabled' : ''}`}
                                onClick={scrollLeft}
                                disabled={!canScrollLeft}
                            >
                                <ChevronLeft size={20} />
                            </button>
                            <button
                                className={`carousel-arrow ${!canScrollRight ? 'carousel-arrow-disabled' : ''}`}
                                onClick={scrollRight}
                                disabled={!canScrollRight}
                            >
                                <ChevronRight size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Feature Cards Carousel */}
                    <div className="features-carousel" ref={carouselRef}>
                        {/* Frame 21 - Property Intelligence */}
                        <div className="feature-card feature-card-dark reveal-hidden delay-100">
                            <div className="feature-badge">Property Intelligence</div>
                            <h2 className="feature-headline">
                                You close new deals.<br />
                                Viano protects the ones<br />
                                you've already won.
                            </h2>
                            <div className="feature-image-container">
                                <Image
                                    src="/Dots in Frame 21.svg"
                                    alt="Dots pattern"
                                    width={400}
                                    height={200}
                                    className="feature-dots"
                                />
                                <Image
                                    src="/Mobile in Frame 21.svg"
                                    alt="Mobile notification"
                                    width={350}
                                    height={400}
                                    className="feature-mobile"
                                />
                            </div>
                        </div>

                        {/* Frame 22 - Predictive SMS */}
                        <div className="feature-card feature-card-light reveal-hidden delay-300">
                            <div className="feature-badge feature-badge-outline">Predictive SMS</div>
                            <h2 className="feature-headline feature-headline-dark">
                                We text YOU. You forward<br />
                                it. You look like a hero.
                            </h2>
                            <div className="feature-image-container">
                                <Image
                                    src="/Chat in Frame 23.png"
                                    alt="Chat bubble"
                                    width={400}
                                    height={300}
                                    className="feature-chat"
                                />
                            </div>
                        </div>

                        {/* Frame 120 - Local Contractors */}
                        <div className="feature-card feature-card-light reveal-hidden delay-500">
                            <div className="feature-badge feature-badge-outline">Local Contract</div>
                            <h2 className="feature-headline feature-headline-dark">
                                Vetted Contractors at your<br />
                                fingertips. Win-win.
                            </h2>
                            <div className="feature-image-container feature-network">
                                <Image
                                    src="/Frame 120.svg"
                                    alt="Network visualization"
                                    width={500}
                                    height={350}
                                    className="feature-network-img"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================
                    STATISTICS SECTION
                    ============================================ */}
                <section className="stats-section reveal-hidden">
                    {/* Main Statistic Text */}
                    <p className="stats-main-text reveal-hidden delay-100">
                        <span className="stats-highlight">88%</span> of your past clients will<br />
                        use a different realtor. Viano<br />
                        keeps you top of mind for the<br />
                        next 5 years.
                    </p>

                    {/* Chat Conversation - Frame 74 */}
                    <div className="stats-chat reveal-hidden delay-200">
                        <Image
                            src="/Frame 74.png"
                            alt="Chat conversation"
                            width={400}
                            height={150}
                            className="stats-chat-img"
                        />
                    </div>

                    {/* Reality Text */}
                    <p className="stats-reality-text reveal-hidden delay-300">
                        Reality? Only <span className="stats-highlight-blue">12%</span> come back<br />
                        again.
                    </p>

                    {/* Star Icon - Frame 75 */}
                    <div className="stats-star reveal-hidden scale-only delay-400">
                        <Image
                            src="/Frame 75.png"
                            alt="Star icon"
                            width={80}
                            height={80}
                            className="stats-star-img"
                        />
                    </div>

                    {/* Viano Text */}
                    <p className="stats-viano-text reveal-hidden delay-500">
                        Viano keeps you top of mind<br />
                        for years to come.
                    </p>
                </section>

                {/* ============================================
                    PRICING SECTION (Frame 33)
                    ============================================ */}
                <section id="pricing" className="pricing-section reveal-hidden">
                    <div className="pricing-header reveal-hidden">
                        <div className="no-hidden-badge">NO HIDDEN CHARGES</div>
                        <h2 className="pricing-title">Simple, Usage-Based Pricing</h2>
                        <p className="pricing-description">
                            Viano tracks your clients' homes with proprietary AI and tells you exactly when to reach out. You stay remembered, trusted, and referred. Automatically.
                        </p>
                    </div>

                    <div className="pricing-card-outer reveal-hidden scale-only delay-200">
                        <div className="pricing-card">
                            <div className="trending-badge">Trending</div>
                            <h3 className="card-product-title">Property Intelligence</h3>
                            <div className="card-price">
                                <span className="price-amount">$8/mo</span>
                                <span className="price-unit">Per Client</span>
                            </div>
                            <p className="card-subtitle">Only pay for the clients you choose to manage.</p>

                            <hr className="card-divider" />

                            <div className="card-features">
                                <div className="card-feature">
                                    <span className="check-icon">✓</span>
                                    Five-year personalized client timeline
                                </div>
                                <div className="card-feature">
                                    <span className="check-icon">✓</span>
                                    Property-aware follow-ups & system insights
                                </div>
                                <div className="card-feature">
                                    <span className="check-icon">✓</span>
                                    Client reactivation & referral momentum
                                </div>
                                <div className="card-feature">
                                    <span className="check-icon">✓</span>
                                    SMS alerts sent directly to you.
                                </div>
                            </div>

                            <div className="pricing-actions">
                                <div className="custom-dropdown" ref={pricingDropdownRef}>
                                    <button
                                        className="dropdown-toggle"
                                        onClick={() => setPricingDropdownOpen(!pricingDropdownOpen)}
                                    >
                                        {selectedClients}
                                        <ChevronDown size={18} />
                                    </button>
                                    {pricingDropdownOpen && (
                                        <div className="dropdown-menu">
                                            <div className="dropdown-item" onClick={() => { setSelectedClients("1 Client - Free For 60 Days"); setPricingDropdownOpen(false); }}>
                                                1 Client - Free For 60 Days
                                            </div>
                                            <div className="dropdown-item" onClick={() => { setSelectedClients("3 Clients — $24 / Month"); setPricingDropdownOpen(false); }}>
                                                3 Clients — $24 / Month
                                            </div>
                                            <div className="dropdown-item" onClick={() => { setSelectedClients("6 Clients — $48 / Month"); setPricingDropdownOpen(false); }}>
                                                6 Clients — $48 / Month
                                            </div>
                                            <div className="dropdown-item" onClick={() => { setSelectedClients("12 Clients — $96 / Month"); setPricingDropdownOpen(false); }}>
                                                12 Clients — $96 / Month (MVP Limit)
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <button className="start-trial-btn">Start Your Free Trial</button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================
                    TEAMS SECTION (Frame 81)
                    ============================================ */}
                <section id="company" className="teams-section reveal-hidden">
                    <div className="teams-content reveal-hidden slide-left delay-100">
                        <div className="teams-badge">Teams & Brokers</div>
                        <h2 className="teams-title">Get Your Team Started with Viano</h2>
                        <p className="teams-description">
                            Brokers and Team leaders are eligible for discount pricing for their teams. Setup a 15 minute demo to review options with our team.
                        </p>

                        <form className="teams-form" onSubmit={(e) => e.preventDefault()}>
                            <div className="form-row">
                                <input type="text" placeholder="First Name" className="form-input" />
                                <input type="text" placeholder="Last Name" className="form-input" />
                            </div>
                            <input type="email" placeholder="Email" className="form-input" />
                            <div className="form-row">
                                <div className="custom-dropdown team-dropdown" ref={teamDropdownRef}>
                                    <button
                                        type="button"
                                        className="dropdown-toggle"
                                        onClick={() => setTeamSizeDropdownOpen(!teamSizeDropdownOpen)}
                                    >
                                        {selectedTeamSize}
                                        <ChevronDown size={18} />
                                    </button>
                                    {teamSizeDropdownOpen && (
                                        <div className="dropdown-menu">
                                            <div className="dropdown-item" onClick={() => { setSelectedTeamSize("1-5 Members"); setTeamSizeDropdownOpen(false); }}>1-5 Members</div>
                                            <div className="dropdown-item" onClick={() => { setSelectedTeamSize("6-20 Members"); setTeamSizeDropdownOpen(false); }}>6-20 Members</div>
                                            <div className="dropdown-item" onClick={() => { setSelectedTeamSize("20+ Members"); setTeamSizeDropdownOpen(false); }}>20+ Members</div>
                                        </div>
                                    )}
                                </div>
                                <div className="phone-input-container">
                                    <span className="phone-prefix">+1</span>
                                    <input type="tel" placeholder="Phone Number" className="form-input phone-input" />
                                </div>
                            </div>
                            <button className="request-demo-btn">Request A Demo</button>
                        </form>
                    </div>
                    <div className="teams-image reveal-hidden slide-right delay-200">
                        <Image
                            src="/Picture in Frame 81.png"
                            alt="Team member using Viano"
                            width={540}
                            height={400}
                            className="team-pic"
                        />
                    </div>
                </section>

                {/* ============================================
                    BUSINESS IMPACT SECTION (Phase 2)
                    ============================================ */}
                <section className="business-impact-section reveal-hidden">
                    <h2 className="impact-title reveal-hidden delay-100">
                        Here's what changes in your<br />
                        business : <span className="nothing-text">Nothing</span>
                    </h2>

                    <div className="impact-details reveal-hidden delay-200">
                        <p className="impact-description">
                            You don't log into another platform. You don't<br />
                            remember to follow up. You don't write messages 💬.<br />
                            You don't research or vet local contractors.
                        </p>
                    </div>

                    <div className="frame-45-container reveal-hidden scale-only delay-300">
                        <div className="frame-45-content">
                            Viano protects the ones<br />
                            you've already won.
                        </div>
                    </div>

                    <div className="ad-spend-text reveal-hidden delay-400">
                        <p>
                            Everyone tells you to buy more leads. Spend more on ads.<br />
                            Cold call more prospects.
                        </p>
                    </div>
                </section>

                {/* ============================================
                    DATA SECTION (Frame 115)
                    ============================================ */}
                <section className="data-section reveal-hidden">
                    <div className="data-infographic reveal-hidden scale-only delay-200">
                        <Image
                            src="/Frame 115.svg"
                            alt="Market Data Infographic"
                            width={1100}
                            height={800}
                            className="frame-115-svg"
                        />
                    </div>
                </section>

                {/* ============================================
                    FINAL CTA BANNER (Frame 72)
                    ============================================ */}
                <section className="final-cta-section reveal-hidden">
                    <div className="final-cta-container reveal-hidden scale-only">
                        <h2 className="cta-banner-text">
                            Property Intelligence AI<br />
                            for Elite Realtors
                        </h2>
                        <Link href="/signup">
                            <button className="cta-overlay-btn">Get Started with Viano</button>
                        </Link>
                    </div>
                </section>

                {/* ============================================
                    FOOTER
                    ============================================ */}
                <footer className="landing-footer reveal-hidden fade-only">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <h2 className="footer-logo">viano systems®</h2>
                            <p className="footer-tagline">Property Intelligence AI for Elite Realtors</p>
                        </div>

                        <div className="footer-nav">
                            <div className="footer-column">
                                <h4 className="footer-col-title">Product</h4>
                                <Link href="#" className="footer-link">How It Works</Link>
                                <Link href="#" className="footer-link">Pricing</Link>
                                <Link href="#" className="footer-link">Team Pricing</Link>
                            </div>
                            <div className="footer-column">
                                <h4 className="footer-col-title">Company</h4>
                                <Link href="#" className="footer-link">Contact</Link>
                            </div>
                            <div className="footer-column">
                                <h4 className="footer-col-title">Legal</h4>
                                <Link href="#" className="footer-link">Privacy Policy</Link>
                                <Link href="#" className="footer-link">Terms of Service</Link>
                            </div>
                        </div>
                    </div>

                    <hr className="footer-divider" />

                    <div className="footer-bottom">
                        <p className="copyright">© 2025 Viano. All rights reserved.</p>
                    </div>
                </footer>
            </div>
        </div >
    );
}

