// src/pages/CounsellorDashboard.tsx — Full Build
// Anonymous Safety Chat & Counsellor Operations Dashboard
// Icons: @fortawesome/react-fontawesome
// No MUI. Same design system as AuthorityDashboard & PoliceDashboard.

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faShieldHalved,
  faComments,
  faInbox,
  faClockRotateLeft,
  faTriangleExclamation,
  faCircleCheck,
  faCircleXmark,
  faArrowRightFromBracket,
  faBars,
  faMagnifyingGlass,
  faBell,
  faChevronLeft,
  faChevronRight,
  faPaperPlane,
  faUserSecret,
  faHandshake,
  faFileLines,
  faChartBar,
  faGear,
  faLock,
  faCircle,
  faEllipsisVertical,
  faArrowUpRightFromSquare,
  faPhone,
  faLocationDot,
  faTag,
  faCalendarDays,
  faFilter,
  faDownload,
  faPlus,
  faBookOpen,
  faLink,
  faToggleOn,
  faToggleOff,
  faClipboardList,
  faUserTie,
  faCircleDot,
  faRotate,
  faXmark,
  faCheck,
  faUserShield,
  faExclamation,
  faAngleDown,
  faPencil,
  faTrash,
  faCopy,
  faEye,
} from "@fortawesome/free-solid-svg-icons";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import type {
  EmergencyAlertRecord,
  SafetyScoreRecord,
} from "../Services/realtimeDataService";

// ─── TYPES ────────────────────────────────────────────────────────────────────

type ChatStatus = "waiting" | "active" | "escalated" | "closed" | "on-hold";
type CaseCategory =
  | "Harassment"
  | "Blackmail"
  | "Stalking"
  | "Domestic Violence"
  | "Cybercrime"
  | "Assault"
  | "Other";
type Priority = "Low" | "Medium" | "High" | "Critical";
type SectionKey =
  | "overview"
  | "queue"
  | "chat"
  | "history"
  | "escalations"
  | "resources"
  | "reports"
  | "settings";

interface Message {
  id: string;
  sender: "user" | "counsellor";
  text: string;
  timestamp: number;
  isRead: boolean;
}

interface ChatSession {
  id: string;
  anonymousId: string;
  category: CaseCategory;
  priority: Priority;
  status: ChatStatus;
  startedAt: number;
  lastMessage: string;
  lastMessageAt: number;
  messages: Message[];
  assignedCounsellor?: string;
  notes?: string;
  escalatedTo?: string;
  location?: string;
  caseRef?: string;
}

interface Resource {
  id: string;
  title: string;
  category: string;
  description: string;
  link?: string;
  tags: string[];
  addedAt: string;
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────

const now = Date.now();

const seedSessions: ChatSession[] = [
  {
    id: "SES-001",
    anonymousId: "ANON-7f3a",
    category: "Harassment",
    priority: "High",
    status: "active",
    startedAt: now - 900000,
    lastMessage: "He keeps following me on my way home every evening.",
    lastMessageAt: now - 120000,
    assignedCounsellor: "Counsellor Priya",
    location: "Guwahati, Assam",
    caseRef: "REF-001",
    messages: [
      {
        id: "m1",
        sender: "user",
        text: "Hello, I need help. I feel unsafe.",
        timestamp: now - 900000,
        isRead: true,
      },
      {
        id: "m2",
        sender: "counsellor",
        text: "You're safe here. I'm Priya, your counsellor. Please tell me what's happening — take your time.",
        timestamp: now - 870000,
        isRead: true,
      },
      {
        id: "m3",
        sender: "user",
        text: "There's this guy from my college. He keeps following me everywhere — to college, back home.",
        timestamp: now - 840000,
        isRead: true,
      },
      {
        id: "m4",
        sender: "counsellor",
        text: "I understand how frightening that must feel. You're doing the right thing by reaching out. Has he made any threats or tried to contact you directly?",
        timestamp: now - 810000,
        isRead: true,
      },
      {
        id: "m5",
        sender: "user",
        text: "He sends messages from unknown numbers saying he's watching me. I blocked him but he keeps making new accounts.",
        timestamp: now - 780000,
        isRead: true,
      },
      {
        id: "m6",
        sender: "counsellor",
        text: "This is cyberstalking and it's a serious offence under IT Act Section 66E. You have every right to file a complaint. Would you like me to connect you with our legal team or the nearest police station?",
        timestamp: now - 750000,
        isRead: true,
      },
      {
        id: "m7",
        sender: "user",
        text: "He keeps following me on my way home every evening.",
        timestamp: now - 120000,
        isRead: false,
      },
    ],
  },
  {
    id: "SES-002",
    anonymousId: "ANON-2b9c",
    category: "Blackmail",
    priority: "Critical",
    status: "waiting",
    startedAt: now - 300000,
    lastMessage: "He has my photos and is threatening to share them.",
    lastMessageAt: now - 300000,
    location: "Dibrugarh, Assam",
    messages: [
      {
        id: "m8",
        sender: "user",
        text: "He has my photos and is threatening to share them unless I give him money.",
        timestamp: now - 300000,
        isRead: false,
      },
    ],
  },
  {
    id: "SES-003",
    anonymousId: "ANON-9e1d",
    category: "Stalking",
    priority: "High",
    status: "waiting",
    startedAt: now - 600000,
    lastMessage: "My ex boyfriend won't stop showing up at my workplace.",
    lastMessageAt: now - 600000,
    messages: [
      {
        id: "m9",
        sender: "user",
        text: "My ex boyfriend won't stop showing up at my workplace. My manager is getting frustrated.",
        timestamp: now - 600000,
        isRead: false,
      },
    ],
  },
  {
    id: "SES-004",
    anonymousId: "ANON-4c5f",
    category: "Cybercrime",
    priority: "Medium",
    status: "on-hold",
    startedAt: now - 3600000,
    lastMessage: "Someone hacked my account and is impersonating me.",
    lastMessageAt: now - 3600000,
    assignedCounsellor: "Counsellor Deepa",
    messages: [
      {
        id: "m10",
        sender: "user",
        text: "Someone hacked my Instagram and is messaging my contacts pretending to be me.",
        timestamp: now - 3600000,
        isRead: true,
      },
      {
        id: "m11",
        sender: "counsellor",
        text: "I've noted your situation. This is identity theft and is actionable. Let me check with our cyber team.",
        timestamp: now - 3540000,
        isRead: true,
      },
    ],
  },
  {
    id: "SES-005",
    anonymousId: "ANON-8d2a",
    category: "Domestic Violence",
    priority: "Critical",
    status: "escalated",
    startedAt: now - 7200000,
    lastMessage: "Case escalated to police. User given shelter contact.",
    lastMessageAt: now - 7200000,
    assignedCounsellor: "Counsellor Priya",
    escalatedTo: "Guwahati Police Station",
    caseRef: "REF-005",
    messages: [
      {
        id: "m12",
        sender: "user",
        text: "My husband hits me regularly. I am scared for my children.",
        timestamp: now - 7200000,
        isRead: true,
      },
      {
        id: "m13",
        sender: "counsellor",
        text: "You are very brave for reaching out. Your safety is our top priority. I am escalating this immediately.",
        timestamp: now - 7140000,
        isRead: true,
      },
    ],
  },
  {
    id: "SES-006",
    anonymousId: "ANON-1a7b",
    category: "Harassment",
    priority: "Low",
    status: "closed",
    startedAt: now - 86400000,
    lastMessage:
      "Session concluded. Advice given on workplace harassment policy.",
    lastMessageAt: now - 86400000,
    assignedCounsellor: "Counsellor Meera",
    caseRef: "REF-006",
    messages: [
      {
        id: "m14",
        sender: "user",
        text: "My supervisor makes uncomfortable remarks. I don't know what to do.",
        timestamp: now - 86400000,
        isRead: true,
      },
    ],
  },
];

const seedResources: Resource[] = [
  {
    id: "R1",
    title: "What to do if you're being stalked",
    category: "Stalking",
    description:
      "Step-by-step safety guide for victims of stalking — evidence collection, legal options, safety planning.",
    tags: ["Safety", "Legal", "Stalking"],
    addedAt: "2025-09-01",
    link: "#",
  },
  {
    id: "R2",
    title: "Cybercrime reporting guide",
    category: "Cybercrime",
    description:
      "How to report image-based abuse, account hacking, and online blackmail under IT Act provisions.",
    tags: ["IT Act", "Cybercrime", "Online"],
    addedAt: "2025-09-05",
    link: "#",
  },
  {
    id: "R3",
    title: "Domestic Violence — Your rights under PWDVA 2005",
    category: "Domestic Violence",
    description:
      "Complete guide to Protection of Women from Domestic Violence Act. Includes shelter contact list.",
    tags: ["PWDVA", "Legal", "Shelter"],
    addedAt: "2025-09-10",
    link: "#",
  },
  {
    id: "R4",
    title: "Workplace harassment & POSH Act",
    category: "Harassment",
    description:
      "Internal Complaints Committee process, formal complaint templates, and what to document.",
    tags: ["POSH", "Workplace", "HR"],
    addedAt: "2025-09-12",
    link: "#",
  },
  {
    id: "R5",
    title: "Emergency contacts — NE India",
    category: "General",
    description:
      "Police helplines, women's helpline 181, child helpline 1098, and NGO contacts across NE India.",
    tags: ["Emergency", "Helpline", "Contact"],
    addedAt: "2025-09-14",
    link: "#",
  },
  {
    id: "R6",
    title: "Evidence collection checklist",
    category: "General",
    description:
      "How to safely screenshot, export, and preserve digital evidence for legal proceedings.",
    tags: ["Evidence", "Digital", "Legal"],
    addedAt: "2025-09-15",
    link: "#",
  },
];

const weeklyData = [
  { day: "Mon", sessions: 8, resolved: 6 },
  { day: "Tue", sessions: 12, resolved: 9 },
  { day: "Wed", sessions: 7, resolved: 7 },
  { day: "Thu", sessions: 15, resolved: 11 },
  { day: "Fri", sessions: 10, resolved: 8 },
  { day: "Sat", sessions: 5, resolved: 5 },
  { day: "Sun", sessions: 3, resolved: 3 },
];

const toMillis = (date: Date | null | undefined, fallback: number): number =>
  date ? date.getTime() : fallback;

const toCaseCategory = (type: string, description: string): CaseCategory => {
  const source = `${type} ${description}`.toLowerCase();
  if (source.includes("blackmail")) {
    return "Blackmail";
  }
  if (source.includes("stalk")) {
    return "Stalking";
  }
  if (source.includes("domestic")) {
    return "Domestic Violence";
  }
  if (source.includes("cyber") || source.includes("hack")) {
    return "Cybercrime";
  }
  if (source.includes("assault") || source.includes("panic")) {
    return "Assault";
  }
  if (source.includes("harass")) {
    return "Harassment";
  }
  return "Other";
};

const toPriority = (severity: string): Priority => {
  const normalized = severity.toLowerCase();
  if (normalized.includes("critical")) {
    return "Critical";
  }
  if (normalized.includes("high")) {
    return "High";
  }
  if (normalized.includes("low")) {
    return "Low";
  }
  return "Medium";
};

const toChatStatus = (status: string): ChatStatus => {
  const normalized = status.toLowerCase();
  if (
    normalized.includes("resolved") ||
    normalized.includes("closed") ||
    normalized.includes("complete")
  ) {
    return "closed";
  }
  if (normalized.includes("escalated")) {
    return "escalated";
  }
  if (
    normalized.includes("acknowledged") ||
    normalized.includes("assigned") ||
    normalized.includes("in_progress")
  ) {
    return "active";
  }
  if (normalized.includes("hold")) {
    return "on-hold";
  }
  return "waiting";
};

const toAnonymousId = (alert: EmergencyAlertRecord): string => {
  const seed =
    alert.touristId || alert.userId || alert.alertId || alert.id || "guest";
  return `ANON-${seed.slice(-6).toUpperCase()}`;
};

const mapEmergencyAlertsToSessions = (
  alerts: EmergencyAlertRecord[],
): ChatSession[] => {
  const nowMillis = Date.now();

  return alerts
    .map((alert) => {
      const startedAt = toMillis(
        alert.alertTime ?? alert.createdAt,
        nowMillis - 600000,
      );
      const lastMessageAt = toMillis(
        alert.updatedAt ?? alert.alertTime ?? alert.createdAt,
        startedAt,
      );
      const description =
        alert.description || `${alert.title} alert raised by the tourist.`;

      return {
        id: alert.alertId || alert.id,
        anonymousId: toAnonymousId(alert),
        category: toCaseCategory(alert.type, description),
        priority: toPriority(alert.severity),
        status: toChatStatus(alert.status),
        startedAt,
        lastMessage: description,
        lastMessageAt,
        assignedCounsellor: alert.assignedOfficerId
          ? "Assigned Response Team"
          : undefined,
        escalatedTo: alert.assignedOfficerId || undefined,
        location: alert.address || "Unknown location",
        caseRef: alert.alertId || alert.id,
        messages: [
          {
            id: `msg-${alert.id}`,
            sender: "user",
            text: description,
            timestamp: startedAt,
            isRead: false,
          },
        ],
      };
    })
    .sort((a, b) => b.lastMessageAt - a.lastMessageAt);
};

const titleCaseFactor = (factorKey: string): string =>
  factorKey
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const mapFactorToResourceCategory = (factorKey: string): Resource["category"] => {
  const normalized = factorKey.toLowerCase();
  if (normalized.includes("cyber")) {
    return "Cybercrime";
  }
  if (normalized.includes("route") || normalized.includes("location")) {
    return "Stalking";
  }
  if (normalized.includes("crime") || normalized.includes("group")) {
    return "Harassment";
  }
  if (normalized.includes("domestic")) {
    return "Domestic Violence";
  }
  return "General";
};

const mapSafetyScoresToResources = (scores: SafetyScoreRecord[]): Resource[] => {
  const today = new Date().toISOString().slice(0, 10);

  return scores.map((score, index) => {
    const factorPairs = Object.entries(score.factorScores).sort(
      (left, right) => right[1] - left[1],
    );
    const topFactor = factorPairs[0]?.[0] || "overallSafety";
    const riskBand =
      score.overallScore !== null && score.overallScore < 50
        ? "High Risk"
        : score.overallScore !== null && score.overallScore < 70
          ? "Medium Risk"
          : "Low Risk";

    return {
      id: `RT-${score.id}-${index + 1}`,
      title: `Safety guidance for ${score.userId || "tourist"} (${riskBand})`,
      category: mapFactorToResourceCategory(topFactor),
      description:
        score.recommendations ||
        `Monitor ${titleCaseFactor(topFactor)} and share preventive guidance.`,
      tags: [
        riskBand,
        `Score:${score.overallScore ?? "N/A"}`,
        titleCaseFactor(topFactor),
      ],
      addedAt: score.updatedAt
        ? score.updatedAt.toISOString().slice(0, 10)
        : score.calculatedAt
          ? score.calculatedAt.toISOString().slice(0, 10)
          : today,
      link: "",
    };
  });
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --navy: #0e1f35;
    --navy-2: #142943;
    --teal: #0d9488;
    --teal-2: #14b8a6;
    --teal-light: #ccfbf1;
    --rose: #e11d48;
    --rose-light: #ffe4e6;
    --amber: #f59e0b;
    --amber-light: #fef3c7;
    --green: #22c55e;
    --green-light: #dcfce7;
    --blue: #3b82f6;
    --blue-light: #dbeafe;
    --purple: #8b5cf6;
    --purple-light: #ede9fe;
    --saffron: #f97316;
    --saffron-light: #fff7ed;
    --text: #0f2137;
    --text-2: #4a5e73;
    --text-3: #94a3b8;
    --border: #dce8f0;
    --surface: #ffffff;
    --surface-2: #f0f7f5;
    --surface-3: #e4f0ee;
    --shadow-sm: 0 1px 3px rgba(11,30,53,0.08), 0 1px 2px rgba(11,30,53,0.06);
    --shadow-md: 0 4px 16px rgba(11,30,53,0.1), 0 2px 4px rgba(11,30,53,0.06);
    --shadow-lg: 0 12px 40px rgba(11,30,53,0.14);
    --radius: 12px;
    --radius-sm: 8px;
    --radius-lg: 16px;
    --sidebar-w: 260px;
    --topbar-h: 64px;
    --ease: 0.22s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .cd { display: flex; min-height: 100vh; background: var(--surface-2); color: var(--text); font-family: 'Plus Jakarta Sans', system-ui, sans-serif; }

  /* ── SIDEBAR ── */
  .cd-sidebar {
    width: var(--sidebar-w); min-height: 100vh;
    background: var(--navy);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0;
    z-index: 200; transition: transform var(--ease), width var(--ease); overflow: hidden;
  }
  .cd-sidebar.collapsed { width: 64px; }
  .cd-sidebar.mobile-open { transform: none !important; }
  @media (max-width: 768px) { .cd-sidebar { transform: translateX(-100%); width: var(--sidebar-w) !important; } }

  .cd-logo {
    display: flex; align-items: center; gap: 12px;
    padding: 18px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
    min-height: var(--topbar-h); flex-shrink: 0;
  }
  .cd-logo-icon {
    width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0;
    background: linear-gradient(135deg, #0d9488, #14b8a6);
    display: flex; align-items: center; justify-content: center; color: #fff; font-size: 16px;
    box-shadow: 0 4px 14px rgba(13,148,136,0.45);
  }
  .cd-logo-text h2 { font-size: 14px; font-weight: 800; color: #fff; line-height: 1.2; white-space: nowrap; }
  .cd-logo-text p { font-size: 10px; color: rgba(255,255,255,0.4); white-space: nowrap; }
  .cd-sidebar.collapsed .cd-logo-text { display: none; }

  .cd-nav { flex: 1; padding: 12px 8px; overflow-y: auto; overflow-x: hidden; }
  .cd-nav::-webkit-scrollbar { width: 3px; }
  .cd-nav::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }

  .cd-nav-group { font-size: 9px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(255,255,255,0.28); padding: 14px 12px 5px; white-space: nowrap; }
  .cd-sidebar.collapsed .cd-nav-group { opacity: 0; }

  .cd-nav-item {
    display: flex; align-items: center; gap: 12px;
    padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer;
    transition: var(--ease); position: relative; margin-bottom: 2px; overflow: hidden; white-space: nowrap;
  }
  .cd-nav-item:hover { background: rgba(255,255,255,0.07); }
  .cd-nav-item.active { background: rgba(13,148,136,0.22); }
  .cd-nav-item.active::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 3px; height: 60%; background: var(--teal-2); border-radius: 0 3px 3px 0; }
  .cd-nav-icon { width: 18px; flex-shrink: 0; color: rgba(255,255,255,0.4); transition: color var(--ease); display: flex; align-items: center; justify-content: center; font-size: 15px; }
  .cd-nav-item.active .cd-nav-icon, .cd-nav-item:hover .cd-nav-icon { color: var(--teal-2); }
  .cd-nav-label { font-size: 13.5px; font-weight: 600; color: rgba(255,255,255,0.6); transition: color var(--ease); flex: 1; }
  .cd-nav-item.active .cd-nav-label, .cd-nav-item:hover .cd-nav-label { color: #fff; }
  .cd-nav-badge { background: var(--rose); color: #fff; font-size: 10px; font-weight: 700; padding: 2px 7px; border-radius: 100px; flex-shrink: 0; }
  .cd-nav-badge.pulse { animation: badgePulse 2s ease infinite; }
  @keyframes badgePulse { 0%,100%{ transform:scale(1); } 50%{ transform:scale(1.15); } }
  .cd-sidebar.collapsed .cd-nav-label, .cd-sidebar.collapsed .cd-nav-badge, .cd-sidebar.collapsed .cd-nav-group { display: none; }

  .cd-sidebar-footer { padding: 12px 8px; border-top: 1px solid rgba(255,255,255,0.07); }
  .cd-user-row {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: var(--radius-sm); overflow: hidden; margin-bottom: 4px;
  }
  .cd-user-avatar { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; background: linear-gradient(135deg, var(--teal), #0f766e); color: #fff; font-size: 12px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
  .cd-user-info { overflow: hidden; flex: 1; }
  .cd-user-info strong { display: block; font-size: 12px; font-weight: 700; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cd-user-info span { font-size: 10px; color: rgba(255,255,255,0.4); }
  .cd-sidebar.collapsed .cd-user-info { display: none; }
  .cd-collapse-btn { width: 100%; display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); background: none; border: none; color: rgba(255,255,255,0.35); cursor: pointer; font-size: 12px; font-weight: 600; font-family: inherit; transition: var(--ease); white-space: nowrap; overflow: hidden; }
  .cd-collapse-btn:hover { background: rgba(255,255,255,0.07); color: rgba(255,255,255,0.7); }
  .cd-sidebar.collapsed .cd-collapse-btn span.label { display: none; }

  /* ── TOPBAR ── */
  .cd-topbar {
    position: fixed; top: 0; left: var(--sidebar-w); right: 0; height: var(--topbar-h);
    background: rgba(255,255,255,0.93); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 24px; z-index: 100; transition: left var(--ease);
  }
  .cd-topbar.collapsed { left: 64px; }
  .cd-topbar-left { display: flex; align-items: center; gap: 16px; }
  .cd-topbar-title h1 { font-size: 16px; font-weight: 700; color: var(--text); }
  .cd-topbar-title p { font-size: 11px; color: var(--text-2); margin-top: 1px; }
  .cd-topbar-right { display: flex; align-items: center; gap: 8px; }

  .cd-search { display: flex; align-items: center; gap: 8px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 8px 14px; width: 240px; transition: var(--ease); }
  .cd-search:focus-within { border-color: var(--teal); background: #fff; box-shadow: 0 0 0 3px rgba(13,148,136,0.12); }
  .cd-search input { border: none; background: none; outline: none; font-size: 13px; color: var(--text); font-family: inherit; width: 100%; }
  .cd-search input::placeholder { color: var(--text-3); }

  .cd-icon-btn { width: 38px; height: 38px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); color: var(--text-2); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--ease); position: relative; font-size: 15px; }
  .cd-icon-btn:hover { background: var(--surface-2); color: var(--teal); border-color: var(--teal); }
  .cd-notif-badge { position: absolute; top: -4px; right: -4px; background: var(--rose); color: #fff; font-size: 9px; font-weight: 800; width: 16px; height: 16px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; }

  .cd-profile-btn { display: flex; align-items: center; gap: 10px; padding: 6px 12px 6px 6px; border-radius: var(--radius-sm); border: 1px solid var(--border); background: var(--surface); cursor: pointer; transition: var(--ease); font-family: inherit; }
  .cd-profile-btn:hover { background: var(--surface-2); }

  /* ── DROPDOWN ── */
  .cd-dd-wrap { position: relative; }
  .cd-dd { position: absolute; top: calc(100% + 8px); right: 0; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-lg); min-width: 200px; z-index: 300; overflow: hidden; animation: cdDrop 0.15s ease; }
  @keyframes cdDrop { from { opacity:0; transform: translateY(-8px) scale(0.97); } to { opacity:1; transform:none; } }
  .cd-dd-item { display: flex; align-items: center; gap: 10px; padding: 10px 16px; font-size: 13px; font-weight: 500; color: var(--text); cursor: pointer; transition: background 0.15s; border: none; background: none; width: 100%; font-family: inherit; text-align: left; }
  .cd-dd-item:hover { background: var(--surface-2); }
  .cd-dd-item.danger { color: var(--rose); }
  .cd-dd-divider { height: 1px; background: var(--border); margin: 4px 0; }

  /* ── MAIN ── */
  .cd-main { flex: 1; margin-left: var(--sidebar-w); padding-top: var(--topbar-h); min-height: 100vh; transition: margin-left var(--ease); }
  .cd-main.collapsed { margin-left: 64px; }
  .cd-content { padding: 28px; }

  /* ── KPI CARDS ── */
  .cd-kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
  .cd-kpi { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; box-shadow: var(--shadow-sm); transition: var(--ease); position: relative; overflow: hidden; }
  .cd-kpi::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--kc, var(--teal)); }
  .cd-kpi:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .cd-kpi-head { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
  .cd-kpi-icon { width: 42px; height: 42px; border-radius: 10px; background: var(--kb, var(--teal-light)); color: var(--kc, var(--teal)); display: flex; align-items: center; justify-content: center; font-size: 17px; }
  .cd-kpi-trend { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 100px; }
  .cd-kpi-trend.up { background: var(--green-light); color: #15803d; }
  .cd-kpi-trend.down { background: var(--rose-light); color: #be123c; }
  .cd-kpi-trend.neutral { background: var(--surface-3); color: var(--text-2); }
  .cd-kpi-val { font-size: 30px; font-weight: 800; color: var(--text); line-height: 1; margin-bottom: 4px; }
  .cd-kpi-lbl { font-size: 12px; color: var(--text-2); font-weight: 500; }

  /* ── SECTION HEADER ── */
  .cd-sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
  .cd-sec-title { font-size: 17px; font-weight: 800; color: var(--text); }
  .cd-sec-sub { font-size: 12px; color: var(--text-2); margin-top: 2px; }

  /* ── BUTTONS ── */
  .cd-btn { display: inline-flex; align-items: center; gap: 7px; padding: 8px 16px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; cursor: pointer; border: none; font-family: inherit; transition: var(--ease); text-decoration: none; white-space: nowrap; }
  .cd-btn-teal { background: var(--teal); color: #fff; box-shadow: 0 4px 12px rgba(13,148,136,0.3); }
  .cd-btn-teal:hover { background: var(--teal-2); box-shadow: 0 6px 18px rgba(13,148,136,0.4); transform: translateY(-1px); }
  .cd-btn-secondary { background: var(--surface-2); color: var(--text); border: 1px solid var(--border); }
  .cd-btn-secondary:hover { background: var(--surface-3); }
  .cd-btn-danger { background: var(--rose); color: #fff; }
  .cd-btn-danger:hover { background: #be123c; }
  .cd-btn-amber { background: var(--amber); color: #fff; }
  .cd-btn-ghost { background: transparent; color: var(--text-2); border: none; }
  .cd-btn-ghost:hover { background: var(--surface-2); }
  .cd-btn-outline { background: transparent; border: 1px solid var(--teal); color: var(--teal); }
  .cd-btn-outline:hover { background: var(--teal-light); }
  .cd-btn-outline-danger { background: transparent; border: 1px solid var(--rose); color: var(--rose); }
  .cd-btn-outline-danger:hover { background: var(--rose-light); }
  .cd-btn-sm { padding: 5px 12px; font-size: 12px; }
  .cd-btn[disabled] { opacity: 0.45; cursor: not-allowed; pointer-events: none; }

  /* ── CARDS ── */
  .cd-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); }
  .cd-card-header { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .cd-card-header h3 { font-size: 14px; font-weight: 700; color: var(--text); }
  .cd-card-header p { font-size: 11px; color: var(--text-2); margin-top: 2px; }
  .cd-card-body { padding: 20px; }
  .cd-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .cd-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }

  /* ── TABLE ── */
  .cd-table-wrap { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); box-shadow: var(--shadow-sm); overflow: hidden; }
  .cd-table-scroll { overflow-x: auto; }
  .cd-table { width: 100%; border-collapse: collapse; }
  .cd-table th { background: var(--surface-2); border-bottom: 1px solid var(--border); padding: 11px 16px; text-align: left; font-size: 11px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.05em; white-space: nowrap; }
  .cd-table td { padding: 12px 16px; font-size: 13px; border-bottom: 1px solid rgba(220,232,240,0.45); color: var(--text); vertical-align: middle; }
  .cd-table tr:last-child td { border-bottom: none; }
  .cd-table tbody tr:hover { background: var(--surface-2); }
  .mono { font-family: 'JetBrains Mono', monospace; font-size: 12px; }

  /* ── CHIPS ── */
  .chip { display: inline-flex; align-items: center; gap: 4px; padding: 3px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; white-space: nowrap; }
  .chip-teal { background: var(--teal-light); color: #0f766e; }
  .chip-green { background: var(--green-light); color: #15803d; }
  .chip-red { background: var(--rose-light); color: #be123c; }
  .chip-amber { background: var(--amber-light); color: #b45309; }
  .chip-blue { background: var(--blue-light); color: #1d4ed8; }
  .chip-purple { background: var(--purple-light); color: #6d28d9; }
  .chip-gray { background: var(--surface-3); color: var(--text-2); }
  .chip-orange { background: var(--saffron-light); color: #c2410c; }

  /* ── PRIORITY DOT ── */
  .pri { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 600; }
  .pri::before { content: ''; width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
  .pri-Critical::before { background: var(--rose); box-shadow: 0 0 0 3px rgba(225,29,72,0.2); animation: priPulse 1.5s ease infinite; }
  .pri-High::before { background: var(--saffron); }
  .pri-Medium::before { background: var(--amber); }
  .pri-Low::before { background: var(--green); }
  @keyframes priPulse { 0%,100%{ box-shadow: 0 0 0 3px rgba(225,29,72,0.2); } 50%{ box-shadow: 0 0 0 5px rgba(225,29,72,0.08); } }

  /* ── LIVE DOT ── */
  .cd-live { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--rose); }
  .cd-live-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--rose); animation: livePop 1.3s ease infinite; }
  @keyframes livePop { 0%,100%{ opacity:1; transform:scale(1); } 50%{ opacity:0.5; transform:scale(1.4); } }

  /* ── QUEUE ITEM ── */
  .cd-queue-item {
    display: flex; align-items: flex-start; gap: 14px;
    padding: 16px; border-radius: var(--radius); border: 1px solid var(--border);
    background: var(--surface); transition: var(--ease); cursor: pointer; margin-bottom: 10px;
  }
  .cd-queue-item:hover { box-shadow: var(--shadow-md); border-color: #9ecfc9; transform: translateX(3px); }
  .cd-queue-item.selected { border-color: var(--teal); box-shadow: 0 0 0 2px rgba(13,148,136,0.15); }
  .cd-queue-item.waiting { border-left: 4px solid var(--rose); }
  .cd-queue-item.active { border-left: 4px solid var(--teal); }
  .cd-queue-item.escalated { border-left: 4px solid var(--amber); }
  .cd-queue-item.on-hold { border-left: 4px solid var(--text-3); }
  .cd-queue-item.closed { border-left: 4px solid var(--green); opacity: 0.7; }
  .cd-queue-anon { width: 42px; height: 42px; border-radius: 50%; background: var(--navy); color: rgba(255,255,255,0.7); font-size: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .cd-queue-body { flex: 1; min-width: 0; }
  .cd-queue-id { font-size: 11px; font-family: 'JetBrains Mono', monospace; color: var(--teal); font-weight: 700; margin-bottom: 3px; }
  .cd-queue-msg { font-size: 13px; color: var(--text); line-height: 1.5; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .cd-queue-meta { font-size: 11px; color: var(--text-2); margin-top: 5px; display: flex; gap: 10px; flex-wrap: wrap; }
  .cd-queue-right { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }

  /* ── CHAT WINDOW ── */
  .cd-chat-layout { display: grid; grid-template-columns: 320px 1fr; gap: 20px; height: calc(100vh - var(--topbar-h) - 80px); min-height: 600px; }
  .cd-chat-sidebar { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; overflow: hidden; }
  .cd-chat-sidebar-header { padding: 16px; border-bottom: 1px solid var(--border); }
  .cd-chat-sidebar-header h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 10px; }
  .cd-chat-list { flex: 1; overflow-y: auto; padding: 8px; }
  .cd-chat-list::-webkit-scrollbar { width: 3px; }
  .cd-chat-list::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
  .cd-chat-list-item {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 12px; border-radius: var(--radius-sm); cursor: pointer; transition: var(--ease); margin-bottom: 4px;
  }
  .cd-chat-list-item:hover { background: var(--surface-2); }
  .cd-chat-list-item.active { background: var(--teal-light); }
  .cd-chat-list-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--navy-2); color: var(--teal-2); display: flex; align-items: center; justify-content: center; font-size: 14px; flex-shrink: 0; position: relative; }
  .cd-chat-list-avatar .unread-dot { position: absolute; top: 0; right: 0; width: 9px; height: 9px; background: var(--rose); border-radius: 50%; border: 2px solid #fff; }
  .cd-chat-list-info { flex: 1; min-width: 0; }
  .cd-chat-list-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 3px; }
  .cd-chat-list-name { font-size: 12.5px; font-weight: 700; color: var(--text); }
  .cd-chat-list-time { font-size: 10px; color: var(--text-3); }
  .cd-chat-list-preview { font-size: 12px; color: var(--text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  .cd-chat-main { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); display: flex; flex-direction: column; overflow: hidden; }
  .cd-chat-topbar { padding: 16px 20px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
  .cd-chat-identity { display: flex; align-items: center; gap: 12px; }
  .cd-chat-avatar { width: 40px; height: 40px; border-radius: 50%; background: var(--navy); color: var(--teal-2); display: flex; align-items: center; justify-content: center; font-size: 17px; }
  .cd-chat-name { font-size: 15px; font-weight: 800; color: var(--text); }
  .cd-chat-sub { font-size: 11px; color: var(--text-2); margin-top: 2px; }

  .cd-messages { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
  .cd-messages::-webkit-scrollbar { width: 4px; }
  .cd-messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }

  .cd-msg { display: flex; gap: 10px; max-width: 78%; }
  .cd-msg.user { align-self: flex-start; }
  .cd-msg.counsellor { align-self: flex-end; flex-direction: row-reverse; }
  .cd-msg-avatar { width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 13px; }
  .cd-msg.user .cd-msg-avatar { background: rgba(11,30,53,0.08); color: var(--text-2); }
  .cd-msg.counsellor .cd-msg-avatar { background: var(--teal); color: #fff; }
  .cd-msg-bubble { padding: 10px 14px; border-radius: 14px; max-width: 100%; }
  .cd-msg.user .cd-msg-bubble { background: var(--surface-2); border: 1px solid var(--border); border-bottom-left-radius: 4px; color: var(--text); }
  .cd-msg.counsellor .cd-msg-bubble { background: var(--teal); border-bottom-right-radius: 4px; color: #fff; }
  .cd-msg-text { font-size: 13.5px; line-height: 1.55; }
  .cd-msg-time { font-size: 10px; margin-top: 5px; opacity: 0.6; }

  .cd-chat-system-msg { text-align: center; font-size: 11px; color: var(--text-3); background: var(--surface-3); border-radius: 100px; padding: 4px 14px; align-self: center; }

  .cd-chat-input-area { padding: 16px 20px; border-top: 1px solid var(--border); flex-shrink: 0; }
  .cd-quick-replies { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 12px; }
  .cd-quick-reply { padding: 5px 12px; border-radius: 100px; border: 1px solid var(--teal); color: var(--teal); background: none; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; transition: var(--ease); white-space: nowrap; }
  .cd-quick-reply:hover { background: var(--teal); color: #fff; }
  .cd-input-row { display: flex; gap: 10px; align-items: flex-end; }
  .cd-input-box { flex: 1; border: 1.5px solid var(--border); border-radius: 10px; padding: 10px 14px; font-size: 13.5px; font-family: inherit; color: var(--text); outline: none; resize: none; max-height: 120px; min-height: 44px; transition: border-color 0.15s; line-height: 1.5; }
  .cd-input-box:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
  .cd-send-btn { width: 44px; height: 44px; border-radius: 10px; background: var(--teal); color: #fff; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 15px; transition: var(--ease); flex-shrink: 0; }
  .cd-send-btn:hover { background: var(--teal-2); transform: scale(1.05); }

  .cd-chat-info-panel { padding: 20px; border-top: 1px solid var(--border); background: var(--surface-2); flex-shrink: 0; display: flex; gap: 12px; flex-wrap: wrap; }
  .cd-info-pill { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-2); }
  .cd-info-pill strong { color: var(--text); font-weight: 700; }

  /* ── CASE NOTES ── */
  .cd-note-box { border: 1.5px solid var(--border); border-radius: var(--radius-sm); padding: 12px; font-size: 13px; font-family: inherit; color: var(--text); outline: none; width: 100%; min-height: 80px; resize: vertical; transition: border-color 0.15s; }
  .cd-note-box:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }

  /* ── ESCALATION FORM ── */
  .cd-escalation-card { background: #fff8f0; border: 1px solid #fed7aa; border-radius: var(--radius); padding: 18px; margin-top: 12px; }
  .cd-escalation-card h4 { font-size: 13px; font-weight: 700; color: #c2410c; margin-bottom: 8px; }

  /* ── MODAL ── */
  .cd-overlay { position: fixed; inset: 0; background: rgba(11,30,53,0.5); backdrop-filter: blur(5px); display: flex; align-items: center; justify-content: center; z-index: 500; padding: 16px; animation: cdFade 0.15s ease; }
  @keyframes cdFade { from { opacity:0; } to { opacity:1; } }
  .cd-modal { background: var(--surface); border-radius: var(--radius-lg); box-shadow: var(--shadow-lg); width: 100%; max-width: 500px; animation: cdSlide 0.2s ease; max-height: 90vh; overflow-y: auto; }
  .cd-modal-lg { max-width: 640px; }
  @keyframes cdSlide { from { opacity:0; transform: translateY(20px) scale(0.98); } to { opacity:1; transform:none; } }
  .cd-modal-header { padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; position: sticky; top: 0; background: var(--surface); z-index: 1; border-radius: var(--radius-lg) var(--radius-lg) 0 0; }
  .cd-modal-header h2 { font-size: 16px; font-weight: 800; color: var(--text); }
  .cd-modal-body { padding: 24px; }
  .cd-modal-footer { padding: 16px 24px; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 10px; }
  .cd-close { width: 32px; height: 32px; border-radius: 8px; border: 1px solid var(--border); background: var(--surface-2); color: var(--text-2); font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: var(--ease); }
  .cd-close:hover { background: var(--surface-3); color: var(--text); }

  /* ── FORM ── */
  .cd-form-group { margin-bottom: 16px; }
  .cd-label { display: block; font-size: 12px; font-weight: 700; color: var(--text-2); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.03em; }
  .cd-input { width: 100%; padding: 9px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 13px; color: var(--text); background: var(--surface); outline: none; font-family: inherit; transition: border-color 0.15s, box-shadow 0.15s; }
  .cd-input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(13,148,136,0.1); }
  .cd-select { appearance: none; cursor: pointer; background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%234a5e73' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e"); background-repeat: no-repeat; background-position: right 10px center; background-size: 18px; padding-right: 36px; }
  .cd-textarea { resize: vertical; min-height: 80px; }
  .cd-row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

  /* ── SETTINGS ── */
  .cd-settings-grid { display: grid; grid-template-columns: 220px 1fr; gap: 24px; }
  .cd-settings-nav { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 8px; }
  .cd-settings-nav-item { padding: 10px 14px; border-radius: var(--radius-sm); font-size: 13px; font-weight: 600; color: var(--text-2); cursor: pointer; transition: var(--ease); display: flex; align-items: center; gap: 10px; }
  .cd-settings-nav-item:hover { background: var(--surface-2); color: var(--text); }
  .cd-settings-nav-item.active { background: var(--teal-light); color: var(--teal); }
  .cd-settings-panel { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 24px; }
  .cd-settings-row { display: flex; align-items: center; justify-content: space-between; padding: 14px 0; border-bottom: 1px solid var(--border); gap: 24px; }
  .cd-settings-row:last-child { border-bottom: none; }
  .cd-settings-row h4 { font-size: 13.5px; font-weight: 700; color: var(--text); margin-bottom: 2px; }
  .cd-settings-row p { font-size: 12px; color: var(--text-2); }
  .cd-toggle { width: 44px; height: 24px; border-radius: 100px; background: var(--surface-3); border: none; cursor: pointer; position: relative; transition: background 0.2s; flex-shrink: 0; }
  .cd-toggle::after { content: ''; width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 3px; left: 3px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); transition: transform 0.2s; }
  .cd-toggle.on { background: var(--teal); }
  .cd-toggle.on::after { transform: translateX(20px); }

  /* ── RESOURCE CARD ── */
  .cd-res-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius); padding: 20px; transition: var(--ease); }
  .cd-res-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .cd-res-icon { font-size: 26px; margin-bottom: 10px; }
  .cd-res-card h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 6px; }
  .cd-res-card p { font-size: 12px; color: var(--text-2); line-height: 1.55; }
  .cd-res-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }

  /* ── MINI BAR CHART ── */
  .cd-bar-chart { display: flex; align-items: flex-end; gap: 6px; height: 80px; padding-top: 8px; }
  .cd-bar-wrap { flex: 1; display: flex; gap: 2px; align-items: flex-end; min-width: 24px; }
  .cd-bar { flex: 1; border-radius: 3px 3px 0 0; transition: var(--ease); min-width: 8px; }
  .cd-bar:hover { opacity: 0.8; }
  .cd-bar-session { background: var(--teal); }
  .cd-bar-resolved { background: var(--teal-light); border: 1px solid var(--teal); }
  .cd-bar-labels { display: flex; gap: 6px; margin-top: 8px; }
  .cd-bar-label { flex: 1; text-align: center; font-size: 10px; color: var(--text-3); font-weight: 600; }

  /* ── TOAST ── */
  .cd-toast-wrap { position: fixed; bottom: 24px; right: 24px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
  .cd-toast { background: var(--navy); color: #fff; padding: 12px 18px; border-radius: var(--radius); font-size: 13px; font-weight: 600; box-shadow: var(--shadow-lg); display: flex; align-items: center; gap: 10px; animation: cdToast 0.25s ease; max-width: 320px; }
  .cd-toast.success { background: #15803d; }
  .cd-toast.error { background: #be123c; }
  @keyframes cdToast { from { opacity:0; transform: translateY(16px); } to { opacity:1; transform:none; } }

  /* ── MOBILE ── */
  .cd-mobile-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 190; }
  .cd-mobile-overlay.visible { display: block; }
  .cd-mobile-btn { display: none; background: none; border: none; cursor: pointer; color: var(--text); padding: 6px; }

  /* ── ANONYMOUS BANNER ── */
  .cd-anon-banner { display: flex; align-items: center; gap: 10px; background: var(--teal-light); border: 1px solid #99f6e4; border-radius: var(--radius-sm); padding: 10px 14px; margin-bottom: 20px; font-size: 12.5px; color: #0f766e; font-weight: 600; }

  /* ── DETAIL PANEL ── */
  .cd-detail-row { display: flex; align-items: flex-start; gap: 14px; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .cd-detail-row:last-child { border-bottom: none; }
  .cd-detail-label { font-size: 11px; font-weight: 700; text-transform: uppercase; color: var(--text-3); min-width: 130px; flex-shrink: 0; padding-top: 1px; letter-spacing: 0.04em; }
  .cd-detail-val { font-size: 13px; color: var(--text); font-weight: 500; }

  @media (max-width: 1100px) { .cd-chat-layout { grid-template-columns: 280px 1fr; } }
  @media (max-width: 1024px) { .cd-kpi-grid { grid-template-columns: repeat(2, 1fr); } .cd-grid-2, .cd-grid-3 { grid-template-columns: 1fr; } .cd-settings-grid { grid-template-columns: 1fr; } .cd-chat-layout { grid-template-columns: 1fr; } .cd-search { width: 160px; } }
  @media (max-width: 768px) { .cd-topbar { left: 0 !important; padding: 0 16px; } .cd-main { margin-left: 0 !important; } .cd-mobile-btn { display: flex; } .cd-search { display: none; } .cd-content { padding: 20px 16px; } .cd-kpi-grid { grid-template-columns: 1fr 1fr; } .cd-row-2 { grid-template-columns: 1fr; } }
  @media (max-width: 480px) { .cd-kpi-grid { grid-template-columns: 1fr; } }
`;

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function timeAgo(ts: number) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function fmtTime(ts: number) {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const categoryIcon: Record<CaseCategory | string, string> = {
  Harassment: "⚠️",
  Blackmail: "🔒",
  Stalking: "👁️",
  "Domestic Violence": "🏠",
  Cybercrime: "💻",
  Assault: "🚨",
  Other: "📋",
};

const statusChip: Record<ChatStatus, { cls: string; label: string }> = {
  waiting: { cls: "chip chip-red", label: "⏳ Waiting" },
  active: { cls: "chip chip-teal", label: "● Active" },
  escalated: { cls: "chip chip-amber", label: "⬆ Escalated" },
  "on-hold": { cls: "chip chip-gray", label: "⏸ On Hold" },
  closed: { cls: "chip chip-green", label: "✓ Closed" },
};

const quickReplies = [
  "You're safe here 🛡️",
  "Take your time",
  "Can you share more details?",
  "This is a serious offence",
  "Would you like us to contact police?",
  "Your identity is protected",
];

// ─── TOAST HOOK ───────────────────────────────────────────────────────────────

type ToastT = { id: number; msg: string; type?: "success" | "error" | "info" };
function useToast() {
  const [toasts, setToasts] = useState<ToastT[]>([]);
  const show = useCallback((msg: string, type: ToastT["type"] = "info") => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 3500);
  }, []);
  return { toasts, show };
}

// ─── INTERFACES ───────────────────────────────────────────────────────────────

interface CounsellorDashboardProps {
  userName: string;
  onLogout: () => void;
}

// ─── SECTIONS ────────────────────────────────────────────────────────────────

// Overview
const OverviewSection: React.FC<{
  sessions: ChatSession[];
  onGoQueue: () => void;
  onGoChat: (id: string) => void;
}> = ({ sessions, onGoQueue, onGoChat }) => {
  const waiting = sessions.filter((s) => s.status === "waiting");
  const active = sessions.filter((s) => s.status === "active");
  const escalated = sessions.filter((s) => s.status === "escalated");
  const resolved = sessions.filter((s) => s.status === "closed");

  const maxBar = Math.max(...weeklyData.map((d) => d.sessions));

  return (
    <div>
      <div className="cd-anon-banner">
        <FontAwesomeIcon icon={faUserSecret} />
        <span>
          All chats are <strong>end-to-end encrypted</strong> and{" "}
          <strong>fully anonymous</strong>. No personal data is ever stored or
          shared without user consent.
        </span>
      </div>

      <div className="cd-kpi-grid">
        {[
          {
            label: "Waiting",
            val: waiting.length,
            icon: faInbox,
            kc: "#e11d48",
            kb: "#ffe4e6",
            trend: waiting.length > 0 ? "Needs response" : "All clear",
            dir: waiting.length > 0 ? "down" : "up",
          },
          {
            label: "Active Sessions",
            val: active.length,
            icon: faComments,
            kc: "#0d9488",
            kb: "#ccfbf1",
            trend: "In progress",
            dir: "neutral",
          },
          {
            label: "Escalated",
            val: escalated.length,
            icon: faTriangleExclamation,
            kc: "#f59e0b",
            kb: "#fef3c7",
            trend: "To police",
            dir: "neutral",
          },
          {
            label: "Resolved Today",
            val: resolved.length,
            icon: faCircleCheck,
            kc: "#22c55e",
            kb: "#dcfce7",
            trend: "Closed safely",
            dir: "up",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="cd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="cd-kpi-head">
              <div className="cd-kpi-icon">
                <FontAwesomeIcon icon={k.icon} />
              </div>
              <span className={`cd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="cd-kpi-val">{k.val}</div>
            <div className="cd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="cd-grid-2" style={{ marginBottom: 20 }}>
        {/* Weekly chart */}
        <div className="cd-card">
          <div className="cd-card-header">
            <div>
              <h3>
                <FontAwesomeIcon
                  icon={faChartBar}
                  style={{ marginRight: 8, color: "var(--teal)" }}
                />
                Weekly Session Volume
              </h3>
              <p>Sessions opened vs. resolved this week</p>
            </div>
          </div>
          <div className="cd-card-body">
            <div className="cd-bar-chart">
              {weeklyData.map((d, i) => (
                <div
                  key={i}
                  className="cd-bar-wrap"
                  title={`${d.day}: ${d.sessions} sessions`}
                >
                  <div
                    className="cd-bar cd-bar-resolved"
                    style={{ height: `${(d.resolved / maxBar) * 100}%` }}
                  />
                  <div
                    className="cd-bar cd-bar-session"
                    style={{
                      height: `${((d.sessions - d.resolved) / maxBar) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="cd-bar-labels">
              {weeklyData.map((d, i) => (
                <div key={i} className="cd-bar-label">
                  {d.day}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 16, marginTop: 12 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 8,
                    background: "var(--teal)",
                    borderRadius: 2,
                    display: "inline-block",
                  }}
                />
                Open
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 11,
                }}
              >
                <span
                  style={{
                    width: 12,
                    height: 8,
                    background: "var(--teal-light)",
                    border: "1px solid var(--teal)",
                    borderRadius: 2,
                    display: "inline-block",
                  }}
                />
                Resolved
              </div>
            </div>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="cd-card">
          <div className="cd-card-header">
            <div>
              <h3>📊 Category Breakdown</h3>
              <p>All time · session types</p>
            </div>
          </div>
          <div className="cd-card-body">
            {[
              { cat: "Harassment", count: 14, pct: 35, color: "#f59e0b" },
              { cat: "Blackmail", count: 8, pct: 20, color: "#e11d48" },
              { cat: "Stalking", count: 7, pct: 18, color: "#8b5cf6" },
              { cat: "Domestic Violence", count: 5, pct: 12, color: "#f97316" },
              { cat: "Cybercrime", count: 4, pct: 10, color: "#3b82f6" },
              { cat: "Other", count: 2, pct: 5, color: "#94a3b8" },
            ].map((c, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                }}
              >
                <span style={{ fontSize: 13, minWidth: 24 }}>
                  {categoryIcon[c.cat]}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text)",
                    minWidth: 130,
                  }}
                >
                  {c.cat}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 6,
                    background: "var(--surface-3)",
                    borderRadius: 100,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${c.pct}%`,
                      height: "100%",
                      background: c.color,
                      borderRadius: 100,
                      transition: "width 1s ease",
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: "var(--text-2)",
                    fontWeight: 700,
                    minWidth: 30,
                    textAlign: "right",
                  }}
                >
                  {c.count}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Urgent queue */}
      <div className="cd-sec-header">
        <div>
          <div className="cd-sec-title">🔴 Urgent — Waiting Sessions</div>
          <div className="cd-sec-sub">
            These users are waiting for a counsellor right now
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div className="cd-live">
            <span className="cd-live-dot" />
            LIVE
          </div>
          <button className="cd-btn cd-btn-teal cd-btn-sm" onClick={onGoQueue}>
            <FontAwesomeIcon icon={faInbox} /> View All Queue
          </button>
        </div>
      </div>

      {waiting.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "32px",
            color: "var(--text-2)",
            fontSize: 13,
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          🎉 No one waiting right now. All sessions attended to.
        </div>
      )}

      {waiting.map((s) => (
        <div
          key={s.id}
          className={`cd-queue-item waiting`}
          onClick={() => onGoChat(s.id)}
        >
          <div className="cd-queue-anon">
            <FontAwesomeIcon icon={faUserSecret} />
          </div>
          <div className="cd-queue-body">
            <div className="cd-queue-id">{s.anonymousId}</div>
            <div className="cd-queue-msg">{s.lastMessage}</div>
            <div className="cd-queue-meta">
              <span>📂 {s.category}</span>
              <span>⏱ {timeAgo(s.startedAt)}</span>
              {s.location && <span>📍 {s.location}</span>}
            </div>
          </div>
          <div className="cd-queue-right">
            <span className={`pri pri-${s.priority}`}>{s.priority}</span>
            <button
              className="cd-btn cd-btn-teal cd-btn-sm"
              onClick={(e) => {
                e.stopPropagation();
                onGoChat(s.id);
              }}
            >
              Accept
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Queue Management
const QueueSection: React.FC<{
  sessions: ChatSession[];
  onOpenChat: (id: string) => void;
  showToast: (m: string, t?: ToastT["type"]) => void;
}> = ({ sessions, onOpenChat, showToast }) => {
  const [filter, setFilter] = useState<string>("All");
  const [catFilter, setCatFilter] = useState<string>("All");

  const filtered = sessions.filter(
    (s) =>
      (filter === "All" || s.status === filter) &&
      (catFilter === "All" || s.category === catFilter),
  );

  return (
    <div>
      <div className="cd-kpi-grid">
        {(["waiting", "active", "on-hold", "escalated"] as const).map(
          (st, i) => {
            const count = sessions.filter((s) => s.status === st).length;
            const meta = [
              { kc: "#e11d48", kb: "#ffe4e6", icon: faInbox, lbl: "Waiting" },
              { kc: "#0d9488", kb: "#ccfbf1", icon: faComments, lbl: "Active" },
              {
                kc: "#94a3b8",
                kb: "#f1f5f9",
                icon: faClockRotateLeft,
                lbl: "On Hold",
              },
              {
                kc: "#f59e0b",
                kb: "#fef3c7",
                icon: faTriangleExclamation,
                lbl: "Escalated",
              },
            ][i];
            return (
              <div
                key={st}
                className="cd-kpi"
                style={{ "--kc": meta.kc, "--kb": meta.kb } as any}
              >
                <div className="cd-kpi-head">
                  <div className="cd-kpi-icon">
                    <FontAwesomeIcon icon={meta.icon} />
                  </div>
                </div>
                <div className="cd-kpi-val">{count}</div>
                <div className="cd-kpi-lbl">{meta.lbl}</div>
              </div>
            );
          },
        )}
      </div>

      <div className="cd-sec-header">
        <div>
          <div className="cd-sec-title">Session Queue</div>
          <div className="cd-sec-sub">
            All incoming and active anonymous sessions
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {["All", "waiting", "active", "on-hold", "escalated", "closed"].map(
            (f) => (
              <button
                key={f}
                className={`cd-btn cd-btn-sm ${filter === f ? "cd-btn-teal" : "cd-btn-secondary"}`}
                onClick={() => setFilter(f)}
              >
                {f === "All" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ),
          )}
          <select
            className="cd-input cd-select"
            style={{
              padding: "5px 32px 5px 10px",
              fontSize: 12,
              height: 32,
              width: "auto",
            }}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            {[
              "All",
              "Harassment",
              "Blackmail",
              "Stalking",
              "Domestic Violence",
              "Cybercrime",
              "Assault",
              "Other",
            ].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {filtered.map((s) => {
        const unread = s.messages.filter(
          (m) => m.sender === "user" && !m.isRead,
        ).length;
        return (
          <div key={s.id} className={`cd-queue-item ${s.status}`}>
            <div className="cd-queue-anon" style={{ position: "relative" }}>
              <FontAwesomeIcon icon={faUserSecret} />
              {unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -4,
                    background: "var(--rose)",
                    color: "#fff",
                    fontSize: 9,
                    fontWeight: 800,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #fff",
                  }}
                >
                  {unread}
                </span>
              )}
            </div>
            <div className="cd-queue-body">
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  alignItems: "center",
                  marginBottom: 3,
                }}
              >
                <span className="cd-queue-id">{s.anonymousId}</span>
                {s.caseRef && (
                  <span
                    className="mono"
                    style={{ fontSize: 10, color: "var(--text-3)" }}
                  >
                    {s.caseRef}
                  </span>
                )}
              </div>
              <div className="cd-queue-msg">{s.lastMessage}</div>
              <div className="cd-queue-meta">
                <span>
                  {categoryIcon[s.category]} {s.category}
                </span>
                <span>⏱ {timeAgo(s.lastMessageAt)}</span>
                {s.location && <span>📍 {s.location}</span>}
                {s.assignedCounsellor && <span>👤 {s.assignedCounsellor}</span>}
              </div>
            </div>
            <div className="cd-queue-right">
              <span className={statusChip[s.status].cls}>
                {statusChip[s.status].label}
              </span>
              <span className={`pri pri-${s.priority}`}>{s.priority}</span>
              {(s.status === "waiting" || s.status === "active") && (
                <button
                  className="cd-btn cd-btn-teal cd-btn-sm"
                  onClick={() => onOpenChat(s.id)}
                >
                  {s.status === "waiting" ? "Accept" : "Continue"}
                </button>
              )}
            </div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 40,
            color: "var(--text-2)",
            fontSize: 13,
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          No sessions match this filter
        </div>
      )}
    </div>
  );
};

// Chat Section
const ChatSection: React.FC<{
  sessions: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onUpdateSessions: (updater: (prev: ChatSession[]) => ChatSession[]) => void;
  showToast: (m: string, t?: ToastT["type"]) => void;
  counsellorName: string;
}> = ({
  sessions,
  activeChatId,
  onSelectChat,
  onUpdateSessions,
  showToast,
  counsellorName,
}) => {
  const [input, setInput] = useState("");
  const [notes, setNotes] = useState("");
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateTo, setEscalateTo] = useState("Guwahati Police Station");
  const [escalateNote, setEscalateNote] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeChatId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeSession?.messages.length]);

  const sendMessage = () => {
    if (!input.trim() || !activeChatId) return;
    const msg: Message = {
      id: `m-${Date.now()}`,
      sender: "counsellor",
      text: input.trim(),
      timestamp: Date.now(),
      isRead: false,
    };
    onUpdateSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? {
              ...s,
              messages: [...s.messages, msg],
              lastMessage: input.trim(),
              lastMessageAt: Date.now(),
              status: s.status === "waiting" ? "active" : s.status,
              assignedCounsellor: s.assignedCounsellor || counsellorName,
            }
          : s,
      ),
    );
    setInput("");
  };

  const escalateCase = () => {
    if (!activeChatId) return;
    onUpdateSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? {
              ...s,
              status: "escalated",
              escalatedTo: escalateTo,
              lastMessage: `Case escalated to ${escalateTo}`,
              lastMessageAt: Date.now(),
              messages: [
                ...s.messages,
                {
                  id: `sys-${Date.now()}`,
                  sender: "counsellor",
                  text: `🚨 This case has been escalated to ${escalateTo}. You will be contacted by an officer. Your safety is our priority.`,
                  timestamp: Date.now(),
                  isRead: false,
                },
              ],
            }
          : s,
      ),
    );
    setShowEscalate(false);
    showToast(`Case escalated to ${escalateTo}`, "success");
  };

  const closeSession = () => {
    if (!activeChatId) return;
    onUpdateSessions((prev) =>
      prev.map((s) =>
        s.id === activeChatId
          ? {
              ...s,
              status: "closed",
              lastMessage: "Session closed by counsellor.",
              lastMessageAt: Date.now(),
            }
          : s,
      ),
    );
    showToast("Session closed", "success");
  };

  const sortedSessions = [...sessions].sort((a, b) => {
    const order: Record<ChatStatus, number> = {
      waiting: 0,
      active: 1,
      escalated: 2,
      "on-hold": 3,
      closed: 4,
    };
    return order[a.status] - order[b.status];
  });

  return (
    <div className="cd-chat-layout">
      {/* Left sidebar — session list */}
      <div className="cd-chat-sidebar">
        <div className="cd-chat-sidebar-header">
          <h3>Conversations</h3>
          <div className="cd-search" style={{ width: "100%" }}>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              style={{ color: "var(--text-3)", fontSize: 12 }}
            />
            <input placeholder="Search sessions…" />
          </div>
        </div>
        <div className="cd-chat-list">
          {sortedSessions.map((s) => {
            const unread = s.messages.filter(
              (m) => m.sender === "user" && !m.isRead,
            ).length;
            return (
              <div
                key={s.id}
                className={`cd-chat-list-item ${activeChatId === s.id ? "active" : ""}`}
                onClick={() => onSelectChat(s.id)}
              >
                <div className="cd-chat-list-avatar">
                  <FontAwesomeIcon icon={faUserSecret} />
                  {unread > 0 && <span className="unread-dot" />}
                </div>
                <div className="cd-chat-list-info">
                  <div className="cd-chat-list-top">
                    <span className="cd-chat-list-name">{s.anonymousId}</span>
                    <span className="cd-chat-list-time">
                      {timeAgo(s.lastMessageAt)}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6, marginBottom: 3 }}>
                    <span
                      style={{
                        fontSize: 10,
                        background:
                          s.status === "waiting"
                            ? "#ffe4e6"
                            : s.status === "active"
                              ? "#ccfbf1"
                              : "#fef3c7",
                        color:
                          s.status === "waiting"
                            ? "#be123c"
                            : s.status === "active"
                              ? "#0f766e"
                              : "#b45309",
                        padding: "1px 7px",
                        borderRadius: 100,
                        fontWeight: 700,
                      }}
                    >
                      {s.status}
                    </span>
                    <span style={{ fontSize: 10, color: "var(--text-3)" }}>
                      {s.category}
                    </span>
                  </div>
                  <div className="cd-chat-list-preview">{s.lastMessage}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main chat */}
      {activeSession ? (
        <div className="cd-chat-main">
          <div className="cd-chat-topbar">
            <div className="cd-chat-identity">
              <div className="cd-chat-avatar">
                <FontAwesomeIcon icon={faUserSecret} />
              </div>
              <div>
                <div className="cd-chat-name">{activeSession.anonymousId}</div>
                <div className="cd-chat-sub">
                  {categoryIcon[activeSession.category]}{" "}
                  {activeSession.category} ·{" "}
                  <span className={`pri pri-${activeSession.priority}`}>
                    {activeSession.priority}
                  </span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="cd-btn cd-btn-secondary cd-btn-sm"
                onClick={() => setShowEscalate(!showEscalate)}
              >
                <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> Escalate to
                Police
              </button>
              {activeSession.status !== "closed" && (
                <button
                  className="cd-btn cd-btn-outline-danger cd-btn-sm"
                  onClick={closeSession}
                >
                  <FontAwesomeIcon icon={faCircleXmark} /> Close Session
                </button>
              )}
            </div>
          </div>

          {/* Escalate panel */}
          {showEscalate && (
            <div
              style={{
                padding: "14px 20px",
                borderBottom: "1px solid var(--border)",
                background: "#fff8f0",
              }}
            >
              <div className="cd-escalation-card">
                <h4>
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    style={{ marginRight: 6 }}
                  />
                  Escalate to Police / Helpline
                </h4>
                <div className="cd-row-2">
                  <div className="cd-form-group" style={{ marginBottom: 10 }}>
                    <label className="cd-label">Escalate To</label>
                    <select
                      className="cd-input cd-select"
                      value={escalateTo}
                      onChange={(e) => setEscalateTo(e.target.value)}
                    >
                      {[
                        "Guwahati Police Station",
                        "Dibrugarh Police Station",
                        "Women Helpline 181",
                        "NCW Helpline",
                        "Assam State Legal Services",
                        "Cyber Crime Cell",
                      ].map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>
                  </div>
                  <div className="cd-form-group" style={{ marginBottom: 10 }}>
                    <label className="cd-label">Reason / Note</label>
                    <input
                      className="cd-input"
                      placeholder="Brief escalation reason"
                      value={escalateNote}
                      onChange={(e) => setEscalateNote(e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    className="cd-btn cd-btn-amber cd-btn-sm"
                    onClick={escalateCase}
                  >
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} /> Confirm
                    Escalation
                  </button>
                  <button
                    className="cd-btn cd-btn-ghost cd-btn-sm"
                    onClick={() => setShowEscalate(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Messages */}
          <div className="cd-messages">
            <div className="cd-chat-system-msg">
              <FontAwesomeIcon icon={faLock} style={{ marginRight: 5 }} />
              Session started · All messages are encrypted ·{" "}
              {new Date(activeSession.startedAt).toLocaleString()}
            </div>

            {activeSession.messages.map((msg) => (
              <div key={msg.id} className={`cd-msg ${msg.sender}`}>
                <div className="cd-msg-avatar">
                  <FontAwesomeIcon
                    icon={msg.sender === "user" ? faUserSecret : faUserShield}
                  />
                </div>
                <div className="cd-msg-bubble">
                  <div className="cd-msg-text">{msg.text}</div>
                  <div className="cd-msg-time">{fmtTime(msg.timestamp)}</div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Session info strip */}
          <div className="cd-chat-info-panel">
            {activeSession.location && (
              <div className="cd-info-pill">
                <FontAwesomeIcon icon={faLocationDot} />
                <strong>Location:</strong> {activeSession.location}
              </div>
            )}
            <div className="cd-info-pill">
              <FontAwesomeIcon icon={faTag} />
              <strong>Category:</strong> {activeSession.category}
            </div>
            <div className="cd-info-pill">
              <FontAwesomeIcon icon={faCalendarDays} />
              <strong>Started:</strong> {timeAgo(activeSession.startedAt)}
            </div>
            {activeSession.caseRef && (
              <div className="cd-info-pill">
                <FontAwesomeIcon icon={faFileLines} />
                <strong>Ref:</strong> {activeSession.caseRef}
              </div>
            )}
          </div>

          {/* Case notes */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid var(--border)",
              background: "var(--surface-2)",
            }}
          >
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div className="cd-label" style={{ marginBottom: 4 }}>
                  <FontAwesomeIcon
                    icon={faClipboardList}
                    style={{ marginRight: 6 }}
                  />
                  Case Notes (Private)
                </div>
                <textarea
                  className="cd-note-box"
                  style={{ minHeight: 50 }}
                  placeholder="Add private notes about this session…"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <button
                className="cd-btn cd-btn-secondary cd-btn-sm"
                style={{ marginTop: 22 }}
                onClick={() => showToast("Notes saved", "success")}
              >
                <FontAwesomeIcon icon={faCheck} /> Save
              </button>
            </div>
          </div>

          {/* Quick replies + input */}
          <div className="cd-chat-input-area">
            {activeSession.status !== "closed" && (
              <>
                <div className="cd-quick-replies">
                  {quickReplies.map((r, i) => (
                    <button
                      key={i}
                      className="cd-quick-reply"
                      onClick={() => setInput(r)}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <div className="cd-input-row">
                  <textarea
                    className="cd-input-box"
                    placeholder="Type your response… (Enter to send, Shift+Enter for new line)"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    rows={1}
                  />
                  <button className="cd-send-btn" onClick={sendMessage}>
                    <FontAwesomeIcon icon={faPaperPlane} />
                  </button>
                </div>
              </>
            )}
            {activeSession.status === "closed" && (
              <div
                style={{
                  textAlign: "center",
                  padding: "12px",
                  color: "var(--text-2)",
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <FontAwesomeIcon
                  icon={faCircleCheck}
                  style={{ color: "var(--green)", marginRight: 8 }}
                />
                This session has been closed.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div
          className="cd-chat-main"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 48, opacity: 0.2 }}>
            <FontAwesomeIcon icon={faComments} />
          </div>
          <p style={{ color: "var(--text-2)", fontSize: 14 }}>
            Select a session from the left to start counselling
          </p>
          <p style={{ color: "var(--text-3)", fontSize: 12 }}>
            All conversations are anonymous and encrypted
          </p>
        </div>
      )}
    </div>
  );
};

// Session History
const HistorySection: React.FC<{
  sessions: ChatSession[];
  showToast: (m: string, t?: ToastT["type"]) => void;
}> = ({ sessions, showToast }) => {
  const [detail, setDetail] = useState<ChatSession | null>(null);
  const [search, setSearch] = useState("");

  const filtered = sessions.filter(
    (s) =>
      s.anonymousId.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      (s.caseRef || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <div className="cd-sec-header">
        <div>
          <div className="cd-sec-title">Session History</div>
          <div className="cd-sec-sub">
            All counselling sessions · full audit trail
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="cd-search" style={{ width: 240 }}>
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              style={{ color: "var(--text-3)", fontSize: 12 }}
            />
            <input
              placeholder="Search by ID, category, ref…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="cd-btn cd-btn-secondary cd-btn-sm">
            <FontAwesomeIcon icon={faDownload} /> Export
          </button>
        </div>
      </div>

      <div className="cd-table-wrap">
        <div className="cd-table-scroll">
          <table className="cd-table" style={{ minWidth: 750 }}>
            <thead>
              <tr>
                {[
                  "Session ID",
                  "Category",
                  "Priority",
                  "Counsellor",
                  "Started",
                  "Last Activity",
                  "Messages",
                  "Status",
                  "Ref",
                  "Action",
                ].map((h) => (
                  <th key={h}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span
                      className="mono"
                      style={{ color: "var(--teal)", fontWeight: 700 }}
                    >
                      {s.anonymousId}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontSize: 14 }}>
                      {categoryIcon[s.category]}
                    </span>{" "}
                    {s.category}
                  </td>
                  <td>
                    <span className={`pri pri-${s.priority}`}>
                      {s.priority}
                    </span>
                  </td>
                  <td>
                    {s.assignedCounsellor || (
                      <span style={{ color: "var(--text-3)" }}>Unassigned</span>
                    )}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {new Date(s.startedAt).toLocaleDateString()}
                  </td>
                  <td style={{ fontSize: 12, color: "var(--text-2)" }}>
                    {timeAgo(s.lastMessageAt)}
                  </td>
                  <td>
                    <span className="chip chip-gray">
                      {s.messages.length} msgs
                    </span>
                  </td>
                  <td>
                    <span className={statusChip[s.status].cls}>
                      {statusChip[s.status].label}
                    </span>
                  </td>
                  <td>
                    {s.caseRef ? (
                      <span
                        className="mono"
                        style={{ fontSize: 11, color: "var(--teal)" }}
                      >
                        {s.caseRef}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-3)", fontSize: 12 }}>
                        —
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="cd-btn cd-btn-ghost cd-btn-sm"
                        onClick={() => setDetail(s)}
                      >
                        <FontAwesomeIcon icon={faEye} /> View
                      </button>
                      <button
                        className="cd-btn cd-btn-ghost cd-btn-sm"
                        onClick={() => showToast("Report generated")}
                      >
                        <FontAwesomeIcon icon={faDownload} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={10}
                    style={{
                      textAlign: "center",
                      padding: 40,
                      color: "var(--text-2)",
                    }}
                  >
                    No sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="cd-overlay" onClick={() => setDetail(null)}>
          <div
            className="cd-modal cd-modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cd-modal-header">
              <div>
                <h2>
                  <FontAwesomeIcon
                    icon={faUserSecret}
                    style={{ marginRight: 8 }}
                  />
                  {detail.anonymousId}
                </h2>
                <p
                  style={{ fontSize: 12, color: "var(--text-2)", marginTop: 2 }}
                >
                  {detail.category} ·{" "}
                  {new Date(detail.startedAt).toLocaleString()}
                </p>
              </div>
              <button className="cd-close" onClick={() => setDetail(null)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="cd-modal-body">
              <div className="cd-detail-row">
                <span className="cd-detail-label">Session ID</span>
                <span className="cd-detail-val mono">{detail.id}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-label">Anonymous ID</span>
                <span className="cd-detail-val mono">{detail.anonymousId}</span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-label">Category</span>
                <span className="cd-detail-val">
                  {categoryIcon[detail.category]} {detail.category}
                </span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-label">Priority</span>
                <span className="cd-detail-val">
                  <span className={`pri pri-${detail.priority}`}>
                    {detail.priority}
                  </span>
                </span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-label">Status</span>
                <span className="cd-detail-val">
                  <span className={statusChip[detail.status].cls}>
                    {statusChip[detail.status].label}
                  </span>
                </span>
              </div>
              <div className="cd-detail-row">
                <span className="cd-detail-label">Counsellor</span>
                <span className="cd-detail-val">
                  {detail.assignedCounsellor || "Unassigned"}
                </span>
              </div>
              {detail.location && (
                <div className="cd-detail-row">
                  <span className="cd-detail-label">Location</span>
                  <span className="cd-detail-val">📍 {detail.location}</span>
                </div>
              )}
              {detail.escalatedTo && (
                <div className="cd-detail-row">
                  <span className="cd-detail-label">Escalated To</span>
                  <span className="cd-detail-val">⬆ {detail.escalatedTo}</span>
                </div>
              )}
              {detail.caseRef && (
                <div className="cd-detail-row">
                  <span className="cd-detail-label">Case Reference</span>
                  <span className="cd-detail-val mono">{detail.caseRef}</span>
                </div>
              )}
              <div className="cd-detail-row">
                <span className="cd-detail-label">Messages</span>
                <span className="cd-detail-val">
                  {detail.messages.length} total
                </span>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="cd-label">Chat Transcript</div>
                <div
                  style={{
                    maxHeight: 200,
                    overflowY: "auto",
                    background: "var(--surface-2)",
                    borderRadius: "var(--radius-sm)",
                    padding: 12,
                    marginTop: 6,
                  }}
                >
                  {detail.messages.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        marginBottom: 10,
                        textAlign: m.sender === "counsellor" ? "right" : "left",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--text-3)",
                          marginBottom: 2,
                        }}
                      >
                        {m.sender === "user" ? "User" : "Counsellor"} ·{" "}
                        {fmtTime(m.timestamp)}
                      </div>
                      <div
                        style={{
                          display: "inline-block",
                          background:
                            m.sender === "counsellor" ? "var(--teal)" : "#fff",
                          color:
                            m.sender === "counsellor" ? "#fff" : "var(--text)",
                          padding: "7px 12px",
                          borderRadius: 10,
                          fontSize: 12.5,
                          maxWidth: "80%",
                          textAlign: "left",
                          border:
                            m.sender === "user"
                              ? "1px solid var(--border)"
                              : "none",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="cd-modal-footer">
              <button
                className="cd-btn cd-btn-secondary"
                onClick={() => showToast("Report downloaded")}
              >
                <FontAwesomeIcon icon={faDownload} /> Download Report
              </button>
              <button
                className="cd-btn cd-btn-ghost"
                onClick={() => setDetail(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Escalations
const EscalationsSection: React.FC<{ sessions: ChatSession[] }> = ({
  sessions,
}) => {
  const escalated = sessions.filter((s) => s.status === "escalated");
  return (
    <div>
      <div className="cd-kpi-grid">
        {[
          {
            label: "Total Escalated",
            val: escalated.length,
            icon: faArrowUpRightFromSquare,
            kc: "#f59e0b",
            kb: "#fef3c7",
          },
          {
            label: "To Police",
            val: escalated.filter((s) => s.escalatedTo?.includes("Police"))
              .length,
            icon: faShieldHalved,
            kc: "#1d6fa4",
            kb: "#dbeafe",
          },
          {
            label: "To Helpline",
            val: escalated.filter((s) => s.escalatedTo?.includes("Helpline"))
              .length,
            icon: faPhone,
            kc: "#22c55e",
            kb: "#dcfce7",
          },
          {
            label: "Pending Response",
            val: escalated.length,
            icon: faClockRotateLeft,
            kc: "#e11d48",
            kb: "#ffe4e6",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="cd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="cd-kpi-head">
              <div className="cd-kpi-icon">
                <FontAwesomeIcon icon={k.icon} />
              </div>
            </div>
            <div className="cd-kpi-val">{k.val}</div>
            <div className="cd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="cd-sec-header">
        <div>
          <div className="cd-sec-title">Escalation Tracker</div>
          <div className="cd-sec-sub">
            Cases escalated to police or external helplines
          </div>
        </div>
      </div>

      {escalated.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 48,
            color: "var(--text-2)",
            fontSize: 13,
            background: "var(--surface)",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 36, opacity: 0.2, marginBottom: 10 }}>
            <FontAwesomeIcon icon={faCircleCheck} />
          </div>
          No escalations currently active.
        </div>
      )}

      {escalated.map((s) => (
        <div
          key={s.id}
          style={{
            background: "var(--surface)",
            border: "1px solid #fed7aa",
            borderLeft: "4px solid var(--amber)",
            borderRadius: "var(--radius)",
            padding: 18,
            marginBottom: 12,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 10,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  marginBottom: 4,
                }}
              >
                <span
                  className="mono"
                  style={{
                    fontSize: 13,
                    color: "var(--teal)",
                    fontWeight: 800,
                  }}
                >
                  {s.anonymousId}
                </span>
                <span className={`chip chip-amber`}>⬆ Escalated</span>
                <span className={`pri pri-${s.priority}`}>{s.priority}</span>
              </div>
              <div
                style={{ fontSize: 13, color: "var(--text)", marginBottom: 4 }}
              >
                {categoryIcon[s.category]} <strong>{s.category}</strong>
              </div>
              {s.escalatedTo && (
                <div style={{ fontSize: 12, color: "var(--text-2)" }}>
                  <FontAwesomeIcon
                    icon={faArrowUpRightFromSquare}
                    style={{ marginRight: 5 }}
                  />
                  Escalated to: <strong>{s.escalatedTo}</strong>
                </div>
              )}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                {timeAgo(s.lastMessageAt)}
              </div>
              {s.assignedCounsellor && (
                <div
                  style={{ fontSize: 12, color: "var(--text-2)", marginTop: 4 }}
                >
                  👤 {s.assignedCounsellor}
                </div>
              )}
            </div>
          </div>
          <div
            style={{
              background: "#fff8f0",
              borderRadius: "var(--radius-sm)",
              padding: "10px 14px",
              fontSize: 12.5,
              color: "var(--text-2)",
              fontStyle: "italic",
            }}
          >
            "{s.lastMessage}"
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <button className="cd-btn cd-btn-secondary cd-btn-sm">
              <FontAwesomeIcon icon={faPhone} /> Contact Authority
            </button>
            <button className="cd-btn cd-btn-secondary cd-btn-sm">
              <FontAwesomeIcon icon={faFileLines} /> View Full Case
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Resources
const ResourcesSection: React.FC<{
  showToast: (m: string, t?: ToastT["type"]) => void;
  baseResources: Resource[];
}> = ({ showToast, baseResources }) => {
  const [resources, setResources] = useState<Resource[]>(baseResources);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "General",
    description: "",
    link: "",
    tags: "",
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    setResources((previous) => {
      const customResources = previous.filter((resource) =>
        resource.id.startsWith("USR-RES-"),
      );
      const merged = [...baseResources, ...customResources];
      const deduped = new Map<string, Resource>();
      merged.forEach((resource) => {
        if (!deduped.has(resource.id)) {
          deduped.set(resource.id, resource);
        }
      });
      return Array.from(deduped.values());
    });
  }, [baseResources]);

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.category.toLowerCase().includes(search.toLowerCase()) ||
      r.tags.some((t) => t.toLowerCase().includes(search.toLowerCase())),
  );

  const add = () => {
    if (!form.title || !form.description) {
      showToast("Fill required fields", "error");
      return;
    }
    setResources((p) => [
      ...p,
      {
        id: `USR-RES-${Date.now()}`,
        ...form,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        addedAt: new Date().toISOString().split("T")[0],
      },
    ]);
    setAddOpen(false);
    setForm({
      title: "",
      category: "General",
      description: "",
      link: "",
      tags: "",
    });
    showToast("Resource added", "success");
  };

  const catIcon: Record<string, string> = {
    Stalking: "👁️",
    Cybercrime: "💻",
    "Domestic Violence": "🏠",
    Harassment: "⚠️",
    General: "📚",
  };

  return (
    <div>
      <div className="cd-sec-header">
        <div>
          <div className="cd-sec-title">Safety Resource Library</div>
          <div className="cd-sec-sub">
            Guides and references for counsellors to share with users
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <div className="cd-search">
            <FontAwesomeIcon
              icon={faMagnifyingGlass}
              style={{ color: "var(--text-3)", fontSize: 12 }}
            />
            <input
              placeholder="Search resources…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="cd-btn cd-btn-teal"
            onClick={() => setAddOpen(true)}
          >
            <FontAwesomeIcon icon={faPlus} /> Add Resource
          </button>
        </div>
      </div>

      <div className="cd-grid-3">
        {filtered.map((r) => (
          <div key={r.id} className="cd-res-card">
            <div className="cd-res-icon">{catIcon[r.category] || "📋"}</div>
            <h3>{r.title}</h3>
            <p>{r.description}</p>
            <div className="cd-res-tags">
              {r.tags.map((t, i) => (
                <span
                  key={i}
                  className="chip chip-teal"
                  style={{ fontSize: 10 }}
                >
                  {t}
                </span>
              ))}
            </div>
            <div
              style={{ fontSize: 11, color: "var(--text-3)", marginTop: 10 }}
            >
              Added {r.addedAt}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {r.link && (
                <a href={r.link} className="cd-btn cd-btn-outline cd-btn-sm">
                  <FontAwesomeIcon icon={faLink} /> Open
                </a>
              )}
              <button
                className="cd-btn cd-btn-secondary cd-btn-sm"
                onClick={() => showToast("Link copied to clipboard")}
              >
                <FontAwesomeIcon icon={faCopy} /> Copy Link
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1/-1",
              textAlign: "center",
              padding: 40,
              color: "var(--text-2)",
              fontSize: 13,
            }}
          >
            No resources match your search.
          </div>
        )}
      </div>

      {addOpen && (
        <div className="cd-overlay" onClick={() => setAddOpen(false)}>
          <div className="cd-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cd-modal-header">
              <h2>Add Resource</h2>
              <button className="cd-close" onClick={() => setAddOpen(false)}>
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <div className="cd-modal-body">
              <div className="cd-form-group">
                <label className="cd-label">Title *</label>
                <input
                  className="cd-input"
                  placeholder="Resource title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                />
              </div>
              <div className="cd-row-2">
                <div className="cd-form-group">
                  <label className="cd-label">Category</label>
                  <select
                    className="cd-input cd-select"
                    value={form.category}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, category: e.target.value }))
                    }
                  >
                    {[
                      "General",
                      "Harassment",
                      "Stalking",
                      "Blackmail",
                      "Domestic Violence",
                      "Cybercrime",
                    ].map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="cd-form-group">
                  <label className="cd-label">Link (optional)</label>
                  <input
                    className="cd-input"
                    placeholder="https://…"
                    value={form.link}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, link: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="cd-form-group">
                <label className="cd-label">Description *</label>
                <textarea
                  className="cd-input cd-textarea"
                  placeholder="Brief description of this resource"
                  value={form.description}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, description: e.target.value }))
                  }
                />
              </div>
              <div className="cd-form-group">
                <label className="cd-label">Tags (comma separated)</label>
                <input
                  className="cd-input"
                  placeholder="e.g. Legal, Safety, Online"
                  value={form.tags}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tags: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="cd-modal-footer">
              <button
                className="cd-btn cd-btn-secondary"
                onClick={() => setAddOpen(false)}
              >
                Cancel
              </button>
              <button className="cd-btn cd-btn-teal" onClick={add}>
                <FontAwesomeIcon icon={faPlus} /> Add Resource
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Reports
const ReportsSection: React.FC = () => {
  const maxBar = Math.max(...weeklyData.map((d) => d.sessions));
  return (
    <div>
      <div className="cd-kpi-grid">
        {[
          {
            label: "Total Sessions",
            val: 40,
            icon: faComments,
            kc: "#0d9488",
            kb: "#ccfbf1",
            trend: "+12% this week",
            dir: "up",
          },
          {
            label: "Avg Response Time",
            val: "4 min",
            icon: faClockRotateLeft,
            kc: "#3b82f6",
            kb: "#dbeafe",
            trend: "Within target",
            dir: "up",
          },
          {
            label: "Resolution Rate",
            val: "78%",
            icon: faCircleCheck,
            kc: "#22c55e",
            kb: "#dcfce7",
            trend: "+5% from last week",
            dir: "up",
          },
          {
            label: "Escalation Rate",
            val: "12%",
            icon: faArrowUpRightFromSquare,
            kc: "#f59e0b",
            kb: "#fef3c7",
            trend: "In range",
            dir: "neutral",
          },
        ].map((k, i) => (
          <div
            key={i}
            className="cd-kpi"
            style={{ "--kc": k.kc, "--kb": k.kb } as any}
          >
            <div className="cd-kpi-head">
              <div className="cd-kpi-icon">
                <FontAwesomeIcon icon={k.icon} />
              </div>
              <span className={`cd-kpi-trend ${k.dir}`}>{k.trend}</span>
            </div>
            <div className="cd-kpi-val">{k.val}</div>
            <div className="cd-kpi-lbl">{k.label}</div>
          </div>
        ))}
      </div>

      <div className="cd-grid-2" style={{ marginBottom: 24 }}>
        <div className="cd-card">
          <div className="cd-card-header">
            <div>
              <h3>📈 Weekly Session Volume</h3>
              <p>Sessions opened vs resolved</p>
            </div>
            <button className="cd-btn cd-btn-secondary cd-btn-sm">
              <FontAwesomeIcon icon={faDownload} />
            </button>
          </div>
          <div className="cd-card-body">
            <div className="cd-bar-chart">
              {weeklyData.map((d, i) => (
                <div
                  key={i}
                  className="cd-bar-wrap"
                  title={`${d.day}: ${d.sessions} sessions`}
                >
                  <div
                    className="cd-bar cd-bar-resolved"
                    style={{ height: `${(d.resolved / maxBar) * 100}%` }}
                  />
                  <div
                    className="cd-bar cd-bar-session"
                    style={{
                      height: `${((d.sessions - d.resolved) / maxBar) * 100}%`,
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="cd-bar-labels">
              {weeklyData.map((d, i) => (
                <div key={i} className="cd-bar-label">
                  {d.day}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="cd-card">
          <div className="cd-card-header">
            <div>
              <h3>⏱ Response Time by Shift</h3>
              <p>Average first-response in minutes</p>
            </div>
          </div>
          <div className="cd-card-body">
            {[
              { shift: "Morning (6AM-2PM)", avg: 3.2, max: 8 },
              { shift: "Afternoon (2PM-10PM)", avg: 4.8, max: 8 },
              { shift: "Night (10PM-6AM)", avg: 7.1, max: 8 },
            ].map((s, i) => (
              <div key={i} style={{ marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 12,
                    fontWeight: 600,
                    marginBottom: 5,
                  }}
                >
                  <span>{s.shift}</span>
                  <span
                    style={{
                      color: s.avg < 5 ? "var(--teal)" : "var(--amber)",
                    }}
                  >
                    {s.avg} min avg
                  </span>
                </div>
                <div
                  style={{
                    height: 8,
                    background: "var(--surface-3)",
                    borderRadius: 100,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      width: `${(s.avg / s.max) * 100}%`,
                      height: "100%",
                      background: s.avg < 5 ? "var(--teal)" : "var(--amber)",
                      borderRadius: 100,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="cd-sec-header">
        <div>
          <div className="cd-sec-title">Downloadable Reports</div>
        </div>
      </div>
      <div className="cd-grid-3">
        {[
          {
            icon: "📊",
            title: "Monthly Counselling Summary",
            desc: "Session volumes, categories, resolution rates and counsellor performance.",
          },
          {
            icon: "🔴",
            title: "Escalation Log",
            desc: "All escalated cases with timestamps, escalation targets and outcomes.",
          },
          {
            icon: "⚖️",
            title: "Legal Referral Report",
            desc: "Cases referred to police or legal services. Court-ready summary format.",
          },
          {
            icon: "📱",
            title: "User Experience Report",
            desc: "Anonymous feedback on chat quality, response time and perceived safety.",
          },
          {
            icon: "👤",
            title: "Counsellor Workload Report",
            desc: "Sessions handled per counsellor, avg response time and closure rates.",
          },
          {
            icon: "🗺️",
            title: "Geographic Incident Map",
            desc: "Location-based breakdown of incident categories across NE India.",
          },
        ].map((r, i) => (
          <div key={i} className="cd-res-card">
            <div className="cd-res-icon">{r.icon}</div>
            <h3>{r.title}</h3>
            <p>{r.desc}</p>
            <div style={{ marginTop: 14, display: "flex", gap: 8 }}>
              <button className="cd-btn cd-btn-outline cd-btn-sm">View</button>
              <button className="cd-btn cd-btn-secondary cd-btn-sm">
                <FontAwesomeIcon icon={faDownload} /> Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Settings
const SettingsSection: React.FC<{
  showToast: (m: string, t?: ToastT["type"]) => void;
  counsellorName: string;
}> = ({ showToast, counsellorName }) => {
  const [tab, setTab] = useState("notifications");
  const [toggles, setToggles] = useState({
    new_session_alert: true,
    escalation_notify: true,
    session_timeout: true,
    anonymous_enforce: true,
    two_fa: true,
    transcript_log: true,
    auto_assign: false,
    night_mode: false,
  });
  const toggle = (k: keyof typeof toggles) => {
    setToggles((p) => ({ ...p, [k]: !p[k] }));
    showToast("Setting saved", "success");
  };

  const tabs = [
    { id: "notifications", label: "🔔 Notifications", icon: faBell },
    { id: "privacy", label: "🔒 Privacy & Security", icon: faLock },
    { id: "profile", label: "👤 My Profile", icon: faUserTie },
    { id: "system", label: "⚙️ System", icon: faGear },
  ];

  return (
    <div className="cd-settings-grid">
      <div className="cd-settings-nav">
        {tabs.map((t) => (
          <div
            key={t.id}
            className={`cd-settings-nav-item ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <FontAwesomeIcon icon={t.icon} style={{ fontSize: 13 }} />
            {t.label}
          </div>
        ))}
      </div>

      <div className="cd-settings-panel">
        {tab === "notifications" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Notification Preferences
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              How and when you receive alerts about sessions
            </p>
            {[
              {
                key: "new_session_alert",
                label: "New Session Alert",
                desc: "Notify when a new user joins the anonymous chat queue",
              },
              {
                key: "escalation_notify",
                label: "Escalation Updates",
                desc: "Get notified when an escalated case receives a response",
              },
              {
                key: "session_timeout",
                label: "Inactive Session Alert",
                desc: "Alert if a session has been inactive for more than 10 minutes",
              },
            ].map((s) => (
              <div key={s.key} className="cd-settings-row">
                <div>
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`cd-toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
          </>
        )}
        {tab === "privacy" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>
              Privacy & Security
            </h3>
            <p
              style={{ fontSize: 13, color: "var(--text-2)", marginBottom: 20 }}
            >
              Protecting user anonymity and system integrity
            </p>
            {[
              {
                key: "anonymous_enforce",
                label: "Enforce Full Anonymity",
                desc: "Never allow real identity to be revealed in any session log",
              },
              {
                key: "two_fa",
                label: "Two-Factor Authentication",
                desc: "Require OTP for counsellor login to prevent unauthorised access",
              },
              {
                key: "transcript_log",
                label: "Encrypted Transcript Logging",
                desc: "Store all session transcripts with AES-256 encryption",
              },
            ].map((s) => (
              <div key={s.key} className="cd-settings-row">
                <div>
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`cd-toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="cd-settings-row">
              <div>
                <h4>Change Password</h4>
                <p>Last changed 21 days ago</p>
              </div>
              <button
                className="cd-btn cd-btn-secondary cd-btn-sm"
                onClick={() => showToast("Reset link sent to your email")}
              >
                Reset Password
              </button>
            </div>
          </>
        )}
        {tab === "profile" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 20 }}>
              My Profile
            </h3>
            <div className="cd-form-group">
              <label className="cd-label">Full Name</label>
              <input
                className="cd-input"
                defaultValue={counsellorName || "Counsellor Priya"}
              />
            </div>
            <div className="cd-row-2">
              <div className="cd-form-group">
                <label className="cd-label">Department</label>
                <input
                  className="cd-input"
                  defaultValue="Safety Counselling Unit"
                />
              </div>
              <div className="cd-form-group">
                <label className="cd-label">Employee ID</label>
                <input className="cd-input" defaultValue="CSL-0042" />
              </div>
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Specialization</label>
              <select
                className="cd-input cd-select"
                defaultValue="Harassment & Stalking"
              >
                {[
                  "Harassment & Stalking",
                  "Cybercrime & Blackmail",
                  "Domestic Violence",
                  "General Safety",
                  "Legal Referrals",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="cd-form-group">
              <label className="cd-label">Shift</label>
              <select className="cd-input cd-select" defaultValue="Day">
                {[
                  "Day (6AM-2PM)",
                  "Afternoon (2PM-10PM)",
                  "Night (10PM-6AM)",
                  "Rotating",
                ].map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <button
              className="cd-btn cd-btn-teal"
              onClick={() => showToast("Profile saved", "success")}
            >
              <FontAwesomeIcon icon={faCheck} /> Save Profile
            </button>
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
              Dashboard behaviour and integrations
            </p>
            {[
              {
                key: "auto_assign",
                label: "Auto-Assign Sessions",
                desc: "Automatically route waiting sessions to available counsellors",
              },
              {
                key: "night_mode",
                label: "Dark Mode",
                desc: "Switch to dark theme for night shift operations",
              },
            ].map((s) => (
              <div key={s.key} className="cd-settings-row">
                <div>
                  <h4>{s.label}</h4>
                  <p>{s.desc}</p>
                </div>
                <button
                  className={`cd-toggle ${toggles[s.key as keyof typeof toggles] ? "on" : ""}`}
                  onClick={() => toggle(s.key as keyof typeof toggles)}
                />
              </div>
            ))}
            <div className="cd-settings-row">
              <div>
                <h4>Connected Integrations</h4>
                <p>Police portal, Legal DB, Helpline 181</p>
              </div>
              <span className="chip chip-green">● 3 Active</span>
            </div>
            <div className="cd-settings-row">
              <div>
                <h4>Session Auto-Close Timer</h4>
                <p>Close inactive sessions after</p>
              </div>
              <select
                className="cd-input cd-select"
                style={{ width: 120, padding: "6px 30px 6px 10px" }}
                defaultValue={30}
              >
                {[15, 20, 30, 45, 60].map((v) => (
                  <option key={v}>{v} min</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

const navGroups = [
  {
    label: "Main",
    items: [
      {
        key: "overview" as SectionKey,
        label: "Overview",
        icon: faShieldHalved,
        badge: 0,
      },
    ],
  },
  {
    label: "Sessions",
    items: [
      {
        key: "queue" as SectionKey,
        label: "Session Queue",
        icon: faInbox,
        badge: 3,
      },
      {
        key: "chat" as SectionKey,
        label: "Live Chat",
        icon: faComments,
        badge: 1,
      },
      {
        key: "history" as SectionKey,
        label: "Session History",
        icon: faClockRotateLeft,
        badge: 0,
      },
    ],
  },
  {
    label: "Actions",
    items: [
      {
        key: "escalations" as SectionKey,
        label: "Escalations",
        icon: faTriangleExclamation,
        badge: 1,
      },
      {
        key: "resources" as SectionKey,
        label: "Resource Library",
        icon: faBookOpen,
        badge: 0,
      },
    ],
  },
  {
    label: "Reports & Admin",
    items: [
      {
        key: "reports" as SectionKey,
        label: "Reports & Analytics",
        icon: faChartBar,
        badge: 0,
      },
      {
        key: "settings" as SectionKey,
        label: "Settings",
        icon: faGear,
        badge: 0,
      },
    ],
  },
];

const sectionTitles: Record<SectionKey, { title: string; sub: string }> = {
  overview: {
    title: "Counsellor Overview",
    sub: "Anonymous safety chat · Live session status",
  },
  queue: {
    title: "Session Queue",
    sub: "Manage incoming and active anonymous sessions",
  },
  chat: { title: "Live Chat", sub: "Respond to anonymous users in real time" },
  history: {
    title: "Session History",
    sub: "Full audit trail of all counselling sessions",
  },
  escalations: {
    title: "Escalation Tracker",
    sub: "Cases escalated to police or helplines",
  },
  resources: {
    title: "Safety Resource Library",
    sub: "Guides and advice for counsellors to share",
  },
  reports: {
    title: "Reports & Analytics",
    sub: "Session metrics, resolution rates and exports",
  },
  settings: {
    title: "Settings",
    sub: "Profile, notifications and system preferences",
  },
};

const CounsellorDashboard: React.FC<CounsellorDashboardProps> = ({
  userName,
  onLogout,
}) => {
  const { emergencyAlerts, safetyScores } = useGeoGuardianRealtimeData();
  const [section, setSection] = useState<SectionKey>("overview");
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>(seedSessions);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const { toasts, show: showToast } = useToast();
  const realtimeSessions = useMemo(
    () =>
      emergencyAlerts.data.length > 0
        ? mapEmergencyAlertsToSessions(emergencyAlerts.data)
        : seedSessions,
    [emergencyAlerts.data],
  );
  const realtimeResources = useMemo(
    () =>
      safetyScores.data.length > 0
        ? mapSafetyScoresToResources(safetyScores.data)
        : seedResources,
    [safetyScores.data],
  );

  useEffect(() => {
    setSessions((previous) => {
      const previousById = new Map(
        previous.map((session) => [session.id, session]),
      );
      return realtimeSessions.map((session) => {
        const existing = previousById.get(session.id);
        if (!existing) {
          return session;
        }

        return {
          ...session,
          messages:
            existing.messages.length > session.messages.length
              ? existing.messages
              : session.messages,
          notes: existing.notes ?? session.notes,
          assignedCounsellor:
            existing.assignedCounsellor ?? session.assignedCounsellor,
        };
      });
    });
  }, [realtimeSessions]);

  useEffect(() => {
    if (activeChatId && !sessions.some((session) => session.id === activeChatId)) {
      setActiveChatId(null);
    }
  }, [activeChatId, sessions]);

  const waitingCount = sessions.filter((s) => s.status === "waiting").length;
  const activeCount = sessions.filter((s) => s.status === "active").length;
  const userInitials = userName
    ? userName
        .split(" ")
        .map((w) => w[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "CP";
  const { title, sub } = sectionTitles[section];

  const goToChat = (sessionId: string) => {
    setActiveChatId(sessionId);
    setSection("chat");
  };

  const renderSection = () => {
    switch (section) {
      case "overview":
        return (
          <OverviewSection
            sessions={sessions}
            onGoQueue={() => setSection("queue")}
            onGoChat={goToChat}
          />
        );
      case "queue":
        return (
          <QueueSection
            sessions={sessions}
            onOpenChat={goToChat}
            showToast={showToast}
          />
        );
      case "chat":
        return (
          <ChatSection
            sessions={sessions}
            activeChatId={activeChatId}
            onSelectChat={setActiveChatId}
            onUpdateSessions={setSessions}
            showToast={showToast}
            counsellorName={userName || "Counsellor"}
          />
        );
      case "history":
        return <HistorySection sessions={sessions} showToast={showToast} />;
      case "escalations":
        return <EscalationsSection sessions={sessions} />;
      case "resources":
        return (
          <ResourcesSection
            showToast={showToast}
            baseResources={realtimeResources}
          />
        );
      case "reports":
        return <ReportsSection />;
      case "settings":
        return (
          <SettingsSection showToast={showToast} counsellorName={userName} />
        );
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="cd">
        {/* Mobile overlay */}
        <div
          className={`cd-mobile-overlay ${mobileOpen ? "visible" : ""}`}
          onClick={() => setMobileOpen(false)}
        />

        {/* Sidebar */}
        <nav
          className={`cd-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}
        >
          <div className="cd-logo">
            <div className="cd-logo-icon">
              <FontAwesomeIcon icon={faHandshake} />
            </div>
            <div className="cd-logo-text">
              <h2>Geo Guardian</h2>
              <p>Safety Counselling</p>
            </div>
          </div>

          <div className="cd-nav">
            {navGroups.map((g) => (
              <div key={g.label}>
                <div className="cd-nav-group">{g.label}</div>
                {g.items.map((item) => {
                  const liveBadge =
                    item.key === "queue"
                      ? waitingCount
                      : item.key === "chat"
                        ? activeCount
                        : item.badge;
                  return (
                    <div
                      key={item.key}
                      className={`cd-nav-item ${section === item.key ? "active" : ""}`}
                      onClick={() => {
                        setSection(item.key);
                        setMobileOpen(false);
                      }}
                    >
                      <span className="cd-nav-icon">
                        <FontAwesomeIcon icon={item.icon} />
                      </span>
                      <span className="cd-nav-label">{item.label}</span>
                      {liveBadge > 0 && (
                        <span
                          className={`cd-nav-badge ${item.key === "queue" ? "pulse" : ""}`}
                        >
                          {liveBadge}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="cd-sidebar-footer">
            <div className="cd-user-row">
              <div className="cd-user-avatar">{userInitials}</div>
              <div className="cd-user-info">
                <strong>{userName || "Counsellor"}</strong>
                <span>Safety Counsellor</span>
              </div>
            </div>
            <button
              className="cd-collapse-btn"
              onClick={() => setCollapsed((c) => !c)}
            >
              <FontAwesomeIcon
                icon={collapsed ? faChevronRight : faChevronLeft}
              />
              <span className="label" style={{ marginLeft: 8 }}>
                Collapse
              </span>
            </button>
          </div>
        </nav>

        {/* Topbar */}
        <header className={`cd-topbar ${collapsed ? "collapsed" : ""}`}>
          <div className="cd-topbar-left">
            <button
              className="cd-mobile-btn"
              onClick={() => setMobileOpen((m) => !m)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "var(--text)",
                padding: 6,
                fontSize: 18,
              }}
            >
              <FontAwesomeIcon icon={faBars} />
            </button>
            <div className="cd-topbar-title">
              <h1>{title}</h1>
              <p>{sub}</p>
            </div>
          </div>

          <div className="cd-topbar-right">
            <div className="cd-search">
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                style={{ color: "var(--text-3)", fontSize: 12 }}
              />
              <input placeholder="Search sessions…" />
            </div>

            {/* Notifications */}
            <div className="cd-dd-wrap">
              <button
                className="cd-icon-btn"
                onClick={() => {
                  setNotifOpen((o) => !o);
                  setProfileOpen(false);
                }}
              >
                <FontAwesomeIcon icon={faBell} />
                {waitingCount > 0 && (
                  <span className="cd-notif-badge">{waitingCount}</span>
                )}
              </button>
              {notifOpen && (
                <div className="cd-dd" style={{ minWidth: 300 }}>
                  <div
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--border)",
                      fontWeight: 800,
                      fontSize: 13,
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <FontAwesomeIcon
                      icon={faBell}
                      style={{ color: "var(--teal)" }}
                    />{" "}
                    Live Notifications
                  </div>
                  {sessions
                    .filter((s) => s.status === "waiting")
                    .map((s) => (
                      <div
                        key={s.id}
                        className="cd-dd-item"
                        style={{ gap: 12, padding: "12px 16px" }}
                        onClick={() => {
                          goToChat(s.id);
                          setNotifOpen(false);
                        }}
                      >
                        <span style={{ fontSize: 20 }}>⏳</span>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, fontWeight: 700 }}>
                            {s.anonymousId} is waiting
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-3)" }}>
                            {s.category} · {timeAgo(s.startedAt)}
                          </div>
                        </div>
                        <span className={`pri pri-${s.priority}`}>
                          {s.priority}
                        </span>
                      </div>
                    ))}
                  {waitingCount === 0 && (
                    <div
                      style={{
                        padding: 20,
                        textAlign: "center",
                        fontSize: 13,
                        color: "var(--text-2)",
                      }}
                    >
                      🎉 No one waiting right now
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile */}
            <div className="cd-dd-wrap">
              <button
                className="cd-profile-btn"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setNotifOpen(false);
                }}
              >
                <div
                  className="cd-user-avatar"
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
                    {userName || "Counsellor"}
                  </strong>
                  <span style={{ fontSize: 10, color: "var(--text-2)" }}>
                    Safety Counsellor
                  </span>
                </div>
              </button>
              {profileOpen && (
                <div className="cd-dd">
                  <div
                    className="cd-dd-item"
                    onClick={() => {
                      setSection("settings");
                      setProfileOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faUserTie} /> My Profile
                  </div>
                  <div
                    className="cd-dd-item"
                    onClick={() => {
                      setSection("settings");
                      setProfileOpen(false);
                    }}
                  >
                    <FontAwesomeIcon icon={faGear} /> Settings
                  </div>
                  <div className="cd-dd-divider" />
                  <button className="cd-dd-item danger" onClick={onLogout}>
                    <FontAwesomeIcon icon={faArrowRightFromBracket} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main */}
        <main className={`cd-main ${collapsed ? "collapsed" : ""}`}>
          <div
            className="cd-content"
            style={{ padding: section === "chat" ? "20px" : "28px" }}
            onClick={() => {
              setProfileOpen(false);
              setNotifOpen(false);
            }}
          >
            {renderSection()}
          </div>
        </main>

        {/* Toasts */}
        <div className="cd-toast-wrap">
          {toasts.map((t) => (
            <div key={t.id} className={`cd-toast ${t.type || ""}`}>
              {t.type === "success" ? (
                <FontAwesomeIcon icon={faCircleCheck} />
              ) : t.type === "error" ? (
                <FontAwesomeIcon icon={faCircleXmark} />
              ) : (
                <FontAwesomeIcon icon={faCircleDot} />
              )}
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default CounsellorDashboard;
