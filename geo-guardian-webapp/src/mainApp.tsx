// src/App.tsx
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Logo from "/geo-guardian.png";
import data from "./assets/data.json";
import "./App.css";

import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import AuthorityDashboard from "./pages/AuthorityDashboard";
import PoliceDashboard from "./pages/PoliceDashboard";

// Landing page component (your original App UI)
const LandingPage: React.FC = () => {
  return (
    <div className="geo-guardian-home">
      <nav className="gg-navbar">
        <div className="gg-navbar-brand">
          <img src={Logo} alt="Geo Guardian Logo" className="gg-logo" />
          <span className="gg-title">Geo Guardian</span>
        </div>
        <div className="gg-navbar-sub">MVP — Prototype</div>
        <div>
          <a href="/login" className="gg-btn">Login</a>
          <a href="/register" className="gg-btn">Register</a>
        </div>
        
      </nav>

      <main className="gg-main">
        {/* Hero Section */}
        <section className="gg-hero fade-in">
          <h1>{data.hero.title}</h1>
          <h2>{data.hero.subtitle}</h2>
          <p>
            {data.hero.pilot} |{" "}
            <span className="gg-date">{data.hero.date}</span> | Presenter:{" "}
            <span className="gg-presenter">{data.hero.presenter}</span>
          </p>
          <a href="#contact" className="gg-btn">
            Contact Us
          </a>
        </section>

        {/* Executive Summary */}
        <section className="gg-section fade-in-delay">
          <h2>Executive Summary</h2>
          <div className="gg-summary-grid">
            <div>
              <h3>Problem</h3>
              <ul>
                {data.executiveSummary.problem.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Solution</h3>
              <ul>
                {data.executiveSummary.solution.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3>Ask</h3>
              <ul>
                {data.executiveSummary.ask.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Strategic Objectives */}
        <section className="gg-section fade-in-delay">
          <h2>Strategic Objectives</h2>
          <ul>
            {data.objectives.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        </section>

        {/* Contact & Team */}
        <section id="contact" className="gg-section fade-in-delay">
          <h2>Contact & Team</h2>
          <ul>
            <li>Core contacts: {data.contacts.core}</li>
            <li>Dev lead: {data.contacts.devLead}</li>
            <li>Product owner: {data.contacts.productOwner}</li>
            <li>Legal advisor: {data.contacts.legalAdvisor}</li>
          </ul>
        </section>
      </main>

      <footer className="gg-footer">
        &copy; {new Date().getFullYear()} Geo Guardian. All rights reserved.
      </footer>
    </div>
  );
};

// Main app with routing and auth state
const App: React.FC = () => {
  // Simple auth simulation state
  const [userRole, setUserRole] = useState<"authority" | "police" | null>(null);
  const [userName, setUserName] = useState<string>("");

  // Handlers to simulate login/logout
  const handleLoginSuccess = (role: "authority" | "police", name: string) => {
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
        {/* Landing page route */}
        <Route
          path="/"
          element={
            userRole ? (
              userRole === "authority" ? (
                <Navigate to="/authority" replace />
              ) : (
                <Navigate to="/police" replace />
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

        {/* Registration */}
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

        {/* Catch all - redirect to root */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;