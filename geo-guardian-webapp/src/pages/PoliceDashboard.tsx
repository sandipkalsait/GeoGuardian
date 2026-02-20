// src/pages/PoliceDashboard.tsx — Full Rebuild
// Matches AuthorityDashboard design system exactly.
// No MUI, no external services, no broken imports.
// All data is local state — drop-in ready.

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import {
  type EmergencyAlertRecord,
  type UserProfileRecord,
} from "../Services/realtimeDataService";

interface PoliceDashboardProps {
  userName: string;
  onLogout: () => void;
}

// ─── TYPES ────────────────────────────────────────────────────────────────────

type IncidentType =
  | "SOS"
  | "Geo-fence Breach"
  | "Harassment"
  | "Theft"
  | "Blackout"
  | "Medical";
type Severity = "Low" | "Medium" | "High" | "Critical";
type IncidentStatus = "unassigned" | "assigned" | "responding" | "resolved";
type UnitStatus = "available" | "responding" | "on-duty" | "offline";

interface Incident {
  id: string;
  type: IncidentType;
  severity: Severity;
  status: IncidentStatus;
  description: string;
  location: string;
  lat?: number;
  lng?: number;
  timestamp: number;
  assignedUnit?: string;
  responseTimeMin?: number;
  complainant?: string;
}

interface Unit {
  id: string;
  name: string;
  callSign: string;
  type: "Patrol Car" | "Motorcycle" | "Foot Patrol" | "Emergency Van";
  officer: string;
  status: UnitStatus;
  location: string;
  lastUpdated: number;
  assignedIncidentId?: string;
}

interface EFir {
  id: string;
  complainant: string;
  offense: string;
  date: string;
  status: "Draft" | "Submitted" | "Under Review" | "Accepted" | "Rejected";
  officer: string;
  blockchainHash?: string;
}

type PoliceUserRole = "Admin" | "Officer" | "Dispatcher" | "Viewer";

type PoliceUserRow = {
  id: string;
  name: string;
  badge: string;
  role: PoliceUserRole;
  department: string;
  status: "Active" | "Inactive";
  shift: "Day" | "Night";
};

const mapEmergencyTypeToIncidentType = (
  rawType: string,
  triggeredBy: string,
): IncidentType => {
  const normalized = (rawType || triggeredBy || "").toLowerCase();
  if (normalized.includes("sos") || normalized.includes("panic")) {
    return "SOS";
  }
  if (normalized.includes("geo")) {
    return "Geo-fence Breach";
  }
  if (normalized.includes("harass")) {
    return "Harassment";
  }
  if (normalized.includes("theft")) {
    return "Theft";
  }
  if (normalized.includes("blackout") || normalized.includes("light")) {
    return "Blackout";
  }
  return "Medical";
};

const mapEmergencySeverityToIncident = (severity: string): Severity => {
  switch ((severity || "").toLowerCase()) {
    case "critical":
      return "Critical";
    case "high":
      return "High";
    case "low":
      return "Low";
    default:
      return "Medium";
  }
};

const mapEmergencyStatusToIncident = (status: string): IncidentStatus => {
  switch ((status || "").toLowerCase()) {
    case "resolved":
    case "closed":
      return "resolved";
    case "responding":
      return "responding";
    case "assigned":
    case "acknowledged":
      return "assigned";
    default:
      return "unassigned";
  }
};

const toOptionalNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

const mapEmergencyAlertToIncident = (alert: EmergencyAlertRecord): Incident => {
  const alertDate = alert.alertTime || alert.createdAt;
  const timestamp = alertDate ? alertDate.getTime() : Date.now();
  const responseTimeValue =
    typeof alert.raw.responseTime === "number" ? alert.raw.responseTime : null;

  return {
    id: alert.alertId || alert.id,
    type: mapEmergencyTypeToIncidentType(alert.type, alert.triggeredBy),
    severity: mapEmergencySeverityToIncident(alert.severity),
    status: mapEmergencyStatusToIncident(alert.status),
    description: alert.description || alert.title || "Emergency alert reported",
    location: alert.address || "Unknown location",
    lat: toOptionalNumber(alert.latitude),
    lng: toOptionalNumber(alert.longitude),
    timestamp,
    assignedUnit: alert.assignedOfficerId || undefined,
    responseTimeMin:
      responseTimeValue && responseTimeValue > 0
        ? Math.round(responseTimeValue / 60)
        : undefined,
    complainant: alert.touristId || undefined,
  };
};

const mapUserTypeToPoliceRole = (userType: string): PoliceUserRole => {
  switch ((userType || "").toLowerCase()) {
    case "authority":
      return "Admin";
    case "police":
      return "Officer";
    case "counsellor":
      return "Dispatcher";
    default:
      return "Viewer";
  }
};

const mapRealtimeUserToPoliceUser = (user: UserProfileRecord): PoliceUserRow => {
  const role = mapUserTypeToPoliceRole(user.userType);
  const rawBadge =
    typeof user.raw.badge === "string" && user.raw.badge ? user.raw.badge : null;
  const compactId = (user.userId || user.id || "0000")
    .replace(/[^a-zA-Z0-9]/g, "")
    .slice(-4)
    .toUpperCase();
  const rawShift =
    typeof user.raw.shift === "string" ? user.raw.shift.toLowerCase() : "";

  return {
    id: user.userId || user.id,
    name: user.name || "Unknown",
    badge: rawBadge || `${role.slice(0, 3).toUpperCase()}-${compactId || "0000"}`,
    role,
    department:
      (typeof user.raw.department === "string" && user.raw.department) ||
      `${user.userType || "User"} Department`,
    status: user.isActive ? "Active" : "Inactive",
    shift: rawShift === "night" ? "Night" : "Day",
  };
};

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const seedIncidents: Incident[] = [
  {
    id: "INC-001",
    type: "SOS",
    severity: "Critical",
    status: "unassigned",
    description:
      "Woman activated SOS near forest trail — no response for 8 minutes.",
    location: "Kaziranga NP, Zone B",
    lat: 26.9,
    lng: 94.1,
    timestamp: Date.now() - 480000,
    responseTimeMin: undefined,
  },
  {
    id: "INC-002",
    type: "Harassment",
    severity: "High",
    status: "assigned",
    description: "Anonymous report of verbal harassment at bus terminal.",
    location: "Pan Bazar Bus Stand",
    lat: 26.18,
    lng: 91.74,
    timestamp: Date.now() - 1200000,
    assignedUnit: "Alpha-1",
    responseTimeMin: 12,
  },
  {
    id: "INC-003",
    type: "Geo-fence Breach",
    severity: "Medium",
    status: "responding",
    description: "Tourist exited designated safe zone — GPS signal weak.",
    location: "Manas NP Trail 3",
    lat: 26.5,
    lng: 90.5,
    timestamp: Date.now() - 2100000,
    assignedUnit: "Bravo-3",
    responseTimeMin: 8,
  },
  {
    id: "INC-004",
    type: "Theft",
    severity: "Medium",
    status: "resolved",
    description:
      "Mobile phone snatching reported near market. Suspect description noted.",
    location: "Fancy Bazar, Guwahati",
    lat: 26.19,
    lng: 91.73,
    timestamp: Date.now() - 7200000,
    assignedUnit: "Charlie-7",
    responseTimeMin: 14,
    complainant: "Rohan Das",
  },
  {
    id: "INC-005",
    type: "Blackout",
    severity: "Low",
    status: "resolved",
    description:
      "Street lighting failure reported — 4 consecutive poles on MG Road.",
    location: "MG Road, Guwahati",
    timestamp: Date.now() - 86400000,
    responseTimeMin: 45,
  },
  {
    id: "INC-006",
    type: "Medical",
    severity: "High",
    status: "unassigned",
    description:
      "Tourist collapsed near heritage site. Breathing labored, needs ambulance.",
    location: "Kamakhya Temple Area",
    lat: 26.16,
    lng: 91.63,
    timestamp: Date.now() - 300000,
  },
];

const seedUnits: Unit[] = [
  {
    id: "U-01",
    name: "Alpha Team 1",
    callSign: "Alpha-1",
    type: "Patrol Car",
    officer: "SI Rahul Das",
    status: "on-duty",
    location: "Guwahati Sector A",
    lastUpdated: Date.now() - 120000,
  },
  {
    id: "U-02",
    name: "Bravo Team 3",
    callSign: "Bravo-3",
    type: "Motorcycle",
    officer: "SI Kaveri Roy",
    status: "responding",
    location: "Manas NP Entry",
    lastUpdated: Date.now() - 300000,
    assignedIncidentId: "INC-003",
  },
  {
    id: "U-03",
    name: "Charlie Team 7",
    callSign: "Charlie-7",
    type: "Patrol Car",
    officer: "SI Arun Kumar",
    status: "available",
    location: "Kaziranga Zone A",
    lastUpdated: Date.now() - 60000,
  },
  {
    id: "U-04",
    name: "Delta Team 2",
    callSign: "Delta-2",
    type: "Emergency Van",
    officer: "SI Ritu Gogoi",
    status: "available",
    location: "Depot Base",
    lastUpdated: Date.now() - 10800000,
  },
  {
    id: "U-05",
    name: "Echo Foot 1",
    callSign: "Echo-F1",
    type: "Foot Patrol",
    officer: "Const. Bikash Singh",
    status: "offline",
    location: "Off Duty",
    lastUpdated: Date.now() - 21600000,
  },
];

const seedEFIRs: EFir[] = [
  {
    id: "eFIR-2025-001",
    complainant: "Priya Sharma",
    offense: "Molestation (IPC 354)",
    date: "2025-09-20",
    status: "Under Review",
    officer: "SI Rahul Das",
    blockchainHash: "0xab3c...f7d2",
  },
  {
    id: "eFIR-2025-002",
    complainant: "Mohammed Ali",
    offense: "Theft (IPC 379)",
    date: "2025-09-19",
    status: "Submitted",
    officer: "SI Kaveri Roy",
  },
  {
    id: "eFIR-2025-003",
    complainant: "Sarah Thomas",
    offense: "Cyberstalking (IT Act 66E)",
    date: "2025-09-18",
    status: "Accepted",
    officer: "SI Arun Kumar",
    blockchainHash: "0xfe11...9a3b",
  },
  {
    id: "eFIR-2025-004",
    complainant: "Bikram Singh",
    offense: "Assault (IPC 323)",
    date: "2025-09-17",
    status: "Draft",
    officer: "SI Ritu Gogoi",
  },
];

const seedUsers: PoliceUserRow[] = [
  {
    id: "USR-01",
    name: "DCP Anindita Borah",
    badge: "DCP-001",
    role: "Admin",
    department: "HQ Operations",
    status: "Active",
    shift: "Day",
  },
  {
    id: "USR-02",
    name: "SI Rahul Das",
    badge: "SI-0342",
    role: "Officer",
    department: "Guwahati Zone A",
    status: "Active",
    shift: "Day",
  },
  {
    id: "USR-03",
    name: "SI Kaveri Roy",
    badge: "SI-0291",
    role: "Officer",
    department: "Tourist Safety",
    status: "Active",
    shift: "Night",
  },
  {
    id: "USR-04",
    name: "Const. Bikash Singh",
    badge: "PC-1122",
    role: "Officer",
    department: "Field",
    status: "Active",
    shift: "Day",
  },
  {
    id: "USR-05",
    name: "Dispatcher Rajesh H.",
    badge: "DSP-007",
    role: "Dispatcher",
    department: "Control Room",
    status: "Active",
    shift: "Day",
  },
];

const chartData = [
  { day: "Mon", incidents: 5, resolved: 4 },
  { day: "Tue", incidents: 8, resolved: 6 },
  { day: "Wed", incidents: 6, resolved: 6 },
  { day: "Thu", incidents: 9, resolved: 7 },
  { day: "Fri", incidents: 7, resolved: 5 },
  { day: "Sat", incidents: 12, resolved: 9 },
  { day: "Sun", incidents: 4, resolved: 4 },
];

const responseData = [
  { hour: "6am", avg: 8 },
  { hour: "9am", avg: 11 },
  { hour: "12pm", avg: 14 },
  { hour: "3pm", avg: 9 },
  { hour: "6pm", avg: 16 },
  { hour: "9pm", avg: 20 },
  { hour: "12am", avg: 13 },
];

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0b1e35;
    --navy-2: #112844;
    --blue: #1d6fa4;
    --blue-2: #2587c4;
    --blue-light: #e8f4fc;
    --teal: #0d9488;
    --saffron: #f97316;
    --red: #ef4444;
    --green: #22c55e;
    --amber: #f59e0b;
    --purple: #8b5cf6;
    --text: #0f2137;
    --text-2: #4a5e73;
    --text-3: #8fa3b1;
    --border: #dce8f0;
    --surface: #ffffff;
    --surface-2: #f4f8fb;
    --surface-3: #edf3f8;
    --shadow-sm: 0 1px 3px rgba(11,30,53,0.08), 0 1px 2px rgba(11,30,53,0.06);
    --shadow-md: 0 4px 16px rgba(11,30,53,0.1), 0 2px 4px rgba(11,30,53,0.06);
    --shadow-lg: 0 12px 40px rgba(11,30,53,0.13);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --sidebar-w: 256px;
    --topbar-h: 64px;
    --transition: 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .pd { display: flex; min-height: 100vh; background: var(--surface-2); color: var(--text); font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

  /* ── SIDEBAR ── */
  .pd-sidebar {
    width: var(--sidebar-w);
    min-height: 100vh;
    background: var(--navy);
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 200;
    transition: transform var(--transition), width var(--transition);
    overflow: hidden;
  }
  .pd-sidebar.collapsed { width: 64px; }
  .pd-sidebar.mobile-open { transform: none !important; }
  @media (max-width: 768px) { .pd-sidebar { transform: translateX(-100%); width: var(--sidebar-w) !important; } }

  .pd-logo {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    min-height: var(--topbar-h);
    flex-shrink: 0;
  }
  .pd-logo-icon {
    width: 36px; height: 36px; border-radius: 10px;
    background: linear-gradient(135deg, #e55a2b, #f97316);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 13px; color: #fff; flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(249,115,22,0.4);
  }
  .pd-logo-text { overflow: hidden; transition: opacity 0.15s; }
  .pd-logo-text h2 { font-size: 14px; font-weight: 800; color: #fff; line-height: 1.2; white-space: nowrap; }
  .pd-logo-text p { font-size: 10px; color: rgba(255,255,255,0.45); white-space: nowrap; }
  .pd-sidebar.collapsed .pd-logo-text { opacity: 0; pointer-events: none; }

  .pd-nav { flex: 1; padding: 12px 8px; overflow-y: auto; overflow-x: hidden; }
  .pd-nav::-webkit-scrollbar { width: 3px; }
  .pd-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  .pd-nav-group { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.3); padding: 14px 12px 5px; white-space: nowrap; }
  .pd-sidebar.collapsed .pd-nav-group { opacity: 0; }

  .pd-nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: var(--radius-sm);
    cursor: pointer; transition: var(--transition);
    position: relative; margin-bottom: 2px;
    overflow: hidden; white-space: nowrap;
  }
  .pd-nav-item:hover { background: rgba(255,255,255,0.07); }
  .pd-nav-item.active { background: rgba(249,115,22,0.18); }
  .pd-nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 3px; height: 60%; background: var(--saffron); border-radius: 0 3px 3px 0;
  }
  .pd-nav-icon { width: 20px; height: 20px; flex-shrink: 0; color: rgba(255,255,255,0.45); transition: color var(--transition); display: flex; align-items: center; justify-content: center; }
  .pd-nav-item.active .pd-nav-icon, .pd-nav-item:hover .pd-nav-icon { color: #fff; }
  .pd-nav-label { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.6); transition: color var(--transition); flex: 1; }
  .pd-nav-item.active .pd-nav-label, .pd-nav-item:hover .pd-nav-label { color: #fff; }
  .pd-nav-badge { background: var(--red); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 100px; flex-shrink: 0; }
  .pd-sidebar.collapsed .pd-nav-label, .pd-sidebar.collapsed .pd-nav-badge, .pd-sidebar.collapsed .pd-nav-group { display: none; }

  .pd-sidebar-footer { padding: 12px 8px; border-top: 1px solid rgba(255,255,255,0.07); }
  .pd-user-card {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 12px; border-radius: var(--radius-sm);
    transition: var(--transition); overflow: hidden;
  }
  .pd-user-card:hover { background: rgba(255,255,255,0.07); }
  .pd-user-avatar {
    width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0;
    background: linear-gradient(135deg, var(--saffron), #e55a2b);
    color: #fff; font-size: 12px; font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .pd-user-info { overflow: hidden; flex: 1; }
  .pd-user-info strong { display: block; font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .pd-user-info span { font-size: 10px; color: rgba(255,255,255,0.4); }
  .pd-sidebar.collapsed .pd-user-info { display: none; }
  .pd-collapse-btn {
    width: 100%; display: flex; align-items: center; gap: 10px;
    padding: 8px 12px; border-radius: var(--radius-sm); background: none; border: none;
    color: rgba(255,255,255,0.35); cursor: pointer; font-size: 12px; font-weight: 600;
    font-family: inherit; transition: var(--transition); white-space: nowrap; overflow: hidden; margin-top: 4px;
  }
  .pd-collapse-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
  .pd-sidebar.collapsed .pd-collapse-btn span { display: none; }

  /* ── TOPBAR ── */
  .pd-topbar {
    position: fixed; top: 0; left: var(--sidebar-w); right: 0;
    height: var(--topbar-h);
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; z-index: 100; transition: left var(--transition);
  }
  .pd-topbar.collapsed { left: 64px; }
  .pd-topbar-left { display: flex; align-items: center; gap: 16px; }
  .pd-topbar-title h1 { font-size: 16px; font-weight: 700; color: var(--text); }
  .pd-topbar-title p { font-size: 12px; color: var(--text-2); }
  .pd-topbar-right { display: flex; align-items: center; gap: 8px; }

  .pd-search {
    display: flex; align-items: center; gap: 8px;
    background: var(--surface-2); border: 1px solid var(--border);
    border-radius: var(--radius-sm); padding: 8px 14px; width: 240px; transition: var(--transition);
  }
  .pd-search:focus-within { border-color: var(--saffron); background: #fff; box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
  .pd-search input { border: none; background: none; outline: none; font-size: 13px; color: var(--text); font-family: inherit; width: 100%; }
  .pd-search input::placeholder { color: var(--text-3); }

  .pd-icon-btn {
    width: 38px; height: 38px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--surface);
    color: var(--text-2); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: var(--transition); position: relative;
  }
  .pd-icon-btn:hover { background: var(--surface-2); color: var(--saffron); border-color: var(--saffron); }
  .pd-icon-btn .pd-badge { position: absolute; top: -4px; right: -4px; background: var(--red); color: #fff; font-size: 9px; font-weight: 800; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }

  /* ── DROPDOWN ── */
  .pd-dropdown-wrap { position: relative; }
  .pd-dropdown {
    position: absolute; top: calc(100% + 8px); right: 0;
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); box-shadow: var(--shadow-lg);
    min-width: 200px; z-index: 300; overflow: hidden;
    animation: pdDropIn 0.15s ease;
  }
  @keyframes pdDropIn { from { opacity:0; transform: translateY(-8px) scale(0.97); } to { opacity:1; transform:none; } }
  .pd-dropdown-item {
    display: flex; align-items: center; gap: 10px;
    padding: 10px 16px; font-size: 13px; font-weight: 500; color: var(--text);
    cursor: pointer; transition: background 0.15s; border: none; background: none; width: 100%; font-family: inherit; text-align: left;
  }
  .pd-dropdown-item:hover { background: var(--surface-2); }
  .pd-dropdown-item.danger { color: var(--red); }
  .pd-dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── MAIN ── */
  .pd-main { flex: 1; margin-left: var(--sidebar-w); padding-top: var(--topbar-h); min-height: 100vh; transition: margin-left var(--transition); }
  .pd-main.collapsed { margin-left: 64px; }
  .pd-content { padding: 28px; }

  /* ── KPI ── */
  .pd-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .pd-kpi {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px;
    box-shadow: var(--shadow-sm); transition: var(--transition);
    position: relative; overflow: hidden;
  }
  .pd-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--kc, var(--saffron)); }
  .pd-kpi:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .pd-kpi-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .pd-kpi-icon { width: 40px; height: 40px; border-radius: 10px; background: var(--kb, #fef3c7); color: var(--kc, var(--saffron)); display: flex; align-items: center; justify-content: center; font-size: 18px; }
  .pd-kpi-trend { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 100px; }
  .pd-kpi-trend.up { background: #dcfce7; color: #16a34a; }
  .pd-kpi-trend.down { background: #fee2e2; color: #dc2626; }
  .pd-kpi-trend.neutral { background: var(--surface-3); color: var(--text-2); }
  .pd-kpi-val { font-size: 28px; font-weight: 800; color: var(--text); line-height: 1; margin-bottom: 4px; }
  .pd-kpi-lbl { font-size: 12px; color: var(--text-2); font-weight: 500; }

  /* ── SECTION HEADER ── */
  .pd-sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .pd-sec-title { font-size: 17px; font-weight: 800; color: var(--text); }
  .pd-sec-sub { font-size: 12px; color: var(--text-2); margin-top: 2px; }

  /* ── BUTTONS ── */
  .pd-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: var(--radius-sm);
    font-size: 13px; font-weight: 600; cursor: pointer; border: none;
    font-family: inherit; transition: var(--transition); text-decoration: none;
  }
  .pd-btn-primary { background: var(--saffron); color: #fff; box-shadow: 0 4px 12px rgba(249,115,22,0.3); }
  .pd-btn-primary:hover { background: #ea6c0a; box-shadow: 0 6px 18px rgba(249,115,22,0.4); transform: translateY(-1px); }
  .pd-btn-blue { background: var(--blue); color: #fff; box-shadow: 0 4px 12px rgba(29,111,164,0.3); }
  .pd-btn-blue:hover { background: var(--blue-2); transform: translateY(-1px); }
  .pd-btn-secondary { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
  .pd-btn-secondary:hover { background: var(--surface-3); }
  .pd-btn-danger { background: var(--red); color: #fff; }
  .pd-btn-danger:hover { background: #dc2626; }
  .pd-btn-ghost { background: transparent; color: var(--text-2); }
  .pd-btn-ghost:hover { background: var(--surface-2); }
  .pd-btn-outline { background: transparent; border: 1px solid var(--saffron); color: var(--saffron); }
  .pd-btn-outline:hover { background: #fff8f0; }
  .pd-btn-outline-blue { background: transparent; border: 1px solid var(--blue); color: var(--blue); }
  .pd-btn-outline-blue:hover { background: var(--blue-light); }
  .pd-btn-sm { padding: 5px 12px; font-size: 12px; }
  .pd-btn[disabled] { opacity: 0.45; cursor: not-allowed; }

  /* ── CARDS ── */
  .pd-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  .pd-card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .pd-card-header h3 { font-size: 14px; font-weight: 700; color: var(--text); }
  .pd-card-header p { font-size: 11px; color: var(--text-2); margin-top: 2px; }
  .pd-card-body { padding: 20px; }
  .pd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .pd-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

  /* ── TABLE ── */
  .pd-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
  .pd-table-scroll { overflow-x: auto; }
  .pd-table { width: 100%; border-collapse: collapse; }
  .pd-table th { background: var(--surface-2); border-bottom: 1px solid var(--border); padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .pd-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid rgba(220,232,240,0.5); color: var(--text); vertical-align: middle; }
  .pd-table tr:last-child td { border-bottom: none; }
  .pd-table tbody tr:hover { background: var(--surface-2); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

  /* ── CHIPS ── */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; }
  .chip-green { background: #dcfce7; color: #15803d; }
  .chip-red { background: #fee2e2; color: #dc2626; }
  .chip-amber { background: #fef3c7; color: #d97706; }
  .chip-blue { background: var(--blue-light); color: var(--blue); }
  .chip-purple { background: #ede9fe; color: #7c3aed; }
  .chip-gray { background: var(--surface-3); color: var(--text-2); }
  .chip-orange { background: #fff7ed; color: #ea580c; }

  /* ── SEVERITY DOT ── */
  .sev { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
  .sev::before { content: ''; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .sev-Critical::before { background: var(--red); box-shadow: 0 0 0 3px rgba(239,68,68,0.2); animation: sevPulse 1.5s ease infinite; }
  .sev-High::before { background: var(--saffron); }
  .sev-Medium::before { background: var(--amber); }
  .sev-Low::before { background: var(--green); }
  @keyframes sevPulse { 0%,100%{ box-shadow: 0 0 0 3px rgba(239,68,68,0.2); } 50%{ box-shadow: 0 0 0 5px rgba(239,68,68,0.1); } }

  /* ── INCIDENT CARD ── */
  .pd-inc-card {
    padding: 14px 16px; border-radius: var(--radius-sm);
    border: 1px solid var(--border); background: var(--surface);
    display: flex; align-items: flex-start; gap: 12px;
    transition: var(--transition); margin-bottom: 8px;
  }
  .pd-inc-card:hover { box-shadow: var(--shadow-md); border-color: #bcd4e4; }
  .pd-inc-type-icon { width: 38px; height: 38px; border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
  .pd-inc-body { flex: 1; min-width: 0; }
  .pd-inc-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .pd-inc-meta { font-size: 11px; color: var(--text-2); display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 4px; }
  .pd-inc-actions { display: flex; flex-direction: column; gap: 5px; align-items: flex-end; flex-shrink: 0; }

  /* ── UNIT CARD ── */
  .pd-unit-card { padding: 16px; border-radius: var(--radius); background: var(--surface); border: 1px solid var(--border); transition: var(--transition); }
  .pd-unit-card:hover { box-shadow: var(--shadow-md); }
  .pd-unit-callsign { font-family: 'JetBrains Mono', monospace; font-size: 13px; font-weight: 700; color: var(--blue); margin-bottom: 4px; }
  .pd-unit-name { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
  .pd-unit-meta { font-size: 12px; color: var(--text-2); margin-bottom: 12px; }
  .pd-unit-status { display: inline-flex; align-items: center; gap: 5px; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 100px; margin-bottom: 12px; }
  .pd-unit-status::before { content: ''; width: 6px; height: 6px; border-radius: 50%; }
  .us-available { background: #dcfce7; color: #15803d; }
  .us-available::before { background: #16a34a; }
  .us-responding { background: #fef3c7; color: #b45309; }
  .us-responding::before { background: var(--amber); animation: sevPulse 1s step-end infinite; }
  .us-on-duty { background: var(--blue-light); color: var(--blue); }
  .us-on-duty::before { background: var(--blue); }
  .us-offline { background: var(--surface-3); color: var(--text-2); }
  .us-offline::before { background: var(--text-3); }

  /* ── MODAL ── */
  .pd-overlay { position: fixed; inset: 0; background: rgba(11,30,53,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 16px; animation: pdFade 0.15s ease; }
  @keyframes pdFade { from { opacity:0; } to { opacity:1; } }
  .pd-modal { background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 500px; animation: pdSlide 0.2s ease; max-height: 90vh; overflow-y: auto; }
  @keyframes pdSlide { from { opacity:0; transform: translateY(20px) scale(0.98); } to { opacity:1; transform:none; } }
  .pd-modal-lg { max-width: 640px; }
  .pd-modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--surface); z-index: 1; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .pd-modal-header h2 { font-size: 16px; font-weight: 800; color: var(--text); }
  .pd-modal-body { padding: 24px; }
  .pd-modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }
  .pd-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--transition); }
  .pd-close:hover { background: var(--surface-3); color: var(--text); }

  /* ── FORM ── */
  .pd-form-group { margin-bottom: 16px; }
  .pd-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
  .pd-input { width: 100%; padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; color: var(--text); background: var(--surface); outline: none; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
  .pd-input:focus { border-color: var(--saffron); box-shadow: 0 0 0 3px rgba(249,115,22,0.1); }
  .pd-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%234a5e73' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px; padding-right: 36px; }
  .pd-textarea { resize: vertical; min-height: 80px; }
  .pd-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── DETAIL PANEL ── */
  .pd-detail-row { display: flex; align-items: flex-start; gap: 12px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .pd-detail-row:last-child { border-bottom: none; }
  .pd-detail-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-3); min-width: 120px; flex-shrink: 0; padding-top: 1px; }
  .pd-detail-val { font-size: 13px; color: var(--text); font-weight: 500; }

  /* ── SETTINGS ── */
  .pd-settings-grid { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
  .pd-settings-nav { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; }
  .pd-settings-nav-item { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; transition: var(--transition); display: flex; align-items: center; gap: 10px; }
  .pd-settings-nav-item:hover { background: var(--surface-2); color: var(--text); }
  .pd-settings-nav-item.active { background: #fff7ed; color: var(--saffron); }
  .pd-settings-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
  .pd-settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); gap: 24px; }
  .pd-settings-row:last-child { border-bottom: none; }
  .pd-settings-row h4 { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
  .pd-settings-row p { font-size: 12px; color: var(--text-2); }
  .pd-toggle { width: 44px; height: 24px; border-radius: 100px; background: var(--surface-3); border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .pd-toggle::after { content: ''; width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s; }
  .pd-toggle.on { background: var(--saffron); }
  .pd-toggle.on::after { transform: translateX(20px); }

  /* ── REPORT CARDS ── */
  .pd-report-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; transition: var(--transition); cursor: pointer; }
  .pd-report-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .pd-report-icon { font-size: 28px; margin-bottom: 12px; }
  .pd-report-card h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .pd-report-card p { font-size: 12px; color: var(--text-2); line-height: 1.5; }
  .pd-report-meta { font-size: 11px; color: var(--text-3); margin-top: 12px; }

  /* ── TOAST ── */
  .pd-toast-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
  .pd-toast { background: var(--navy); color: #fff; padding: 12px 18px; border-radius: var(--radius); font-size: 13px; font-weight: 600; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 10px; animation: pdToastIn 0.25s ease; max-width: 320px; }
  .pd-toast.success { background: #15803d; }
  .pd-toast.error { background: #dc2626; }
  @keyframes pdToastIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }

  /* ── LIVE BADGE ── */
  .pd-live { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--red); }
  .pd-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--red); animation: pdLive 1.2s ease infinite; }
  @keyframes pdLive { 0%,100%{ opacity:1;transform:scale(1); } 50%{ opacity:0.5;transform:scale(1.3); } }

  /* ── EMPTY ── */
  .pd-empty { text-align: center; padding: 48px 24px; }
  .pd-empty-icon { font-size: 40px; opacity: 0.3; margin-bottom: 10px; }
  .pd-empty p { font-size: 13px; color: var(--text-2); }

  /* ── MOBILE ── */
  .pd-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 190; }
  .pd-mobile-overlay.visible { display: block; }
  .pd-mobile-btn { display: none; background: none; border: none; cursor: pointer; color: var(--text); padding: 6px; }

  @media (max-width: 1024px) {
    .pd-kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .pd-grid-2, .pd-grid-3 { grid-template-columns: 1fr; }
    .pd-settings-grid { grid-template-columns: 1fr; }
    .pd-search { width: 160px; }
  }
  @media (max-width: 768px) {
    .pd-topbar { left: 0 !important; padding: 0 16px; }
    .pd-main { margin-left: 0 !important; }
    .pd-mobile-btn { display: flex; }
    .pd-search { display: none; }
    .pd-content { padding: 20px 16px; }
    .pd-kpi-grid { grid-template-columns: 1fr 1fr; }
    .pd-row-2 { grid-template-columns: 1fr; }
  }
  @media (max-width: 480px) {
    .pd-kpi-grid { grid-template-columns: 1fr; }
    .pd-inc-actions { flex-direction: row; }
  }
`;

// ─── ICONS ────────────────────────────────────────────────────────────────────

const I = {
  Menu: () => (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  ),
  Dashboard: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  ),
  Case: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  Bell: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  ),
  Patrol: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polygon points="10 8 16 12 10 16 10 8" />
    </svg>
  ),
  Map: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
      <line x1="9" y1="3" x2="9" y2="18" />
      <line x1="15" y1="6" x2="15" y2="21" />
    </svg>
  ),
  Chart: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Users: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  Doc: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  ),
  Settings: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  ),
  LogOut: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  ),
  Search: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Plus: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ChevL: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  ChevR: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  Download: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  User: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
  Refresh: () => (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
    </svg>
  ),
  Check: () => (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Shield: () => (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
};

// ─── TOAST HOOK ────────────────────────────────────────────────────────────────

type ToastItem = {
  id: number;
  msg: string;
  type?: "success" | "error" | "info";
};
function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((msg: string, type: ToastItem["type"] = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
}

// ─── HELPER ───────────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

const typeIcon: Record<string, string> = {
  SOS: "🆘",
  "Geo-fence Breach": "📡",
  Harassment: "⚠️",
  Theft: "🔓",
  Blackout: "💡",
  Medical: "🚑",
};
const typeBg: Record<string, string> = {
  SOS: "#fee2e2",
  "Geo-fence Breach": "#ede9fe",
  Harassment: "#fef3c7",
  Theft: "#fef9c3",
  Blackout: "#dbeafe",
  Medical: "#dcfce7",
};

// ─── SECTIONS ────────────────────────────────────────────────────────────────

// Overview
const OverviewPanel: React.FC<{
  incidents: Incident[];
  units: Unit[];
  onNewIncident: () => void;
  onViewIncident: (i: Incident) => void;
  showToast: (m: string, t?: ToastItem["type"]) => void;
}> = ({ incidents, units, onNewIncident, onViewIncident, showToast }) => {
  const active = incidents.filter((i) => i.status !== "resolved");
  const critical = incidents.filter(
    (i) =>
      (i.severity === "Critical" || i.severity === "High") &&
      i.status !== "resolved",
  );
  const resolved = incidents.filter((i) => i.status === "resolved");
  const avgResp = incidents.filter((i) => i.responseTimeMin != null).length
    ? Math.round(
        incidents
          .filter((i) => i.responseTimeMin != null)
          .reduce((s, i) => s + (i.responseTimeMin || 0), 0) /
          incidents.filter((i) => i.responseTimeMin != null).length,
      )
    : null;

  const pieData = [
    {
      name: "SOS",
      value: incidents.filter((i) => i.type === "SOS").length,
      color: "#ef4444",
    },
    {
      name: "Harassment",
      value: incidents.filter((i) => i.type === "Harassment").length,
      color: "#f97316",
    },
    {
      name: "Theft",
      value: incidents.filter((i) => i.type === "Theft").length,
      color: "#f59e0b",
    },
    {
      name: "Other",
      value: incidents.filter(
        (i) => !["SOS", "Harassment", "Theft"].includes(i.type),
      ).length,
      color: "#6b7280",
    },
  ];

  return (
    <div>
      <div className="pd-kpi-grid">
        {[
          {
            label: "Active Incidents",
            val: active.length,
            icon: "🔔",
            kc: "#ef4444",
            kb: "#fee2e2",
            trend: critical.length + " critical",
            dir: "down",
          },
          {
            label: "Critical / High",
            val: critical.length,
            icon: "🚨",
            kc: "#f97316",
            kb: "#fff7ed",
            trend: "Immediate action",
            dir: critical.length > 0 ? "down" : "up",
          },
          {
            label: "Avg Response (min)",
            val: avgResp !== null ? avgResp : "—",
            icon: "⚡",
            kc: "#1d6fa4",
            kb: "#e8f4fc",
            trend: avgResp && avgResp < 15 ? "Good" : "Needs work",
            dir: avgResp && avgResp < 15 ? "up" : "down",
          },
          {
            label: "Resolved Today",
            val: resolved.length,
            icon: "✅",
            kc: "#16a34a",
            kb: "#dcfce7",
            trend: "Well done",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="pd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="pd-kpi-head">
              <div className="pd-kpi-icon">{k.icon}</div>
              <span className={`pd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="pd-kpi-val">{k.val}</div>
            <div className="pd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="pd-grid-2" style={{ marginBottom: 20 }}>
        {/* Line chart */}
        <div className="pd-card">
          <div className="pd-card-header">
            <div>
              <h3>📈 Incidents — Last 7 Days</h3>
              <p>Daily incident vs resolution rate</p>
            </div>
          </div>
          <div className="pd-card-body" style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#edf3f8" />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 11, fill: "#8fa3b1" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8fa3b1" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 8,
                    border: "1px solid #dce8f0",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="incidents"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: "#f97316", r: 3 }}
                  name="Incidents"
                />
                <Line
                  type="monotone"
                  dataKey="resolved"
                  stroke="#22c55e"
                  strokeWidth={2}
                  strokeDasharray="4 2"
                  dot={false}
                  name="Resolved"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Pie */}
        <div className="pd-card">
          <div className="pd-card-header">
            <div>
              <h3>🔎 Incident Breakdown</h3>
              <p>By type · all time</p>
            </div>
          </div>
          <div
            className="pd-card-body"
            style={{
              height: 220,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <PieChart width={140} height={140}>
              <Pie
                data={pieData}
                cx={65}
                cy={65}
                innerRadius={40}
                outerRadius={65}
                dataKey="value"
                paddingAngle={3}
              >
                {pieData.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
            </PieChart>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {pieData.map((d, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 3,
                      background: d.color,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ color: "var(--text-2)", fontWeight: 600 }}>
                    {d.name}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      fontWeight: 800,
                      color: "var(--text)",
                    }}
                  >
                    {d.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live alerts */}
      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Live Alert Feed</div>
          <div className="pd-sec-sub">
            Unresolved incidents requiring action
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="pd-live">
            <span className="pd-live-dot" /> LIVE
          </div>
          <button
            className="pd-btn pd-btn-primary pd-btn-sm"
            onClick={onNewIncident}
          >
            <I.Plus /> New Incident
          </button>
        </div>
      </div>

      {active.slice(0, 4).map((inc) => (
        <div key={inc.id} className="pd-inc-card">
          <div
            className="pd-inc-type-icon"
            style={{ background: typeBg[inc.type] || "#f3f4f6" }}
          >
            {typeIcon[inc.type] || "📋"}
          </div>
          <div className="pd-inc-body">
            <div className="pd-inc-title">
              {inc.type} — {inc.description.slice(0, 80)}
              {inc.description.length > 80 ? "…" : ""}
            </div>
            <div className="pd-inc-meta">
              <span>📍 {inc.location}</span>
              <span>🕐 {timeAgo(inc.timestamp)}</span>
              <span className={`sev sev-${inc.severity}`}>{inc.severity}</span>
              <span className="mono" style={{ color: "var(--text-3)" }}>
                {inc.id}
              </span>
            </div>
          </div>
          <div className="pd-inc-actions">
            {inc.status === "unassigned" ? (
              <span className="chip chip-red">Unassigned</span>
            ) : inc.status === "assigned" ? (
              <span className="chip chip-amber">Assigned</span>
            ) : (
              <span className="chip chip-blue">Responding</span>
            )}
            <button
              className="pd-btn pd-btn-outline-blue pd-btn-sm"
              onClick={() => onViewIncident(inc)}
            >
              View
            </button>
          </div>
        </div>
      ))}

      {active.length === 0 && (
        <div className="pd-empty">
          <div className="pd-empty-icon">🎉</div>
          <p>No active incidents right now. All clear!</p>
        </div>
      )}

      {/* Unit status strip */}
      <div style={{ marginTop: 20 }}>
        <div className="pd-sec-header">
          <div>
            <div className="pd-sec-title">Unit Status</div>
            <div className="pd-sec-sub">Quick field overview</div>
          </div>
        </div>
        <div className="pd-grid-3">
          {units.slice(0, 3).map((u) => (
            <div key={u.id} className="pd-card" style={{ padding: 16 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div className="pd-unit-callsign">{u.callSign}</div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {u.officer}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-2)",
                      marginTop: 2,
                    }}
                  >
                    📍 {u.location}
                  </div>
                </div>
                <span className={`pd-unit-status us-${u.status}`}>
                  {u.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Cases Panel
const CasesPanel: React.FC<{
  incidents: Incident[];
  onView: (i: Incident) => void;
  onResolve: (id: string) => void;
  onNew: () => void;
}> = ({ incidents, onView, onResolve, onNew }) => {
  const [filter, setFilter] = useState<string>("All");

  const filtered =
    filter === "All" ? incidents : incidents.filter((i) => i.status === filter);

  const statusChip: Record<IncidentStatus, string> = {
    unassigned: "chip chip-red",
    assigned: "chip chip-amber",
    responding: "chip chip-blue",
    resolved: "chip chip-green",
  };

  return (
    <div>
      <div className="pd-kpi-grid">
        {[
          {
            label: "Total Cases",
            val: incidents.length,
            icon: "📁",
            kc: "#1d6fa4",
            kb: "#e8f4fc",
            trend: "All time",
            dir: "neutral",
          },
          {
            label: "Unassigned",
            val: incidents.filter((i) => i.status === "unassigned").length,
            icon: "🔓",
            kc: "#ef4444",
            kb: "#fee2e2",
            trend: "Needs officer",
            dir: "down",
          },
          {
            label: "In Progress",
            val: incidents.filter((i) =>
              ["assigned", "responding"].includes(i.status),
            ).length,
            icon: "🔍",
            kc: "#f97316",
            kb: "#fff7ed",
            trend: "Active",
            dir: "neutral",
          },
          {
            label: "Resolved",
            val: incidents.filter((i) => i.status === "resolved").length,
            icon: "✅",
            kc: "#16a34a",
            kb: "#dcfce7",
            trend: "Closed",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="pd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="pd-kpi-head">
              <div className="pd-kpi-icon">{k.icon}</div>
              <span className={`pd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="pd-kpi-val">{k.val}</div>
            <div className="pd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Case Management</div>
          <div className="pd-sec-sub">All incidents and FIR-linked cases</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["All", "unassigned", "assigned", "responding", "resolved"].map(
            (f) => (
              <button
                key={f}
                className={`pd-btn pd-btn-sm ${filter === f ? "pd-btn-primary" : "pd-btn-secondary"}`}
                onClick={() => setFilter(f)}
              >
                {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ),
          )}
          <button className="pd-btn pd-btn-blue pd-btn-sm" onClick={onNew}>
            <I.Plus /> New
          </button>
        </div>
      </div>

      <div className="pd-table-wrap">
        <div className="pd-table-scroll">
          <table className="pd-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                {[
                  "Case ID",
                  "Type",
                  "Description",
                  "Location",
                  "Severity",
                  "Assigned To",
                  "Time",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <span className="mono">{c.id}</span>
                  </td>
                  <td>
                    {typeIcon[c.type]} {c.type}
                  </td>
                  <td
                    style={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={c.description}
                  >
                    {c.description}
                  </td>
                  <td style={{ fontSize: 12 }}>📍 {c.location}</td>
                  <td>
                    <span className={`sev sev-${c.severity}`}>
                      {c.severity}
                    </span>
                  </td>
                  <td>
                    {c.assignedUnit ? (
                      <span className="chip chip-blue">{c.assignedUnit}</span>
                    ) : (
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>
                        —
                      </span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {timeAgo(c.timestamp)}
                  </td>
                  <td>
                    <span className={statusChip[c.status]}>{c.status}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="pd-btn pd-btn-ghost pd-btn-sm"
                        onClick={() => onView(c)}
                      >
                        View
                      </button>
                      {c.status !== "resolved" && (
                        <button
                          className="pd-btn pd-btn-ghost pd-btn-sm"
                          style={{ color: "var(--green)" }}
                          onClick={() => onResolve(c.id)}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9}>
                    <div className="pd-empty">
                      <div className="pd-empty-icon">🎉</div>
                      <p>No cases match this filter</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Alerts Panel
const AlertsPanel: React.FC<{
  incidents: Incident[];
  units: Unit[];
  onAssign: (i: Incident) => void;
  onView: (i: Incident) => void;
  onResolve: (id: string) => void;
}> = ({ incidents, units, onAssign, onView, onResolve }) => {
  const active = incidents.filter((i) => i.status !== "resolved");
  const [typeFilter, setTypeFilter] = useState("All");

  const filtered =
    typeFilter === "All" ? active : active.filter((i) => i.type === typeFilter);

  return (
    <div>
      <div className="pd-kpi-grid">
        {[
          {
            label: "Active Alerts",
            val: active.length,
            icon: "🔔",
            kc: "#ef4444",
            kb: "#fee2e2",
            trend: "Now",
            dir: "down",
          },
          {
            label: "SOS Signals",
            val: active.filter((i) => i.type === "SOS").length,
            icon: "🆘",
            kc: "#dc2626",
            kb: "#fee2e2",
            trend: "Immediate",
            dir: "down",
          },
          {
            label: "Unassigned",
            val: active.filter((i) => i.status === "unassigned").length,
            icon: "📋",
            kc: "#f97316",
            kb: "#fff7ed",
            trend: "Needs unit",
            dir:
              active.filter((i) => i.status === "unassigned").length > 0
                ? "down"
                : "up",
          },
          {
            label: "Units Available",
            val: units.filter((u) => u.status === "available").length,
            icon: "🚔",
            kc: "#16a34a",
            kb: "#dcfce7",
            trend: "Ready to deploy",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="pd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="pd-kpi-head">
              <div className="pd-kpi-icon">{k.icon}</div>
              <span className={`pd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="pd-kpi-val">{k.val}</div>
            <div className="pd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Real-time Alerts</div>
          <div className="pd-sec-sub">Active incidents requiring response</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="pd-live">
            <span className="pd-live-dot" /> LIVE
          </div>
          {["All", "SOS", "Harassment", "Geo-fence Breach", "Medical"].map(
            (f) => (
              <button
                key={f}
                className={`pd-btn pd-btn-sm ${typeFilter === f ? "pd-btn-primary" : "pd-btn-secondary"}`}
                onClick={() => setTypeFilter(f)}
              >
                {f}
              </button>
            ),
          )}
        </div>
      </div>

      {filtered.map((inc) => (
        <div key={inc.id} className="pd-inc-card">
          <div
            className="pd-inc-type-icon"
            style={{ background: typeBg[inc.type] || "#f3f4f6" }}
          >
            {typeIcon[inc.type] || "📋"}
          </div>
          <div className="pd-inc-body">
            <div className="pd-inc-title">
              {inc.type} — {inc.description}
            </div>
            <div className="pd-inc-meta">
              <span>📍 {inc.location}</span>
              <span>🕐 {timeAgo(inc.timestamp)}</span>
              <span className={`sev sev-${inc.severity}`}>{inc.severity}</span>
              {inc.assignedUnit && (
                <span className="chip chip-blue" style={{ fontSize: 10 }}>
                  {inc.assignedUnit}
                </span>
              )}
            </div>
          </div>
          <div className="pd-inc-actions">
            {inc.status === "unassigned" && (
              <span className="chip chip-red">● Unassigned</span>
            )}
            {inc.status === "assigned" && (
              <span className="chip chip-amber">👁 Assigned</span>
            )}
            {inc.status === "responding" && (
              <span className="chip chip-orange">🚔 Responding</span>
            )}
            <div style={{ display: "flex", gap: 6 }}>
              <button
                className="pd-btn pd-btn-secondary pd-btn-sm"
                onClick={() => onView(inc)}
              >
                Details
              </button>
              {inc.status === "unassigned" && (
                <button
                  className="pd-btn pd-btn-primary pd-btn-sm"
                  onClick={() => onAssign(inc)}
                >
                  Assign
                </button>
              )}
              {inc.status !== "unassigned" && (
                <button
                  className="pd-btn pd-btn-blue pd-btn-sm"
                  onClick={() => onResolve(inc.id)}
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {filtered.length === 0 && (
        <div className="pd-empty">
          <div className="pd-empty-icon">🎉</div>
          <p>No active alerts for this filter. All clear!</p>
        </div>
      )}
    </div>
  );
};

// Patrols Panel
const PatrolsPanel: React.FC<{
  units: Unit[];
  incidents: Incident[];
  onUpdateUnit: (id: string, status: UnitStatus) => void;
  showToast: (m: string, t?: ToastItem["type"]) => void;
}> = ({ units, incidents, onUpdateUnit, showToast }) => {
  return (
    <div>
      <div className="pd-kpi-grid">
        {[
          {
            label: "Total Units",
            val: units.length,
            icon: "🚔",
            kc: "#1d6fa4",
            kb: "#e8f4fc",
            trend: "Fleet",
            dir: "neutral",
          },
          {
            label: "On Duty",
            val: units.filter((u) => u.status !== "offline").length,
            icon: "🟢",
            kc: "#16a34a",
            kb: "#dcfce7",
            trend: "Active",
            dir: "up",
          },
          {
            label: "Responding",
            val: units.filter((u) => u.status === "responding").length,
            icon: "🚨",
            kc: "#f97316",
            kb: "#fff7ed",
            trend: "Dispatched",
            dir: "neutral",
          },
          {
            label: "Available",
            val: units.filter((u) => u.status === "available").length,
            icon: "✅",
            kc: "#0d9488",
            kb: "#ccfbf1",
            trend: "Ready",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="pd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="pd-kpi-head">
              <div className="pd-kpi-icon">{k.icon}</div>
              <span className={`pd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="pd-kpi-val">{k.val}</div>
            <div className="pd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Patrol & Resource Management</div>
          <div className="pd-sec-sub">Field unit deployment and status</div>
        </div>
        <button
          className="pd-btn pd-btn-secondary pd-btn-sm"
          onClick={() => showToast("Unit data refreshed")}
        >
          <I.Refresh />
        </button>
      </div>

      <div className="pd-grid-3">
        {units.map((u) => {
          const assigned = incidents.find(
            (i) => i.assignedUnit === u.callSign && i.status !== "resolved",
          );
          return (
            <div key={u.id} className="pd-unit-card">
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 8,
                }}
              >
                <div>
                  <div className="pd-unit-callsign">{u.callSign}</div>
                  <div className="pd-unit-name">{u.name}</div>
                </div>
                <span style={{ fontSize: 22 }}>
                  {u.type === "Patrol Car"
                    ? "🚔"
                    : u.type === "Motorcycle"
                      ? "🏍️"
                      : u.type === "Emergency Van"
                        ? "🚑"
                        : "👮"}
                </span>
              </div>
              <div className="pd-unit-meta">
                👮 {u.officer}
                <br />
                📍 {u.location}
                <br />⏱ Updated {timeAgo(u.lastUpdated)}
              </div>
              <span
                className={`pd-unit-status us-${u.status.replace(" ", "-")}`}
              >
                {u.status}
              </span>
              {assigned && (
                <div
                  style={{
                    fontSize: 11,
                    background: "#fff7ed",
                    border: "1px solid #fed7aa",
                    borderRadius: 6,
                    padding: "6px 10px",
                    marginBottom: 10,
                    color: "#ea580c",
                    fontWeight: 600,
                  }}
                >
                  📋 On: {assigned.id} — {assigned.type}
                </div>
              )}
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {u.status !== "responding" && (
                  <button
                    className="pd-btn pd-btn-sm pd-btn-outline"
                    onClick={() => {
                      onUpdateUnit(u.id, "responding");
                      showToast(`${u.callSign} set to Responding`);
                    }}
                  >
                    Set Responding
                  </button>
                )}
                {u.status !== "available" && (
                  <button
                    className="pd-btn pd-btn-sm pd-btn-secondary"
                    onClick={() => {
                      onUpdateUnit(u.id, "available");
                      showToast(`${u.callSign} now Available`);
                    }}
                  >
                    Available
                  </button>
                )}
                {u.status !== "offline" && (
                  <button
                    className="pd-btn pd-btn-sm pd-btn-ghost"
                    onClick={() => {
                      onUpdateUnit(u.id, "offline");
                      showToast(`${u.callSign} set Offline`);
                    }}
                  >
                    Offline
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Tourist Panel
const TouristPanel: React.FC = () => {
  const zones = [
    {
      name: "Kaziranga NP Zone A",
      risk: "Low",
      tourists: 12,
      crowdLevel: "Moderate",
      lastCheck: "2 min ago",
    },
    {
      name: "Manas NP Trail 3",
      risk: "High",
      tourists: 3,
      crowdLevel: "Low",
      lastCheck: "5 min ago",
    },
    {
      name: "Guwahati City Centre",
      risk: "Medium",
      tourists: 34,
      crowdLevel: "High",
      lastCheck: "1 min ago",
    },
    {
      name: "Itanagar Heritage Site",
      risk: "High",
      tourists: 2,
      crowdLevel: "Low",
      lastCheck: "8 min ago",
    },
    {
      name: "Majuli Island Route",
      risk: "Low",
      tourists: 9,
      crowdLevel: "Low",
      lastCheck: "3 min ago",
    },
    {
      name: "Kamakhya Temple Area",
      risk: "Medium",
      tourists: 21,
      crowdLevel: "Very High",
      lastCheck: "4 min ago",
    },
  ];

  const riskAreas = [
    "Market area — high footfall after 10pm, insufficient lighting",
    "Old Fort restricted zones — unauthorized tourist access",
    "Riverfront area — poor lighting, isolated stretch",
    "Forest trail NP3 — tourists frequently lose GPS signal",
    "Highway NH37 — no pedestrian zones near tourist spots",
  ];

  return (
    <div>
      <div className="pd-kpi-grid">
        {[
          {
            label: "Monitored Zones",
            val: zones.length,
            icon: "🗺️",
            kc: "#1d6fa4",
            kb: "#e8f4fc",
            trend: "Active",
            dir: "up",
          },
          {
            label: "Total Tourists",
            val: zones.reduce((s, z) => s + z.tourists, 0),
            icon: "👥",
            kc: "#0d9488",
            kb: "#ccfbf1",
            trend: "Live count",
            dir: "up",
          },
          {
            label: "Alert Zones",
            val: zones.filter((z) => z.risk === "High").length,
            icon: "⚠️",
            kc: "#ef4444",
            kb: "#fee2e2",
            trend: "Action needed",
            dir: "down",
          },
          {
            label: "Safe Zones",
            val: zones.filter((z) => z.risk === "Low").length,
            icon: "🛡️",
            kc: "#16a34a",
            kb: "#dcfce7",
            trend: "Secure",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="pd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="pd-kpi-head">
              <div className="pd-kpi-icon">{k.icon}</div>
              <span className={`pd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="pd-kpi-val">{k.val}</div>
            <div className="pd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Zone Safety Monitor</div>
          <div className="pd-sec-sub">
            Real-time tourist zone risk assessment
          </div>
        </div>
        <div className="pd-live">
          <span className="pd-live-dot" /> LIVE TRACKING
        </div>
      </div>

      <div className="pd-table-wrap" style={{ marginBottom: 24 }}>
        <div className="pd-table-scroll">
          <table className="pd-table">
            <thead>
              <tr>
                {[
                  "Zone",
                  "Risk",
                  "Tourists",
                  "Crowd Level",
                  "Last Check",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {zones.map((z, i) => (
                <tr key={i}>
                  <td>
                    <strong>{z.name}</strong>
                  </td>
                  <td>
                    <span
                      className={`sev sev-${z.risk === "High" ? "Critical" : z.risk === "Medium" ? "Medium" : "Low"}`}
                    >
                      {z.risk}
                    </span>
                  </td>
                  <td>{z.tourists} active</td>
                  <td>
                    {z.crowdLevel === "Very High" ? (
                      <span className="chip chip-red">{z.crowdLevel}</span>
                    ) : z.crowdLevel === "High" ? (
                      <span className="chip chip-amber">{z.crowdLevel}</span>
                    ) : z.crowdLevel === "Moderate" ? (
                      <span className="chip chip-blue">{z.crowdLevel}</span>
                    ) : (
                      <span className="chip chip-green">{z.crowdLevel}</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                    ⏱ {z.lastCheck}
                  </td>
                  <td>
                    <button className="pd-btn pd-btn-ghost pd-btn-sm pd-btn-outline-blue">
                      View Zone
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pd-card">
        <div className="pd-card-header">
          <div>
            <h3>⚠️ Identified Risk Areas</h3>
            <p>Areas requiring increased patrol presence</p>
          </div>
        </div>
        <div className="pd-card-body">
          {riskAreas.map((r, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "10px 0",
                borderBottom:
                  i < riskAreas.length - 1 ? "1px solid var(--border)" : "none",
              }}
            >
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <span
                style={{
                  fontSize: 13,
                  color: "var(--text-2)",
                  lineHeight: 1.5,
                }}
              >
                {r}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Reports Panel
const ReportsPanel: React.FC = () => {
  const reports = [
    {
      icon: "📊",
      title: "Weekly Incident Summary",
      desc: "All incidents logged this week with severity breakdown and response times.",
      meta: "Updated 1h ago · PDF",
    },
    {
      icon: "⚡",
      title: "Response Time Analysis",
      desc: "Average response per unit, shift, and zone. Identify bottlenecks.",
      meta: "Updated 2h ago · PDF",
    },
    {
      icon: "🚔",
      title: "Patrol Coverage Report",
      desc: "Unit deployment efficiency and coverage gaps across all zones.",
      meta: "Updated 6h ago · PDF",
    },
    {
      icon: "👥",
      title: "Tourist Safety Log",
      desc: "Zone incidents, crowd density patterns, and tourist complaint trends.",
      meta: "Updated daily · CSV",
    },
    {
      icon: "⚖️",
      title: "FIR & Case Status Report",
      desc: "Open/closed FIR ratios, officer caseload, and court-ready summaries.",
      meta: "Updated 3h ago · PDF",
    },
    {
      icon: "🗺️",
      title: "Geographic Risk Map",
      desc: "Heat map analysis of high-incident zones with patrol recommendations.",
      meta: "Updated 4h ago · PDF",
    },
  ];

  return (
    <div>
      <div className="pd-card" style={{ marginBottom: 24 }}>
        <div className="pd-card-header">
          <div>
            <h3>📈 7-Day Incident & Response Trend</h3>
            <p>Incidents logged vs average response time</p>
          </div>
          <button className="pd-btn pd-btn-secondary pd-btn-sm">
            <I.Download /> Export
          </button>
        </div>
        <div className="pd-card-body" style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={responseData} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#edf3f8" />
              <XAxis
                dataKey="hour"
                tick={{ fontSize: 11, fill: "#8fa3b1" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#8fa3b1" }}
                axisLine={false}
                tickLine={false}
                unit="m"
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #dce8f0",
                  fontSize: 12,
                }}
                formatter={(v: any) => [`${v} min`, "Avg Response"]}
              />
              <Bar dataKey="avg" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Available Reports</div>
          <div className="pd-sec-sub">Download or view detailed analytics</div>
        </div>
      </div>

      <div className="pd-grid-3">
        {reports.map((r, i) => (
          <div key={i} className="pd-report-card">
            <div className="pd-report-icon">{r.icon}</div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div className="pd-report-meta">📄 {r.meta}</div>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button className="pd-btn pd-btn-ghost pd-btn-sm pd-btn-outline-blue">
                View
              </button>
              <button className="pd-btn pd-btn-secondary pd-btn-sm">
                <I.Download /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Users Panel
const UsersPanel: React.FC<{
  showToast: (m: string, t?: ToastItem["type"]) => void;
  userRows: PoliceUserRow[];
}> = ({ showToast, userRows }) => {
  const [users, setUsers] = useState<PoliceUserRow[]>(
    userRows.length ? userRows : seedUsers,
  );
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    badge: "",
    role: "Officer",
    department: "",
    shift: "Day",
  });

  useEffect(() => {
    if (userRows.length) {
      setUsers(userRows);
    }
  }, [userRows]);

  const add = () => {
    if (!form.name || !form.badge) {
      showToast("Fill required fields", "error");
      return;
    }
    setUsers((p) => [
      ...p,
      {
        id: `USR-${String(p.length + 1).padStart(2, "0")}`,
        ...form,
        role: form.role as any,
        status: "Active" as const,
      },
    ]);
    setAddOpen(false);
    setForm({
      name: "",
      badge: "",
      role: "Officer",
      department: "",
      shift: "Day",
    });
    showToast("Officer added successfully", "success");
  };

  const roleChip: Record<string, string> = {
    Admin: "chip chip-red",
    Officer: "chip chip-blue",
    Dispatcher: "chip chip-purple",
    Viewer: "chip chip-gray",
  };

  return (
    <div>
      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">Users & Roles</div>
          <div className="pd-sec-sub">
            Police personnel and access management
          </div>
        </div>
        <button
          className="pd-btn pd-btn-primary"
          onClick={() => setAddOpen(true)}
        >
          <I.Plus /> Add Officer
        </button>
      </div>

      <div className="pd-table-wrap">
        <div className="pd-table-scroll">
          <table className="pd-table" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                {[
                  "Officer",
                  "Badge No.",
                  "Role",
                  "Department",
                  "Shift",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    <br />
                    <span
                      className="mono"
                      style={{ color: "var(--text-3)", fontSize: 11 }}
                    >
                      {u.id}
                    </span>
                  </td>
                  <td>
                    <span className="mono">{u.badge}</span>
                  </td>
                  <td>
                    <span className={roleChip[u.role] || "chip chip-gray"}>
                      {u.role}
                    </span>
                  </td>
                  <td>{u.department}</td>
                  <td>
                    <span
                      className={`chip ${u.shift === "Night" ? "chip-purple" : "chip-blue"}`}
                    >
                      {u.shift}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        u.status === "Active" ? "chip chip-green" : "chip chip-gray"
                      }
                    >
                      {u.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="pd-btn pd-btn-ghost pd-btn-sm"
                      onClick={() => showToast(`Editing ${u.name}`)}
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="pd-overlay" onClick={() => setAddOpen(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <h2>Add Officer</h2>
              <button className="pd-close" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="pd-modal-body">
              <div className="pd-form-group">
                <label className="pd-label">Full Name *</label>
                <input
                  className="pd-input"
                  placeholder="Officer full name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="pd-form-group">
                <label className="pd-label">Badge No. *</label>
                <input
                  className="pd-input"
                  placeholder="e.g. SI-0342"
                  value={form.badge}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, badge: e.target.value }))
                  }
                />
              </div>
              <div className="pd-row-2">
                <div className="pd-form-group">
                  <label className="pd-label">Role</label>
                  <select
                    className="pd-input pd-select"
                    value={form.role}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, role: e.target.value }))
                    }
                  >
                    {["Admin", "Officer", "Dispatcher", "Viewer"].map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="pd-form-group">
                  <label className="pd-label">Shift</label>
                  <select
                    className="pd-input pd-select"
                    value={form.shift}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, shift: e.target.value }))
                    }
                  >
                    {["Day", "Night", "Rotating"].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="pd-form-group">
                <label className="pd-label">Department</label>
                <input
                  className="pd-input"
                  placeholder="e.g. Guwahati Zone A"
                  value={form.department}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, department: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="pd-modal-footer">
              <button
                className="pd-btn pd-btn-secondary"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button className="pd-btn pd-btn-primary" onClick={add}>
                Add Officer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// eFIR Panel
const EFIRPanel: React.FC<{
  showToast: (m: string, t?: ToastItem["type"]) => void;
}> = ({ showToast }) => {
  const [efirs, setEfirs] = useState(seedEFIRs);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    complainant: "",
    offense: "",
    officer: "",
  });

  const add = () => {
    if (!form.complainant || !form.offense) {
      showToast("Fill required fields", "error");
      return;
    }
    setEfirs((p) => [
      ...p,
      {
        id: `eFIR-2025-${String(p.length + 1).padStart(3, "0")}`,
        ...form,
        date: new Date().toISOString().split("T")[0],
        status: "Draft" as const,
      },
    ]);
    setAddOpen(false);
    setForm({ complainant: "", offense: "", officer: "" });
    showToast("eFIR created. Pending submission.", "success");
  };

  const submit = (id: string) => {
    setEfirs((p) =>
      p.map((f) =>
        f.id === id
          ? {
              ...f,
              status: "Submitted" as const,
              blockchainHash:
                "0x" + Math.random().toString(16).slice(2, 10) + "...",
            }
          : f,
      ),
    );
    showToast("eFIR submitted to blockchain ledger", "success");
  };

  const statusChip: Record<EFir["status"], string> = {
    Draft: "chip chip-gray",
    Submitted: "chip chip-blue",
    "Under Review": "chip chip-amber",
    Accepted: "chip chip-green",
    Rejected: "chip chip-red",
  };

  return (
    <div>
      <div className="pd-kpi-grid">
        {[
          {
            label: "Total eFIRs",
            val: efirs.length,
            icon: "📁",
            kc: "#1d6fa4",
            kb: "#e8f4fc",
            trend: "All records",
            dir: "neutral",
          },
          {
            label: "Draft",
            val: efirs.filter((f) => f.status === "Draft").length,
            icon: "✏️",
            kc: "#6b7280",
            kb: "#f3f4f6",
            trend: "Not submitted",
            dir: "neutral",
          },
          {
            label: "Under Review",
            val: efirs.filter((f) => f.status === "Under Review").length,
            icon: "🔍",
            kc: "#f97316",
            kb: "#fff7ed",
            trend: "Pending",
            dir: "neutral",
          },
          {
            label: "Accepted",
            val: efirs.filter((f) => f.status === "Accepted").length,
            icon: "✅",
            kc: "#16a34a",
            kb: "#dcfce7",
            trend: "On-chain",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="pd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="pd-kpi-head">
              <div className="pd-kpi-icon">{k.icon}</div>
              <span className={`pd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="pd-kpi-val">{k.val}</div>
            <div className="pd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="pd-sec-header">
        <div>
          <div className="pd-sec-title">eFIR & Legal Documents</div>
          <div className="pd-sec-sub">Blockchain-secured complaint records</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="pd-btn pd-btn-secondary pd-btn-sm">
            <I.Download /> Export
          </button>
          <button
            className="pd-btn pd-btn-primary"
            onClick={() => setAddOpen(true)}
          >
            <I.Plus /> New eFIR
          </button>
        </div>
      </div>

      <div className="pd-table-wrap">
        <div className="pd-table-scroll">
          <table className="pd-table" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                {[
                  "eFIR ID",
                  "Complainant",
                  "Offense",
                  "Date",
                  "Officer",
                  "Blockchain Hash",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {efirs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="mono">{f.id}</span>
                  </td>
                  <td>
                    <strong>{f.complainant}</strong>
                  </td>
                  <td
                    style={{
                      maxWidth: 180,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {f.offense}
                  </td>
                  <td>{f.date}</td>
                  <td>{f.officer}</td>
                  <td>
                    {f.blockchainHash ? (
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--teal)" }}
                      >
                        🔗 {f.blockchainHash}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={statusChip[f.status]}>{f.status}</span>
                  </td>
                  <td>
                    {f.status === "Draft" && (
                      <button
                        className="pd-btn pd-btn-outline pd-btn-sm"
                        onClick={() => submit(f.id)}
                      >
                        Submit
                      </button>
                    )}
                    {f.status !== "Draft" && (
                      <button
                        className="pd-btn pd-btn-ghost pd-btn-sm"
                        onClick={() => showToast("Opening PDF…")}
                      >
                        View PDF
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="pd-overlay" onClick={() => setAddOpen(false)}>
          <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="pd-modal-header">
              <h2>New eFIR</h2>
              <button className="pd-close" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="pd-modal-body">
              <div className="pd-form-group">
                <label className="pd-label">Complainant Name *</label>
                <input
                  className="pd-input"
                  placeholder="Full name"
                  value={form.complainant}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, complainant: e.target.value }))
                  }
                />
              </div>
              <div className="pd-form-group">
                <label className="pd-label">Offense / IPC Section *</label>
                <input
                  className="pd-input"
                  placeholder="e.g. Molestation (IPC 354)"
                  value={form.offense}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, offense: e.target.value }))
                  }
                />
              </div>
              <div className="pd-form-group">
                <label className="pd-label">Handling Officer</label>
                <input
                  className="pd-input"
                  placeholder="Officer name"
                  value={form.officer}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, officer: e.target.value }))
                  }
                />
              </div>
              <div
                style={{
                  background: "#fff7ed",
                  border: "1px solid #fed7aa",
                  borderRadius: 8,
                  padding: "12px 14px",
                  fontSize: 12,
                  color: "#ea580c",
                  fontWeight: 600,
                }}
              >
                🔗 On submission, this eFIR will be anchored to the blockchain
                ledger for tamper-proof storage.
              </div>
            </div>
            <div className="pd-modal-footer">
              <button
                className="pd-btn pd-btn-secondary"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button className="pd-btn pd-btn-primary" onClick={add}>
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Settings Panel
const SettingsPanel: React.FC<{
  showToast: (m: string, t?: ToastItem["type"]) => void;
}> = ({ showToast }) => {
  const [tab, setTab] = useState("alerts");
  const [toggles, setToggles] = useState({
    sos_notify: true,
    auto_dispatch: true,
    sms_alert: false,
    whatsapp: true,
    two_fa: true,
    audit_log: true,
    data_retention: false,
    night_mode: false,
    geo_fence: true,
  });

  const toggle = (k: keyof typeof toggles) => {
    setToggles((p) => ({ ...p, [k]: !p[k] }));
    showToast("Setting saved", "success");
  };

  const tabs = [
    { id: "alerts", label: "🔔 Alert Settings" },
    { id: "security", label: "🔒 Security" },
    { id: "integrations", label: "🔗 Integrations" },
    { id: "system", label: "⚙️ System" },
  ];

  return (
    <div className="pd-settings-grid">
      <div className="pd-settings-nav">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`pd-settings-nav-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>
      <div className="pd-settings-panel">
        {tab === "alerts" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Alert & Notification Settings
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Configure how officers receive critical alerts
            </p>
            {[
              {
                key: "sos_notify",
                label: "SOS Push Notifications",
                desc: "Instant alert to all active officers on SOS activation",
              },
              {
                key: "auto_dispatch",
                label: "Auto-Dispatch Suggestion",
                desc: "AI recommends nearest available unit for each incident",
              },
              {
                key: "sms_alert",
                label: "SMS Alerts",
                desc: "Send SMS for critical incidents to registered mobiles",
              },
              {
                key: "whatsapp",
                label: "WhatsApp Alerts",
                desc: "WhatsApp notifications for assigned officers",
              },
            ].map((s) => (
              <div key={s.key} className="pd-settings-row">
                <div>
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`pd-toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="pd-settings-row">
              <div>
                <h4>Alert Threshold (minutes)</h4>
                <p>Escalate if no response within this time</p>
              </div>
              <select
                className="pd-input pd-select"
                style={{ width: 100, padding: "6px 30px 6px 10px" }}
                defaultValue={15}
              >
                {[5, 10, 15, 20, 30].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
          </>
        )}
        {tab === "security" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Security Configuration
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Protect system access and data integrity
            </p>
            {[
              {
                key: "two_fa",
                label: "Two-Factor Authentication",
                desc: "Require OTP on every officer login",
              },
              {
                key: "audit_log",
                label: "Audit Logging",
                desc: "Log every action taken in the dashboard",
              },
            ].map((s) => (
              <div key={s.key} className="pd-settings-row">
                <div>
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`pd-toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="pd-settings-row">
              <div>
                <h4>Session Timeout</h4>
                <p>Auto-logout after inactivity</p>
              </div>
              <select
                className="pd-input pd-select"
                style={{ width: 120, padding: "6px 30px 6px 10px" }}
                defaultValue={30}
              >
                {[15, 30, 60, 120].map((v) => (
                  <option key={v}>{v} min</option>
                ))}
              </select>
            </div>
            <div className="pd-settings-row">
              <div>
                <h4>Change Password</h4>
                <p>Last changed 14 days ago</p>
              </div>
              <button
                className="pd-btn pd-btn-secondary pd-btn-sm"
                onClick={() => showToast("Reset link sent to registered email")}
              >
                Reset
              </button>
            </div>
          </>
        )}
        {tab === "integrations" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              External Integrations
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Connected government systems and APIs
            </p>
            {[
              {
                name: "NCRB Database",
                status: true,
                desc: "National Crime Records Bureau",
              },
              {
                name: "Emergency 112 Hub",
                status: true,
                desc: "National Emergency Response",
              },
              {
                name: "Blockchain eFIR Ledger",
                status: true,
                desc: "Decentralized FIR storage",
              },
              {
                name: "FRRO Tourist API",
                status: false,
                desc: "Foreign Regional Registration Office",
              },
              {
                name: "State Police HQ",
                status: true,
                desc: "Live data sync with HQ",
              },
              {
                name: "CCTNS Integration",
                status: false,
                desc: "Crime & Criminal Tracking Network",
              },
            ].map((s, i) => (
              <div key={i} className="pd-settings-row">
                <div>
                  <h4>{s.name}</h4>
                  <p>{s.desc}</p>
                </div>
                <span
                  className={`chip ${s.status ? "chip-green" : "chip-red"}`}
                >
                  {s.status ? "● Connected" : "○ Offline"}
                </span>
              </div>
            ))}
          </>
        )}
        {tab === "system" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              System Settings
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Dashboard behaviour and data management
            </p>
            {[
              {
                key: "geo_fence",
                label: "Geo-fence Monitoring",
                desc: "Alert when tourists exit designated safe zones",
              },
              {
                key: "night_mode",
                label: "Night Mode",
                desc: "Dark theme for night shift operations",
              },
              {
                key: "data_retention",
                label: "Auto Archive (90 days)",
                desc: "Auto-archive resolved cases older than 90 days",
              },
            ].map((s) => (
              <div key={s.key} className="pd-settings-row">
                <div>
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`pd-toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="pd-settings-row">
              <div>
                <h4>Database Backup</h4>
                <p>Last: Today 06:00 AM</p>
              </div>
              <button
                className="pd-btn pd-btn-primary pd-btn-sm"
                onClick={() => showToast("Backup initiated", "success")}
              >
                Backup Now
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

type SectionKey =
  | "overview"
  | "cases"
  | "alerts"
  | "patrols"
  | "tourist"
  | "reports"
  | "users"
  | "efir"
  | "settings";

const navGroups = [
  {
    label: "Main",
    items: [
      {
        key: "overview" as SectionKey,
        label: "Overview",
        icon: <I.Dashboard />,
        badge: 0,
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        key: "cases" as SectionKey,
        label: "Case Management",
        icon: <I.Case />,
        badge: 0,
      },
      {
        key: "alerts" as SectionKey,
        label: "Real-time Alerts",
        icon: <I.Bell />,
        badge: 3,
      },
      {
        key: "patrols" as SectionKey,
        label: "Patrols & Resources",
        icon: <I.Patrol />,
        badge: 0,
      },
    ],
  },
  {
    label: "Field",
    items: [
      {
        key: "tourist" as SectionKey,
        label: "Tourist Monitoring",
        icon: <I.Map />,
        badge: 2,
      },
      {
        key: "reports" as SectionKey,
        label: "Analytics & Reports",
        icon: <I.Chart />,
        badge: 0,
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        key: "users" as SectionKey,
        label: "Users & Roles",
        icon: <I.Users />,
        badge: 0,
      },
      {
        key: "efir" as SectionKey,
        label: "eFIRs & Legal",
        icon: <I.Doc />,
        badge: 0,
      },
      {
        key: "settings" as SectionKey,
        label: "Settings",
        icon: <I.Settings />,
        badge: 0,
      },
    ],
  },
];

const titles: Record<SectionKey, { title: string; sub: string }> = {
  overview: {
    title: "Police Operations Overview",
    sub: "Live incidents, unit status, and daily metrics",
  },
  cases: {
    title: "Case Management",
    sub: "All incidents and FIR-linked cases",
  },
  alerts: {
    title: "Real-time Alerts",
    sub: "Active incidents requiring immediate response",
  },
  patrols: {
    title: "Patrols & Resources",
    sub: "Field unit deployment and status control",
  },
  tourist: {
    title: "Tourist Safety Monitor",
    sub: "Zone risk levels, crowd density, and risk areas",
  },
  reports: {
    title: "Analytics & Reports",
    sub: "Performance metrics and downloadable reports",
  },
  users: {
    title: "Users & Roles",
    sub: "Police personnel and access management",
  },
  efir: {
    title: "eFIRs & Legal Documents",
    sub: "Blockchain-secured complaint records",
  },
  settings: {
    title: "System Settings",
    sub: "Configuration, alerts, and integrations",
  },
};

const PoliceDashboard: React.FC<PoliceDashboardProps> = ({
  userName,
  onLogout,
}) => {
  const { emergencyAlerts, users } = useGeoGuardianRealtimeData();
  const [section, setSection] = useState<SectionKey>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>(seedIncidents);
  const [units, setUnits] = useState<Unit[]>(seedUnits);
  const { toasts, show: showToast } = useToast();

  const realtimeIncidents = useMemo(
    () =>
      emergencyAlerts.data
        .map(mapEmergencyAlertToIncident)
        .sort((a, b) => b.timestamp - a.timestamp),
    [emergencyAlerts.data],
  );
  const realtimeUserRows = useMemo(
    () => users.data.map(mapRealtimeUserToPoliceUser),
    [users.data],
  );
  const effectiveUserRows = realtimeUserRows.length ? realtimeUserRows : seedUsers;

  // Incident detail modal
  const [detailInc, setDetailInc] = useState<Incident | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [assignTarget, setAssignTarget] = useState<Incident | null>(null);
  const [selectedUnit, setSelectedUnit] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [newInc, setNewInc] = useState({
    type: "SOS" as IncidentType,
    severity: "Medium" as Severity,
    description: "",
    location: "",
  });

  useEffect(() => {
    if (realtimeIncidents.length) {
      setIncidents(realtimeIncidents);
    }
  }, [realtimeIncidents]);

  const alertCount = incidents.filter((i) => i.status !== "resolved").length;

  const resolveIncident = (id: string) => {
    setIncidents((p) =>
      p.map((i) =>
        i.id === id
          ? {
              ...i,
              status: "resolved",
              responseTimeMin:
                i.responseTimeMin || Math.floor(Math.random() * 20 + 5),
            }
          : i,
      ),
    );
    setDetailInc(null);
    showToast("Incident resolved", "success");
  };

  const assignUnit = () => {
    if (!assignTarget || !selectedUnit) return;
    const unit = units.find((u) => u.id === selectedUnit);
    setIncidents((p) =>
      p.map((i) =>
        i.id === assignTarget.id
          ? { ...i, assignedUnit: unit?.callSign, status: "assigned" }
          : i,
      ),
    );
    setUnits((p) =>
      p.map((u) =>
        u.id === selectedUnit
          ? { ...u, status: "responding", assignedIncidentId: assignTarget.id }
          : u,
      ),
    );
    setAssignOpen(false);
    setAssignTarget(null);
    showToast(`${unit?.callSign} dispatched to ${assignTarget.id}`, "success");
  };

  const createIncident = () => {
    if (!newInc.description || !newInc.location) {
      showToast("Fill required fields", "error");
      return;
    }
    const id = `INC-${String(incidents.length + 1).padStart(3, "0")}`;
    setIncidents((p) => [
      ...p,
      { id, ...newInc, status: "unassigned", timestamp: Date.now() },
    ]);
    setCreateOpen(false);
    setNewInc({
      type: "SOS",
      severity: "Medium",
      description: "",
      location: "",
    });
    showToast(`${id} created`, "success");
  };

  const updateUnit = (id: string, status: UnitStatus) => {
    setUnits((p) =>
      p.map((u) =>
        u.id === id ? { ...u, status, lastUpdated: Date.now() } : u,
      ),
    );
  };

  const openAssign = (inc: Incident) => {
    setAssignTarget(inc);
    setSelectedUnit("");
    setAssignOpen(true);
  };

  const userInitials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "PO";
  const { title, sub } = titles[section];

  const renderSection = () => {
    switch (section) {
      case "overview":
        return (
          <OverviewPanel
            incidents={incidents}
            units={units}
            onNewIncident={() => setCreateOpen(true)}
            onViewIncident={(i) => setDetailInc(i)}
            showToast={showToast}
          />
        );
      case "cases":
        return (
          <CasesPanel
            incidents={incidents}
            onView={(i) => setDetailInc(i)}
            onResolve={resolveIncident}
            onNew={() => setCreateOpen(true)}
          />
        );
      case "alerts":
        return (
          <AlertsPanel
            incidents={incidents}
            units={units}
            onAssign={openAssign}
            onView={(i) => setDetailInc(i)}
            onResolve={resolveIncident}
          />
        );
      case "patrols":
        return (
          <PatrolsPanel
            units={units}
            incidents={incidents}
            onUpdateUnit={updateUnit}
            showToast={showToast}
          />
        );
      case "tourist":
        return <TouristPanel />;
      case "reports":
        return <ReportsPanel />;
      case "users":
        return <UsersPanel showToast={showToast} userRows={effectiveUserRows} />;
      case "efir":
        return <EFIRPanel showToast={showToast} />;
      case "settings":
        return <SettingsPanel showToast={showToast} />;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="pd">
        {/* Mobile overlay */}
        <div
          className={`pd-mobile-overlay ${mobileOpen ? "visible" : ""}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Sidebar */}
        <nav
          className={`pd-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        >
          <div className="pd-logo">
            <div className="pd-logo-icon">GG</div>
            <div className="pd-logo-text">
              <h2>Geo Guardian</h2>
              <p>Police Operations</p>
            </div>
          </div>

          <div className="pd-nav">
            {navGroups.map((g) => (
              <div key={g.label}>
                <div className="pd-nav-group">{g.label}</div>
                {g.items.map((item) => (
                  <div
                    key={item.key}
                    className={`pd-nav-item ${section === item.key ? "active" : ""}`}
                    onClick={() => {
                      setSection(item.key);
                      setMobileOpen(false);
                    }}
                  >
                    <span className="pd-nav-icon">{item.icon}</span>
                    <span className="pd-nav-label">{item.label}</span>
                    {item.badge > 0 && (
                      <span className="pd-nav-badge">{item.badge}</span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="pd-sidebar-footer">
            <div className="pd-user-card">
              <div className="pd-user-avatar">{userInitials}</div>
              <div className="pd-user-info">
                <strong>{userName || "Officer"}</strong>
                <span>Police Dashboard</span>
              </div>
            </div>
            <button
              className="pd-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
            >
              <span>{collapsed ? <I.ChevR /> : <I.ChevL />}</span>
              {!collapsed && <span>Collapse Sidebar</span>}
            </button>
          </div>
        </nav>

        {/* Topbar */}
        <header className={`pd-topbar ${collapsed ? "collapsed" : ""}`}>
          <div className="pd-topbar-left">
            <button
              className="pd-mobile-btn"
              onClick={() => setMobileOpen((m) => !m)}
            >
              <I.Menu />
            </button>
            <div className="pd-topbar-title">
              <h1>{title}</h1>
              <p>{sub}</p>
            </div>
          </div>
          <div className="pd-topbar-right">
            <div className="pd-search">
              <I.Search />
              <input placeholder="Search incidents, officers…" />
            </div>

            {/* Notifications */}
            <div className="pd-dropdown-wrap">
              <button
                className="pd-icon-btn"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
              >
                <I.Bell />
                {alertCount > 0 && (
                  <span className="pd-badge">{alertCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="pd-dropdown" style={{ minWidth: 280 }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Active Alerts ({alertCount})
                  </div>
                  {incidents
                    .filter((i) => i.status !== "resolved")
                    .slice(0, 3)
                    .map((inc) => (
                      <div
                        key={inc.id}
                        className="pd-dropdown-item"
                        style={{ gap: 10, padding: "12px 16px" }}
                      >
                        <span style={{ fontSize: 18 }}>
                          {typeIcon[inc.type]}
                        </span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            {inc.type} — {inc.location}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {timeAgo(inc.timestamp)} · {inc.severity}
                          </div>
                        </div>
                        <span
                          className={`chip chip-${inc.severity === "Critical" ? "red" : "amber"}`}
                          style={{ fontSize: 10 }}
                        >
                          {inc.severity}
                        </span>
                      </div>
                    ))}
                  {alertCount === 0 && (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--text-2)",
                      }}
                    >
                      🎉 No active alerts
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="pd-dropdown-wrap">
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "6px 12px 6px 6px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  cursor: "pointer",
                  transition: "var(--transition)",
                  fontFamily: "inherit",
                }}
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
              >
                <div
                  className="pd-user-avatar"
                  style={{ width: 30, height: 30, fontSize: 11 }}
                >
                  {userInitials}
                </div>
                <div style={{ textAlign: "left" }}>
                  <strong
                    style={{
                      display: "block",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "var(--text)",
                    }}
                  >
                    {userName || "Officer"}
                  </strong>
                  <span style={{ fontSize: 10, color: "var(--text-2)" }}>
                    Police Officer
                  </span>
                </div>
              </button>
              {profileOpen && (
                <div className="pd-dropdown">
                  <div className="pd-dropdown-item">
                    <I.User /> My Profile
                  </div>
                  <div
                    className="pd-dropdown-item"
                    onClick={() => {
                      setSection("settings");
                      setProfileOpen(false);
                    }}
                  >
                    <I.Settings /> Settings
                  </div>
                  <div className="pd-dropdown-divider" />
                  <button
                    className="pd-dropdown-item danger"
                    onClick={onLogout}
                  >
                    <I.LogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className={`pd-main ${collapsed ? "collapsed" : ""}`}>
          <div
            className="pd-content"
            onClick={() => {
              setProfileOpen(false);
              setNotifOpen(false);
            }}
          >
            {renderSection()}
          </div>
        </main>

        {/* Toast */}
        <div className="pd-toast-wrap">
          {toasts.map((t) => (
            <div key={t.id} className={`pd-toast ${t.type || ""}`}>
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}{" "}
              {t.msg}
            </div>
          ))}
        </div>

        {/* Incident Detail Modal */}
        {detailInc && (
          <div className="pd-overlay" onClick={() => setDetailInc(null)}>
            <div
              className="pd-modal pd-modal-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="pd-modal-header">
                <div>
                  <h2>{typeIcon[detailInc.type]} Incident Detail</h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: "var(--text-2)",
                      marginTop: 2,
                    }}
                  >
                    <span className="mono">{detailInc.id}</span> ·{" "}
                    {timeAgo(detailInc.timestamp)}
                  </p>
                </div>
                <button className="pd-close" onClick={() => setDetailInc(null)}>
                  ✕
                </button>
              </div>
              <div className="pd-modal-body">
                <div className="pd-detail-row">
                  <span className="pd-detail-label">Type</span>
                  <span className="pd-detail-val">{detailInc.type}</span>
                </div>
                <div className="pd-detail-row">
                  <span className="pd-detail-label">Description</span>
                  <span className="pd-detail-val">{detailInc.description}</span>
                </div>
                <div className="pd-detail-row">
                  <span className="pd-detail-label">Location</span>
                  <span className="pd-detail-val">📍 {detailInc.location}</span>
                </div>
                <div className="pd-detail-row">
                  <span className="pd-detail-label">Severity</span>
                  <span className="pd-detail-val">
                    <span className={`sev sev-${detailInc.severity}`}>
                      {detailInc.severity}
                    </span>
                  </span>
                </div>
                <div className="pd-detail-row">
                  <span className="pd-detail-label">Status</span>
                  <span className="pd-detail-val">{detailInc.status}</span>
                </div>
                <div className="pd-detail-row">
                  <span className="pd-detail-label">Assigned Unit</span>
                  <span className="pd-detail-val">
                    {detailInc.assignedUnit ? (
                      <span className="chip chip-blue">
                        {detailInc.assignedUnit}
                      </span>
                    ) : (
                      "Not assigned"
                    )}
                  </span>
                </div>
                {detailInc.lat && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Coordinates</span>
                    <span className="pd-detail-val mono">
                      {detailInc.lat}, {detailInc.lng}
                    </span>
                  </div>
                )}
                {detailInc.responseTimeMin && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Response Time</span>
                    <span className="pd-detail-val">
                      {detailInc.responseTimeMin} minutes
                    </span>
                  </div>
                )}
                {detailInc.complainant && (
                  <div className="pd-detail-row">
                    <span className="pd-detail-label">Complainant</span>
                    <span className="pd-detail-val">
                      {detailInc.complainant}
                    </span>
                  </div>
                )}
              </div>
              <div className="pd-modal-footer">
                {detailInc.status !== "resolved" && (
                  <>
                    <button
                      className="pd-btn pd-btn-secondary"
                      onClick={() => {
                        openAssign(detailInc);
                        setDetailInc(null);
                      }}
                    >
                      Assign Unit
                    </button>
                    <button
                      className="pd-btn pd-btn-primary"
                      onClick={() => resolveIncident(detailInc.id)}
                    >
                      <I.Check /> Mark Resolved
                    </button>
                  </>
                )}
                <button
                  className="pd-btn pd-btn-ghost"
                  onClick={() => setDetailInc(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Unit Modal */}
        {assignOpen && (
          <div className="pd-overlay" onClick={() => setAssignOpen(false)}>
            <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pd-modal-header">
                <h2>Assign Patrol Unit</h2>
                <button
                  className="pd-close"
                  onClick={() => setAssignOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="pd-modal-body">
                {assignTarget && (
                  <div
                    style={{
                      background: "var(--surface-2)",
                      borderRadius: 8,
                      padding: "10px 14px",
                      marginBottom: 16,
                      fontSize: 13,
                    }}
                  >
                    📋 <strong>{assignTarget.id}</strong> — {assignTarget.type}{" "}
                    at {assignTarget.location}
                  </div>
                )}
                <label className="pd-label">Select Available Unit</label>
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 8 }}
                >
                  {units
                    .filter((u) => u.status !== "offline")
                    .map((u) => (
                      <label
                        key={u.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "12px 14px",
                          borderRadius: 8,
                          border: `1px solid ${selectedUnit === u.id ? "var(--saffron)" : "var(--border)"}`,
                          background:
                            selectedUnit === u.id
                              ? "#fff7ed"
                              : "var(--surface)",
                          cursor: "pointer",
                          transition: "var(--transition)",
                        }}
                      >
                        <input
                          type="radio"
                          name="unit"
                          value={u.id}
                          checked={selectedUnit === u.id}
                          onChange={() => setSelectedUnit(u.id)}
                        />
                        <div style={{ flex: 1 }}>
                          <strong style={{ fontSize: 13 }}>
                            {u.callSign} — {u.officer}
                          </strong>
                          <div style={{ fontSize: 11, color: "var(--text-2)" }}>
                            📍 {u.location}
                          </div>
                        </div>
                        <span className={`pd-unit-status us-${u.status}`}>
                          {u.status}
                        </span>
                      </label>
                    ))}
                </div>
              </div>
              <div className="pd-modal-footer">
                <button
                  className="pd-btn pd-btn-secondary"
                  onClick={() => setAssignOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="pd-btn pd-btn-primary"
                  disabled={!selectedUnit}
                  onClick={assignUnit}
                >
                  <I.Shield /> Dispatch Unit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Incident Modal */}
        {createOpen && (
          <div className="pd-overlay" onClick={() => setCreateOpen(false)}>
            <div className="pd-modal" onClick={(e) => e.stopPropagation()}>
              <div className="pd-modal-header">
                <h2>Create New Incident</h2>
                <button
                  className="pd-close"
                  onClick={() => setCreateOpen(false)}
                >
                  ✕
                </button>
              </div>
              <div className="pd-modal-body">
                <div className="pd-row-2">
                  <div className="pd-form-group">
                    <label className="pd-label">Type</label>
                    <select
                      className="pd-input pd-select"
                      value={newInc.type}
                      onChange={(e) =>
                        setNewInc((p) => ({
                          ...p,
                          type: e.target.value as IncidentType,
                        }))
                      }
                    >
                      {[
                        "SOS",
                        "Geo-fence Breach",
                        "Harassment",
                        "Theft",
                        "Blackout",
                        "Medical",
                      ].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </div>
                  <div className="pd-form-group">
                    <label className="pd-label">Severity</label>
                    <select
                      className="pd-input pd-select"
                      value={newInc.severity}
                      onChange={(e) =>
                        setNewInc((p) => ({
                          ...p,
                          severity: e.target.value as Severity,
                        }))
                      }
                    >
                      {["Low", "Medium", "High", "Critical"].map((s) => (
                        <option key={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="pd-form-group">
                  <label className="pd-label">Location *</label>
                  <input
                    className="pd-input"
                    placeholder="e.g. Guwahati, MG Road"
                    value={newInc.location}
                    onChange={(e) =>
                      setNewInc((p) => ({ ...p, location: e.target.value }))
                    }
                  />
                </div>
                <div className="pd-form-group">
                  <label className="pd-label">Description *</label>
                  <textarea
                    className="pd-input pd-textarea"
                    placeholder="Describe the incident…"
                    value={newInc.description}
                    onChange={(e) =>
                      setNewInc((p) => ({ ...p, description: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="pd-modal-footer">
                <button
                  className="pd-btn pd-btn-secondary"
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="pd-btn pd-btn-primary"
                  onClick={createIncident}
                >
                  <I.Plus /> Create Incident
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PoliceDashboard;
