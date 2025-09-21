import React, { useState, useMemo } from "react";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import {
  Search as SearchIcon,
  Notifications as NotificationsIcon,
  AddAlert as AddAlertIcon,
  AssignmentInd as AssignmentIndIcon,
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  ReportProblem as ReportProblemIcon,
  CheckCircle as CheckCircleIcon,
  Person as PersonIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Mock Data Types
interface TouristID {
  id: string;
  name: string;
  nationality: string;
  kycStatus: string;
  tripItinerary: string;
  validUntil: string;
}

interface AlertIncident {
  id: string;
  type: string;
  urgency: "Low" | "Medium" | "High" | "Critical";
  status: "Open" | "Assigned" | "Resolved";
  assignedTo?: string;
  date: string;
}

interface Notification {
  id: string;
  message: string;
  date: string;
  critical?: boolean;
}

// Reusable Stat Card Component
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  tooltip: string;
}> = ({ title, value, icon, tooltip }) => (
  <Tooltip title={tooltip} arrow>
    <Card
      variant="outlined"
      sx={{
        display: "flex",
        alignItems: "center",
        p: 2,
        cursor: "default",
        height: "100%",
      }}
      aria-label={`${title}: ${value}`}
    >
      <Box sx={{ mr: 2, fontSize: 40, color: "primary.main" }}>{icon}</Box>
      <Box>
        <Typography variant="subtitle2" color="textSecondary" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight="bold">
          {value}
        </Typography>
      </Box>
    </Card>
  </Tooltip>
);

// Header Component
const Header: React.FC<{ userName: string; onLogout: () => void }> = ({
  userName,
  onLogout,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (e: React.MouseEvent<HTMLElement>) => setAnchorEl(e.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  return (
    <AppBar position="sticky" color="primary" enableColorOnDark>
      <Toolbar>
        <PersonIcon sx={{ mr: 1 }} aria-hidden="true" />
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Smart Tourist Safety Monitoring - Welcome, {userName}
        </Typography>
        <Tooltip title="Profile & Settings">
          <IconButton
            color="inherit"
            onClick={handleMenuOpen}
            aria-controls={open ? "profile-menu" : undefined}
            aria-haspopup="true"
            aria-expanded={open ? "true" : undefined}
            aria-label="Open profile menu"
            size="large"
          >
            <SettingsIcon />
          </IconButton>
        </Tooltip>
        <Menu
          id="profile-menu"
          anchorEl={anchorEl}
          open={open}
          onClose={handleMenuClose}
          MenuListProps={{ "aria-labelledby": "profile-button" }}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <MenuItem onClick={handleMenuClose}>Settings</MenuItem>
          <MenuItem
            onClick={() => {
              handleMenuClose();
              onLogout();
            }}
          >
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

// Heatmap Component (using Leaflet CircleMarkers as placeholders)


const Heatmap: React.FC = () => {
  // Example Indian tourist clusters with mock intensity and labels
  const clusters = [
    { lat: 28.6139, lng: 77.2090, intensity: 60, label: "Delhi - Tourist Cluster" },
    { lat: 19.076, lng: 72.8777, intensity: 50, label: "Mumbai - Tourist Cluster" },
    { lat: 26.9124, lng: 75.7873, intensity: 40, label: "Jaipur - Tourist Cluster" },
    { lat: 15.2993, lng: 74.1240, intensity: 30, label: "Goa - Tourist Cluster" },
    { lat: 27.1767, lng: 78.0081, intensity: 70, label: "Agra - High-Risk Zone" }, // example high risk
  ];

  return (
    <MapContainer
      center={[20.5937, 78.9629]} // Center of India approx
      zoom={5}
      style={{ height: 300, width: "100%" }}
      scrollWheelZoom={false}
      aria-label="Interactive heatmap showing tourist clusters and high-risk zones in India"
    >
      <TileLayer
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {clusters.map(({ lat, lng, intensity, label }, i) => (
        <CircleMarker
          key={i}
          center={[lat, lng]}
          radius={intensity / 5}
          fillOpacity={0.5}
          stroke={false}
          fillColor={intensity > 60 ? "red" : intensity > 40 ? "orange" : "yellow"}
        >
          <Popup>{label}</Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
};

// Digital Tourist ID Records Table
const TouristIDRecords: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filterNationality, setFilterNationality] = useState("");

  const tourists: TouristID[] = [
    {
      id: "T-001",
      name: "Alice Johnson",
      nationality: "USA",
      kycStatus: "Verified",
      tripItinerary: "NYC - Boston - Miami",
      validUntil: "2024-12-31",
    },
    {
      id: "T-002",
      name: "Mohamed Ali",
      nationality: "Egypt",
      kycStatus: "Pending",
      tripItinerary: "Cairo - Luxor",
      validUntil: "2024-08-15",
    },
    {
      id: "T-003",
      name: "Sofia Rossi",
      nationality: "Italy",
      kycStatus: "Verified",
      tripItinerary: "Rome - Venice",
      validUntil: "2024-09-30",
    },
  ];

  const filtered = useMemo(() => {
    return tourists.filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) &&
        (filterNationality ? t.nationality === filterNationality : true)
    );
  }, [search, filterNationality]);

  const nationalities = Array.from(new Set(tourists.map((t) => t.nationality)));

  return (
    <Paper sx={{ p: 2, mb: 2 }} aria-label="Digital Tourist ID Records">
      <Typography variant="h6" gutterBottom>
        Digital Tourist ID Records
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems="center"
      >
        <TextField
          label="Search by Name"
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end" aria-hidden="true">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          aria-label="Search tourists by name"
        />
        <TextField
          select
          label="Filter by Nationality"
          size="small"
          value={filterNationality}
          onChange={(e) => setFilterNationality(e.target.value)}
          sx={{ minWidth: 180 }}
          aria-label="Filter tourists by nationality"
        >
          <MenuItem value="">All</MenuItem>
          {nationalities.map((nat) => (
            <MenuItem key={nat} value={nat}>
              {nat}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <TableContainer sx={{ maxHeight: 300 }}>
        <Table stickyHeader size="small" aria-label="Tourist ID records table">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Nationality</TableCell>
              <TableCell>KYC Status</TableCell>
              <TableCell>Trip Itinerary</TableCell>
              <TableCell>Valid Until</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map(({ id, name, nationality, kycStatus, tripItinerary, validUntil }) => (
              <TableRow key={id} hover tabIndex={-1}>
                <TableCell>{id}</TableCell>
                <TableCell>{name}</TableCell>
                <TableCell>{nationality}</TableCell>
                <TableCell>{kycStatus}</TableCell>
                <TableCell>{tripItinerary}</TableCell>
                <TableCell>{validUntil}</TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center">
                  No records found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

// Alert and Incident History Panel
const AlertIncidentHistory: React.FC = () => {
  const [filterType, setFilterType] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");

  const alerts: AlertIncident[] = [
    {
      id: "A-1001",
      type: "Geo-fencing Alert",
      urgency: "High",
      status: "Open",
      assignedTo: "Unit 12",
      date: "2024-06-10",
    },
    {
      id: "A-1002",
      type: "Panic Button Activation",
      urgency: "Critical",
      status: "Assigned",
      assignedTo: "Unit 5",
      date: "2024-06-09",
    },
    {
      id: "A-1003",
      type: "AI Anomaly Flag",
      urgency: "Medium",
      status: "Resolved",
      assignedTo: "Unit 3",
      date: "2024-06-08",
    },
  ];

  const filtered = useMemo(() => {
    return alerts.filter(
      (a) =>
        (filterType ? a.type === filterType : true) &&
        (filterUrgency ? a.urgency === filterUrgency : true)
    );
  }, [filterType, filterUrgency]);

  const alertTypes = Array.from(new Set(alerts.map((a) => a.type)));
  const urgencies = Array.from(new Set(alerts.map((a) => a.urgency)));

  // Placeholder handlers
  const assignCase = (id: string) => {
    // TODO: Integrate backend API to assign/reassign case
    alert(`Assign/Reassign case ${id} clicked`);
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }} aria-label="Alert and Incident History">
      <Typography variant="h6" gutterBottom>
        Alert and Incident History
      </Typography>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 2 }}
        alignItems="center"
      >
        <TextField
          select
          label="Filter by Alert Type"
          size="small"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          sx={{ minWidth: 180 }}
          aria-label="Filter alerts by type"
        >
          <MenuItem value="">All</MenuItem>
          {alertTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {type}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          label="Filter by Urgency"
          size="small"
          value={filterUrgency}
          onChange={(e) => setFilterUrgency(e.target.value)}
          sx={{ minWidth: 140 }}
          aria-label="Filter alerts by urgency"
        >
          <MenuItem value="">All</MenuItem>
          {urgencies.map((urgency) => (
            <MenuItem key={urgency} value={urgency}>
              {urgency}
            </MenuItem>
          ))}
        </TextField>
      </Stack>
      <List dense sx={{ maxHeight: 300, overflowY: "auto" }}>
        {filtered.map(({ id, type, urgency, status, assignedTo, date }) => (
          <ListItem
            key={id}
            secondaryAction={
              <Button
                variant="outlined"
                size="small"
                onClick={() => assignCase(id)}
                aria-label={`Assign or reassign case ${id}`}
              >
                Assign/Reassign
              </Button>
            }
            divider
          >
            <ListItemText
              primary={`${type} (${urgency} urgency) - ${status}`}
              secondary={`Date: ${date} | Assigned to: ${assignedTo ?? "Unassigned"}`}
            />
          </ListItem>
        ))}
        {filtered.length === 0 && (
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            No alerts found.
          </Typography>
        )}
      </List>
      <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
        <Button
          variant="contained"
          startIcon={<AddAlertIcon />}
          onClick={() => alert("Add Alert clicked")}
          aria-label="Add alert or incident"
        >
          Add Alert/Incident
        </Button>
        <Button
          variant="contained"
          startIcon={<AssignmentIndIcon />}
          onClick={() => alert("Generate E-FIR clicked")}
          aria-label="Generate automated E-FIR"
        >
          Generate E-FIR
        </Button>
      </Stack>
    </Paper>
  );
};

// Notifications Panel
const NotificationsPanel: React.FC = () => {
  const notifications: Notification[] = [
    {
      id: "N-001",
      message: "System maintenance scheduled for 2024-06-15",
      date: "2024-06-10",
      critical: false,
    },
    {
      id: "N-002",
      message: "New high-risk zone detected near Central Park",
      date: "2024-06-09",
      critical: true,
    },
    {
      id: "N-003",
      message: "User  'Officer Smith' updated case A-1002",
      date: "2024-06-08",
      critical: false,
    },
  ];

  return (
    <Paper sx={{ p: 2 }} aria-label="Notifications panel">
      <Typography variant="h6" gutterBottom>
        Notifications
      </Typography>
      <List dense>
        {notifications.map(({ id, message, date, critical }) => (
          <ListItem
            key={id}
            sx={{ bgcolor: critical ? "error.light" : "inherit" }}
            divider
          >
            <ListItemText
              primary={message}
              secondary={date}
              primaryTypographyProps={{
                color: critical ? "error.main" : "textPrimary",
                fontWeight: critical ? "bold" : "normal",
              }}
            />
          </ListItem>
        ))}
      </List>
    </Paper>
  );
};

// Main Authority Dashboard Component
const AuthorityDashboard: React.FC<{ userName: string; onLogout: () => void }> = ({
  userName,
  onLogout,
}) => {
  // Mock stats
  const totalTourists = 1280;
  const activeAlerts = 24;
  const resolvedIncidents = 1150;

  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <Header userName={userName} onLogout={onLogout} />
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {/* Stats Overview */}
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Tourists Monitored"
              value={totalTourists}
              icon={<PersonIcon fontSize="inherit" />}
              tooltip="Total number of tourists currently monitored"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Active Safety Alerts"
              value={activeAlerts}
              icon={<ReportProblemIcon fontSize="inherit" />}
              tooltip="Number of active safety alerts"
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatCard
              title="Resolved Incidents"
              value={resolvedIncidents}
              icon={<CheckCircleIcon fontSize="inherit" />}
              tooltip="Number of resolved/closed incidents"
            />
          </Grid>
        </Grid>

        {/* Heatmap */}
        <Typography variant="h6" gutterBottom>
          Tourist Clusters & High-Risk Zones
        </Typography>
        <Heatmap />

        {/* Digital Tourist ID Records */}
        <TouristIDRecords />

        {/* Alert and Incident History */}
        <AlertIncidentHistory />

        {/* Notifications */}
        <NotificationsPanel />
      </Container>
    </Box>
  );
};

export default AuthorityDashboard;