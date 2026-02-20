// AuthorityDashboard.tsx — Full Rebuild
// All sections self-contained. No external section imports required.
// Dependencies: react-router-dom, react-leaflet, leaflet, @mui/material, @mui/icons-material

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Rectangle,
  Marker,
  Popup,
  Circle,
} from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import {
  updateEmergencyAlertStatus,
  type EmergencyAlertRecord,
  type TouristIdentityRecord,
  type UserProfileRecord,
} from "../Services/realtimeDataService";

// Fix leaflet marker icons
import L from "leaflet";
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export type AuthorityDashboardProps = {
  userName: string;
  onLogout: () => void;
};

// ─── TYPES ────────────────────────────────────────────────────────────────────

type Section =
  | "overview"
  | "alerts"
  | "cases"
  | "response"
  | "tourists"
  | "reports"
  | "users"
  | "settings";

type TouristRow = {
  touristId: string;
  createdAt: string;
  fullName: string;
  age: number;
  gender: string;
  country: string;
  address: string;
  passportNo: string;
  visaType: string;
  visaNumber: string;
  documentType: string;
  documentNumber: string;
  phone: string;
  emergencyPhone: string;
  digitalId: string;
  isActive: boolean;
  isVerified: boolean;
  startDate: string;
  endDate: string;
};

type Alert = {
  id: string;
  type: "SOS" | "Complaint" | "Emergency" | "Blackout";
  title: string;
  location: string;
  time: string;
  priority: "Critical" | "High" | "Medium" | "Low";
  status: "Active" | "Acknowledged" | "Resolved";
  sourceCollection?: string;
  docId?: string;
};

type FIR = {
  id: string;
  complainant: string;
  offense: string;
  date: string;
  officer: string;
  status: "Open" | "Under Investigation" | "Closed" | "Filed";
  priority: "High" | "Medium" | "Low";
};

type PatrolUnit = {
  id: string;
  callSign: string;
  officer: string;
  location: string;
  status: "On Duty" | "Responding" | "Available" | "Off Duty";
  lastUpdate: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Officer" | "Supervisor" | "Viewer";
  department: string;
  status: "Active" | "Inactive" | "Suspended";
  lastLogin: string;
};

const formatUiDate = (value: Date | null): string =>
  value
    ? value.toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      })
    : "-";

const formatUiTime = (value: Date | null): string =>
  value
    ? value.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

const mapAlertType = (
  rawType: string,
  triggeredBy: string,
): Alert["type"] => {
  const normalized = (rawType || triggeredBy || "").toLowerCase();
  if (normalized.includes("sos") || normalized.includes("panic")) {
    return "SOS";
  }
  if (normalized.includes("complaint")) {
    return "Complaint";
  }
  if (normalized.includes("blackout") || normalized.includes("light")) {
    return "Blackout";
  }
  return "Emergency";
};

const mapAlertPriority = (severity: string): Alert["priority"] => {
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

const mapAlertStatus = (status: string): Alert["status"] => {
  switch ((status || "").toLowerCase()) {
    case "resolved":
    case "closed":
      return "Resolved";
    case "acknowledged":
    case "assigned":
    case "in_progress":
      return "Acknowledged";
    default:
      return "Active";
  }
};

const mapUserRole = (userType: string): User["role"] => {
  switch ((userType || "").toLowerCase()) {
    case "authority":
      return "Admin";
    case "police":
      return "Officer";
    case "counsellor":
    case "supervisor":
      return "Supervisor";
    default:
      return "Viewer";
  }
};

const mapTouristToRow = (tourist: TouristIdentityRecord): TouristRow => {
  const rawAge = tourist.raw.age;
  const rawGender = tourist.raw.gender;
  const rawVisaType = tourist.raw.visaType;
  const rawVisaNumber = tourist.raw.visaNumber;

  return {
    touristId: tourist.touristId || tourist.digitalId || tourist.id,
    createdAt: formatUiDate(tourist.createdAt),
    fullName: tourist.fullName || "Unknown",
    age: typeof rawAge === "number" ? rawAge : 0,
    gender: typeof rawGender === "string" ? rawGender : "Unknown",
    country: tourist.nationality || "Unknown",
    address: tourist.address || "-",
    passportNo: tourist.documentNumber || "-",
    visaType: typeof rawVisaType === "string" ? rawVisaType : tourist.documentType,
    visaNumber: typeof rawVisaNumber === "string" ? rawVisaNumber : "-",
    documentType: tourist.documentType || "-",
    documentNumber: tourist.documentNumber || "-",
    phone: tourist.phoneNumber || "-",
    emergencyPhone: tourist.emergencyContacts[0] || "-",
    digitalId: tourist.digitalId || tourist.touristId || tourist.id,
    isActive: tourist.isActive,
    isVerified: tourist.isVerified,
    startDate: tourist.itineraryStartDate || formatUiDate(tourist.tripStartDate),
    endDate: tourist.itineraryEndDate || formatUiDate(tourist.tripEndDate),
  };
};

const mapEmergencyAlertToUi = (alert: EmergencyAlertRecord): Alert => ({
  id: alert.alertId || alert.id,
  type: mapAlertType(alert.type, alert.triggeredBy),
  title: alert.title || "Emergency Alert",
  location: alert.address || "Unknown location",
  time: formatUiTime(alert.alertTime || alert.createdAt),
  priority: mapAlertPriority(alert.severity),
  status: mapAlertStatus(alert.status),
  sourceCollection: alert.sourceCollection,
  docId: alert.docId,
});

const mapUserToRow = (user: UserProfileRecord): User => ({
  id: user.userId || user.id,
  name: user.name || "Unknown",
  email: user.email || "-",
  role: mapUserRole(user.userType),
  department:
    (typeof user.raw.department === "string" && user.raw.department) ||
    `${user.userType || "User"} Department`,
  status: user.isActive ? "Active" : "Inactive",
  lastLogin: formatUiDate(user.updatedAt || user.createdAt),
});

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const initialTourists: TouristRow[] = [
  {
    touristId: "GGBC-9f3a1c8e",
    createdAt: "2025-09-20",
    fullName: "John Doe",
    age: 31,
    gender: "Male",
    country: "United Kingdom",
    address: "221B Baker Street, London",
    passportNo: "X1234567",
    visaType: "Tourist",
    visaNumber: "V-998877",
    documentType: "Passport",
    documentNumber: "X1234567",
    phone: "+44-7700-900111",
    emergencyPhone: "+44-7700-900222",
    digitalId: "DGT-1001",
    isActive: true,
    isVerified: true,
    startDate: "2025-09-18",
    endDate: "2025-09-25",
  },
  {
    touristId: "GGBC-7e5d21aa",
    createdAt: "2025-09-15",
    fullName: "Jane Smith",
    age: 28,
    gender: "Female",
    country: "USA",
    address: "742 Evergreen Terrace, Springfield",
    passportNo: "Y7654321",
    visaType: "e-Visa",
    visaNumber: "EV-113355",
    documentType: "ID Card",
    documentNumber: "Y7654321",
    phone: "+1-555-123-4567",
    emergencyPhone: "+1-555-987-6543",
    digitalId: "DGT-1002",
    isActive: true,
    isVerified: false,
    startDate: "2025-09-14",
    endDate: "2025-09-21",
  },
  {
    touristId: "GGBC-3c2b4d9f",
    createdAt: "2025-09-22",
    fullName: "Akira Tanaka",
    age: 45,
    gender: "Male",
    country: "Japan",
    address: "Shibuya, Tokyo",
    passportNo: "JPN-99182",
    visaType: "Business",
    visaNumber: "BV-445566",
    documentType: "Passport",
    documentNumber: "JPN-99182",
    phone: "+81-90-1234-5678",
    emergencyPhone: "+81-90-8765-4321",
    digitalId: "DGT-1003",
    isActive: true,
    isVerified: false,
    startDate: "2025-09-20",
    endDate: "2025-09-30",
  },
];

const initialAlerts: Alert[] = [
  {
    id: "ALT-001",
    type: "SOS",
    title: "Woman distress signal — forest trail",
    location: "Kaziranga, Zone B",
    time: "08:34 AM",
    priority: "Critical",
    status: "Active",
  },
  {
    id: "ALT-002",
    type: "Blackout",
    title: "Streetlight cluster failure",
    location: "MG Road, Guwahati",
    time: "09:12 AM",
    priority: "High",
    status: "Acknowledged",
  },
  {
    id: "ALT-003",
    type: "Complaint",
    title: "Harassment reported near bus stand",
    location: "Pan Bazar, Guwahati",
    time: "10:05 AM",
    priority: "High",
    status: "Active",
  },
  {
    id: "ALT-004",
    type: "Emergency",
    title: "Lone walker unresponsive — 45 min",
    location: "Itanagar Highway",
    time: "11:20 AM",
    priority: "Critical",
    status: "Active",
  },
  {
    id: "ALT-005",
    type: "Complaint",
    title: "Suspicious vehicle near school",
    location: "Dibrugarh Town",
    time: "12:00 PM",
    priority: "Medium",
    status: "Resolved",
  },
  {
    id: "ALT-006",
    type: "SOS",
    title: "Tourist lost — no GPS signal",
    location: "Manas National Park",
    time: "01:30 PM",
    priority: "Critical",
    status: "Acknowledged",
  },
];

const initialFIRs: FIR[] = [
  {
    id: "FIR-2025-001",
    complainant: "Priya Sharma",
    offense: "Molestation (IPC 354)",
    date: "2025-09-20",
    officer: "SI Rahul Das",
    status: "Under Investigation",
    priority: "High",
  },
  {
    id: "FIR-2025-002",
    complainant: "Mohammed Ali",
    offense: "Theft (IPC 379)",
    date: "2025-09-19",
    officer: "SI Kaveri Roy",
    status: "Open",
    priority: "Medium",
  },
  {
    id: "FIR-2025-003",
    complainant: "Sarah Thomas",
    offense: "Cyberstalking (IT Act 66E)",
    date: "2025-09-18",
    officer: "SI Arun Kumar",
    status: "Filed",
    priority: "High",
  },
  {
    id: "FIR-2025-004",
    complainant: "Bikram Singh",
    offense: "Assault (IPC 323)",
    date: "2025-09-17",
    officer: "SI Priya Devi",
    status: "Closed",
    priority: "Low",
  },
];

const patrolUnits: PatrolUnit[] = [
  {
    id: "PU-01",
    callSign: "Alpha-1",
    officer: "SI Rahul Das",
    location: "Guwahati Sector A",
    status: "On Duty",
    lastUpdate: "2 min ago",
  },
  {
    id: "PU-02",
    callSign: "Bravo-3",
    officer: "SI Kaveri Roy",
    location: "Pan Bazar",
    status: "Responding",
    lastUpdate: "5 min ago",
  },
  {
    id: "PU-03",
    callSign: "Charlie-7",
    officer: "SI Arun Kumar",
    location: "Kaziranga Entry",
    status: "Available",
    lastUpdate: "1 min ago",
  },
  {
    id: "PU-04",
    callSign: "Delta-2",
    officer: "SI Ritu Gogoi",
    location: "Depot (Base)",
    status: "Off Duty",
    lastUpdate: "3 hr ago",
  },
];

const systemUsers: User[] = [
  {
    id: "USR-001",
    name: "Anindita Borah",
    email: "anindita@geo.gov.in",
    role: "Admin",
    department: "HQ Operations",
    status: "Active",
    lastLogin: "Today, 08:30",
  },
  {
    id: "USR-002",
    name: "Rajesh Hazarika",
    email: "rajesh@geo.gov.in",
    role: "Supervisor",
    department: "Guwahati Zone",
    status: "Active",
    lastLogin: "Today, 09:15",
  },
  {
    id: "USR-003",
    name: "Simran Kaur",
    email: "simran@geo.gov.in",
    role: "Officer",
    department: "Tourist Safety",
    status: "Active",
    lastLogin: "Yesterday",
  },
  {
    id: "USR-004",
    name: "Devajit Saikia",
    email: "devajit@geo.gov.in",
    role: "Viewer",
    department: "Analytics",
    status: "Inactive",
    lastLogin: "3 days ago",
  },
];

// ─── MAP DATA ─────────────────────────────────────────────────────────────────

const mapCenter: LatLngExpression = [26.2, 92.0];
const heatZones: Array<{
  bounds: LatLngBoundsExpression;
  color: string;
  label: string;
}> = [
  {
    bounds: [
      [26.0, 91.0],
      [27.5, 93.5],
    ],
    color: "#ef4444",
    label: "High Risk",
  },
  {
    bounds: [
      [25.5, 92.5],
      [26.8, 95.0],
    ],
    color: "#f97316",
    label: "Medium Risk",
  },
  {
    bounds: [
      [24.8, 88.2],
      [25.8, 90.4],
    ],
    color: "#eab308",
    label: "Low Risk",
  },
];
const touristMarkers = [
  { pos: [26.9, 94.1] as LatLngExpression, label: "Kaziranga NP", count: 12 },
  { pos: [26.2, 91.7] as LatLngExpression, label: "Guwahati", count: 34 },
  { pos: [27.1, 93.7] as LatLngExpression, label: "Itanagar", count: 8 },
  { pos: [26.5, 90.5] as LatLngExpression, label: "Manas NP", count: 5 },
];

// ─── STYLES ───────────────────────────────────────────────────────────────────

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

  body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

  .dash { display: flex; min-height: 100vh; background: var(--surface-2); color: var(--text); font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

  /* ── SIDEBAR ── */
  .sidebar {
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
  .sidebar.collapsed { width: 64px; }
  .sidebar.mobile-hidden { transform: translateX(-100%); }

  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 16px;
    border-bottom: 1px solid rgba(255,255,255,0.07);
    min-height: var(--topbar-h);
    flex-shrink: 0;
  }
  .sidebar-logo-icon {
    width: 36px; height: 36px;
    border-radius: 10px;
    background: linear-gradient(135deg, #2587c4, #1d6fa4);
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 14px; color: #fff;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(37,135,196,0.4);
  }
  .sidebar-logo-text { overflow: hidden; transition: opacity 0.15s; }
  .sidebar-logo-text h2 { font-size: 14px; font-weight: 800; color: #fff; line-height: 1.2; white-space: nowrap; }
  .sidebar-logo-text p { font-size: 10px; color: rgba(255,255,255,0.45); white-space: nowrap; }
  .sidebar.collapsed .sidebar-logo-text { opacity: 0; pointer-events: none; }

  .sidebar-nav { flex: 1; padding: 12px 8px; overflow-y: auto; overflow-x: hidden; }
  .sidebar-nav::-webkit-scrollbar { width: 3px; }
  .sidebar-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  .nav-section-label {
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: rgba(255,255,255,0.3);
    padding: 16px 12px 6px;
    white-space: nowrap;
    overflow: hidden;
  }
  .sidebar.collapsed .nav-section-label { opacity: 0; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: var(--transition);
    position: relative;
    margin-bottom: 2px;
    overflow: hidden;
    white-space: nowrap;
  }
  .nav-item:hover { background: rgba(255,255,255,0.07); }
  .nav-item.active { background: rgba(37,135,196,0.2); }
  .nav-item.active::before {
    content: '';
    position: absolute;
    left: 0; top: 50%;
    transform: translateY(-50%);
    width: 3px; height: 60%;
    background: var(--blue-2);
    border-radius: 0 3px 3px 0;
  }
  .nav-icon {
    width: 20px; height: 20px;
    flex-shrink: 0;
    color: rgba(255,255,255,0.5);
    transition: color var(--transition);
    display: flex; align-items: center; justify-content: center;
  }
  .nav-item.active .nav-icon, .nav-item:hover .nav-icon { color: #fff; }
  .nav-label {
    font-size: 13.5px;
    font-weight: 600;
    color: rgba(255,255,255,0.6);
    transition: color var(--transition);
    flex: 1;
  }
  .nav-item.active .nav-label, .nav-item:hover .nav-label { color: #fff; }
  .nav-badge {
    background: var(--red);
    color: #fff;
    font-size: 10px;
    font-weight: 700;
    padding: 2px 6px;
    border-radius: 100px;
    flex-shrink: 0;
  }
  .sidebar.collapsed .nav-label,
  .sidebar.collapsed .nav-badge,
  .sidebar.collapsed .nav-section-label { display: none; }

  .sidebar-footer {
    padding: 12px 8px;
    border-top: 1px solid rgba(255,255,255,0.07);
  }
  .sidebar-collapse-btn {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: var(--radius-sm);
    background: none;
    border: none;
    color: rgba(255,255,255,0.45);
    cursor: pointer;
    font-size: 13px;
    font-weight: 600;
    font-family: inherit;
    transition: var(--transition);
    white-space: nowrap;
    overflow: hidden;
  }
  .sidebar-collapse-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.8); }
  .sidebar.collapsed .sidebar-collapse-btn span { display: none; }

  /* ── TOPBAR ── */
  .topbar {
    position: fixed;
    top: 0;
    left: var(--sidebar-w);
    right: 0;
    height: var(--topbar-h);
    background: rgba(255,255,255,0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24px;
    z-index: 100;
    transition: left var(--transition);
  }
  .topbar.sidebar-collapsed { left: 64px; }
  .topbar-left { display: flex; align-items: center; gap: 16px; }
  .topbar-breadcrumb h1 { font-size: 16px; font-weight: 700; color: var(--text); }
  .topbar-breadcrumb p { font-size: 12px; color: var(--text-2); }
  .topbar-right { display: flex; align-items: center; gap: 8px; }

  .topbar-search {
    display: flex;
    align-items: center;
    gap: 8px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    width: 240px;
    transition: var(--transition);
  }
  .topbar-search:focus-within { border-color: var(--blue-2); background: #fff; box-shadow: 0 0 0 3px rgba(37,135,196,0.1); }
  .topbar-search input { border: none; background: none; outline: none; font-size: 13px; color: var(--text); font-family: inherit; width: 100%; }
  .topbar-search input::placeholder { color: var(--text-3); }

  .icon-btn {
    width: 38px; height: 38px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: var(--transition);
    position: relative;
  }
  .icon-btn:hover { background: var(--surface-2); color: var(--blue-2); border-color: var(--blue-2); }
  .icon-btn .badge {
    position: absolute;
    top: -4px; right: -4px;
    background: var(--red);
    color: #fff;
    font-size: 9px;
    font-weight: 800;
    width: 16px; height: 16px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff;
  }

  .avatar-btn {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 6px 12px 6px 6px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    transition: var(--transition);
  }
  .avatar-btn:hover { background: var(--surface-2); }
  .avatar {
    width: 30px; height: 30px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--blue), var(--teal));
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    display: flex; align-items: center; justify-content: center;
  }
  .avatar-info { text-align: left; }
  .avatar-info strong { display: block; font-size: 12px; font-weight: 700; color: var(--text); }
  .avatar-info span { font-size: 10px; color: var(--text-2); }

  /* ── DROPDOWN ── */
  .dropdown-wrap { position: relative; }
  .dropdown {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    min-width: 200px;
    z-index: 300;
    overflow: hidden;
    animation: dropIn 0.15s ease;
  }
  @keyframes dropIn { from { opacity: 0; transform: translateY(-8px) scale(0.97); } to { opacity: 1; transform: none; } }
  .dropdown-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    transition: background 0.15s;
    border: none;
    background: none;
    width: 100%;
    font-family: inherit;
    text-align: left;
  }
  .dropdown-item:hover { background: var(--surface-2); }
  .dropdown-item.danger { color: var(--red); }
  .dropdown-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── MAIN ── */
  .main {
    flex: 1;
    margin-left: var(--sidebar-w);
    padding-top: var(--topbar-h);
    min-height: 100vh;
    transition: margin-left var(--transition);
  }
  .main.sidebar-collapsed { margin-left: 64px; }
  .section-content { padding: 28px 28px; }

  /* ── KPI CARDS ── */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 24px;
  }
  .kpi-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    box-shadow: var(--shadow-sm);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
  }
  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--kpi-color, var(--blue));
  }
  .kpi-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .kpi-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .kpi-icon {
    width: 40px; height: 40px;
    border-radius: 10px;
    background: var(--kpi-bg, var(--blue-light));
    color: var(--kpi-color, var(--blue));
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .kpi-trend {
    font-size: 11px;
    font-weight: 700;
    padding: 3px 8px;
    border-radius: 100px;
  }
  .kpi-trend.up { background: #dcfce7; color: #16a34a; }
  .kpi-trend.down { background: #fee2e2; color: #dc2626; }
  .kpi-trend.neutral { background: var(--surface-3); color: var(--text-2); }
  .kpi-value { font-size: 28px; font-weight: 800; color: var(--text); line-height: 1; margin-bottom: 4px; }
  .kpi-label { font-size: 12px; color: var(--text-2); font-weight: 500; }

  /* ── SECTION HEADER ── */
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .section-title { font-size: 17px; font-weight: 800; color: var(--text); }
  .section-sub { font-size: 12px; color: var(--text-2); margin-top: 2px; }

  /* ── BUTTONS ── */
  .btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    font-family: inherit;
    transition: var(--transition);
    text-decoration: none;
  }
  .btn-primary { background: var(--blue); color: #fff; box-shadow: 0 4px 12px rgba(29,111,164,0.3); }
  .btn-primary:hover { background: var(--blue-2); box-shadow: 0 6px 18px rgba(29,111,164,0.4); transform: translateY(-1px); }
  .btn-secondary { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
  .btn-secondary:hover { background: var(--surface-3); }
  .btn-danger { background: var(--red); color: #fff; }
  .btn-danger:hover { background: #dc2626; }
  .btn-ghost { background: transparent; color: var(--text-2); }
  .btn-ghost:hover { background: var(--surface-2); }
  .btn-sm { padding: 5px 12px; font-size: 12px; }
  .btn-outline { background: transparent; border: 1px solid var(--blue); color: var(--blue); }
  .btn-outline:hover { background: var(--blue-light); }

  /* ── TABLE ── */
  .table-wrap {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .table-scroll { overflow-x: auto; }
  .table-inner { width: 100%; border-collapse: collapse; }
  .table-inner th {
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
    padding: 11px 16px;
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    white-space: nowrap;
  }
  .table-inner td {
    padding: 12px 16px;
    font-size: 13px;
    border-bottom: 1px solid rgba(220,232,240,0.5);
    color: var(--text);
    vertical-align: middle;
    white-space: nowrap;
  }
  .table-inner tr:last-child td { border-bottom: none; }
  .table-inner tbody tr:hover { background: var(--surface-2); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

  /* ── BADGES / CHIPS ── */
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 11px;
    font-weight: 700;
  }
  .chip-green { background: #dcfce7; color: #15803d; }
  .chip-red { background: #fee2e2; color: #dc2626; }
  .chip-amber { background: #fef3c7; color: #d97706; }
  .chip-blue { background: var(--blue-light); color: var(--blue); }
  .chip-purple { background: #ede9fe; color: #7c3aed; }
  .chip-gray { background: var(--surface-3); color: var(--text-2); }

  .priority-dot {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
  }
  .priority-dot::before {
    content: '';
    width: 7px; height: 7px;
    border-radius: 50%;
    flex-shrink: 0;
  }
  .priority-Critical::before { background: var(--red); box-shadow: 0 0 0 3px rgba(239,68,68,0.2); animation: pulseRed 1.5s ease infinite; }
  .priority-High::before { background: var(--saffron); }
  .priority-Medium::before { background: var(--amber); }
  .priority-Low::before { background: var(--green); }
  @keyframes pulseRed { 0%,100%{ box-shadow: 0 0 0 3px rgba(239,68,68,0.2); } 50%{ box-shadow: 0 0 0 5px rgba(239,68,68,0.1); } }

  /* ── CARD GRID ── */
  .card-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .card-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-sm);
  }
  .card-header {
    padding: 16px 20px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .card-header h3 { font-size: 14px; font-weight: 700; color: var(--text); }
  .card-header p { font-size: 11px; color: var(--text-2); margin-top: 2px; }
  .card-body { padding: 20px; }

  /* ── ALERT CARD ── */
  .alert-card {
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    display: flex;
    align-items: flex-start;
    gap: 12px;
    transition: var(--transition);
    margin-bottom: 8px;
  }
  .alert-card:hover { box-shadow: var(--shadow-md); border-color: #bcd4e4; }
  .alert-type-icon {
    width: 36px; height: 36px;
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 16px;
    flex-shrink: 0;
  }
  .alert-card-body { flex: 1; min-width: 0; }
  .alert-card-title { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
  .alert-card-meta { font-size: 11px; color: var(--text-2); display: flex; gap: 10px; flex-wrap: wrap; }
  .alert-card-actions { display: flex; flex-direction: column; gap: 4px; align-items: flex-end; }

  /* ── PATROL UNIT ── */
  .patrol-item {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 16px;
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
  }
  .patrol-item:last-child { border-bottom: none; }
  .patrol-item:hover { background: var(--surface-2); }
  .patrol-callsign {
    width: 44px; height: 44px;
    border-radius: 10px;
    background: var(--navy);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    display: flex; align-items: center; justify-content: center;
    text-align: center;
    flex-shrink: 0;
    line-height: 1.2;
  }

  /* ── STATUS INDICATOR ── */
  .status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 700;
    padding: 3px 9px;
    border-radius: 100px;
  }
  .status-indicator::before {
    content: '';
    width: 6px; height: 6px;
    border-radius: 50%;
  }
  .status-on-duty { background: #dcfce7; color: #15803d; }
  .status-on-duty::before { background: #16a34a; }
  .status-responding { background: #fef3c7; color: #b45309; animation: blinkAmber 1s step-end infinite; }
  .status-responding::before { background: var(--amber); }
  @keyframes blinkAmber { 0%,100%{ opacity:1; } 50%{ opacity:0.5; } }
  .status-available { background: var(--blue-light); color: var(--blue); }
  .status-available::before { background: var(--blue); }
  .status-off-duty { background: var(--surface-3); color: var(--text-2); }
  .status-off-duty::before { background: var(--text-3); }

  /* ── MODAL ── */
  .modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(11,30,53,0.5);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 500;
    padding: 16px;
    animation: fadeIn 0.15s ease;
  }
  @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
  .modal {
    background: var(--surface);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-lg);
    width: 100%;
    max-width: 480px;
    animation: slideUp 0.2s ease;
  }
  @keyframes slideUp { from { opacity:0; transform: translateY(20px) scale(0.98); } to { opacity:1; transform: none; } }
  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .modal-header h2 { font-size: 16px; font-weight: 800; color: var(--text); }
  .modal-body { padding: 24px; }
  .modal-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }
  .close-btn {
    width: 32px; height: 32px;
    border-radius: 8px;
    border: 1px solid var(--border);
    background: var(--surface-2);
    color: var(--text-2);
    font-size: 16px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: var(--transition);
  }
  .close-btn:hover { background: var(--surface-3); color: var(--text); }

  /* ── FORM ELEMENTS ── */
  .form-group { margin-bottom: 16px; }
  .form-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
  .form-input {
    width: 100%;
    padding: 9px 14px;
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 13px;
    color: var(--text);
    background: var(--surface);
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s, box-shadow 0.15s;
  }
  .form-input:focus { border-color: var(--blue-2); box-shadow: 0 0 0 3px rgba(37,135,196,0.1); }
  .form-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%234a5e73' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px; padding-right: 36px; }
  .radio-group { display: flex; flex-direction: column; gap: 8px; }
  .radio-item { display: flex; align-items: center; gap: 10px; cursor: pointer; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border); transition: var(--transition); }
  .radio-item:hover, .radio-item.selected { border-color: var(--blue-2); background: var(--blue-light); }
  .radio-item input { accent-color: var(--blue); }
  .radio-item label { font-size: 13px; font-weight: 600; color: var(--text); cursor: pointer; }

  /* ── UPLOAD ZONE ── */
  .upload-zone {
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    padding: 24px;
    text-align: center;
    cursor: pointer;
    transition: var(--transition);
    background: var(--surface-2);
  }
  .upload-zone:hover, .upload-zone.dragover { border-color: var(--blue-2); background: var(--blue-light); }
  .upload-zone.has-file { border-color: var(--green); background: #f0fdf4; }
  .upload-zone p { font-size: 13px; color: var(--text-2); margin-top: 8px; }
  .upload-icon { font-size: 32px; }

  /* ── SETTINGS PANELS ── */
  .settings-grid { display: grid; grid-template-columns: 240px 1fr; gap: 24px; }
  .settings-nav { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; }
  .settings-nav-item {
    padding: 10px 14px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    color: var(--text-2);
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .settings-nav-item:hover { background: var(--surface-2); color: var(--text); }
  .settings-nav-item.active { background: var(--blue-light); color: var(--blue); }
  .settings-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
  .settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); gap: 24px; }
  .settings-row:last-child { border-bottom: none; }
  .settings-row-info h4 { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
  .settings-row-info p { font-size: 12px; color: var(--text-2); }
  .toggle {
    width: 44px; height: 24px;
    border-radius: 100px;
    background: var(--surface-3);
    border: none;
    cursor: pointer;
    position: relative;
    transition: background 0.2s;
    flex-shrink: 0;
  }
  .toggle::after {
    content: '';
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #fff;
    position: absolute;
    top: 3px; left: 3px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
    transition: transform 0.2s;
  }
  .toggle.on { background: var(--blue); }
  .toggle.on::after { transform: translateX(20px); }

  /* ── REPORTS ── */
  .report-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 20px;
    transition: var(--transition);
    cursor: pointer;
  }
  .report-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .report-icon { font-size: 28px; margin-bottom: 12px; }
  .report-card h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .report-card p { font-size: 12px; color: var(--text-2); line-height: 1.5; }
  .report-card .report-meta { font-size: 11px; color: var(--text-3); margin-top: 12px; display: flex; align-items: center; gap: 6px; }

  /* ── CHART BAR ── */
  .mini-chart { display: flex; align-items: flex-end; gap: 6px; height: 60px; padding-top: 4px; }
  .mini-bar {
    flex: 1;
    background: var(--blue-light);
    border-radius: 4px 4px 0 0;
    transition: var(--transition);
    position: relative;
    cursor: pointer;
    min-width: 12px;
  }
  .mini-bar:hover { background: var(--blue); }
  .mini-bar .bar-tip {
    position: absolute;
    top: -22px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    font-weight: 700;
    color: var(--text-2);
    white-space: nowrap;
  }

  /* ── LIVE INDICATOR ── */
  .live-dot {
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--red);
    animation: livePulse 1.2s ease infinite;
    display: inline-block;
  }
  @keyframes livePulse { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(1.4); } }

  /* ── EMPTY STATE ── */
  .empty-state { text-align: center; padding: 48px 24px; }
  .empty-state .empty-icon { font-size: 40px; margin-bottom: 12px; opacity: 0.4; }
  .empty-state p { font-size: 13px; color: var(--text-2); }

  /* ── TOAST ── */
  .toast-wrap {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .toast {
    background: var(--navy);
    color: #fff;
    padding: 12px 18px;
    border-radius: var(--radius);
    font-size: 13px;
    font-weight: 600;
    box-shadow: var(--shadow-lg);
    display: flex;
    align-items: center;
    gap: 10px;
    animation: toastIn 0.25s ease;
    max-width: 320px;
  }
  .toast.success { background: #15803d; }
  .toast.error { background: #dc2626; }
  @keyframes toastIn { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }

  /* ── MOBILE OVERLAY ── */
  .mobile-overlay {
    display: none;
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.4);
    z-index: 190;
  }
  .mobile-overlay.visible { display: block; }
  .mobile-topbar-btn {
    display: none;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text);
    padding: 6px;
  }

  /* ── RESPONSIVE ── */
  @media (max-width: 1024px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    .card-grid-2, .card-grid-3 { grid-template-columns: 1fr; }
    .settings-grid { grid-template-columns: 1fr; }
    .topbar-search { width: 180px; }
  }
  @media (max-width: 768px) {
    .sidebar { transform: translateX(-100%); width: var(--sidebar-w) !important; }
    .sidebar.mobile-open { transform: none; }
    .topbar { left: 0 !important; padding: 0 16px; }
    .main { margin-left: 0 !important; }
    .mobile-topbar-btn { display: flex; }
    .topbar-search, .avatar-info { display: none; }
    .section-content { padding: 20px 16px; }
    .kpi-grid { grid-template-columns: 1fr 1fr; }
  }
  @media (max-width: 480px) {
    .kpi-grid { grid-template-columns: 1fr; }
  }
`;

// ─── ICONS (inline SVGs, no import needed) ───────────────────────────────────

const Icon = {
  Home: () => (
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
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
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
  File: () => (
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
  MapPin: () => (
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
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
      <circle cx="12" cy="10" r="3" />
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
  ChevronLeft: () => (
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
  ChevronRight: () => (
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
  Upload: () => (
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="16 16 12 12 8 16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
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
  X: () => (
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
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
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
};

// ─── TOAST COMPONENT ──────────────────────────────────────────────────────────

type Toast = { id: number; msg: string; type?: "success" | "error" | "info" };

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3000);
  }, []);
  return { toasts, show };
};

// ─── SECTIONS ────────────────────────────────────────────────────────────────

// ── Overview ──
const OverviewSection: React.FC<{
  showToast: (m: string, t?: Toast["type"]) => void;
  touristRows: TouristRow[];
}> = ({ showToast, touristRows }) => {
  const navigate = useNavigate();
  const [tourists, setTourists] = useState<TouristRow[]>(
    touristRows.length ? touristRows : initialTourists,
  );
  const [search, setSearch] = useState("");
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyTarget, setVerifyTarget] = useState<TouristRow | null>(null);
  const [method, setMethod] = useState<"Biometric" | "Document" | "OTP">(
    "Document",
  );
  const [bioCaptured, setBioCaptured] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  useEffect(() => {
    if (touristRows.length) {
      setTourists(touristRows);
    }
  }, [touristRows]);

  const filtered = tourists.filter(
    (t) =>
      t.fullName.toLowerCase().includes(search.toLowerCase()) ||
      t.touristId.toLowerCase().includes(search.toLowerCase()) ||
      t.passportNo.toLowerCase().includes(search.toLowerCase()),
  );

  const openVerify = (row: TouristRow) => {
    setVerifyTarget(row);
    setMethod("Document");
    setBioCaptured(false);
    setDocFile(null);
    setOtpSent(false);
    setOtpCode("");
    setVerifyOpen(true);
  };

  const canConfirm =
    method === "Biometric"
      ? bioCaptured
      : method === "Document"
        ? !!docFile
        : otpSent && /^\d{6}$/.test(otpCode);

  const confirmVerify = () => {
    if (!verifyTarget || !canConfirm) return;
    setTourists((prev) =>
      prev.map((r) =>
        r.touristId === verifyTarget.touristId ? { ...r, isVerified: true } : r,
      ),
    );
    setVerifyOpen(false);
    showToast(`${verifyTarget.fullName} verified successfully`, "success");
  };

  const kpis = [
    {
      label: "Total Tourists",
      value: tourists.length,
      icon: "🌍",
      color: "#1d6fa4",
      bg: "#e8f4fc",
      trend: "+3 today",
      trendDir: "up",
    },
    {
      label: "Verified",
      value: tourists.filter((t) => t.isVerified).length,
      icon: "✅",
      color: "#0d9488",
      bg: "#ccfbf1",
      trend: "100% rate",
      trendDir: "neutral",
    },
    {
      label: "Unverified",
      value: tourists.filter((t) => !t.isVerified).length,
      icon: "⚠️",
      color: "#d97706",
      bg: "#fef3c7",
      trend: "Needs action",
      trendDir: "down",
    },
    {
      label: "Active Now",
      value: tourists.filter((t) => t.isActive).length,
      icon: "🟢",
      color: "#16a34a",
      bg: "#dcfce7",
      trend: "All safe",
      trendDir: "up",
    },
  ];

  return (
    <div>
      <div className="kpi-grid">
        {kpis.map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ "--kpi-color": k.color, "--kpi-bg": k.bg } as any}
          >
            <div className="kpi-header">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-trend ${k.trendDir}`}>{k.trend}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">Tourist Records</div>
          <div className="section-sub">
            Registered visitors with verification status
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div
            className="topbar-search"
            style={{ width: "auto", flex: "0 0 auto" }}
          >
            <Icon.Search />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, passport…"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/tourist")}
          >
            <Icon.Plus /> Add Tourist
          </button>
        </div>
      </div>

      <div className="table-wrap" style={{ marginBottom: 24 }}>
        <div className="table-scroll">
          <table className="table-inner" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                {[
                  "Tourist ID",
                  "Full Name",
                  "Country",
                  "Passport",
                  "Phone",
                  "Doc Type",
                  "Visit Period",
                  "Active",
                  "Status",
                  "Actions",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.touristId}>
                  <td>
                    <span className="mono">{u.touristId}</span>
                  </td>
                  <td>
                    <strong>{u.fullName}</strong>
                    <br />
                    <span style={{ fontSize: 11, color: "var(--text-2)" }}>
                      {u.gender}, {u.age} · {u.digitalId}
                    </span>
                  </td>
                  <td>{u.country}</td>
                  <td>
                    <span className="mono">{u.passportNo}</span>
                  </td>
                  <td>{u.phone}</td>
                  <td>{u.documentType}</td>
                  <td style={{ fontSize: 12 }}>
                    {u.startDate}
                    <br />
                    <span style={{ color: "var(--text-2)" }}>
                      → {u.endDate}
                    </span>
                  </td>
                  <td>
                    {u.isActive ? (
                      <span className="chip chip-green">Yes</span>
                    ) : (
                      <span className="chip chip-gray">No</span>
                    )}
                  </td>
                  <td>
                    {u.isVerified ? (
                      <span className="chip chip-green">✓ Verified</span>
                    ) : (
                      <span className="chip chip-amber">⏳ Pending</span>
                    )}
                  </td>
                  <td>
                    {!u.isVerified && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openVerify(u)}
                      >
                        Verify
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state">
                      <div className="empty-icon">🔍</div>
                      <p>No records match your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3>📍 Live Heat Map — Northeast India</h3>
            <p>Real-time activity zones and tourist locations</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot" />
            <span
              style={{ fontSize: 12, color: "var(--text-2)", fontWeight: 600 }}
            >
              LIVE
            </span>
          </div>
        </div>
        <div style={{ height: 380 }}>
          <MapContainer
            center={mapCenter}
            zoom={6}
            style={{ height: "100%", width: "100%" }}
            scrollWheelZoom={false}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="© OpenStreetMap contributors"
            />
            {heatZones.map((z, i) => (
              <Rectangle
                key={i}
                bounds={z.bounds}
                pathOptions={{ color: z.color, weight: 2, fillOpacity: 0.12 }}
              >
                <Popup>{z.label} Risk Zone</Popup>
              </Rectangle>
            ))}
            {touristMarkers.map((m, i) => (
              <Marker key={i} position={m.pos}>
                <Popup>
                  <strong>{m.label}</strong>
                  <br />
                  {m.count} tourists active
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: "12px 20px",
            borderTop: "1px solid var(--border)",
            flexWrap: "wrap",
          }}
        >
          {heatZones.map((z, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                color: "var(--text-2)",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 3,
                  background: z.color,
                  flexShrink: 0,
                }}
              />
              {z.label} Risk
            </div>
          ))}
        </div>
      </div>

      {/* Verify Modal */}
      {verifyOpen && verifyTarget && (
        <div className="modal-overlay" onClick={() => setVerifyOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>Verify Tourist</h2>
                <p
                  style={{ fontSize: 13, color: "var(--text-2)", marginTop: 2 }}
                >
                  {verifyTarget.fullName} · {verifyTarget.touristId}
                </p>
              </div>
              <button
                className="close-btn"
                onClick={() => setVerifyOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Verification Method</label>
                <div className="radio-group">
                  {(["Document", "Biometric", "OTP"] as const).map((m) => (
                    <label
                      key={m}
                      className={`radio-item ${method === m ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="method"
                        value={m}
                        checked={method === m}
                        onChange={() => {
                          setMethod(m);
                          setBioCaptured(false);
                          setDocFile(null);
                          setOtpSent(false);
                          setOtpCode("");
                        }}
                      />
                      <label>
                        {m === "Document"
                          ? "📄 Document Scan (Passport/Visa)"
                          : m === "Biometric"
                            ? "🤚 Biometric (Face/Fingerprint)"
                            : "📱 OTP (Phone/Email)"}
                      </label>
                    </label>
                  ))}
                </div>
              </div>

              {method === "Document" && (
                <div>
                  <label className="form-label">Upload Document</label>
                  <label
                    className={`upload-zone ${docFile ? "has-file" : ""}`}
                    style={{ display: "block", cursor: "pointer" }}
                  >
                    <input
                      type="file"
                      hidden
                      accept="image/*,.pdf"
                      onChange={(e) => setDocFile(e.target.files?.[0] || null)}
                    />
                    <div className="upload-icon">
                      <Icon.Upload />
                    </div>
                    {docFile ? (
                      <p style={{ color: "var(--green)", fontWeight: 700 }}>
                        ✓ {docFile.name}
                      </p>
                    ) : (
                      <p>
                        Click to upload passport or visa scan
                        <br />
                        <span style={{ fontSize: 11 }}>
                          PNG, JPG or PDF accepted
                        </span>
                      </p>
                    )}
                  </label>
                </div>
              )}

              {method === "Biometric" && (
                <div>
                  <label className="form-label">Biometric Capture</label>
                  <div
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius)",
                      padding: 20,
                      textAlign: "center",
                      background: "var(--surface-2)",
                    }}
                  >
                    <div style={{ fontSize: 40, marginBottom: 12 }}>
                      {bioCaptured ? "✅" : "🤚"}
                    </div>
                    <p
                      style={{
                        fontSize: 13,
                        color: "var(--text-2)",
                        marginBottom: 16,
                      }}
                    >
                      {bioCaptured
                        ? "Biometric data captured successfully"
                        : "Place finger or align face for capture"}
                    </p>
                    {!bioCaptured && (
                      <button
                        className="btn btn-primary"
                        onClick={() => setBioCaptured(true)}
                      >
                        Capture Biometric
                      </button>
                    )}
                  </div>
                </div>
              )}

              {method === "OTP" && (
                <div>
                  <label className="form-label">Send OTP To</label>
                  <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                    <input
                      className="form-input"
                      defaultValue={verifyTarget.phone}
                      style={{ flex: 1 }}
                    />
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        setOtpSent(true);
                        showToast("OTP sent to " + verifyTarget.phone);
                      }}
                    >
                      Send OTP
                    </button>
                  </div>
                  {otpSent && (
                    <div className="form-group">
                      <label className="form-label">Enter 6-digit OTP</label>
                      <input
                        className="form-input mono"
                        placeholder="000000"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) =>
                          setOtpCode(e.target.value.replace(/\D/g, ""))
                        }
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setVerifyOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                disabled={!canConfirm}
                onClick={confirmVerify}
                style={{ opacity: canConfirm ? 1 : 0.5 }}
              >
                <Icon.Check /> Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Alert Management ──
const AlertManagementSection: React.FC<{
  showToast: (m: string, t?: Toast["type"]) => void;
  alertRows: Alert[];
}> = ({ showToast, alertRows }) => {
  const [alerts, setAlerts] = useState<Alert[]>(
    alertRows.length ? alertRows : initialAlerts,
  );
  const [filter, setFilter] = useState<"All" | Alert["type"]>("All");
  const [priorityFilter, setPriorityFilter] = useState<
    "All" | Alert["priority"]
  >("All");

  useEffect(() => {
    if (alertRows.length) {
      setAlerts(alertRows);
    }
  }, [alertRows]);

  const filtered = alerts.filter(
    (a) =>
      (filter === "All" || a.type === filter) &&
      (priorityFilter === "All" || a.priority === priorityFilter),
  );

  const acknowledge = async (id: string) => {
    const target = alerts.find((a) => a.id === id);
    setAlerts((p) =>
      p.map((a) => (a.id === id ? { ...a, status: "Acknowledged" } : a)),
    );
    if (target?.sourceCollection && target.docId) {
      try {
        await updateEmergencyAlertStatus(
          {
            sourceCollection: target.sourceCollection,
            docId: target.docId,
          },
          "acknowledged",
        );
      } catch (error) {
        console.error("Failed to update alert status:", error);
      }
    }
    showToast("Alert acknowledged", "success");
  };
  const resolve = async (id: string) => {
    const target = alerts.find((a) => a.id === id);
    setAlerts((p) =>
      p.map((a) => (a.id === id ? { ...a, status: "Resolved" } : a)),
    );
    if (target?.sourceCollection && target.docId) {
      try {
        await updateEmergencyAlertStatus(
          {
            sourceCollection: target.sourceCollection,
            docId: target.docId,
          },
          "resolved",
        );
      } catch (error) {
        console.error("Failed to update alert status:", error);
      }
    }
    showToast("Alert resolved", "success");
  };

  const typeIcon: Record<Alert["type"], string> = {
    SOS: "🆘",
    Complaint: "📋",
    Emergency: "🚨",
    Blackout: "💡",
  };
  const typeBg: Record<Alert["type"], string> = {
    SOS: "#fee2e2",
    Complaint: "#fef3c7",
    Emergency: "#ede9fe",
    Blackout: "#dbeafe",
  };

  const criticalCount = alerts.filter(
    (a) => a.priority === "Critical" && a.status === "Active",
  ).length;

  return (
    <div>
      <div className="kpi-grid">
        {[
          {
            label: "Active Alerts",
            value: alerts.filter((a) => a.status === "Active").length,
            icon: "🔔",
            color: "#dc2626",
            bg: "#fee2e2",
            trend: criticalCount + " critical",
            trendDir: criticalCount > 0 ? "down" : "up",
          },
          {
            label: "SOS Signals",
            value: alerts.filter((a) => a.type === "SOS").length,
            icon: "🆘",
            color: "#dc2626",
            bg: "#fee2e2",
            trend: "Immediate",
            trendDir: "down",
          },
          {
            label: "Acknowledged",
            value: alerts.filter((a) => a.status === "Acknowledged").length,
            icon: "👁️",
            color: "#d97706",
            bg: "#fef3c7",
            trend: "In progress",
            trendDir: "neutral",
          },
          {
            label: "Resolved Today",
            value: alerts.filter((a) => a.status === "Resolved").length,
            icon: "✅",
            color: "#16a34a",
            bg: "#dcfce7",
            trend: "Good work",
            trendDir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ "--kpi-color": k.color, "--kpi-bg": k.bg } as any}
          >
            <div className="kpi-header">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-trend ${k.trendDir}`}>{k.trend}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">Alert Feed</div>
          <div className="section-sub">
            Real-time incidents requiring attention
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {(["All", "SOS", "Complaint", "Emergency", "Blackout"] as const).map(
            (f) => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? "btn-primary" : "btn-secondary"}`}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ),
          )}
          <select
            className="form-input form-select"
            style={{ padding: "5px 32px 5px 12px", fontSize: 12, height: 32 }}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            {["All", "Critical", "High", "Medium", "Low"].map((p) => (
              <option key={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        {filtered.map((alert) => (
          <div key={alert.id} className="alert-card">
            <div
              className="alert-type-icon"
              style={{ background: typeBg[alert.type] }}
            >
              {typeIcon[alert.type]}
            </div>
            <div className="alert-card-body">
              <div className="alert-card-title">{alert.title}</div>
              <div className="alert-card-meta">
                <span>📍 {alert.location}</span>
                <span>🕐 {alert.time}</span>
                <span className={`priority-dot priority-${alert.priority}`}>
                  {alert.priority}
                </span>
                <span className="mono" style={{ color: "var(--text-3)" }}>
                  {alert.id}
                </span>
              </div>
            </div>
            <div className="alert-card-actions">
              {alert.status === "Active" ? (
                <>
                  <span className="chip chip-red">● Active</span>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => acknowledge(alert.id)}
                    >
                      Acknowledge
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => resolve(alert.id)}
                    >
                      Resolve
                    </button>
                  </div>
                </>
              ) : alert.status === "Acknowledged" ? (
                <>
                  <span className="chip chip-amber">👁️ Acknowledged</span>
                  <button
                    className="btn btn-sm btn-primary"
                    style={{ marginTop: 4 }}
                    onClick={() => resolve(alert.id)}
                  >
                    Mark Resolved
                  </button>
                </>
              ) : (
                <span className="chip chip-green">✓ Resolved</span>
              )}
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <p>No alerts for this filter. All clear!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Case / FIR ──
const CaseFIRSection: React.FC<{
  showToast: (m: string, t?: Toast["type"]) => void;
}> = ({ showToast }) => {
  const [firs, setFirs] = useState<FIR[]>(initialFIRs);
  const [addOpen, setAddOpen] = useState(false);
  const [newFir, setNewFir] = useState({
    complainant: "",
    offense: "",
    officer: "",
    priority: "Medium",
  });

  const updateStatus = (id: string, status: FIR["status"]) => {
    setFirs((p) => p.map((f) => (f.id === id ? { ...f, status } : f)));
    showToast("FIR status updated to " + status, "success");
  };

  const addFir = () => {
    if (!newFir.complainant || !newFir.offense) {
      showToast("Fill required fields", "error");
      return;
    }
    const id = `FIR-2025-${String(firs.length + 5).padStart(3, "0")}`;
    setFirs((p) => [
      ...p,
      {
        id,
        ...newFir,
        date: new Date().toISOString().split("T")[0],
        status: "Open",
        priority: newFir.priority as FIR["priority"],
      },
    ]);
    setAddOpen(false);
    setNewFir({
      complainant: "",
      offense: "",
      officer: "",
      priority: "Medium",
    });
    showToast("FIR " + id + " filed successfully", "success");
  };

  const statusChip: Record<FIR["status"], string> = {
    Open: "chip chip-red",
    "Under Investigation": "chip chip-amber",
    Filed: "chip chip-blue",
    Closed: "chip chip-green",
  };

  return (
    <div>
      <div className="kpi-grid">
        {(
          [
            {
              label: "Total FIRs",
              value: firs.length,
              icon: "📁",
              color: "#1d6fa4",
              bg: "#e8f4fc",
              trend: "All time",
              trendDir: "neutral",
            },
            {
              label: "Open",
              value: firs.filter((f) => f.status === "Open").length,
              icon: "🔓",
              color: "#dc2626",
              bg: "#fee2e2",
              trend: "Needs attention",
              trendDir: "down",
            },
            {
              label: "Under Investigation",
              value: firs.filter((f) => f.status === "Under Investigation")
                .length,
              icon: "🔍",
              color: "#d97706",
              bg: "#fef3c7",
              trend: "In progress",
              trendDir: "neutral",
            },
            {
              label: "Closed",
              value: firs.filter((f) => f.status === "Closed").length,
              icon: "✅",
              color: "#16a34a",
              bg: "#dcfce7",
              trend: "Resolved",
              trendDir: "up",
            },
          ] as const
        ).map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ "--kpi-color": k.color, "--kpi-bg": k.bg } as any}
          >
            <div className="kpi-header">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-trend ${k.trendDir}`}>{k.trend}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">FIR & Case Management</div>
          <div className="section-sub">
            Blockchain-secured complaint records
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-secondary">
            <Icon.Download /> Export
          </button>
          <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
            <Icon.Plus /> New FIR
          </button>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table-inner" style={{ minWidth: 700 }}>
            <thead>
              <tr>
                {[
                  "FIR ID",
                  "Complainant",
                  "Offense",
                  "Date Filed",
                  "Officer",
                  "Priority",
                  "Status",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {firs.map((f) => (
                <tr key={f.id}>
                  <td>
                    <span className="mono">{f.id}</span>
                  </td>
                  <td>
                    <strong>{f.complainant}</strong>
                  </td>
                  <td
                    style={{
                      maxWidth: 200,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {f.offense}
                  </td>
                  <td>{f.date}</td>
                  <td>{f.officer}</td>
                  <td>
                    <span className={`priority-dot priority-${f.priority}`}>
                      {f.priority}
                    </span>
                  </td>
                  <td>
                    <span className={statusChip[f.status]}>{f.status}</span>
                  </td>
                  <td>
                    <select
                      className="form-input form-select"
                      style={{
                        padding: "4px 28px 4px 10px",
                        fontSize: 12,
                        height: 28,
                      }}
                      value={f.status}
                      onChange={(e) =>
                        updateStatus(f.id, e.target.value as FIR["status"])
                      }
                    >
                      {["Open", "Under Investigation", "Filed", "Closed"].map(
                        (s) => (
                          <option key={s}>{s}</option>
                        ),
                      )}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>File New FIR</h2>
              <button className="close-btn" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Complainant Name *</label>
                <input
                  className="form-input"
                  placeholder="Full name"
                  value={newFir.complainant}
                  onChange={(e) =>
                    setNewFir((p) => ({ ...p, complainant: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Offense / IPC Section *</label>
                <input
                  className="form-input"
                  placeholder="e.g. Theft (IPC 379)"
                  value={newFir.offense}
                  onChange={(e) =>
                    setNewFir((p) => ({ ...p, offense: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Officer</label>
                <input
                  className="form-input"
                  placeholder="Officer name"
                  value={newFir.officer}
                  onChange={(e) =>
                    setNewFir((p) => ({ ...p, officer: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input form-select"
                  value={newFir.priority}
                  onChange={(e) =>
                    setNewFir((p) => ({ ...p, priority: e.target.value }))
                  }
                >
                  {["High", "Medium", "Low"].map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addFir}>
                File FIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Emergency Response ──
const EmergencyResponseSection: React.FC<{
  showToast: (m: string, t?: Toast["type"]) => void;
}> = ({ showToast }) => {
  const [units, setUnits] = useState<PatrolUnit[]>(patrolUnits);

  const dispatch = (id: string) => {
    setUnits((p) =>
      p.map((u) =>
        u.id === id
          ? { ...u, status: "Responding", lastUpdate: "Just now" }
          : u,
      ),
    );
    showToast("Unit dispatched to incident", "success");
  };

  const statusClass: Record<PatrolUnit["status"], string> = {
    "On Duty": "status-indicator status-on-duty",
    Responding: "status-indicator status-responding",
    Available: "status-indicator status-available",
    "Off Duty": "status-indicator status-off-duty",
  };

  return (
    <div>
      <div className="kpi-grid">
        {[
          {
            label: "Units On Duty",
            value: units.filter((u) => u.status !== "Off Duty").length,
            icon: "🚔",
            color: "#1d6fa4",
            bg: "#e8f4fc",
            trend: "Active",
            trendDir: "up",
          },
          {
            label: "Responding",
            value: units.filter((u) => u.status === "Responding").length,
            icon: "🚨",
            color: "#dc2626",
            bg: "#fee2e2",
            trend: "Urgent",
            trendDir: "down",
          },
          {
            label: "Available",
            value: units.filter((u) => u.status === "Available").length,
            icon: "✅",
            color: "#16a34a",
            bg: "#dcfce7",
            trend: "Ready",
            trendDir: "up",
          },
          {
            label: "Off Duty",
            value: units.filter((u) => u.status === "Off Duty").length,
            icon: "🌙",
            color: "#6b7280",
            bg: "#f3f4f6",
            trend: "Resting",
            trendDir: "neutral",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ "--kpi-color": k.color, "--kpi-bg": k.bg } as any}
          >
            <div className="kpi-header">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-trend ${k.trendDir}`}>{k.trend}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="card-grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>🚔 Patrol Units</h3>
              <p>Field deployment status</p>
            </div>
            <button
              className="btn btn-sm btn-secondary"
              onClick={() => showToast("Refreshing unit data…")}
            >
              <Icon.Refresh />
            </button>
          </div>
          {units.map((u) => (
            <div key={u.id} className="patrol-item">
              <div className="patrol-callsign">
                {u.callSign.split("-").join("\n")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 3 }}>
                  {u.officer}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-2)",
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                  }}
                >
                  <span>📍 {u.location}</span>
                  <span style={{ color: "var(--text-3)" }}>
                    ⏱ {u.lastUpdate}
                  </span>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                  gap: 6,
                }}
              >
                <span className={statusClass[u.status]}>{u.status}</span>
                {u.status === "Available" && (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => dispatch(u.id)}
                  >
                    Dispatch
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>🗺️ Deployment Map</h3>
              <p>Live unit positions</p>
            </div>
          </div>
          <div style={{ height: 340 }}>
            <MapContainer
              center={mapCenter}
              zoom={6}
              style={{ height: "100%", width: "100%" }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="© OpenStreetMap contributors"
              />
              {touristMarkers.map((m, i) => (
                <Circle
                  key={i}
                  center={m.pos}
                  radius={20000}
                  pathOptions={{ color: "#1d6fa4", fillOpacity: 0.1 }}
                >
                  <Popup>
                    {m.label}
                    <br />
                    Patrol coverage area
                  </Popup>
                </Circle>
              ))}
              {touristMarkers.map((m, i) => (
                <Marker key={i} position={m.pos}>
                  <Popup>
                    Unit {patrolUnits[i % patrolUnits.length]?.callSign || "–"}
                    <br />
                    {m.label}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Tourist Monitoring ──
const TouristMonitoringSection: React.FC = () => {
  const safetyZones = [
    {
      name: "Kaziranga NP Zone A",
      risk: "Low",
      tourists: 12,
      status: "Safe",
      lastCheck: "2 min ago",
    },
    {
      name: "Manas NP Trail 3",
      risk: "High",
      tourists: 3,
      status: "Alert",
      lastCheck: "5 min ago",
    },
    {
      name: "Guwahati City Centre",
      risk: "Medium",
      tourists: 34,
      status: "Monitor",
      lastCheck: "1 min ago",
    },
    {
      name: "Itanagar Highway",
      risk: "High",
      tourists: 2,
      status: "Alert",
      lastCheck: "8 min ago",
    },
    {
      name: "Majuli Island Route",
      risk: "Low",
      tourists: 9,
      status: "Safe",
      lastCheck: "3 min ago",
    },
  ];

  return (
    <div>
      <div className="kpi-grid">
        {[
          {
            label: "Tourist Zones",
            value: safetyZones.length,
            icon: "🗺️",
            color: "#1d6fa4",
            bg: "#e8f4fc",
            trend: "Monitored",
            trendDir: "up",
          },
          {
            label: "Total Tourists",
            value: safetyZones.reduce((s, z) => s + z.tourists, 0),
            icon: "👥",
            color: "#0d9488",
            bg: "#ccfbf1",
            trend: "Active",
            trendDir: "up",
          },
          {
            label: "Alert Zones",
            value: safetyZones.filter((z) => z.status === "Alert").length,
            icon: "⚠️",
            color: "#dc2626",
            bg: "#fee2e2",
            trend: "Action needed",
            trendDir: "down",
          },
          {
            label: "Safe Zones",
            value: safetyZones.filter((z) => z.status === "Safe").length,
            icon: "🛡️",
            color: "#16a34a",
            bg: "#dcfce7",
            trend: "Secure",
            trendDir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ "--kpi-color": k.color, "--kpi-bg": k.bg } as any}
          >
            <div className="kpi-header">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-trend ${k.trendDir}`}>{k.trend}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">Zone Safety Monitor</div>
          <div className="section-sub">
            Real-time tourist zone risk assessment
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="live-dot" />
          <span
            style={{ fontSize: 12, fontWeight: 700, color: "var(--text-2)" }}
          >
            LIVE TRACKING
          </span>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table-inner">
            <thead>
              <tr>
                {[
                  "Zone Name",
                  "Risk Level",
                  "Active Tourists",
                  "Status",
                  "Last Check",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {safetyZones.map((z, i) => (
                <tr key={i}>
                  <td>
                    <strong>{z.name}</strong>
                  </td>
                  <td>
                    <span
                      className={`priority-dot priority-${z.risk === "High" ? "Critical" : z.risk === "Medium" ? "Medium" : "Low"}`}
                    >
                      {z.risk}
                    </span>
                  </td>
                  <td>{z.tourists} tourists</td>
                  <td>
                    {z.status === "Alert" ? (
                      <span className="chip chip-red">🔴 Alert</span>
                    ) : z.status === "Monitor" ? (
                      <span className="chip chip-amber">🟡 Monitor</span>
                    ) : (
                      <span className="chip chip-green">🟢 Safe</span>
                    )}
                  </td>
                  <td style={{ color: "var(--text-2)", fontSize: 12 }}>
                    {z.lastCheck}
                  </td>
                  <td>
                    <button className="btn btn-sm btn-outline">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// ── Reports & Analytics ──
const ReportsSection: React.FC = () => {
  const weeks = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];
  const alertData = [12, 19, 8, 24, 16, 31, 14];
  const maxVal = Math.max(...alertData);

  const reports = [
    {
      icon: "📊",
      title: "Monthly Safety Report",
      desc: "Complete overview of incidents, resolutions, and trends for September 2025.",
      meta: "Updated 2h ago · PDF · 4.2MB",
    },
    {
      icon: "🗺️",
      title: "Zone Risk Assessment",
      desc: "Heat map analysis of high-risk areas across NE India with patrol recommendations.",
      meta: "Updated 6h ago · PDF · 2.1MB",
    },
    {
      icon: "🚨",
      title: "SOS & Emergency Log",
      desc: "All SOS activations with response times and outcome tracking.",
      meta: "Updated 1h ago · CSV · 0.8MB",
    },
    {
      icon: "👥",
      title: "Tourist Safety Summary",
      desc: "Verification rates, zone activity, and incident breakdown by tourist type.",
      meta: "Updated daily · PDF · 1.5MB",
    },
    {
      icon: "📱",
      title: "App Usage Analytics",
      desc: "Active users, feature adoption, and alert submission patterns.",
      meta: "Updated 3h ago · PDF · 2.8MB",
    },
    {
      icon: "⚖️",
      title: "FIR Status Report",
      desc: "Case closure rates, pending FIRs, and officer performance metrics.",
      meta: "Updated 4h ago · PDF · 1.2MB",
    },
  ];

  return (
    <div>
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <div>
            <h3>📈 Weekly Alert Trend</h3>
            <p>Last 7 weeks · Total incidents logged</p>
          </div>
          <button className="btn btn-sm btn-secondary">
            <Icon.Download /> Export CSV
          </button>
        </div>
        <div className="card-body">
          <div className="mini-chart">
            {alertData.map((v, i) => (
              <div
                key={i}
                className="mini-bar"
                style={{ height: `${(v / maxVal) * 100}%` }}
              >
                <span className="bar-tip">{v}</span>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 0, marginTop: 8 }}>
            {weeks.map((w, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  textAlign: "center",
                  fontSize: 10,
                  color: "var(--text-3)",
                  fontWeight: 600,
                }}
              >
                {w}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">Available Reports</div>
          <div className="section-sub">Download or view detailed analytics</div>
        </div>
      </div>

      <div className="card-grid-3">
        {reports.map((r, i) => (
          <div key={i} className="report-card">
            <div className="report-icon">{r.icon}</div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div className="report-meta">📄 {r.meta}</div>
            <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
              <button className="btn btn-sm btn-outline">View</button>
              <button className="btn btn-sm btn-secondary">
                <Icon.Download /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── User Management ──
const UserManagementSection: React.FC<{
  showToast: (m: string, t?: Toast["type"]) => void;
  userRows: User[];
}> = ({ showToast, userRows }) => {
  const [users, setUsers] = useState(userRows.length ? userRows : systemUsers);
  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "Officer",
    department: "",
  });

  useEffect(() => {
    if (userRows.length) {
      setUsers(userRows);
    }
  }, [userRows]);

  const addUser = () => {
    if (!newUser.name || !newUser.email) {
      showToast("Fill required fields", "error");
      return;
    }
    setUsers((p) => [
      ...p,
      {
        id: `USR-${String(p.length + 1).padStart(3, "0")}`,
        ...newUser,
        role: newUser.role as User["role"],
        status: "Active",
        lastLogin: "Never",
      },
    ]);
    setAddOpen(false);
    setNewUser({ name: "", email: "", role: "Officer", department: "" });
    showToast("User created successfully", "success");
  };

  const toggleStatus = (id: string) => {
    setUsers((p) =>
      p.map((u) =>
        u.id === id
          ? { ...u, status: u.status === "Active" ? "Inactive" : "Active" }
          : u,
      ),
    );
  };

  const roleChip: Record<User["role"], string> = {
    Admin: "chip chip-red",
    Supervisor: "chip chip-purple",
    Officer: "chip chip-blue",
    Viewer: "chip chip-gray",
  };

  return (
    <div>
      <div className="kpi-grid">
        {[
          {
            label: "Total Users",
            value: users.length,
            icon: "👥",
            color: "#1d6fa4",
            bg: "#e8f4fc",
            trend: "All roles",
            trendDir: "neutral",
          },
          {
            label: "Active",
            value: users.filter((u) => u.status === "Active").length,
            icon: "✅",
            color: "#16a34a",
            bg: "#dcfce7",
            trend: "Online",
            trendDir: "up",
          },
          {
            label: "Admins",
            value: users.filter((u) => u.role === "Admin").length,
            icon: "👑",
            color: "#dc2626",
            bg: "#fee2e2",
            trend: "Full access",
            trendDir: "neutral",
          },
          {
            label: "Officers",
            value: users.filter((u) => u.role === "Officer").length,
            icon: "🛡️",
            color: "#7c3aed",
            bg: "#ede9fe",
            trend: "Field",
            trendDir: "neutral",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="kpi-card"
            style={{ "--kpi-color": k.color, "--kpi-bg": k.bg } as any}
          >
            <div className="kpi-header">
              <div className="kpi-icon">{k.icon}</div>
              <span className={`kpi-trend ${k.trendDir}`}>{k.trend}</span>
            </div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="section-header">
        <div>
          <div className="section-title">System Users</div>
          <div className="section-sub">Role-based access control</div>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Icon.Plus /> Add User
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-scroll">
          <table className="table-inner" style={{ minWidth: 600 }}>
            <thead>
              <tr>
                {[
                  "User",
                  "Email",
                  "Role",
                  "Department",
                  "Last Login",
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
                      style={{ fontSize: 11, color: "var(--text-3)" }}
                    >
                      {u.id}
                    </span>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={roleChip[u.role]}>{u.role}</span>
                  </td>
                  <td>{u.department}</td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {u.lastLogin}
                  </td>
                  <td>
                    {u.status === "Active" ? (
                      <span className="chip chip-green">Active</span>
                    ) : (
                      <span className="chip chip-gray">Inactive</span>
                    )}
                  </td>
                  <td>
                    <button
                      className="btn btn-sm btn-ghost"
                      onClick={() => toggleStatus(u.id)}
                    >
                      {u.status === "Active" ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addOpen && (
        <div className="modal-overlay" onClick={() => setAddOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New User</h2>
              <button className="close-btn" onClick={() => setAddOpen(false)}>
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input
                  className="form-input"
                  placeholder="Name"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="user@geo.gov.in"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-input form-select"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, role: e.target.value }))
                  }
                >
                  {["Admin", "Supervisor", "Officer", "Viewer"].map((r) => (
                    <option key={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  className="form-input"
                  placeholder="Department name"
                  value={newUser.department}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, department: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addUser}>
                Create User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Settings ──
const SettingsSection: React.FC<{
  showToast: (m: string, t?: Toast["type"]) => void;
}> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState("notifications");
  const [toggles, setToggles] = useState({
    sos_alerts: true,
    email_notify: true,
    sms_notify: false,
    auto_dispatch: true,
    dark_mode: false,
    two_fa: true,
    analytics: true,
    maintenance: false,
  });

  const toggle = (key: keyof typeof toggles) => {
    setToggles((p) => ({ ...p, [key]: !p[key] }));
    showToast("Setting updated", "success");
  };

  const tabs = [
    { id: "notifications", label: "🔔 Notifications" },
    { id: "security", label: "🔒 Security" },
    { id: "system", label: "⚙️ System" },
    { id: "integrations", label: "🔗 Integrations" },
  ];

  return (
    <div className="settings-grid">
      <div className="settings-nav">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`settings-nav-item ${activeTab === t.id ? "active" : ""}`}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </div>
        ))}
      </div>

      <div className="settings-panel">
        {activeTab === "notifications" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Notification Preferences
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Configure how and when you receive alerts
            </p>
            {[
              {
                key: "sos_alerts",
                label: "SOS Alerts",
                desc: "Receive instant notifications for SOS activations",
              },
              {
                key: "email_notify",
                label: "Email Notifications",
                desc: "Send alert summaries to registered email",
              },
              {
                key: "sms_notify",
                label: "SMS Notifications",
                desc: "Text alerts for critical incidents only",
              },
              {
                key: "auto_dispatch",
                label: "Auto-Dispatch Suggestions",
                desc: "AI suggests nearest available patrol unit",
              },
            ].map((s) => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
          </>
        )}

        {activeTab === "security" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Security Settings
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Protect your authority account
            </p>
            {[
              {
                key: "two_fa",
                label: "Two-Factor Authentication",
                desc: "Require OTP on every login",
              },
              {
                key: "analytics",
                label: "Activity Logging",
                desc: "Log all admin actions for audit trail",
              },
            ].map((s) => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Change Password</h4>
                <p>Last changed 30 days ago</p>
              </div>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => showToast("Password reset email sent")}
              >
                Reset Password
              </button>
            </div>
          </>
        )}

        {activeTab === "system" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              System Configuration
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Dashboard and operational settings
            </p>
            {[
              {
                key: "dark_mode",
                label: "Dark Mode",
                desc: "Use dark theme for the dashboard",
              },
              {
                key: "maintenance",
                label: "Maintenance Mode",
                desc: "Put system in read-only maintenance mode",
              },
            ].map((s) => (
              <div key={s.key} className="settings-row">
                <div className="settings-row-info">
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="settings-row">
              <div className="settings-row-info">
                <h4>Data Backup</h4>
                <p>Last backup: Today 06:00 AM</p>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => showToast("Backup initiated", "success")}
              >
                Backup Now
              </button>
            </div>
          </>
        )}

        {activeTab === "integrations" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              External Integrations
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Connected services and APIs
            </p>
            {[
              {
                name: "NCRB Database",
                status: true,
                desc: "National Crime Records Bureau",
              },
              {
                name: "Emergency 112",
                status: true,
                desc: "National Emergency Response System",
              },
              {
                name: "FRRO API",
                status: false,
                desc: "Foreign Regional Registration Office",
              },
              {
                name: "Blockchain eFIR",
                status: true,
                desc: "Decentralized FIR ledger",
              },
            ].map((s, i) => (
              <div key={i} className="settings-row">
                <div className="settings-row-info">
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
      </div>
    </div>
  );
};

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

const navItems = [
  {
    id: "overview" as Section,
    label: "Overview",
    icon: <Icon.Home />,
    badge: 0,
    group: "Main",
  },
  {
    id: "alerts" as Section,
    label: "Alert Management",
    icon: <Icon.Bell />,
    badge: 4,
    group: "Operations",
  },
  {
    id: "cases" as Section,
    label: "Case & FIR",
    icon: <Icon.File />,
    badge: 0,
    group: "Operations",
  },
  {
    id: "response" as Section,
    label: "Emergency Response",
    icon: <Icon.Shield />,
    badge: 0,
    group: "Operations",
  },
  {
    id: "tourists" as Section,
    label: "Tourist Safety",
    icon: <Icon.MapPin />,
    badge: 2,
    group: "Field",
  },
  {
    id: "reports" as Section,
    label: "Reports & Analytics",
    icon: <Icon.Chart />,
    badge: 0,
    group: "Field",
  },
  {
    id: "users" as Section,
    label: "User & Roles",
    icon: <Icon.Users />,
    badge: 0,
    group: "Admin",
  },
  {
    id: "settings" as Section,
    label: "Settings",
    icon: <Icon.Settings />,
    badge: 0,
    group: "Admin",
  },
];

const sectionTitles: Record<Section, { title: string; sub: string }> = {
  overview: {
    title: "Tourist Records & Heat Map",
    sub: "Visitor monitoring and geographic activity",
  },
  alerts: {
    title: "Alert Management",
    sub: "Real-time incidents and SOS signals",
  },
  cases: {
    title: "Case & FIR Management",
    sub: "Complaint filing and investigation tracking",
  },
  response: {
    title: "Emergency Response",
    sub: "Patrol units and deployment coordination",
  },
  tourists: {
    title: "Tourist Safety Monitor",
    sub: "Zone risk levels and active tourists",
  },
  reports: {
    title: "Reports & Analytics",
    sub: "Insights, trends, and downloadable reports",
  },
  users: {
    title: "User & Role Management",
    sub: "Access control and team administration",
  },
  settings: { title: "System Settings", sub: "Configuration and preferences" },
};

const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({
  userName,
  onLogout,
}) => {
  const { emergencyAlerts, safetyScores, tourists, users } =
    useGeoGuardianRealtimeData();
  const [section, setSection] = useState<Section>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { toasts, show: showToast } = useToast();

  const realtimeTouristRows = useMemo(
    () => tourists.data.map(mapTouristToRow),
    [tourists.data],
  );
  const realtimeAlertRows = useMemo(
    () =>
      emergencyAlerts.data
        .map(mapEmergencyAlertToUi)
        .sort((a, b) => b.id.localeCompare(a.id)),
    [emergencyAlerts.data],
  );
  const realtimeUserRows = useMemo(
    () => users.data.map(mapUserToRow),
    [users.data],
  );

  const effectiveTouristRows = realtimeTouristRows.length
    ? realtimeTouristRows
    : initialTourists;
  const effectiveAlertRows = realtimeAlertRows.length
    ? realtimeAlertRows
    : initialAlerts;
  const effectiveUserRows = realtimeUserRows.length ? realtimeUserRows : systemUsers;

  const liveAlerts = useMemo(
    () => ({
      complaints: effectiveAlertRows.filter((a) => a.type === "Complaint").length,
      sos: effectiveAlertRows.filter((a) => a.type === "SOS").length,
      emergency: effectiveAlertRows.filter((a) => a.type === "Emergency").length,
    }),
    [effectiveAlertRows],
  );

  const latestSafetyScore = useMemo(
    () =>
      safetyScores.data
        .slice()
        .sort((a, b) => {
          const at = (a.updatedAt || a.calculatedAt)?.getTime() || 0;
          const bt = (b.updatedAt || b.calculatedAt)?.getTime() || 0;
          return bt - at;
        })[0] || null,
    [safetyScores.data],
  );

  const notificationItems = useMemo(() => {
    const items = [
      {
        icon: "🆘",
        msg: `${liveAlerts.sos} active SOS signal(s)`,
        time: "Just now",
      },
      {
        icon: "📋",
        msg: `${liveAlerts.complaints} new complaint(s)`,
        time: "2 min ago",
      },
      {
        icon: "🚨",
        msg: `${liveAlerts.emergency} emergency alert(s)`,
        time: "5 min ago",
      },
    ];

    if (latestSafetyScore?.overallScore != null) {
      items.push({
        icon: "🛡️",
        msg: `Latest safety score: ${latestSafetyScore.overallScore.toFixed(2)}`,
        time: "Live",
      });
    }

    return items;
  }, [liveAlerts, latestSafetyScore]);

  const totalNotifs =
    liveAlerts.complaints +
    liveAlerts.sos +
    liveAlerts.emergency +
    (latestSafetyScore?.overallScore != null ? 1 : 0);
  const userInitials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "AG";
  const { title, sub } = sectionTitles[section];

  const groups = ["Main", "Operations", "Field", "Admin"];

  const renderSection = () => {
    switch (section) {
      case "overview":
        return (
          <OverviewSection
            showToast={showToast}
            touristRows={effectiveTouristRows}
          />
        );
      case "alerts":
        return (
          <AlertManagementSection
            showToast={showToast}
            alertRows={effectiveAlertRows}
          />
        );
      case "cases":
        return <CaseFIRSection showToast={showToast} />;
      case "response":
        return <EmergencyResponseSection showToast={showToast} />;
      case "tourists":
        return <TouristMonitoringSection />;
      case "reports":
        return <ReportsSection />;
      case "users":
        return (
          <UserManagementSection showToast={showToast} userRows={effectiveUserRows} />
        );
      case "settings":
        return <SettingsSection showToast={showToast} />;
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="dash">
        {/* Mobile overlay */}
        <div
          className={`mobile-overlay ${mobileOpen ? "visible" : ""}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Sidebar */}
        <nav
          className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        >
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">GG</div>
            <div className="sidebar-logo-text">
              <h2>Geo Guardian</h2>
              <p>Operations Console</p>
            </div>
          </div>

          <div className="sidebar-nav">
            {groups.map((group) => {
              const items = navItems.filter((n) => n.group === group);
              return (
                <div key={group}>
                  <div className="nav-section-label">{group}</div>
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`nav-item ${section === item.id ? "active" : ""}`}
                      onClick={() => {
                        setSection(item.id);
                        setMobileOpen(false);
                      }}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-label">{item.label}</span>
                      {item.badge > 0 && (
                        <span className="nav-badge">{item.badge}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div className="sidebar-footer">
            <button
              className="sidebar-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
            >
              <span>
                {collapsed ? <Icon.ChevronRight /> : <Icon.ChevronLeft />}
              </span>
              {!collapsed && <span>Collapse Sidebar</span>}
            </button>
          </div>
        </nav>

        {/* Topbar */}
        <header className={`topbar ${collapsed ? "sidebar-collapsed" : ""}`}>
          <div className="topbar-left">
            <button
              className="mobile-topbar-btn"
              onClick={() => setMobileOpen((m) => !m)}
            >
              <Icon.Menu />
            </button>
            <div className="topbar-breadcrumb">
              <h1>{title}</h1>
              <p>{sub}</p>
            </div>
          </div>

          <div className="topbar-right">
            <div className="topbar-search">
              <Icon.Search />
              <input placeholder="Search anything…" />
            </div>

            {/* Notifications */}
            <div className="dropdown-wrap">
              <button
                className="icon-btn"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
              >
                <Icon.Bell />
                {totalNotifs > 0 && (
                  <span className="badge">{totalNotifs}</span>
                )}
              </button>
              {notifOpen && (
                <div className="dropdown" style={{ minWidth: 260 }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 800,
                      fontSize: 13,
                    }}
                  >
                    Notifications
                  </div>
                  {notificationItems.map((n, i) => (
                    <div
                      key={i}
                      className="dropdown-item"
                      style={{ gap: 12, padding: "12px 16px" }}
                    >
                      <span style={{ fontSize: 20 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>
                          {n.msg}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                          {n.time}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="dropdown-wrap">
              <button
                className="avatar-btn"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
              >
                <div className="avatar">{userInitials}</div>
                <div className="avatar-info">
                  <strong>{userName || "Authority"}</strong>
                  <span>Administrator</span>
                </div>
              </button>
              {profileOpen && (
                <div className="dropdown">
                  <div className="dropdown-item">
                    <Icon.User /> My Profile
                  </div>
                  <div
                    className="dropdown-item"
                    onClick={() => {
                      setSection("settings");
                      setProfileOpen(false);
                    }}
                  >
                    <Icon.Settings /> Settings
                  </div>
                  <div className="dropdown-divider" />
                  <button className="dropdown-item danger" onClick={onLogout}>
                    <Icon.LogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className={`main ${collapsed ? "sidebar-collapsed" : ""}`}>
          <div
            className="section-content"
            onClick={() => {
              setProfileOpen(false);
              setNotifOpen(false);
            }}
          >
            {renderSection()}
          </div>
        </main>

        {/* Toasts */}
        <div className="toast-wrap">
          {toasts.map((t) => (
            <div key={t.id} className={`toast ${t.type || ""}`}>
              {t.type === "success" ? "✅" : t.type === "error" ? "❌" : "ℹ️"}{" "}
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default AuthorityDashboard;
