// AuthorityDashboard.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// Maps
import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import type { LatLngExpression, LatLngBoundsExpression } from "leaflet";
import "leaflet/dist/leaflet.css";

export type AuthorityDashboardProps = {
  userName: string;
  onLogout: () => void;
};

import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  TextField,
  InputAdornment,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  CssBaseline,
  Menu,
  MenuItem,
  Avatar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
  Badge,
  Divider,
  Tooltip,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  Button,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import MenuIcon from "@mui/icons-material/Menu";
import SettingsIcon from "@mui/icons-material/Settings";
import HomeIcon from "@mui/icons-material/Home";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleIcon from "@mui/icons-material/Person";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import DescriptionIcon from "@mui/icons-material/Description";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import AssessmentIcon from "@mui/icons-material/Assessment";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import LogoutIcon from "@mui/icons-material/Logout";
import NotificationsActiveOutlinedIcon from "@mui/icons-material/NotificationsActiveOutlined";

import AlertManagementSection from "./AlertManagementSection";
import CaseFIRManagementSection from "./CaseFIRManagementSection ";
import EmergencyResponseCoordinationSection from "./EmergencyResponseCoordinationSection";
import TouristMonitoringSafetySection from "./TouristMonitoringSafetySection";
import UserRoleManagementSection from "./UserRoleManagementSection";
import SystemSettingsNotificationsSection from "./SystemSettingsNotificationsSection";

// Theme
const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#2b9bd6", dark: "#0f6fb1", light: "#73c6f1" },
    secondary: { main: "#0f4c75" },
    background: { default: "#f7f9fc", paper: "#ffffff" },
    text: { primary: "#152232", secondary: "rgba(21,34,50,0.7)" },
    error: { main: "#d64545" },
    warning: { main: "#f0ad4e" },
    success: { main: "#2eb85c" },
    info: { main: "#3ba0f2" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 12 } } },
  },
});

const drawerWidthExpanded = 288;

type Section =
  | "overview"
  | "alerts"
  | "cases"
  | "response"
  | "tourists"
  | "reports"
  | "users"
  | "settings";

type SectionItem = { id: Section; label: string; icon: React.ReactNode };

const sections: SectionItem[] = [
  { id: "overview", label: "Overview", icon: <HomeIcon /> },
  { id: "alerts", label: "Alert Management", icon: <NotificationsActiveIcon /> },
  { id: "cases", label: "Case & FIR", icon: <DescriptionIcon /> },
  { id: "response", label: "Emergency Response", icon: <LocalPoliceIcon /> },
  { id: "tourists", label: "Tourist Safety", icon: <LocationOnIcon /> },
  { id: "reports", label: "Reports & Analytics", icon: <AssessmentIcon /> },
  { id: "users", label: "User & Roles", icon: <PeopleIcon /> },
  { id: "settings", label: "Settings", icon: <SettingsIcon /> },
];

// Sample user data
const userData = [
  {
    touristId: 101,
    createdAt: "2025-09-20",
    digitalId: "DGT-1001",
    documentNumber: "X1234567",
    documentType: "Passport",
    email: "tourist1@example.com",
    emergencyContacts: "1234567890",
    fullName: "John Doe",
    isActive: true,
    isVerified: true,
    startDate: "2025-09-18",
    endDate: "2025-09-25",
  },
  {
    touristId: 102,
    createdAt: "2025-09-15",
    digitalId: "DGT-1002",
    documentNumber: "Y7654321",
    documentType: "ID Card",
    email: "tourist2@example.com",
    emergencyContacts: "0987654321",
    fullName: "Jane Smith",
    isActive: true,
    isVerified: false,
    startDate: "2025-09-14",
    endDate: "2025-09-21",
  },
];

// Map constants (typed)
const mapCenter: LatLngExpression = [26.5, 92.5];
const heatBounds: LatLngBoundsExpression = [
  [24.0, 88.0],
  [28.5, 96.0],
];

// Overview
const OverviewSection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "space-between", flexWrap: "wrap" }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 800, letterSpacing: 0.2 }}>
            User Records
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Recently active tourists and verification status
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <TextField
            size="small"
            placeholder="Search users, IDs, documents…"
            sx={{
              minWidth: 280,
              "& .MuiOutlinedInput-root": {
                background: "rgba(255,255,255,0.9)",
                backdropFilter: "blur(6px)",
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="contained" color="primary" onClick={() => navigate("/tourist")} sx={{ px: 2.25 }}>
            Open Tourist
          </Button>
        </Box>
      </Box>

      <Paper elevation={0} sx={{ p: 0, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 28px rgba(20,35,52,0.06)" }}>
        <TableContainer sx={{ maxHeight: 420 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow
                sx={{
                  "& th": {
                    fontWeight: 700,
                    color: "primary.dark",
                    borderBottom: "none",
                    background: "linear-gradient(180deg, rgba(15,76,117,0.06), rgba(15,76,117,0.02))",
                  },
                }}
              >
                {[
                  "Tourist ID",
                  "Created At",
                  "Digital ID",
                  "Document Number",
                  "Document Type",
                  "Email",
                  "Emergency Contacts",
                  "Full Name",
                  "Active",
                  "Verified",
                  "Start Date",
                  "End Date",
                ].map((h) => (
                  <TableCell key={h} sx={{ py: 1.25 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <tbody>
              {userData.map((u) => (
                <TableRow
                  key={u.touristId}
                  hover
                  sx={{
                    backgroundColor: "#fff",
                    "&:nth-of-type(odd)": { backgroundColor: "#fbfdff" },
                    "&:hover": { transform: "translateY(-1px)", boxShadow: "0 8px 20px rgba(20,35,52,0.05)" },
                    transition: "all 200ms ease",
                  }}
                >
                  <TableCell>{u.touristId}</TableCell>
                  <TableCell>{u.createdAt}</TableCell>
                  <TableCell>{u.digitalId}</TableCell>
                  <TableCell>{u.documentNumber}</TableCell>
                  <TableCell>{u.documentType}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.emergencyContacts}</TableCell>
                  <TableCell>{u.fullName}</TableCell>
                  <TableCell>{u.isActive ? "Yes" : "No"}</TableCell>
                  <TableCell>{u.isVerified ? "Yes" : "No"}</TableCell>
                  <TableCell>{u.startDate}</TableCell>
                  <TableCell>{u.endDate}</TableCell>
                </TableRow>
              ))}
            </tbody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper elevation={0} sx={{ borderRadius: 2, overflow: "hidden", border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 28px rgba(20,35,52,0.06)" }}>
        <Box sx={{ p: 2 }}>
          <Typography sx={{ color: "primary.dark", fontWeight: 700 }}>
            Heat Map — NorthEast India
          </Typography>
          <Typography variant="body2" color="text.secondary">
            High-level activity visualization across NE region
          </Typography>
        </Box>
        <Box sx={{ height: 380 }}>
          {/* If TS still complains in your environment due to mismatched deps, add `as any` casts shown below */}
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
            <Rectangle
              bounds={heatBounds}
              pathOptions={{ color: "#d64545", weight: 2, fillOpacity: 0.1 }}
            />
          </MapContainer>

          {/*
          Fallback cast (only if needed):
          <MapContainer {...({ center: mapCenter, zoom: 6, style: { height: "100%", width: "100%" }, scrollWheelZoom: false } as any)}>
            <TileLayer {...({ url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", attribution: "© OpenStreetMap contributors" } as any)} />
            <Rectangle {...({ bounds: heatBounds, pathOptions: { color: "#d64545", weight: 2, fillOpacity: 0.1 } } as any)} />
          </MapContainer>
          */}
        </Box>
      </Paper>
    </Box>
  );
};

// Main Dashboard
const AuthorityDashboard: React.FC<AuthorityDashboardProps> = ({ userName, onLogout }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentSection, setCurrentSection] = useState<Section>("overview");
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);
  const [alertCounts, setAlertCounts] = useState({ complaints: 3, sos: 1, emergency: 2 });
  const lgUp = useMediaQuery("(min-width:1200px)");

  const totalAlerts = alertCounts.complaints + alertCounts.sos + alertCounts.emergency;

  useEffect(() => {
    const interval = setInterval(() => {
      setAlertCounts({
        complaints: Math.floor(Math.random() * 10) + 1,
        sos: Math.floor(Math.random() * 5),
        emergency: Math.floor(Math.random() * 3),
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleNotifClick = (e: React.MouseEvent<HTMLElement>) => setNotifAnchorEl(e.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  const handleSectionChange = (id: Section) => {
    setCurrentSection(id);
    if (mobileOpen) setMobileOpen(false);
    if (sidebarCollapsed && lgUp) setSidebarCollapsed(false);
  };

  const CollapsedToggle: React.FC<{ onClick: () => void }> = ({ onClick }) => (
    <Box sx={{ position: "fixed", top: 16, left: 12, zIndex: (t) => t.zIndex.drawer + 3 }}>
      <IconButton
        onClick={onClick}
        size="small"
        sx={{
          bgcolor: "rgba(255,255,255,0.92)",
          border: "1px solid rgba(15,76,117,0.12)",
          boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
          "&:hover": { bgcolor: "white" },
          color: "primary.main",
        }}
        aria-label="Expand sidebar"
      >
        <ChevronRightIcon />
      </IconButton>
    </Box>
  );

  const drawer = !sidebarCollapsed ? (
    <Box
      sx={{
        height: "100vh",
        width: drawerWidthExpanded,
        display: "flex",
        flexDirection: "column",
        background: "linear-gradient(180deg, rgba(255,255,255,0.72), rgba(245,250,255,0.64))",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderRight: "1px solid rgba(15,76,117,0.06)",
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 1.5, py: 1.25 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg,#2b9bd6,#0f6fb1)",
              color: "#fff",
              fontWeight: 800,
              boxShadow: "0 6px 18px rgba(15,76,117,0.12)",
            }}
          >
            GG
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "primary.dark" }}>
              Geo Guardian
            </Typography>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Operations Console
            </Typography>
          </Box>
        </Box>

        <IconButton
          onClick={() => setSidebarCollapsed(true)}
          sx={{ color: "primary.main", background: "rgba(15,76,117,0.06)", "&:hover": { background: "rgba(15,76,117,0.1)" } }}
          aria-label="Collapse sidebar"
        >
          <ChevronLeftIcon />
        </IconButton>
      </Box>

      <Divider sx={{ opacity: 0.6 }} />

      <List sx={{ flexGrow: 1, px: 1.5, py: 1.5 }}>
        {sections.map(({ id, label, icon }) => {
          const selected = currentSection === id;
          return (
            <ListItemButton
              key={id}
              selected={selected}
              onClick={() => handleSectionChange(id)}
              sx={{
                borderRadius: 2,
                mb: 0.75,
                minHeight: 52,
                "&.Mui-selected": {
                  bgcolor: "rgba(43,155,214,0.12)",
                  color: "primary.main",
                  "& svg": { color: "primary.main" },
                },
                "&:hover": { background: "rgba(15,76,117,0.06)" },
              }}
            >
              <ListItemIcon sx={{ minWidth: 44, color: selected ? "primary.main" : "text.secondary" }}>
                {icon}
              </ListItemIcon>
              <ListItemText primaryTypographyProps={{ fontWeight: selected ? 700 : 600, fontSize: 14 }} primary={label} />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ opacity: 0.6 }} />
      <Box sx={{ p: 1.5 }}>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          Version 1.3 • Secure
        </Typography>
      </Box>
    </Box>
  ) : null;

  const renderContent = () => {
    switch (currentSection) {
      case "overview":
        return <OverviewSection />;
      case "alerts":
        return <AlertManagementSection />;
      case "cases":
        return <CaseFIRManagementSection />;
      case "response":
        return <EmergencyResponseCoordinationSection />;
      case "tourists":
        return <TouristMonitoringSafetySection />;
      case "users":
        return <UserRoleManagementSection />;
      case "settings":
        return <SystemSettingsNotificationsSection />;
      case "reports":
        return (
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Reports & Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add charts and KPIs here using your analytics sources
            </Typography>
          </Box>
        );
      default:
        return <Typography>Section not found</Typography>;
    }
  };

  const currentLabel = sections.find((s) => s.id === currentSection)?.label || "Dashboard";

  return (
    <ThemeProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        <CssBaseline />

        {/* App Bar */}
        <AppBar
          position="fixed"
          elevation={0}
          sx={{
            width: { xs: "100%", lg: `calc(100% - ${sidebarCollapsed ? 0 : drawerWidthExpanded}px)` },
            ml: { xs: 0, lg: `${sidebarCollapsed ? 0 : drawerWidthExpanded}px` },
            bgcolor: "rgba(255,255,255,0.7)",
            color: "text.primary",
            backdropFilter: "blur(10px)",
            WebkitBackdropFilter: "blur(10px)",
            borderBottom: "1px solid rgba(15,76,117,0.08)",
            zIndex: (t) => t.zIndex.drawer + 2,
            transition: "width 0.28s ease, margin-left 0.28s ease",
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", minHeight: 68 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexGrow: 1 }}>
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleDrawerToggle}
                sx={{ mr: 1, display: { lg: "none" }, background: "rgba(15,76,117,0.06)", "&:hover": { background: "rgba(15,76,117,0.1)" } }}
              >
                <MenuIcon />
              </IconButton>

              <Box component="img" src="/geo-guardian.png" alt="Geo Guardian" sx={{ height: 40, width: "auto", display: { xs: "none", sm: "block" } }} />

              <Box sx={{ minWidth: 200 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {currentLabel}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Authority Dashboard
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 0 }}>
              <Tooltip title="Notifications">
                <IconButton color="inherit" onClick={handleNotifClick}>
                  <Badge badgeContent={totalAlerts} color="error">
                    <NotificationsActiveOutlinedIcon />
                  </Badge>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={notifAnchorEl}
                open={Boolean(notifAnchorEl)}
                onClose={handleNotifClose}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
              >
                <MenuItem>Complaints: {alertCounts.complaints}</MenuItem>
                <MenuItem>SOS: {alertCounts.sos}</MenuItem>
                <MenuItem>Emergencies: {alertCounts.emergency}</MenuItem>
              </Menu>

              <Tooltip title="Account">
                <IconButton color="inherit" onClick={handleMenuOpen} sx={{ ml: 0.5 }}>
                  <Avatar sx={{ width: 34, height: 34, fontSize: 14 }}>AG</Avatar>
                </IconButton>
              </Tooltip>

              <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem>Profile</MenuItem>
                <MenuItem>Settings</MenuItem>
                <MenuItem onClick={onLogout}>
                  <LogoutIcon sx={{ mr: 1 }} /> Logout
                </MenuItem>
              </Menu>
            </Box>
          </Toolbar>
        </AppBar>

        {/* Desktop Drawer only when expanded */}
        {!sidebarCollapsed && (
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: "none", lg: "block" },
              width: drawerWidthExpanded,
              flexShrink: 0,
              "& .MuiDrawer-paper": { width: drawerWidthExpanded, boxSizing: "border-box", border: "none" },
            }}
            open
          >
            {drawer}
          </Drawer>
        )}

        {/* Mobile Drawer respects collapsed */}
        <Drawer
          variant="temporary"
          open={!sidebarCollapsed && mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", lg: "none" },
            "& .MuiDrawer-paper": { width: drawerWidthExpanded, boxSizing: "border-box", border: "none" },
          }}
        >
          {drawer}
        </Drawer>

        {/* Floating unhide chevron only when collapsed */}
        {sidebarCollapsed && <CollapsedToggle onClick={() => setSidebarCollapsed(false)} />}

        {/* Main Content */}
        <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, pt: { xs: 9, sm: 10 }, transition: "margin-left 0.0 ease", maxWidth: "100%" }}>
          {renderContent()}
        </Box>
      </Box>
    </ThemeProvider>
  );
};

export default AuthorityDashboard;
