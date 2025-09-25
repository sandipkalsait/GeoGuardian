// src/App.tsx
import React, { useState } from "react";

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";


type AuthorityDashboardProps = {
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

const AuthorityDashboardElement: React.FC<AuthorityDashboardProps> = (props) => (
  <AuthorityDashboard {...props} />
);

const complaintData = [
  { id: "C1234", name: "Lost Wallet" },
  { id: "C1235", name: "Unauthorized Access" },
];

// Landing page component (your original App UI)
const LandingPage: React.FC = () => {
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<number | null>(null);
  const [showVerification, setShowVerification] = useState(false);
  return (
    <div className="geo-guardian-home">
      <nav className="gg-navbar">
        <div className="gg-navbar-brand">
          <img src={Logo} alt="Geo Guardian Logo" className="gg-logo" />
          <span className="gg-title">Geo Guardian</span>
        </div>
        <div className="gg-navbar-sub">MVP — Prototype</div>
        <div style={{ display: "flex", gap: "10px" }}>
        <button
            className="gg-btn gg-search-btn"
            style={{ padding: "6px 10px", display: "flex", alignItems: "center" }}
            onClick={() => setShowSearchModal(true)}
            aria-label="Search Complaint"
          >
            {/* Simple SVG icon for search */}
            <svg
              height="18"
              viewBox="0 0 24 24"
              width="18"
              fill="currentColor"
              style={{ marginRight: "5px" }}
            >
              <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5
              6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5
              4.99c.39.39 1.02.39 1.41 0s.39-1.02 0-1.41l-4.99-5zm-6
              0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15
              9.5 12.99 14 10.5 14z" />
            </svg>
            Search
          </button>
            
          <a href="/login" className="gg-btn">
            Login
          </a>
          {/* New buttons to preview dashboards without login */}
          
        </div>
      </nav>
       {/* Complaint Search Modal */}
      {showSearchModal && (
        <div className="gg-modal-overlay">
          <div className="gg-modal">
            <h2>Track Complaint</h2>
            <table style={{ width: "100%", marginBottom: "16px" }}>
              <thead>
                <tr>
                  <th>Complaint ID</th>
                  <th>Name</th>
                  <th>Track</th>
                </tr>
              </thead>
              <tbody>
                {complaintData.map((item, idx) => (
                  <tr key={idx}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td>
                      <button
                        className="gg-btn"
                        onClick={() => {
                          setSelectedComplaint(idx);
                          setShowVerification(true);
                        }}
                      >
                        Track
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              className="gg-btn"
              onClick={() => {
                setShowSearchModal(false);
                setSelectedComplaint(null);
                setShowVerification(false);
              }}
            >
              Close
            </button>
            {/* Verification window after "Track" */}
            {showVerification && selectedComplaint !== null && (
              <div className="gg-verification-window" style={{ marginTop: "16px" }}>
                <h3>Get Verified</h3>
                <p>
                  Please verify your identity for complaint:{" "}
                  <strong>{complaintData[selectedComplaint].id}</strong>
                </p>
                {/* Example: Render verification fields/buttons here */}
                <button
                  className="gg-btn"
                  onClick={() => alert("Verification step shown!")}
                >
                  Open Verification
                </button>
              </div>
            )}
          </div>
        </div>
      )}


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

    {/* Tourist Page */}
    <Route
      path="/tourist"
      element={<TouristPage />}
    />

    {/* Catch all */}
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
</Router>


  );
};

export default App;