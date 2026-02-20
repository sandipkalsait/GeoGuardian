// AlertManagementSection.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Chip,
  Button,
  Grid,
  Select,
  MenuItem,
  TextField,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
} from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DangerousIcon from "@mui/icons-material/Dangerous";
import InsightsIcon from "@mui/icons-material/Insights";
import VisibilityIcon from "@mui/icons-material/Visibility";
import SendIcon from "@mui/icons-material/Send";
import PriorityHighIcon from "@mui/icons-material/PriorityHigh";
import DownloadIcon from "@mui/icons-material/Download";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import {
  updateEmergencyAlertStatus,
  type EmergencyAlertRecord,
  type SafetyScoreRecord,
  type TouristIdentityRecord,
} from "../Services/realtimeDataService";

// Mock types and data (replace via API)
type Zone = "Safe" | "Risky" | "Danger";

type TouristAlert = {
  id: string;
  tourist: string;
  digitalId: string;
  area: string;
  region: string;
  zone: Zone;
  lastSeen: string; // ISO or time
};

type LiveAlert = {
  id: string;
  title: string;
  app: string;
  region: string;
  zone: Zone;
  assigned: string[];
  createdAt: string;
  sourceCollection?: string;
  docId?: string;
};

const mockTourists: TouristAlert[] = [
  { id: "T-1001", tourist: "John Doe", digitalId: "DGT-1001", area: "City Museum", region: "Pune", zone: "Safe", lastSeen: "14:52" },
  { id: "T-1002", tourist: "Jane Smith", digitalId: "DGT-1002", area: "Riverside Park North", region: "Mumbai", zone: "Risky", lastSeen: "14:49" },
  { id: "T-1003", tourist: "Akash Verma", digitalId: "DGT-1003", area: "Hill Base Route-23", region: "Mumbai", zone: "Danger", lastSeen: "14:47" },
  { id: "T-1004", tourist: "Sara Khan", digitalId: "DGT-1004", area: "Old Fort Gate", region: "Nagpur", zone: "Risky", lastSeen: "14:46" },
  { id: "T-1005", tourist: "Lee Wang", digitalId: "DGT-1005", area: "Botanical Garden", region: "Pune", zone: "Safe", lastSeen: "14:44" },
];

const mockLiveAlerts: LiveAlert[] = [
  { id: "AL-3101", title: "Perimeter breach", app: "Wearable", region: "Mumbai", zone: "Danger", assigned: ["TeamA"], createdAt: "2m ago" },
  { id: "AL-3099", title: "Crowd surge risk", app: "Geo‑Beacon", region: "Pune", zone: "Risky", assigned: ["Ops-2"], createdAt: "5m ago" },
  { id: "AL-3098", title: "Lost contact ping", app: "App", region: "Nagpur", zone: "Safe", assigned: ["Ops-1"], createdAt: "7m ago" },
];

const getZoneFromScore = (score: number | null): Zone => {
  if (score == null) {
    return "Risky";
  }
  if (score >= 75) {
    return "Safe";
  }
  if (score >= 50) {
    return "Risky";
  }
  return "Danger";
};

const getZoneFromSeverity = (severity: string): Zone => {
  const normalized = (severity || "").toLowerCase();
  if (normalized === "critical" || normalized === "high") {
    return "Danger";
  }
  if (normalized === "medium") {
    return "Risky";
  }
  return "Safe";
};

const toTimeAgo = (date: Date | null): string => {
  if (!date) {
    return "now";
  }
  const diffSec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (diffSec < 60) {
    return `${diffSec}s ago`;
  }
  if (diffSec < 3600) {
    return `${Math.floor(diffSec / 60)}m ago`;
  }
  return `${Math.floor(diffSec / 3600)}h ago`;
};

const extractRegion = (address: string): string => {
  if (!address) {
    return "Unknown";
  }
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 2];
  }
  return parts[0] || "Unknown";
};

const extractArea = (address: string): string => {
  if (!address) {
    return "Unknown";
  }
  return address.split(",")[0]?.trim() || "Unknown";
};

const mapTouristRow = (
  tourist: TouristIdentityRecord,
  scoreByUserId: Map<string, number | null>,
): TouristAlert => ({
  id: tourist.touristId || tourist.id,
  tourist: tourist.fullName || "Unknown",
  digitalId: tourist.digitalId || tourist.touristId || tourist.id,
  area: extractArea(tourist.address),
  region: extractRegion(tourist.address),
  zone: getZoneFromScore(scoreByUserId.get(tourist.userId) ?? null),
  lastSeen: (tourist.updatedAt || tourist.createdAt || new Date()).toLocaleTimeString(
    [],
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  ),
});

const mapLiveAlert = (alert: EmergencyAlertRecord): LiveAlert => ({
  id: alert.alertId || alert.id,
  title: alert.title || "Emergency Alert",
  app: alert.triggeredBy || alert.type || "App",
  region: extractRegion(alert.address),
  zone: getZoneFromSeverity(alert.severity),
  assigned: alert.assignedOfficerId ? [alert.assignedOfficerId] : ["Unassigned"],
  createdAt: toTimeAgo(alert.alertTime || alert.createdAt),
  sourceCollection: alert.sourceCollection,
  docId: alert.docId,
});

// Styled card shell
const Shell = ({ title, subtitle, actions, children }: { title: string; subtitle?: string; actions?: React.ReactNode; children: React.ReactNode }) => (
  <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 28px rgba(20,35,52,0.06)" }}>
    <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(15,76,117,0.08)", background: "linear-gradient(180deg, rgba(15,76,117,0.04), rgba(15,76,117,0.02))" }}>
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
        {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Paper>
);

// Zone chip helper
const zoneChip = (z: Zone) => {
  if (z === "Safe") return <Chip label="Safe" color="success" size="small" />;
  if (z === "Risky") return <Chip label="Risky" color="warning" size="small" />;
  return <Chip label="Danger" color="error" size="small" />;
};

// KPI card
const Kpi = ({ label, value, delta, color, icon }: { label: string; value: number; delta?: string; color: "success" | "warning" | "error" | "info"; icon: React.ReactNode }) => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 24px rgba(20,35,52,0.06)" }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
        {delta && <Typography variant="caption" color={`${color}.main`}>{delta}</Typography>}
      </Box>
      <Badge color={color} variant="dot" overlap="circular" anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(15,76,117,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </Box>
      </Badge>
    </Box>
  </Paper>
);

const AlertManagementSection: React.FC = () => {
  const { emergencyAlerts, tourists, safetyScores } = useGeoGuardianRealtimeData();

  // Filters
  const [zoneFilter, setZoneFilter] = useState<Zone | "All">("All");
  const [region, setRegion] = useState<string>("All");
  const [date, setDate] = useState<string>("");

  const scoreByUserId = useMemo(() => {
    const map = new Map<string, number | null>();
    safetyScores.data.forEach((score: SafetyScoreRecord) => {
      map.set(score.userId, score.overallScore);
    });
    return map;
  }, [safetyScores.data]);

  const rows = useMemo(
    () =>
      tourists.data.length
        ? tourists.data.map((tourist: TouristIdentityRecord) =>
            mapTouristRow(tourist, scoreByUserId),
          )
        : mockTourists,
    [tourists.data, scoreByUserId],
  );

  const live = useMemo(
    () =>
      emergencyAlerts.data.length
        ? emergencyAlerts.data.map((alert: EmergencyAlertRecord) => mapLiveAlert(alert))
        : mockLiveAlerts,
    [emergencyAlerts.data],
  );

  const filtered = useMemo(() => {
    return rows.filter(r => (zoneFilter === "All" || r.zone === zoneFilter) && (region === "All" || r.region === region));
  }, [rows, zoneFilter, region]);

  // Counts
  const total = filtered.length;
  const safe = filtered.filter(r => r.zone === "Safe").length;
  const risky = filtered.filter(r => r.zone === "Risky").length;
  const danger = filtered.filter(r => r.zone === "Danger").length;

  const regions = Array.from(new Set(rows.map(r => r.region)));

  // Row actions
  const notify = async (id: string) => {
    const target = live.find((entry) => entry.id === id);
    if (target?.sourceCollection && target.docId) {
      await updateEmergencyAlertStatus(
        {
          sourceCollection: target.sourceCollection,
          docId: target.docId,
        },
        "acknowledged",
      );
    }
    alert(`Notify ${id}`);
  };
  const escalate = async (id: string) => {
    const target = live.find((entry) => entry.id === id);
    if (target?.sourceCollection && target.docId) {
      await updateEmergencyAlertStatus(
        {
          sourceCollection: target.sourceCollection,
          docId: target.docId,
        },
        "resolved",
      );
    }
    alert(`Escalate ${id} to Response`);
  };
  const view = (id: string) => alert(`View details for ${id}`);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top bar like screenshot: filters + actions */}
      <Shell
        title="Alerts filtered by:"
        subtitle={`${region === "All" ? "All Regions" : region} • ${zoneFilter === "All" ? "All Zones" : zoneFilter}${date ? " • " + date : ""}`}
        actions={
          <>
            <Button variant="outlined" size="small" startIcon={<InsightsIcon />}>Preview Reports</Button>
            <Button variant="contained" size="small" startIcon={<DownloadIcon />}>Generate Report</Button>
          </>
        }
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <Select fullWidth size="small" value={zoneFilter} onChange={(e) => setZoneFilter(e.target.value as any)}>
              <MenuItem value="All">All Zones</MenuItem>
              <MenuItem value="Safe">Safe</MenuItem>
              <MenuItem value="Risky">Risky</MenuItem>
              <MenuItem value="Danger">Danger</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Select fullWidth size="small" value={region} onChange={(e) => setRegion(e.target.value)}>
              <MenuItem value="All">All Regions</MenuItem>
              {regions.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField fullWidth size="small" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: "flex", gap: 1 }}>
            <Button variant="text" size="small" onClick={() => { setZoneFilter("All"); setRegion("All"); setDate(""); }}>Reset</Button>
          </Grid>
        </Grid>
      </Shell>

      {/* KPIs row */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Safe Tourists" value={safe} delta="+2.3% vs yesterday" color="success" icon={<CheckCircleIcon color="success" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Risky Zone" value={risky} delta="+1 new area" color="warning" icon={<WarningAmberIcon color="warning" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Danger Zone" value={danger} delta="-1 incident" color="error" icon={<DangerousIcon color="error" />} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Total Tracked" value={total} delta="+5 today" color="info" icon={<NotificationsActiveIcon color="info" />} />
        </Grid>
      </Grid>

      {/* Live alerts cards, like the screenshot’s lower row */}
      <Grid container spacing={2}>
        {live.map((a) => (
          <Grid item xs={12} md={4} key={a.id}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 24px rgba(20,35,52,0.06)" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Chip label={`New Live Alert`} size="small" color={a.zone === "Danger" ? "error" : a.zone === "Risky" ? "warning" : "default"} />
                <Typography variant="caption" color="text.secondary">{a.createdAt}</Typography>
              </Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>{a.title}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>{a.app} • {a.region}</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                <Chip label={a.zone} size="small" color={a.zone === "Danger" ? "error" : a.zone === "Risky" ? "warning" : "default"} />
                {a.assigned.map(name => <Chip key={name} label={name} size="small" variant="outlined" />)}
              </Box>
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button size="small" variant="outlined" onClick={() => view(a.id)}>
                  Preview
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => notify(a.id)}
                >
                  Acknowledge
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Main table of tourists */}
      <Shell title="Tourist Zone Tracking" subtitle="Live zone classification and last seen">
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tourist</TableCell>
                <TableCell>Digital ID</TableCell>
                <TableCell>Area</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Zone</TableCell>
                <TableCell>Last Seen</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>{r.tourist}</TableCell>
                  <TableCell>
                    <Typography fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">{r.digitalId}</Typography>
                  </TableCell>
                  <TableCell>{r.area}</TableCell>
                  <TableCell>{r.region}</TableCell>
                  <TableCell>{zoneChip(r.zone)}</TableCell>
                  <TableCell>{r.lastSeen}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => view(r.id)}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Notify">
                      <IconButton size="small" color="primary" onClick={() => notify(r.id)}><SendIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    <Tooltip title="Escalate">
                      <IconButton size="small" color="error" onClick={() => escalate(r.id)}><PriorityHighIcon fontSize="small" /></IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>No records</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>
    </Box>
  );
};

export default AlertManagementSection;
