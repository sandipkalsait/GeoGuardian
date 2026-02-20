// src/App.tsx
import React, { useState, useEffect, useRef } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";

type DashboardProps = {
  userName: string;
  onLogout: () => void;
};

import Logo from "/geo-guardian.png";
import data from "./assets/data.json";
import "./App.css";

import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import PoliceDashboard from "./pages/PoliceDashboard";
import TouristPage from "./pages/tourist";
import CounsellorDashboard from "./pages/Counsellordashboard";
import SearchPage from "./pages/search";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAndroid } from "@fortawesome/free-brands-svg-icons";
import {
  faBell,
  faShieldHalved,
  faWifi,
  faMapLocationDot,
  faHospital,
  faUsers,
  faChartLine,
  faComments,
  faUserNinja,
} from "@fortawesome/free-solid-svg-icons";

const AuthorityDashboardElement: React.FC<DashboardProps> = (props) => (
  <AuthorityDashboard {...props} />
);

// Demo complaints
const complaintData = [
  { id: "C1234", name: "Lost Wallet" },
  { id: "C1235", name: "Unauthorized Access" },
];

// Animated counter hook
function useCounter(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return count;
}

// Intersection observer hook
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);
  return { ref, inView };
}

// Stats counter component
const StatCounter: React.FC<{
  value: number;
  suffix: string;
  label: string;
  start: boolean;
}> = ({ value, suffix, label, start }) => {
  const count = useCounter(value, 2000, start);
  return (
    <div className="gg-stat-item">
      <span className="gg-stat-number">
        {count}
        {suffix}
      </span>
      <span className="gg-stat-label">{label}</span>
    </div>
  );
};

// Landing page
const LandingPage: React.FC = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [verified, setVerified] = useState(false);
  const [deptId, setDeptId] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  const { ref: statsRef, inView: statsInView } = useInView();
  const { ref: featuresRef, inView: featuresInView } = useInView();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleOpenSearch = () => setShowSearchModal(true);
  const handleCloseModal = () => {
    setShowSearchModal(false);
    setVerified(false);
    setDeptId("");
  };
  const handleVerifyDept = () => {
    if (deptId.trim().length < 4) {
      alert("Enter a valid Department ID");
      return;
    }
    setVerified(true);
  };

  return (
    <div className="gg-root">
      {/* ── NAVBAR ── */}
      <nav className={`gg-nav ${scrolled ? "gg-nav--scrolled" : ""}`}>
        <a href="/" className="gg-nav-brand">
          <img src={Logo} alt="Geo Guardian" className="gg-nav-logo" />
          <span className="gg-nav-name">
            Geo<span>Guardian</span>
          </span>
        </a>

        <div className="gg-nav-links">
          <a href="#features">Features</a>
          <a href="#stats">Impact</a>
          <a href="#summary">About</a>
          <a href="#contact">Team</a>
        </div>

        <div className="gg-nav-actions">
          <button
            className="gg-icon-btn"
            onClick={handleOpenSearch}
            aria-label="Search"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z" />
            </svg>
          </button>
          <span className="gg-badge-mvp">MVP · Prototype</span>
          <a href="/login" className="gg-btn-primary">
            Login →
          </a>
          <button
            className="gg-hamburger"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="gg-mobile-menu">
          <a href="#features" onClick={() => setMobileMenuOpen(false)}>
            Features
          </a>
          <a href="#stats" onClick={() => setMobileMenuOpen(false)}>
            Impact
          </a>
          <a href="#summary" onClick={() => setMobileMenuOpen(false)}>
            About
          </a>
          <a href="#contact" onClick={() => setMobileMenuOpen(false)}>
            Team
          </a>
          <a
            href="/login"
            className="gg-btn-primary"
            style={{ textAlign: "center" }}
          >
            Login →
          </a>
        </div>
      )}

      {/* ── HERO ── */}
      <section className="gg-hero-section">
        <div className="gg-hero-bg">
          <img
            src={Logo}
            alt="Geo Guardian"
            className="gg-hero-banner-img"
            loading="eager"
          />
          <div className="gg-hero-overlay" />
        </div>
        <div className="gg-hero-content">
          <div className="gg-hero-eyebrow">
            <span className="gg-pulse-dot" />
            Powered by AI · Secured by Blockchain
          </div>
          <h1 className="gg-hero-title">
            India's Smart
            <br />
            <span className="gg-hero-accent">Safety Companion</span>
          </h1>
          <p className="gg-hero-subtitle">
            AI detects alone walkers in unlit areas · Anonymous police chat for
            harassment reporting · Real-time SOS + eFIR
          </p>

          <div className="gg-hero-ctas">
            <a href="#" className="gg-download-btn gg-download-android">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <FontAwesomeIcon
                  icon={faAndroid}
                  className="group-hover:scale-110 text-3xl transition-transform duration-300 flex-shrink-0"
                  style={{ color: "#00C853" }}
                />
              </svg>
              <span>
                <small>Get it on</small>
                <br />
                Google Play
              </span>
            </a>
          </div>
          <div className="gg-hero-social-proof">
            <div className="gg-avatars">
              {["#FF6B35", "#0a5c7d", "#2ECC71", "#9B59B6"].map((c, i) => (
                <div
                  key={i}
                  className="gg-avatar"
                  style={{ background: c, zIndex: 4 - i }}
                />
              ))}
            </div>
            <span>1M+ Downloads · 4.8★ Rating</span>
          </div>
          <div className="gg-trust-badges">
            <span>🛡️ Police Verified</span>
            <span>🔐 End-to-End Encrypted</span>
            <span>🌐 10+ Languages</span>
            <span>⚖️ MeitY Compliant</span>
          </div>
        </div>
        <div className="gg-hero-scroll-hint">
          <span>Scroll to explore</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
          </svg>
        </div>
      </section>

      {/* ── STATS BAND ── */}
      <section id="stats" className="gg-stats-section">
        <div ref={statsRef} className="gg-stats-grid">
          <StatCounter
            value={60}
            suffix="%"
            label="Streets inadequately lit across India"
            start={statsInView}
          />
          <StatCounter
            value={2}
            suffix="Cr+"
            label="Migrant workers at safety risk"
            start={statsInView}
          />
          <StatCounter
            value={1000}
            suffix="+"
            label="Alone walker incidents monthly"
            start={statsInView}
          />
          <StatCounter
            value={95}
            suffix="%"
            label="Cases resolved faster with eFIR"
            start={statsInView}
          />
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="gg-features-section">
        <div className="gg-section-header">
          <p className="gg-section-eyebrow">What We Offer</p>
          <h2 className="gg-section-title">
            Built for India's Safety Challenges
          </h2>
        </div>

        <div
          ref={featuresRef}
          className={`gg-features-grid ${featuresInView ? "gg-features-visible" : ""}`}
        >
          {[
            {
              icon: faBell,
              title: "SOS + eFIR",
              desc: "Immediate alerts with blockchain-secured reporting. One-tap emergency sends GPS + auto-generates legally valid eFIR.",
              color: "#FF4444",
              tag: "Emergency",
              iconColor: "#000000",
            },
            {
              icon: faShieldHalved,
              title: "Blockchain Security",
              desc: "Tamper-proof, transparent, and legally valid records. Every incident logged permanently on decentralized ledger.",
              color: "#8B5CF6",
              tag: "Secure",
              iconColor: "#000000",
            },
            {
              icon: faWifi,
              title: "Offline Ready",
              desc: "Works even in low-network zones. Cached safety maps + alerts function without internet in forests/remote areas.",
              color: "#10B981",
              tag: "Offline",
              iconColor: "#000000",
            },
            {
              icon: faMapLocationDot,
              title: "Smart Geo-Alerts",
              desc: "Zone-based safety warnings for forests, unlit areas, construction sites. Real-time danger zone notifications.",
              color: "#0A5C7D",
              tag: "Real-Time",
              iconColor: "#000000",
            },
            {
              icon: faHospital,
              title: "Verified Medical Access",
              desc: "Nearest hospitals, clinics, and insurance tie-ins. English-speaking doctors + ambulance ETA in emergencies.",
              color: "#3B82F6",
              tag: "Healthcare",
              iconColor: "#000000",
            },
            {
              icon: faUsers,
              title: "Authority Integration",
              desc: "Direct coordination with police, health agencies. Live dashboards + automated alert dispatch to nearest station.",
              color: "#F59E0B",
              tag: "Live Sync",
              iconColor: "#000000",
            },
            {
              icon: faChartLine,
              title: "Trust Dashboard",
              desc: "Independent audits and transparency reports. Track resolution rates + safety improvements in your area.",
              color: "#EC4899",
              tag: "Analytics",
              iconColor: "#000000",
            },
            {
              icon: faComments,
              title: "Anonymous Police Chat",
              desc: "Encrypted harassment reporting. Chat directly with verified counselors — your identity stays completely protected.",
              color: "#FF6B35",
              tag: "Anonymous",
              iconColor: "#000000",
            },
            {
              icon: faUserNinja,
              title: "Alone Walker Detection",
              desc: "AI detects solo movement patterns in unsafe zones. Auto-alerts family + police if no 'I'm safe' check-in.",
              color: "#6366F1",
              tag: "AI Powered",
              iconColor: "#000000",
            },
          ].map((f, i) => (
            <div
              key={i}
              className="gg-feature-card"
              style={{ "--card-color": f.color } as React.CSSProperties}
            >
              <div className="gg-feature-icon-wrap">
                <FontAwesomeIcon
                  icon={f.icon}
                  className="gg-feature-icon"
                  style={{ color: f.iconColor, fontSize: "1.6rem" }}
                />
              </div>
              <span className="gg-feature-tag">{f.tag}</span>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section className="gg-dashboard-preview-section">
        <div className="gg-dashboard-preview-inner">
          <div className="gg-dashboard-preview-text">
            <p className="gg-section-eyebrow">For Authorities</p>
            <h2>Real-Time Command Dashboard</h2>
            <p>
              Police stations and local bodies get a live operational view —
              complaint tracking, geographic heat maps, patrol deployment, and
              instant citizen alerts all in one place.
            </p>
            <a
              href="/login"
              className="gg-btn-primary"
              style={{ display: "inline-block", marginTop: 24 }}
            >
              Access Dashboard →
            </a>
          </div>
          <div className="gg-dashboard-preview-mockup">
            <div className="gg-mockup-window">
              <div className="gg-mockup-topbar">
                <span />
                <span />
                <span />
              </div>
              <div className="gg-mockup-content">
                <div
                  className="gg-mockup-stat"
                  style={{ background: "rgba(10,92,125,0.15)" }}
                >
                  <strong style={{ color: "#0a5c7d" }}>23</strong>
                  <small>Active Cases</small>
                </div>
                <div
                  className="gg-mockup-stat"
                  style={{ background: "rgba(46,204,113,0.15)" }}
                >
                  <strong style={{ color: "#2ECC71" }}>147</strong>
                  <small>Resolved Today</small>
                </div>
                <div
                  className="gg-mockup-stat"
                  style={{ background: "rgba(255,107,53,0.15)" }}
                >
                  <strong style={{ color: "#FF6B35" }}>5</strong>
                  <small>SOS Active</small>
                </div>
                <div className="gg-mockup-map">
                  <div
                    className="gg-map-dot"
                    style={{ top: "30%", left: "25%", background: "#E74C3C" }}
                  />
                  <div
                    className="gg-map-dot"
                    style={{ top: "55%", left: "60%", background: "#FF6B35" }}
                  />
                  <div
                    className="gg-map-dot"
                    style={{ top: "40%", left: "70%", background: "#2ECC71" }}
                  />
                  <div
                    className="gg-map-dot"
                    style={{ top: "70%", left: "35%", background: "#E74C3C" }}
                  />
                  📍 Live Incident Map
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EXECUTIVE SUMMARY ── */}
      <section id="summary" className="gg-summary-section">
        <div className="gg-section-header">
          <p className="gg-section-eyebrow">Executive Summary</p>
          <h2 className="gg-section-title">Why Geo Guardian Exists</h2>
        </div>
        <div className="gg-summary-cards">
          <div className="gg-summary-card gg-summary-problem">
            <div className="gg-summary-card-header">
              <span className="gg-summary-icon">⚠️</span>
              <h3>The Problem</h3>
            </div>
            <ul>
              {data.executiveSummary.problem.map(
                (item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ),
              )}
            </ul>
          </div>
          <div className="gg-summary-card gg-summary-solution">
            <div className="gg-summary-card-header">
              <span className="gg-summary-icon">✅</span>
              <h3>Our Solution</h3>
            </div>
            <ul>
              {data.executiveSummary.solution.map(
                (item: string, idx: number) => (
                  <li key={idx}>{item}</li>
                ),
              )}
            </ul>
          </div>
          <div className="gg-summary-card gg-summary-ask">
            <div className="gg-summary-card-header">
              <span className="gg-summary-icon">🚀</span>
              <h3>Our Ask</h3>
            </div>
            <ul>
              {data.executiveSummary.ask.map((item: string, idx: number) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── OBJECTIVES ── */}
      <section className="gg-objectives-section">
        <div className="gg-section-header">
          <p className="gg-section-eyebrow">Our Mission</p>
          <h2 className="gg-section-title">Strategic Objectives</h2>
        </div>
        <div className="gg-objectives-list">
          {data.objectives.map((item: string, idx: number) => (
            <div key={idx} className="gg-objective-item">
              <span className="gg-objective-num">
                {String(idx + 1).padStart(2, "0")}
              </span>
              <p>{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── MID-PAGE CTA ── */}
      <section className="gg-midcta-section">
        <div className="gg-midcta-inner">
          <h2>Start Keeping India Safer, Today</h2>
          <p>Join 1M+ Indians who trust Geo Guardian for their daily safety.</p>
          <div className="gg-hero-ctas" style={{ justifyContent: "center" }}>
            <a href="#" className="gg-download-btn gg-download-android">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M17.523 15.341l-.613-1.065a5.98 5.98 0 00.59-2.588 5.98 5.98 0 00-.59-2.588l.613-1.065a.25.25 0 00-.091-.341.25.25 0 00-.341.091l-.601 1.043A5.977 5.977 0 0012 8a5.977 5.977 0 00-4.49 2.033l-.601-1.043a.25.25 0 00-.432.25l.613 1.065A5.98 5.98 0 006.5 12.688a5.98 5.98 0 00.59 2.588l-.613 1.065a.25.25 0 00.341.341l.601-1.043A5.977 5.977 0 0012 17.375a5.977 5.977 0 004.49-2.033l.601 1.043a.25.25 0 00.432-.25zM9.75 13.688a.937.937 0 110-1.875.937.937 0 010 1.875zm4.5 0a.937.937 0 110-1.875.937.937 0 010 1.875z" />
              </svg>
              <span>
                <small>Get it on</small>
                <br />
                Google Play
              </span>
            </a>
            <a href="#" className="gg-download-btn gg-download-ios">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
              </svg>
              <span>
                <small>Download on</small>
                <br />
                App Store
              </span>
            </a>
          </div>
        </div>
      </section>

      {/* ── CONTACT / TEAM ── */}
      <section id="contact" className="gg-contact-section">
        <div className="gg-section-header">
          <p className="gg-section-eyebrow">Get In Touch</p>
          <h2 className="gg-section-title">Contact & Team</h2>
        </div>
        <div className="gg-contact-grid">
          {[
            { role: "Core Contacts", value: data.contacts.core, icon: "🏢" },
            { role: "Dev Lead", value: data.contacts.devLead, icon: "💻" },
            {
              role: "Product Owner",
              value: data.contacts.productOwner,
              icon: "📋",
            },
            {
              role: "Legal Advisor",
              value: data.contacts.legalAdvisor,
              icon: "⚖️",
            },
          ].map((c, i) => (
            <div key={i} className="gg-contact-card">
              <span className="gg-contact-icon">{c.icon}</span>
              <span className="gg-contact-role">{c.role}</span>
              <span className="gg-contact-value">{c.value}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="gg-footer-new">
        <div className="gg-footer-inner">
          <div className="gg-footer-brand">
            <img src={Logo} alt="Geo Guardian" style={{ height: 36 }} />
            <span>GeoGuardian</span>
          </div>
          <p className="gg-footer-tagline">
            Making India safer, one alert at a time.
          </p>
          <div className="gg-footer-links">
            <a href="#features">Features</a>
            <a href="#stats">Impact</a>
            <a href="#summary">About</a>
            <a href="#contact">Contact</a>
            <a href="/login">Authority Login</a>
          </div>
          <p className="gg-footer-copy">
            &copy; {new Date().getFullYear()} Geo Guardian · MVP Prototype · All
            rights reserved
          </p>
        </div>
      </footer>

      {/* ── SEARCH MODAL (preserved) ── */}
      {showSearchModal && (
        <div className="gg-modal-overlay-new" onClick={handleCloseModal}>
          <div className="gg-modal-new" onClick={(e) => e.stopPropagation()}>
            <button className="gg-modal-close" onClick={handleCloseModal}>
              ✕
            </button>
            {!verified ? (
              <>
                <div className="gg-modal-icon">🔍</div>
                <h2>Department Verification</h2>
                <p>Enter your Department ID to access complaint tracking.</p>
                <input
                  type="text"
                  placeholder="Enter Department ID (min 4 chars)"
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="gg-modal-input"
                  onKeyDown={(e) => e.key === "Enter" && handleVerifyDept()}
                />
                <div className="gg-modal-actions">
                  <button
                    className="gg-modal-btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    className="gg-modal-btn-primary"
                    onClick={handleVerifyDept}
                  >
                    Verify →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="gg-modal-icon">📋</div>
                <h2>Track Complaints</h2>
                <div className="gg-complaint-list">
                  {complaintData.map((item) => (
                    <div key={item.id} className="gg-complaint-row">
                      <span className="gg-complaint-id">{item.id}</span>
                      <span className="gg-complaint-name">{item.name}</span>
                      <button
                        className="gg-modal-btn-primary"
                        style={{ padding: "6px 16px", fontSize: 13 }}
                        onClick={() => {
                          navigate(
                            `/search?complaint=${encodeURIComponent(item.id)}`,
                          );
                          handleCloseModal();
                        }}
                      >
                        Track
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  className="gg-modal-btn-secondary"
                  style={{ width: "100%", marginTop: 8 }}
                  onClick={handleCloseModal}
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ── APP with routing ── ✅ PERFECT ROUTING
const App: React.FC = () => {
  const [userRole, setUserRole] = useState<
    "authority" | "police" | "counsellor" | null
  >(null);
  const [userName, setUserName] = useState<string>("");

  const handleLoginSuccess = (
    role: "authority" | "police" | "counsellor",
    name: string,
  ) => {
    setUserRole(role);
    setUserName(name);
  };

  const handleLogout = () => {
    setUserRole(null);
    setUserName("");
  };

  return (
    <Router>
      <Routes>
        {/* Landing - redirect based on ALL roles */}
        <Route
          path="/"
          element={
            userRole ? (
              userRole === "authority" ? (
                <Navigate to="/authority" replace />
              ) : userRole === "police" ? (
                <Navigate to="/police" replace />
              ) : userRole === "counsellor" ? (
                <Navigate to="/counsellor" replace />
              ) : (
                <LandingPage />
              )
            ) : (
              <LandingPage />
            )
          }
        />

        {/* Login */}
        <Route
          path="/login"
          element={
            userRole ? (
              <Navigate to={`/${userRole}`} replace />
            ) : (
              <LoginPage onLoginSuccess={handleLoginSuccess} />
            )
          }
        />

        {/* Register */}
        <Route
          path="/register"
          element={
            userRole ? (
              <Navigate to={`/${userRole}`} replace />
            ) : (
              <RegistrationPage />
            )
          }
        />

        {/* Authority Dashboard */}
        <Route
          path="/authority"
          element={
            userRole === "authority" ? (
              <AuthorityDashboard userName={userName} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Police Dashboard */}
        <Route
          path="/police"
          element={
            userRole === "police" ? (
              <PoliceDashboard userName={userName} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* COUNSELLOR Dashboard - PROTECTED */}
        <Route
          path="/counsellor"
          element={
            userRole === "counsellor" ? (
              <CounsellorDashboard
                userName={userName}
                onLogout={handleLogout}
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Tourist Page */}
        <Route path="/tourist" element={<TouristPage />} />

        {/* Public Search */}
        <Route path="/search" element={<SearchPage />} />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
