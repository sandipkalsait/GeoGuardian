// src/pages/PoliceDashboard.tsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Grid,
  Paper,
  Button,
  Badge,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";

import MenuIcon from "@mui/icons-material/Menu";
import DashboardIcon from "@mui/icons-material/Dashboard";
import ReportIcon from "@mui/icons-material/Report";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleIcon from "@mui/icons-material/People";
import MapIcon from "@mui/icons-material/Map";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LogoutIcon from "@mui/icons-material/Logout";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PoliceDashboardProps {
  userName: string;
  onLogout: () => void;
}

type IncidentStatus = "unassigned" | "dispatched" | "resolved";

interface Incident {
  id: string;
  touristId: string;
  type: string;
  severity: "Low" | "Medium" | "High" | "Critical";
  description: string;
  lat: number;
  lng: number;
  timestamp: string;
  status: IncidentStatus;
  assignedUnitId?: string | null;
  responseTimeMin?: number | null; // for analytics (mock)
}

interface Unit {
  id: string;
  name: string;
  type: string;
  lat: number;
  lng: number;
  status: "available" | "responding" | "offline";
}

const drawerWidth = 260;

const initialIncidents: Incident[] = [
  {
    id: "INC-1001",
    touristId: "T-501",
    type: "SOS",
    severity: "Critical",
    description: "Solo tourist pressed panic near Old Fort at 1:12 AM",
    lat: 19.9315,
    lng: 73.8567,
    timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    status: "unassigned",
    responseTimeMin: null,
  },
  {
    id: "INC-1002",
    touristId: "T-502",
    type: "Geo-fence breach",
    severity: "High",
    description: "Group entered restricted zone near heritage site",
    lat: 19.9340,
    lng: 73.8540,
    timestamp: new Date(Date.now() - 1000 * 60 * 160).toISOString(),
    status: "dispatched",
    assignedUnitId: "U-11",
    responseTimeMin: 18,
  },
  {
    id: "INC-1003",
    touristId: "T-503",
    type: "Harassment reported",
    severity: "Medium",
    description: "Tourist reported harassment near market",
    lat: 19.9300,
    lng: 73.8590,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(),
    status: "resolved",
    assignedUnitId: "U-10",
    responseTimeMin: 25,
  },
];

const initialUnits: Unit[] = [
  { id: "U-10", name: "Patrol Car 10", type: "car", lat: 19.9345, lng: 73.8555, status: "available" },
  { id: "U-11", name: "Patrol Bike 11", type: "bike", lat: 19.9320, lng: 73.8570, status: "responding" },
  { id: "U-12", name: "Foot Patrol 12", type: "foot", lat: 19.9305, lng: 73.8530, status: "available" },
];

const menuItems = [
  { key: "overview", label: "Overview", icon: <DashboardIcon /> },
  { key: "cases", label: "Case Management", icon: <AssignmentIcon /> },
  { key: "alerts", label: "Real-time Alerts", icon: <NotificationsActiveIcon /> },
  { key: "patrols", label: "Patrols & Resources", icon: <GpsFixedIcon /> },
  { key: "tourist", label: "Tourist Monitoring", icon: <MapIcon /> },
  { key: "reports", label: "Analytics & Reports", icon: <BarChartIcon /> },
  { key: "users", label: "Users & Roles", icon: <PeopleIcon /> },
  { key: "efir", label: "eFIRs & Legal", icon: <ReportIcon /> },
  { key: "settings", label: "Settings", icon: <SettingsIcon /> },
];

const PoliceDashboard: React.FC<PoliceDashboardProps> = ({ userName, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selected, setSelected] = useState<string>("overview");
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents);
  const [units, setUnits] = useState<Unit[]>(initialUnits);

  // Dialog state for viewing incident details and assigning units
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");

  // helper metrics
  const metrics = useMemo(() => {
    const total = incidents.length;
    const active = incidents.filter((i) => i.status !== "resolved").length;
    const critical = incidents.filter((i) => i.severity === "Critical" || i.severity === "High").length;
    const resolved = incidents.filter((i) => i.status === "resolved").length;
    const avgResponse =
      incidents.filter((i) => i.responseTimeMin != null).length > 0
        ? Math.round(
            incidents
              .filter((i) => i.responseTimeMin != null)
              .reduce((s, c) => s + (c.responseTimeMin || 0), 0) /
              incidents.filter((i) => i.responseTimeMin != null).length
          )
        : null;
    return { total, active, critical, resolved, avgResponse };
  }, [incidents]);

  // mock time-series data for chart (last 7 days)
  const chartData = [
    { day: "Mon", incidents: 5 },
    { day: "Tue", incidents: 8 },
    { day: "Wed", incidents: 6 },
    { day: "Thu", incidents: 9 },
    { day: "Fri", incidents: 7 },
    { day: "Sat", incidents: 10 },
    { day: "Sun", incidents: 4 },
  ];

  const toggleDrawer = () => setMobileOpen((s) => !s);

  const handleOpenIncident = (inc: Incident) => {
    setDetailIncident(inc);
  };

  const handleCloseIncident = () => {
    setDetailIncident(null);
    setAssignDialogOpen(false);
    setSelectedUnit("");
  };

  const openAssignDialog = (inc: Incident) => {
    setDetailIncident(inc);
    setAssignDialogOpen(true);
  };

  const handleAssignUnit = () => {
    if (!detailIncident) return;
    setIncidents((prev) =>
      prev.map((p) => (p.id === detailIncident.id ? { ...p, assignedUnitId: selectedUnit, status: "dispatched" } : p))
    );
    setUnits((prev) => prev.map((u) => (u.id === selectedUnit ? { ...u, status: "responding" } : u)));
    setAssignDialogOpen(false);
    setSelectedUnit("");
    setDetailIncident(null);
  };

  // simple status update (resolve)
  const handleResolve = (id: string) => {
    setIncidents((prev) => prev.map((p) => (p.id === id ? { ...p, status: "resolved", responseTimeMin: p.responseTimeMin ?? 15 } : p)));
  };

  // side menu content
  const drawer = (
    <Box sx={{ width: drawerWidth, px: 2, py: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Avatar sx={{ bgcolor: "primary.main" }}>{userName?.[0] ?? "P"}</Avatar>
        <Box>
          <Typography variant="subtitle1">Welcome</Typography>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {userName || "Officer"}
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {menuItems.map((m) => (
          <ListItemButton
            key={m.key}
            selected={selected === m.key}
            onClick={() => {
              setSelected(m.key);
              if (mobileOpen) setMobileOpen(false);
            }}
            sx={{ borderRadius: 1, mb: 0.5 }}
          >
            <ListItemIcon>{m.icon}</ListItemIcon>
            <ListItemText primary={m.label} />
            {m.key === "alerts" && (
              <Badge color="error" badgeContent={incidents.filter((i) => i.status !== "resolved").length} />
            )}
          </ListItemButton>
        ))}
      </List>

      <Box sx={{ position: "absolute", bottom: 24, left: 16, right: 16 }}>
        <Button startIcon={<LogoutIcon />} variant="outlined" color="error" fullWidth onClick={onLogout}>
          Logout
        </Button>
      </Box>
    </Box>
  );

  // ========== Panels ==========

  function OverviewPanel() {
    return (
      <Box>
        <Grid container spacing={2}>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Open Incidents</Typography>
              <Typography variant="h4" color="primary" sx={{ mt: 1 }}>
                {metrics.active}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Critical / High</Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {metrics.critical}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Avg Response (min)</Typography>
              <Typography variant="h4" sx={{ mt: 1 }}>
                {metrics.avgResponse ?? "—"}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={3}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Resolved</Typography>
              <Typography variant="h4" color="success.main" sx={{ mt: 1 }}>
                {metrics.resolved}
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={7}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography variant="subtitle1">Incidents (last 7 days)</Typography>
              <ResponsiveContainer width="100%" height="85%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="incidents" stroke="#1976d2" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 2, height: 320 }}>
              <Typography variant="subtitle1" gutterBottom>
                Live Alerts
              </Typography>
              <List>
                {incidents
                    .slice()
                    .sort((a, _b) => (a.status === "unassigned" ? -1 : 1))
                  .map((inc) => (
                    <ListItemButton key={inc.id} onClick={() => handleOpenIncident(inc)} sx={{ mb: 1 }}>
                      <ListItemText
                        primary={`${inc.type} — ${inc.description}`}
                        secondary={`${new Date(inc.timestamp).toLocaleString()} • ${inc.severity} • ${inc.status}`}
                      />
                      <Badge
                        color={inc.status === "resolved" ? "success" : inc.severity === "Critical" || inc.severity === "High" ? "error" : "primary"}
                        variant="dot"
                      />
                    </ListItemButton>
                  ))}
              </List>
            </Paper>
          </Grid>

          <Grid item xs={12}>
            <Paper sx={{ p: 2, minHeight: 220 }}>
              <Typography variant="subtitle1" gutterBottom>
                Map (placeholder)
              </Typography>
              <Box
                sx={{
                  height: 200,
                  borderRadius: 1,
                  background:
                    "linear-gradient(135deg, rgba(25,118,210,0.06), rgba(25,118,210,0.02))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "text.secondary",
                }}
              >
                {/* Here you will plug React-Leaflet or Google Maps component */}
                <Typography>Map will be integrated here (React-Leaflet / Google Maps)</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  function CasesPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Case Management — FIRs & Complaints
        </Typography>
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Case ID</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Tourist ID</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {incidents.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.id}</TableCell>
                  <TableCell>{c.type}</TableCell>
                  <TableCell>{c.touristId}</TableCell>
                  <TableCell>{c.severity}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell>{new Date(c.timestamp).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => handleOpenIncident(c)}>
                      View
                    </Button>
                    <Button size="small" color="success" onClick={() => handleResolve(c.id)}>
                      Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    );
  }

  function AlertsPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>
          Real-time Alerts
        </Typography>
        <List>
          {incidents
            .filter((i) => i.status !== "resolved")
            .map((inc) => (
              <Paper key={inc.id} sx={{ p: 2, mb: 1 }}>
                <Grid container>
                  <Grid item xs={10}>
                    <Typography variant="subtitle1">{inc.type} • {inc.severity}</Typography>
                    <Typography variant="body2" color="text.secondary">{inc.description}</Typography>
                    <Typography variant="caption">{new Date(inc.timestamp).toLocaleString()}</Typography>
                  </Grid>
                  <Grid item xs={2} sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                    <Button size="small" variant="contained" onClick={() => openAssignDialog(inc)}>Assign</Button>
                    <Button size="small" color="inherit" onClick={() => handleOpenIncident(inc)}>Details</Button>
                  </Grid>
                </Grid>
              </Paper>
            ))}
        </List>
      </Box>
    );
  }

  function PatrolsPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Patrol & Resource Management</Typography>
        <Grid container spacing={2}>
          {units.map((u) => (
            <Grid item xs={12} md={4} key={u.id}>
              <Paper sx={{ p: 2 }}>
                <Typography variant="subtitle2">{u.name}</Typography>
                <Typography variant="body2">Type: {u.type}</Typography>
                <Typography variant="body2">Status: {u.status}</Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button size="small" onClick={() => setUnits((prev) => prev.map(p => p.id === u.id ? { ...p, status: "responding" } : p))}>Set Responding</Button>
                  <Button size="small" onClick={() => setUnits((prev) => prev.map(p => p.id === u.id ? { ...p, status: "available" } : p))}>Set Available</Button>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  function TouristPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Tourist Safety Monitoring</Typography>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="body2">Heatmap / Crowd density visualization (placeholder)</Typography>
          <Box sx={{ mt: 1, height: 220, borderRadius: 1, bgcolor: "background.paper", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Typography color="text.secondary">Heatmap / crowd visualization will be added here (map integration)</Typography>
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle1">Identified Risk Areas</Typography>
          <List>
            <ListItemButton>Market area — high footfall after 10pm</ListItemButton>
            <ListItemButton>Old Fort — restricted zones</ListItemButton>
            <ListItemButton>Riverfront — poor lighting</ListItemButton>
          </List>
        </Paper>
      </Box>
    );
  }

  function ReportsPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Analytics & Reports</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Response Time Trend</Typography>
              <Box sx={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="incidents" stroke="#ff5722" />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle2">Quick Stats</Typography>
              <Typography>Total Incidents: {metrics.total}</Typography>
              <Typography>Avg Response: {metrics.avgResponse ?? "—"}</Typography>
              <Typography>Resolved: {metrics.resolved}</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    );
  }

  function UsersPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Users & Roles</Typography>
        <Paper sx={{ p: 2 }}>
          <Typography>Admin</Typography>
          <Typography>Dispatcher</Typography>
          <Typography>Field Officer</Typography>
          <Typography sx={{ mt: 1 }} color="text.secondary">(User management UI to add/edit roles goes here)</Typography>
        </Paper>
      </Box>
    );
  }

  function EFIRPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>eFIRs & Legal Documents</Typography>
        <Paper sx={{ p: 2 }}>
          <Typography variant="body2">Create & manage eFIR templates, attach evidence, and export PDF / legal forms.</Typography>
        </Paper>
      </Box>
    );
  }

  function SettingsPanel() {
    return (
      <Box>
        <Typography variant="h6" sx={{ mb: 1 }}>System Settings</Typography>
        <Paper sx={{ p: 2 }}>
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="thresh-label">Alert threshold (minutes)</InputLabel>
            <Select labelId="thresh-label" defaultValue={15} label="Alert threshold (minutes)">
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
              <MenuItem value={30}>30</MenuItem>
            </Select>
          </FormControl>
          <Typography variant="caption">Integrations / SMS provider / webhook settings</Typography>
        </Paper>
      </Box>
    );
  }

  // choose panel
  const content = (() => {
    switch (selected) {
      case "overview":
        return <OverviewPanel />;
      case "cases":
        return <CasesPanel />;
      case "alerts":
        return <AlertsPanel />;
      case "patrols":
        return <PatrolsPanel />;
      case "tourist":
        return <TouristPanel />;
      case "reports":
        return <ReportsPanel />;
      case "users":
        return <UsersPanel />;
      case "efir":
        return <EFIRPanel />;
      case "settings":
        return <SettingsPanel />;
      default:
        return <OverviewPanel />;
    }
  })();

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={toggleDrawer} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>
            Geo Guardian — Police Dashboard
          </Typography>
          <Badge color="error" badgeContent={incidents.filter(i => i.status !== "resolved").length} sx={{ mr: 2 }}>
            <NotificationsActiveIcon />
          </Badge>
          <Avatar sx={{ bgcolor: "secondary.main", mr: 1 }}>{userName?.[0] ?? "P"}</Avatar>
          <Typography variant="body2" sx={{ mr: 2 }}>{userName}</Typography>
        </Toolbar>
      </AppBar>

      {/* Desktop drawer */}
      <Drawer variant="permanent" sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" }
      }}>
        <Toolbar />
        {drawer}
      </Drawer>

      {/* Mobile drawer (temporary) */}
      <Drawer open={mobileOpen} onClose={toggleDrawer} variant="temporary" sx={{
        display: { xs: "block", md: "none" },
        [`& .MuiDrawer-paper`]: { width: drawerWidth }
      }}>
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {content}
      </Box>

      {/* Incident detail dialog */}
      <Dialog open={!!detailIncident} onClose={handleCloseIncident} maxWidth="sm" fullWidth>
        <DialogTitle>Incident Details</DialogTitle>
        <DialogContent>
          {detailIncident && (
            <>
              <Typography variant="subtitle2">{detailIncident.id} — {detailIncident.type}</Typography>
              <Typography sx={{ mt: 1 }}>{detailIncident.description}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {new Date(detailIncident.timestamp).toLocaleString()} • Severity: {detailIncident.severity}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography>Assigned Unit: {detailIncident.assignedUnitId ?? "None"}</Typography>
              <Typography>Location: {detailIncident.lat}, {detailIncident.lng}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {detailIncident && detailIncident.status !== "resolved" && (
            <Button onClick={() => openAssignDialog(detailIncident)}>Assign Unit</Button>
          )}
          {detailIncident && detailIncident.status !== "resolved" && (
            <Button color="success" onClick={() => { detailIncident && handleResolve(detailIncident.id); handleCloseIncident(); }}>
              Mark Resolved
            </Button>
          )}
          <Button onClick={handleCloseIncident}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign dialog */}
      <Dialog open={assignDialogOpen} onClose={() => setAssignDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Unit</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel id="unit-select-label">Select Unit</InputLabel>
            <Select
              labelId="unit-select-label"
              value={selectedUnit}
              label="Select Unit"
              onChange={(e) => setSelectedUnit(e.target.value)}
            >
              {units.map((u) => (
                <MenuItem value={u.id} key={u.id}>{u.name} — {u.status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAssignUnit} variant="contained" disabled={!selectedUnit}>Assign</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PoliceDashboard;
