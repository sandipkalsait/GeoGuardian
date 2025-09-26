// src/pages/PoliceDashboard.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  TextField,
  Stack,
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

import { policeService } from "../Services/PoliceService";
import type { Incident, Unit } from "../Services/PoliceService";

interface PoliceDashboardProps {
  userName: string;
  onLogout: () => void;
}

const drawerWidth = 260;

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
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // dialog states
  const [detailIncident, setDetailIncident] = useState<Incident | null>(null);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // new incident form
  const [newType, setNewType] = useState<string>("SOS");
  const [newSeverity, setNewSeverity] = useState<"Low"|"Medium"|"High"|"Critical">("Medium");
  const [newDesc, setNewDesc] = useState<string>("");
  const [newLat, setNewLat] = useState<string>("");
  const [newLng, setNewLng] = useState<string>("");

  useEffect(() => {
    // seed demo if empty (no-op if DB already has data)
    policeService.seedIfEmpty().catch(console.error);

    const unsubInc = policeService.listenIncidents(setIncidents);
    const unsubUnits = policeService.listenUnits(setUnits);

    return () => {
      try { unsubInc && unsubInc(); } catch {}
      try { unsubUnits && unsubUnits(); } catch {}
    };
  }, []);

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

  const openAssignDialog = (inc: Incident) => {
    setDetailIncident(inc);
    setSelectedUnit(inc.assignedUnitId ?? "");
    setAssignDialogOpen(true);
  };

  const handleAssignUnit = async () => {
    if (!detailIncident || !selectedUnit) return;
    try {
      await policeService.assignUnit(detailIncident.id, selectedUnit);
      setAssignDialogOpen(false);
      setDetailIncident(null);
      setSelectedUnit("");
    } catch (err) {
      console.error("Assign failed", err);
      alert("Failed to assign unit. Check console.");
    }
  };

  const handleResolve = async (inc: Incident) => {
    try {
      await policeService.resolveIncident(inc.id);
      setDetailIncident(null);
    } catch (err) {
      console.error("Resolve failed", err);
      alert("Failed to resolve. Check console.");
    }
  };

  const handleUpdateUnitStatus = async (unitId: string, status: Unit["status"]) => {
    try {
      await policeService.updateUnitStatus(unitId, status);
    } catch (err) {
      console.error("Update unit status failed", err);
      alert("Failed to update unit status. See console.");
    }
  };

  const handleCreateIncident = async () => {
    try {
      const payload = {
        type: newType,
        description: newDesc,
        lat: newLat ? Number(newLat) : undefined,
        lng: newLng ? Number(newLng) : undefined,
        severity: newSeverity,
      };
      await policeService.createIncident(payload);
      setCreateDialogOpen(false);
      // clear fields
      setNewDesc("");
      setNewLat("");
      setNewLng("");
      setNewSeverity("Medium");
      setNewType("SOS");
    } catch (err) {
      console.error("Create incident failed", err);
      alert("Failed to create incident.");
    }
  };

  // drawer content
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

  // Panels (Overview, Cases, Alerts, Patrols, etc.)
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
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1">Live Alerts</Typography>
                <Button variant="contained" size="small" onClick={() => setCreateDialogOpen(true)}>
                  + New Incident
                </Button>
              </Stack>

              <List sx={{ mt: 1 }}>
                {incidents
                  .slice()
                  .sort((a, b) => (a.status === "unassigned" && b.status !== "unassigned" ? -1 : 1))
                  .map((inc) => (
                    <ListItemButton key={inc.id} onClick={() => setDetailIncident(inc)} sx={{ mb: 1 }}>
                      <ListItemText
                        primary={`${inc.type} — ${inc.description || "No details"}`}
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
                  <TableCell>{c.severity}</TableCell>
                  <TableCell>{c.status}</TableCell>
                  <TableCell>{new Date(c.timestamp).toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => setDetailIncident(c)}>
                      View
                    </Button>
                    <Button size="small" color="success" onClick={() => handleResolve(c)}>
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
                    <Button size="small" color="inherit" onClick={() => setDetailIncident(inc)}>Details</Button>
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
                <Typography variant="caption" display="block">Last: {u.lastUpdated ? new Date(u.lastUpdated).toLocaleString() : "—"}</Typography>
                <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                  <Button size="small" onClick={() => handleUpdateUnitStatus(u.id, "responding")}>Set Responding</Button>
                  <Button size="small" onClick={() => handleUpdateUnitStatus(u.id, "available")}>Set Available</Button>
                  <Button size="small" onClick={() => handleUpdateUnitStatus(u.id, "offline")}>Set Offline</Button>
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

  const content = (() => {
    switch (selected) {
      case "overview": return <OverviewPanel />;
      case "cases": return <CasesPanel />;
      case "alerts": return <AlertsPanel />;
      case "patrols": return <PatrolsPanel />;
      case "tourist": return <TouristPanel />;
      case "reports": return <ReportsPanel />;
      case "users": return <UsersPanel />;
      case "efir": return <EFIRPanel />;
      case "settings": return <SettingsPanel />;
      default: return <OverviewPanel />;
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

      <Drawer variant="permanent" sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" }
      }}>
        <Toolbar />
        {drawer}
      </Drawer>

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
      <Dialog open={!!detailIncident} onClose={() => setDetailIncident(null)} maxWidth="sm" fullWidth>
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
              <Typography>Location: {detailIncident.lat ?? "—"}, {detailIncident.lng ?? "—"}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          {detailIncident && detailIncident.status !== "resolved" && (
            <Button onClick={() => detailIncident && openAssignDialog(detailIncident)}>Assign Unit</Button>
          )}
          {detailIncident && detailIncident.status !== "resolved" && (
            <Button color="success" onClick={() => { detailIncident && handleResolve(detailIncident); }}>
              Mark Resolved
            </Button>
          )}
          <Button onClick={() => setDetailIncident(null)}>Close</Button>
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

      {/* Create incident dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Incident</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Type</InputLabel>
              <Select labelId="type-label" value={newType} label="Type" onChange={(e) => setNewType(e.target.value)}>
                <MenuItem value="SOS">SOS</MenuItem>
                <MenuItem value="Geo-fence breach">Geo-fence breach</MenuItem>
                <MenuItem value="Harassment">Harassment</MenuItem>
                <MenuItem value="Theft">Theft</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel id="sev-label">Severity</InputLabel>
              <Select labelId="sev-label" value={newSeverity} label="Severity" onChange={(e) => setNewSeverity(e.target.value as any)}>
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Description" multiline rows={3} value={newDesc} onChange={(e) => setNewDesc(e.target.value)} fullWidth />

            <Stack direction="row" spacing={1}>
              <TextField label="Lat" value={newLat} onChange={(e) => setNewLat(e.target.value)} />
              <TextField label="Lng" value={newLng} onChange={(e) => setNewLng(e.target.value)} />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateIncident} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PoliceDashboard;
