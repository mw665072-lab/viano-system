"use client";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ArrowRight, ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import "./landing.css";

export default function LandingPage() {
    const carouselRef = useRef<HTMLDivElement>(null);
    const [canScrollRight, setCanScrollRight] = useState(true);
    const [teamSizeDropdownOpen, setTeamSizeDropdownOpen] = useState(false);
    const [selectedTeamSize, setSelectedTeamSize] = useState("Team Size");
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const teamDropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
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
            const currentScroll = Math.round(scrollLeft);
            const maxScroll = Math.round(scrollWidth - clientWidth);
            const canGoRight = currentScroll < maxScroll - 10;
            setCanScrollRight(canGoRight);
        }
    };

    const scrollByCard = (direction: number) => {
        if (carouselRef.current) {
            const firstCard = carouselRef.current.firstElementChild;
            const gap = window.innerWidth <= 1024 ? 16 : 24;
            const amount = firstCard ? firstCard.getBoundingClientRect().width + gap : 544;
            carouselRef.current.scrollBy({ left: direction * amount, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        checkScrollPosition();
        const interval = setInterval(checkScrollPosition, 500);
        const timeout = setTimeout(() => clearInterval(interval), 5000);
        const carousel = carouselRef.current;
        if (carousel) {
            carousel.addEventListener('scroll', checkScrollPosition);
            window.addEventListener('resize', checkScrollPosition);
            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
                carousel.removeEventListener('scroll', checkScrollPosition);
                window.removeEventListener('resize', checkScrollPosition);
            };
        }
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, []);

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
            <header className="landing-header fade-only">
                <div className="main-nav-frame">
                    <Image
                        src="/Logo.svg"
                        alt="Viano"
                        width={55}
                        height={46}
                        className="viano-main-logo"
                        priority
                    />
                    <nav className="nav-links-frame">
                        <div className="nav-item-frame">
                            <button className="nav-link" onClick={() => document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' })}>
                                Product
                                <ChevronDown className="dropdown-arrow" size={16} />
                            </button>
                        </div>
                        <div className="nav-item-frame">
                            <button className="nav-link" onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>
                                Pricing
                                <ChevronDown className="dropdown-arrow" size={16} />
                            </button>
                        </div>
                        <div className="nav-item-frame">
                            <button className="nav-link" onClick={() => document.getElementById('company')?.scrollIntoView({ behavior: 'smooth' })}>
                                Company
                                <ChevronDown className="dropdown-arrow" size={16} />
                            </button>
                        </div>
                    </nav>
                </div>

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

                <button
                    className="mobile-menu-btn"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Toggle mobile menu"
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </header>

            {mobileMenuOpen && (
                <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)}>
                    <nav className="mobile-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="mobile-nav-link" onClick={() => { document.getElementById('product')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Product</button>
                        <button className="mobile-nav-link" onClick={() => { document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Pricing</button>
                        <button className="mobile-nav-link" onClick={() => { document.getElementById('company')?.scrollIntoView({ behavior: 'smooth' }); setMobileMenuOpen(false); }}>Company</button>
                    </nav>
                </div>
            )}

            <div className="page-content">
                {/* ============================================
            HERO SECTION
            ============================================ */}
                <section className="hero-section">
                    <div className="hero-orange-glow" />
                    <div className="hero-curve-overlay" />
                    <div className="hero-content-frame">
                        <div className="hero-text-frame">
                            <div className="star-icon-wrapper scale-only delay-100">
                                <svg
                                    className="star-icon"
                                    viewBox="0 0 202 202"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        d="M165.687 101C165.702 102.91 165.121 104.777 164.026 106.342C162.931 107.906 161.375 109.091 159.576 109.731L122.652 123.158L109.23 160.076C108.569 161.858 107.377 163.396 105.817 164.481C104.256 165.566 102.401 166.148 100.5 166.148C98.5986 166.148 96.7431 165.566 95.1825 164.481C93.6218 163.396 92.4307 161.858 91.7692 160.076L78.3475 123.152L41.4234 109.731C39.6413 109.069 38.1042 107.878 37.0188 106.317C35.9334 104.757 35.3516 102.901 35.3516 101C35.3516 99.0991 35.9334 97.2436 37.0188 95.6829C38.1042 94.1223 39.6413 92.9312 41.4234 92.2696L78.3475 78.848L91.7692 41.9239C92.4307 40.1417 93.6218 38.6047 95.1825 37.5193C96.7431 36.4338 98.5986 35.8521 100.5 35.8521C102.401 35.8521 104.256 36.4338 105.817 37.5193C107.377 38.6047 108.569 40.1417 109.23 41.9239L122.658 78.848L159.576 92.2696C161.375 92.9094 162.931 94.094 164.026 95.6586C165.121 97.2233 165.702 99.0903 165.687 101Z"
                                        fill="url(#heroStarGrad)"
                                    />
                                    <defs>
                                        <linearGradient id="heroStarGrad" x1="35" y1="35" x2="165" y2="165" gradientUnits="userSpaceOnUse">
                                            <stop stopColor="#E8730A" />
                                            <stop offset="1" stopColor="#C4600A" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                            <h1 className="hero-headline">
                                Property Intelligence AI for Elite Realtors
                            </h1>
                        </div>
                        <Link href="/signup">
                            <button className="hero-cta-button">
                                <span className="hero-cta-text">Get Started</span>
                                <ArrowRight className="hero-cta-arrow" size={24} />
                            </button>
                        </Link>
                    </div>
                    <div className="hero-image-container">
                        <div className="hero-image-fade" />
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
                </section>

                {/* ============================================
                    FEATURE CARDS SECTION
                    ============================================ */}
                <section id="product" className="features-section">
                    <div className="features-header">
                        <button className="carousel-arrow" onClick={() => scrollByCard(-1)} aria-label="Scroll left">
                            <ChevronLeft size={22} />
                        </button>
                        <button className="carousel-arrow" onClick={() => scrollByCard(1)} aria-label="Scroll right">
                            <ChevronRight size={22} />
                        </button>
                    </div>

                    <div className={`features-carousel${canScrollRight ? ' fade-right' : ''}`} ref={carouselRef}>
                        {/* Property Intelligence Card */}
                        <div className="feature-card feature-card-dark">
                            <div className="feature-badge">Property Intelligence</div>
                            <h2 className="feature-headline">
                                You close new deals.<br />
                                Viano protects the ones<br />
                                you've already won.
                            </h2>
                            <Image
                                src="/dots-orange.svg"
                                alt="Dots pattern"
                                width={400}
                                height={400}
                                className="feature-dots"
                            />
                            <Image
                                src="/Mobile in Frame 21.svg"
                                alt="Mobile notification"
                                width={360}
                                height={380}
                                className="feature-mobile"
                            />
                        </div>

                        {/* Follow Up Card */}
                        <div className="feature-card feature-card-light">
                            <div className="feature-badge feature-badge-outline">Predictive SMS</div>
                            <h2 className="feature-headline feature-headline-dark">
                                We text YOU. You forward<br />
                                it. You look like<br />
                                a hero.
                            </h2>
                            <div className="feature-sms-mockup">
                                <div className="sms-bubble">
                                    <div className="sms-bubble-line">👩 Sarah Martinez - 456 Ocean Drive</div>
                                    <div className="sms-bubble-line">🏠 Roof Inspection Recommended</div>
                                    <div className="sms-bubble-line">➡️ Installed: 2010 (15 years old)</div>
                                    <div className="sms-bubble-line">🤍 Expected lifespan: 15-20 years</div>
                                    <div className="sms-bubble-line">👷 Local Roofers:</div>
                                    <div className="sms-bubble-line sms-bubble-indent">Sunshine Roofing (4.9★)</div>
                                    <div className="sms-bubble-line sms-bubble-indent">Coastal Roof Pros (4.8★)</div>
                                    <div className="sms-bubble-line sms-bubble-cta">⭐ Forward this to Sarah.</div>
                                </div>
                            </div>
                        </div>

                        {/* Lead Generation Network Card */}
                        <div className="feature-card feature-card-light">
                            <div className="feature-badge feature-badge-outline">Lead Generation Network</div>
                            <h2 className="feature-headline feature-headline-dark">
                                Vetted contractors at your<br />
                                fingertips. Win-win-win.
                            </h2>
                            <Image
                                src="/lead-gen-network.svg"
                                alt="Network of vetted contractors connected to the agent"
                                width={360}
                                height={298}
                                className="feature-network-graphic"
                            />
                        </div>
                    </div>

                    <div className="scroll-hint-container" aria-hidden="true">
                        {!canScrollRight ? (
                            <span className="scroll-hint">Scroll left ←</span>
                        ) : (
                            <span className="scroll-hint">Scroll right →</span>
                        )}
                    </div>
                </section>

                {/* ============================================
                    STATISTICS SECTION
                    ============================================ */}
                <section className="stats-section reveal-hidden">
                    <p className="stats-main-text reveal-hidden delay-100">
                        <span className="highlight-blue">88%</span> of your past clients will use a different realtor. Viano keeps you top of mind for the <span className="highlight-blue">next 5 years</span>.
                    </p>
                    <div className="stats-chat reveal-hidden delay-200">
                        <div className="chat-bubble chat-bubble-received">Would you use our services again?</div>
                        <div className="chat-bubble chat-bubble-sent">Ofc, I definitely would</div>
                    </div>
                </section>

                {/* ============================================
                    REALITY SECTION
                    ============================================ */}
                <section className="reality-section reveal-hidden">
                    <p className="reality-statement reveal-hidden delay-100">
                        <span className="reality-orange">Reality?</span> Only 12% come back again
                    </p>
                    <div className="reality-star reveal-hidden scale-only delay-200">
                        <svg width="120" height="120" viewBox="0 0 202 202" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="101" cy="101" r="101" fill="#0D0D0D" />
                            <path
                                d="M165.687 101C165.702 102.91 165.121 104.777 164.026 106.342C162.931 107.906 161.375 109.091 159.576 109.731L122.652 123.158L109.23 160.076C108.569 161.858 107.377 163.396 105.817 164.481C104.256 165.566 102.401 166.148 100.5 166.148C98.5986 166.148 96.7431 165.566 95.1825 164.481C93.6218 163.396 92.4307 161.858 91.7692 160.076L78.3475 123.152L41.4234 109.731C39.6413 109.069 38.1042 107.878 37.0188 106.317C35.9334 104.757 35.3516 102.901 35.3516 101C35.3516 99.0991 35.9334 97.2436 37.0188 95.6829C38.1042 94.1223 39.6413 92.9312 41.4234 92.2696L78.3475 78.848L91.7692 41.9239C92.4307 40.1417 93.6218 38.6047 95.1825 37.5193C96.7431 36.4338 98.5986 35.8521 100.5 35.8521C102.401 35.8521 104.256 36.4338 105.817 37.5193C107.377 38.6047 108.569 40.1417 109.23 41.9239L122.658 78.848L159.576 92.2696C161.375 92.9094 162.931 94.094 164.026 95.6586C165.121 97.2233 165.702 99.0903 165.687 101Z"
                                fill="url(#realityStarGrad)"
                            />
                            <defs>
                                <linearGradient id="realityStarGrad" x1="35" y1="35" x2="165" y2="165" gradientUnits="userSpaceOnUse">
                                    <stop stopColor="#E8730A" />
                                    <stop offset="1" stopColor="#C4600A" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <p className="reality-tagline reveal-hidden delay-300">
                        Viano keeps you top of mind for years to come.
                    </p>
                </section>

                {/* ============================================
                    PRICING SECTION
                    ============================================ */}
                <section id="pricing" className="pricing-section reveal-hidden">
                    <div className="pricing-header reveal-hidden">
                        <div className="no-hidden-badge">NO HIDDEN CHARGES</div>
                        <h2 className="pricing-title">Simple, Usage-Based Pricing</h2>
                        <p className="pricing-description">
                            Viano tracks your clients' homes with proprietary AI and tells you exactly when to reach out. You stay remembered, trusted, and referred. Automatically.
                        </p>
                    </div>

                    <div className="pricing-cards-wrapper pricing-single">
                        <div className="pricing-card-outer reveal-hidden scale-only delay-100">
                            <div className="pricing-card">
                                <div className="trending-badge">Trending</div>
                                <div className="card-price">
                                    <span className="price-amount">Free</span>
                                    <span className="price-highlight">for 2 Clients FOREVER</span>
                                </div>
                                <div className="card-price-secondary">
                                    <span className="price-amount-secondary">$49/mo</span>
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

                                <Link href="/signup">
                                    <button className="start-trial-btn">Get Started Free - No Credit Card</button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ============================================
                    TEAMS SECTION
                    ============================================ */}
                <section id="company" className="teams-section reveal-hidden">
                    <div className="teams-card">
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
                            width={480}
                            height={360}
                            className="team-pic"
                        />
                    </div>
                    </div>
                </section>

                {/* ============================================
                    DATA SECTION
                    ============================================ */}
                <section className="data-section reveal-hidden">
                    <div className="data-badge highlight-pill">The Numbers Don't Lie</div>
                    <h2 className="data-title">
                        Your Next Deals Are in Your Past Clients
                    </h2>
                    <div className="data-grid-container">
                        <div className="data-card dark-card">
                            <div className="card-header">
                                <div className="card-icon blue-star"><svg viewBox="0 0 202 202" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M165.687 101C165.702 102.91 165.121 104.777 164.026 106.342C162.931 107.906 161.375 109.091 159.576 109.731L122.652 123.158L109.23 160.076C108.569 161.858 107.377 163.396 105.817 164.481C104.256 165.566 102.401 166.148 100.5 166.148C98.5986 166.148 96.7431 165.566 95.1825 164.481C93.6218 163.396 92.4307 161.858 91.7692 160.076L78.3475 123.152L41.4234 109.731C39.6413 109.069 38.1042 107.878 37.0188 106.317C35.9334 104.757 35.3516 102.901 35.3516 101C35.3516 99.0991 35.9334 97.2436 37.0188 95.6829C38.1042 94.1223 39.6413 92.9312 41.4234 92.2696L78.3475 78.848L91.7692 41.9239C92.4307 40.1417 93.6218 38.6047 95.1825 37.5193C96.7431 36.4338 98.5986 35.8521 100.5 35.8521C102.401 35.8521 104.256 36.4338 105.817 37.5193C107.377 38.6047 108.569 40.1417 109.23 41.9239L122.658 78.848L159.576 92.2696C161.375 92.9094 162.931 94.094 164.026 95.6586C165.121 97.2233 165.702 99.0903 165.687 101Z" fill="currentColor"/></svg></div>
                                <span className="card-label">Market Reality</span>
                            </div>
                            <div className="card-value">85<span className="unit">%</span></div>
                            <div className="progress-container">
                                <div className="progress-bar blue-bar" style={{ width: '85%' }}></div>
                            </div>
                            <p className="card-desc">of the market comes from repeat business and referrals</p>
                        </div>

                        <div className="data-card dark-card">
                            <div className="card-header">
                                <div className="card-icon red-star"><svg viewBox="0 0 202 202" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M165.687 101C165.702 102.91 165.121 104.777 164.026 106.342C162.931 107.906 161.375 109.091 159.576 109.731L122.652 123.158L109.23 160.076C108.569 161.858 107.377 163.396 105.817 164.481C104.256 165.566 102.401 166.148 100.5 166.148C98.5986 166.148 96.7431 165.566 95.1825 164.481C93.6218 163.396 92.4307 161.858 91.7692 160.076L78.3475 123.152L41.4234 109.731C39.6413 109.069 38.1042 107.878 37.0188 106.317C35.9334 104.757 35.3516 102.901 35.3516 101C35.3516 99.0991 35.9334 97.2436 37.0188 95.6829C38.1042 94.1223 39.6413 92.9312 41.4234 92.2696L78.3475 78.848L91.7692 41.9239C92.4307 40.1417 93.6218 38.6047 95.1825 37.5193C96.7431 36.4338 98.5986 35.8521 100.5 35.8521C102.401 35.8521 104.256 36.4338 105.817 37.5193C107.377 38.6047 108.569 40.1417 109.23 41.9239L122.658 78.848L159.576 92.2696C161.375 92.9094 162.931 94.094 164.026 95.6586C165.121 97.2233 165.702 99.0903 165.687 101Z" fill="currentColor"/></svg></div>
                                <span className="card-label">The Gap</span>
                            </div>
                            <div className="card-value">12<span className="unit">%</span></div>
                            <div className="progress-container">
                                <div className="progress-bar red-bar" style={{ width: '12%' }}></div>
                            </div>
                            <p className="card-desc">is what most agents actually capture without follow-up</p>
                        </div>

                        <div className="data-card dark-card">
                            <div className="card-header">
                                <div className="card-icon violet-star"><svg viewBox="0 0 202 202" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M165.687 101C165.702 102.91 165.121 104.777 164.026 106.342C162.931 107.906 161.375 109.091 159.576 109.731L122.652 123.158L109.23 160.076C108.569 161.858 107.377 163.396 105.817 164.481C104.256 165.566 102.401 166.148 100.5 166.148C98.5986 166.148 96.7431 165.566 95.1825 164.481C93.6218 163.396 92.4307 161.858 91.7692 160.076L78.3475 123.152L41.4234 109.731C39.6413 109.069 38.1042 107.878 37.0188 106.317C35.9334 104.757 35.3516 102.901 35.3516 101C35.3516 99.0991 35.9334 97.2436 37.0188 95.6829C38.1042 94.1223 39.6413 92.9312 41.4234 92.2696L78.3475 78.848L91.7692 41.9239C92.4307 40.1417 93.6218 38.6047 95.1825 37.5193C96.7431 36.4338 98.5986 35.8521 100.5 35.8521C102.401 35.8521 104.256 36.4338 105.817 37.5193C107.377 38.6047 108.569 40.1417 109.23 41.9239L122.658 78.848L159.576 92.2696C161.375 92.9094 162.931 94.094 164.026 95.6586C165.121 97.2233 165.702 99.0903 165.687 101Z" fill="currentColor"/></svg></div>
                                <span className="card-label">Critical Window</span>
                            </div>
                            <div className="card-value">81<span className="unit">%</span></div>
                            <div className="progress-container">
                                <div className="progress-bar violet-bar" style={{ width: '81%' }}></div>
                            </div>
                            <p className="card-desc">of sellers call only ONE agent when ready to list</p>
                        </div>

                        <div className="data-card opportunity-card">
                            <div className="card-header">
                                <div className="card-icon white-star"><svg viewBox="0 0 202 202" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M165.687 101C165.702 102.91 165.121 104.777 164.026 106.342C162.931 107.906 161.375 109.091 159.576 109.731L122.652 123.158L109.23 160.076C108.569 161.858 107.377 163.396 105.817 164.481C104.256 165.566 102.401 166.148 100.5 166.148C98.5986 166.148 96.7431 165.566 95.1825 164.481C93.6218 163.396 92.4307 161.858 91.7692 160.076L78.3475 123.152L41.4234 109.731C39.6413 109.069 38.1042 107.878 37.0188 106.317C35.9334 104.757 35.3516 102.901 35.3516 101C35.3516 99.0991 35.9334 97.2436 37.0188 95.6829C38.1042 94.1223 39.6413 92.9312 41.4234 92.2696L78.3475 78.848L91.7692 41.9239C92.4307 40.1417 93.6218 38.6047 95.1825 37.5193C96.7431 36.4338 98.5986 35.8521 100.5 35.8521C102.401 35.8521 104.256 36.4338 105.817 37.5193C107.377 38.6047 108.569 40.1417 109.23 41.9239L122.658 78.848L159.576 92.2696C161.375 92.9094 162.931 94.094 164.026 95.6586C165.121 97.2233 165.702 99.0903 165.687 101Z" fill="currentColor"/></svg></div>
                                <span className="card-label">Your Opportunity</span>
                            </div>
                            <div className="card-value">$15K-130K</div>
                            <div className="progress-container white-vessel">
                                <div className="progress-bar green-bar" style={{ width: '100%' }}></div>
                            </div>
                            <p className="card-desc">additional annual revenue per agent with Viano</p>
                        </div>
                    </div>
                </section>

                {/* ============================================
                    FINAL CTA BANNER
                    ============================================ */}
                <section className="final-cta-section reveal-hidden">
                    <div className="final-cta-container reveal-hidden scale-only">
                        <div className="cta-star star-big">
                            <svg viewBox="0 0 159 159" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M159.206 79.5761C159.216 81.9081 158.506 84.1891 157.176 86.1001C155.836 88.0111 153.936 89.4581 151.736 90.2401L106.636 106.641L90.2361 151.736C89.4361 153.913 87.9761 155.79 86.0761 157.116C84.1661 158.442 81.8961 159.152 79.5761 159.152C77.2561 159.152 74.9861 158.442 73.0861 157.116C71.1761 155.79 69.7161 153.913 68.9161 151.736L52.5161 106.634L7.41612 90.2401C5.24012 89.4321 3.36212 87.9771 2.03612 86.0701C0.710121 84.1641 0.00012207 81.8981 0.00012207 79.5761C0.00012207 77.2541 0.710121 74.9871 2.03612 73.0811C3.36212 71.1751 5.24012 69.7201 7.41612 68.9121L52.5161 52.5171L68.9161 7.41512C69.7161 5.23912 71.1761 3.36112 73.0861 2.03512C74.9861 0.709121 77.2561 -0.000878906 79.5761 -0.000878906C81.8961 -0.000878906 84.1661 0.709121 86.0761 2.03512C87.9761 3.36112 89.4361 5.23912 90.2361 7.41512L106.646 52.5171L151.736 68.9121C153.936 69.6931 155.836 71.1401 157.176 73.0511C158.506 74.9621 159.216 77.2431 159.206 79.5761Z" fill="#E8730A" />
                            </svg>
                        </div>
                        <div className="cta-star star-small">
                            <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M80 40C80.01 41.173 79.65 42.319 78.98 43.28C78.31 44.24 77.35 44.968 76.25 45.36L53.58 53.605L45.35 76.272C44.94 77.366 44.21 78.31 43.25 78.976C42.29 79.643 41.15 80 39.99 80C38.82 80 37.68 79.643 36.72 78.976C35.77 78.31 35.04 77.366 34.63 76.272L26.39 53.601L3.73 45.36C2.63 44.954 1.69 44.223 1.02 43.265C0.36 42.306 0 41.167 0 40C0 38.833 0.36 37.694 1.02 36.735C1.69 35.777 2.63 35.046 3.73 34.64L26.39 26.399L34.63 3.728C35.04 2.634 35.77 1.69 36.72 1.024C37.68 0.357 38.82 0 39.99 0C41.15 0 42.29 0.357 43.25 1.024C44.21 1.69 44.94 2.634 45.35 3.728L53.59 26.399L76.25 34.64C77.35 35.032 78.31 35.76 78.98 36.72C79.65 37.681 80.01 38.827 80 40Z" fill="#E8730A" />
                            </svg>
                        </div>
                        <h2 className="cta-banner-text">
                            Viano keeps you top-of-mind with automated, valuable follow-up using inspection data only YOU have.
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
                            <p className="footer-brand-name">viano systems<sup>®</sup></p>
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
        </div>
    );
}
