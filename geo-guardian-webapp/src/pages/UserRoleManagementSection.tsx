import React, { useMemo, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
  Dialog,
  AppBar,
  Toolbar,
  Slide,
  Divider,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { TransitionProps } from "@mui/material/transitions";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import {
  createUserProfile,
  updateUserActiveStatus,
  type EmergencyAlertRecord,
} from "../Services/realtimeDataService";

type Authority = {
  id: string;
  name: string;
  role: "Admin" | "Authority";
  email: string;
  phone?: string;
  active: boolean;
  docId?: string;
  sourceCollection?: string;
};

type PoliceStation = {
  id: string;
  name: string;
  area: string;
  address: string;
  contact: string;
  active: boolean;
};

type PoliceOfficer = {
  id: string;
  name: string;
  post: string;
  department: string;
  stationId: string;
  stationName: string;
  phone: string;
  email?: string;
  active: boolean;
  docId?: string;
  sourceCollection?: string;
};

const initialAuthorities: Authority[] = [
  { id: "AUTH-001", name: "Arun Gupta", role: "Admin", email: "arun@geo.gov", phone: "9876543210", active: true },
  { id: "AUTH-002", name: "Priya Nair", role: "Authority", email: "priya@geo.gov", phone: "9988776655", active: true },
];

const initialStations: PoliceStation[] = [
  { id: "PS-1001", name: "Shivaji Nagar PS", area: "Central Zone", address: "12 MG Road, Pune", contact: "020-2456-1122", active: true },
  { id: "PS-1002", name: "Marine Drive PS", area: "South", address: "88 Seaface Rd, Mumbai", contact: "022-2300-7788", active: true },
];

const initialOfficers: PoliceOfficer[] = [
  { id: "PO-5001", name: "Rahul Deshmukh", post: "Inspector", department: "Crime", stationId: "PS-1001", stationName: "Shivaji Nagar PS", phone: "9000011111", email: "rahul@police.in", active: true },
  { id: "PO-5002", name: "Anita Joshi", post: "SI", department: "Traffic", stationId: "PS-1002", stationName: "Marine Drive PS", phone: "9000022222", email: "anita@police.in", active: true },
];

const normalizeType = (value: string): string =>
  value.trim().toLowerCase();

const makeStationName = (address: string, index: number): string => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length === 0) {
    return `Zone ${index + 1} Station`;
  }
  const seed = parts[0];
  return /station|ps/i.test(seed) ? seed : `${seed} Station`;
};

const mapAlertsToStations = (alerts: EmergencyAlertRecord[]): PoliceStation[] => {
  const byAddress = new Map<string, PoliceStation>();

  alerts.forEach((alert) => {
    const address = alert.address?.trim() || "Address unavailable";
    if (byAddress.has(address)) {
      return;
    }

    const parts = address
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);

    const id = `PS-AUTO-${String(byAddress.size + 1).padStart(4, "0")}`;
    byAddress.set(address, {
      id,
      name: makeStationName(address, byAddress.size),
      area: parts.length > 1 ? parts[parts.length - 2] : "Unknown Zone",
      address,
      contact: "N/A",
      active: true,
    });
  });

  return Array.from(byAddress.values());
};

const Shell = ({ title, count, icon, onAdd, children }: { title: string; count: number; icon: React.ReactNode; onAdd: () => void; children: React.ReactNode }) => (
  <Paper elevation={0} sx={{ borderRadius: 2, border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 28px rgba(20,35,52,0.06)" }}>
    <Box sx={{ px: 2, py: 1.25, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(15,76,117,0.08)", background: "linear-gradient(180deg, rgba(15,76,117,0.04), rgba(15,76,117,0.02))" }}>
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
        <Badge color="info" variant="dot">{icon}</Badge>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>{title}</Typography>
        <Chip label={`${count}`} size="small" variant="outlined" />
      </Box>
      <Tooltip title="Add new">
        <IconButton size="small" color="primary" onClick={onAdd}>
          <AddIcon />
        </IconButton>
      </Tooltip>
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Paper>
);

const Kpi = ({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: "info" | "warning" | "success" | "error" }) => (
  <Paper elevation={0} sx={{ p: 2, borderRadius: 2, border: "1px solid rgba(15,76,117,0.08)", boxShadow: "0 8px 24px rgba(20,35,52,0.06)" }}>
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.5 }}>{value}</Typography>
      </Box>
      <Badge color={color} variant="dot">
        <Box sx={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(15,76,117,0.06)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </Box>
      </Badge>
    </Box>
  </Paper>
);

// Fullscreen dialog transition
const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const UserAdminControlSection: React.FC = () => {
  const { users, emergencyAlerts } = useGeoGuardianRealtimeData();
  const [authorities, setAuthorities] = useState<Authority[]>(initialAuthorities);
  const [stations, setStations] = useState<PoliceStation[]>(initialStations);
  const [officers, setOfficers] = useState<PoliceOfficer[]>(initialOfficers);
  const [inactiveUserIds, setInactiveUserIds] = useState<string[]>([]);
  const [inactiveStationIds, setInactiveStationIds] = useState<string[]>([]);

  const realtimeAuthorities = useMemo(
    () =>
      users.data
        .filter((user) => {
          const userType = normalizeType(user.userType);
          return userType.includes("authority") || userType.includes("admin");
        })
        .map((user) => ({
          id: user.id,
          name: user.name,
          role: normalizeType(user.userType).includes("admin")
            ? "Admin"
            : "Authority",
          email: user.email,
          phone: user.phoneNumber,
          active: user.isActive && !inactiveUserIds.includes(user.id),
          docId: user.docId,
          sourceCollection: user.sourceCollection,
        })),
    [users.data, inactiveUserIds],
  );

  const realtimeOfficers = useMemo(
    () =>
      users.data
        .filter((user) => {
          const userType = normalizeType(user.userType);
          return userType.includes("police") || userType.includes("officer");
        })
        .map((user) => {
          const raw = user.raw as Record<string, unknown>;
          const stationName =
            typeof raw.stationName === "string" && raw.stationName
              ? raw.stationName
              : "Unassigned Station";

          return {
            id: user.id,
            name: user.name,
            post:
              typeof raw.post === "string" && raw.post ? raw.post : "Inspector",
            department:
              typeof raw.department === "string" && raw.department
                ? raw.department
                : "Operations",
            stationId:
              typeof raw.stationId === "string" && raw.stationId
                ? raw.stationId
                : stationName.toUpperCase().replace(/[^A-Z0-9]+/g, "-"),
            stationName,
            phone: user.phoneNumber || "-",
            email: user.email,
            active: user.isActive && !inactiveUserIds.includes(user.id),
            docId: user.docId,
            sourceCollection: user.sourceCollection,
          };
        }),
    [users.data, inactiveUserIds],
  );

  const autoStations = useMemo(
    () => mapAlertsToStations(emergencyAlerts.data),
    [emergencyAlerts.data],
  );

  const authorityRows = useMemo(
    () => (realtimeAuthorities.length > 0 ? realtimeAuthorities : authorities),
    [realtimeAuthorities, authorities],
  );

  const officerRows = useMemo(
    () => (realtimeOfficers.length > 0 ? realtimeOfficers : officers),
    [realtimeOfficers, officers],
  );

  const stationRows = useMemo(() => {
    const manualStations = stations.filter((station) =>
      station.id.startsWith("PS-MANUAL-"),
    );
    const base =
      autoStations.length > 0
        ? [...autoStations, ...manualStations]
        : stations;
    const seen = new Set<string>();
    return base
      .filter((station) => {
        const dedupeKey = `${station.id}:${station.address}`;
        if (seen.has(dedupeKey)) {
          return false;
        }
        seen.add(dedupeKey);
        return true;
      })
      .map((station) => ({
        ...station,
        active:
          station.active && !inactiveStationIds.includes(station.id),
      }));
  }, [autoStations, stations, inactiveStationIds]);

  const activeAuthorities = useMemo(
    () => authorityRows.filter((authority) => authority.active).length,
    [authorityRows],
  );
  const activeStations = useMemo(
    () => stationRows.filter((station) => station.active).length,
    [stationRows],
  );
  const activeOfficers = useMemo(
    () => officerRows.filter((officer) => officer.active).length,
    [officerRows],
  );

  // Dialog router
  const [dialog, setDialog] = useState<null | "authority" | "station" | "officer">(null);

  // Forms
  const [authForm, setAuthForm] = useState<Partial<Authority>>({ role: "Authority", active: true });
  const [stationForm, setStationForm] = useState<Partial<PoliceStation>>({ active: true });
  const [officerForm, setOfficerForm] = useState<Partial<PoliceOfficer>>({ active: true, post: "Inspector", department: "Crime" });

  const closeDialog = () => setDialog(null);

  const saveAuthority = async () => {
    if (!authForm.name || !authForm.email) return alert("Name and Email required");
    const id = `AUTH-${String(authorities.length + 1).padStart(3, "0")}`;
    const row: Authority = {
      id,
      name: authForm.name!,
      role: (authForm.role as "Admin" | "Authority") || "Authority",
      email: authForm.email!,
      phone: authForm.phone || "",
      active: true,
    };
    setAuthorities((prev) => [...prev, row]);
    try {
      await createUserProfile({
        name: row.name,
        email: row.email,
        phoneNumber: row.phone,
        userType: row.role === "Admin" ? "admin" : "authority",
        isActive: true,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create authority";
      alert(message);
    }
    setAuthForm({ role: "Authority", active: true });
    closeDialog();
  };

  const saveStation = () => {
    if (!stationForm.name || !stationForm.area || !stationForm.address || !stationForm.contact) return alert("All fields required");
    const id = `PS-MANUAL-${String(stations.length + 1).padStart(4, "0")}`;
    setStations((prev) => [
      ...prev,
      {
        id,
        name: stationForm.name!,
        area: stationForm.area!,
        address: stationForm.address!,
        contact: stationForm.contact!,
        active: true,
      },
    ]);
    setStationForm({ active: true });
    closeDialog();
  };

  const saveOfficer = async () => {
    if (!officerForm.name || !officerForm.stationId || !officerForm.stationName || !officerForm.post || !officerForm.department || !officerForm.phone) {
      return alert("Fill all officer fields");
    }
    const id = `PO-${String(officers.length + 1).padStart(4, "0")}`;
    const row: PoliceOfficer = {
      id,
      name: officerForm.name!,
      post: officerForm.post!,
      department: officerForm.department!,
      stationId: officerForm.stationId!,
      stationName: officerForm.stationName!,
      phone: officerForm.phone!,
      email: officerForm.email || "",
      active: true,
    };
    setOfficers((prev) => [...prev, row]);
    try {
      await createUserProfile({
        name: row.name,
        email: row.email || `${row.id.toLowerCase()}@geo-guardian.local`,
        phoneNumber: row.phone,
        userType: "police",
        isActive: true,
        stationId: row.stationId,
        stationName: row.stationName,
        post: row.post,
        department: row.department,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to create officer";
      alert(message);
    }
    setOfficerForm({ active: true, post: "Inspector", department: "Crime" });
    closeDialog();
  };

  const deactivateOfficer = async (officer: PoliceOfficer) => {
    setInactiveUserIds((prev) =>
      prev.includes(officer.id) ? prev : [...prev, officer.id],
    );
    setOfficers((prev) =>
      prev.map((existing) =>
        existing.id === officer.id ? { ...existing, active: false } : existing,
      ),
    );

    if (officer.docId && officer.sourceCollection) {
      try {
        await updateUserActiveStatus(
          {
            docId: officer.docId,
            sourceCollection: officer.sourceCollection,
          },
          false,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to deactivate officer";
        alert(message);
      }
    }
  };

  const deactivateStation = (id: string) => {
    setInactiveStationIds((prev) =>
      prev.includes(id) ? prev : [...prev, id],
    );
    setStations((prev) =>
      prev.map((station) =>
        station.id === id ? { ...station, active: false } : station,
      ),
    );
  };

  const deactivateAuthority = async (authority: Authority) => {
    setInactiveUserIds((prev) =>
      prev.includes(authority.id) ? prev : [...prev, authority.id],
    );
    setAuthorities((prev) =>
      prev.map((existing) =>
        existing.id === authority.id
          ? { ...existing, active: false }
          : existing,
      ),
    );

    if (authority.docId && authority.sourceCollection) {
      try {
        await updateUserActiveStatus(
          {
            docId: authority.docId,
            sourceCollection: authority.sourceCollection,
          },
          false,
        );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to deactivate authority";
        alert(message);
      }
    }
  };

  const realtimeError = users.error || emergencyAlerts.error;

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {realtimeError && (
        <Typography variant="caption" color="error">
          Realtime sync issue: {realtimeError}
        </Typography>
      )}

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Active Authorities" value={activeAuthorities} icon={<AdminPanelSettingsIcon color="info" />} color="info" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Active Stations" value={activeStations} icon={<AccountBalanceIcon color="success" />} color="success" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Active Officers" value={activeOfficers} icon={<LocalPoliceIcon color="warning" />} color="warning" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Total Entities" value={authorityRows.length + stationRows.length + officerRows.length} icon={<AddIcon color="error" />} color="error" /></Grid>
      </Grid>

      {/* Authorities */}
      <Shell title="Authority Members" count={authorityRows.filter((authority) => authority.active).length} icon={<AdminPanelSettingsIcon />} onAdd={() => setDialog("authority")}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Role</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {authorityRows.filter((authority) => authority.active).map((authority) => (
                <TableRow key={authority.id} hover>
                  <TableCell>{authority.id}</TableCell>
                  <TableCell>{authority.name}</TableCell>
                  <TableCell>{authority.role}</TableCell>
                  <TableCell>{authority.email}</TableCell>
                  <TableCell>{authority.phone || "-"}</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deactivateAuthority(authority)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Stations */}
      <Shell title="Police Stations" count={stationRows.filter((station) => station.active).length} icon={<AccountBalanceIcon />} onAdd={() => setDialog("station")}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Area</TableCell><TableCell>Address</TableCell><TableCell>Contact</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stationRows.filter((station) => station.active).map((station) => (
                <TableRow key={station.id} hover>
                  <TableCell>{station.id}</TableCell>
                  <TableCell>{station.name}</TableCell>
                  <TableCell>{station.area}</TableCell>
                  <TableCell>{station.address}</TableCell>
                  <TableCell>{station.contact}</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deactivateStation(station.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Officers */}
      <Shell title="Police Officers" count={officerRows.filter((officer) => officer.active).length} icon={<LocalPoliceIcon />} onAdd={() => setDialog("officer")}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Post</TableCell><TableCell>Department</TableCell><TableCell>Station</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {officerRows.filter((officer) => officer.active).map((officer) => (
                <TableRow key={officer.id} hover>
                  <TableCell>{officer.id}</TableCell>
                  <TableCell>{officer.name}</TableCell>
                  <TableCell>{officer.post}</TableCell>
                  <TableCell>{officer.department}</TableCell>
                  <TableCell>{officer.stationName}</TableCell>
                  <TableCell>{officer.phone}</TableCell>
                  <TableCell>{officer.email || "-"}</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deactivateOfficer(officer)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Full-screen Create Dialog */}
      <Dialog fullScreen open={dialog !== null} onClose={closeDialog} TransitionComponent={Transition}>
        <AppBar sx={{ position: "relative", bgcolor: "rgba(15,76,117,0.9)" }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={closeDialog} aria-label="close">
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1, fontWeight: 800 }} variant="h6">
              {dialog === "authority" ? "New Authority Member" : dialog === "station" ? "New Police Station" : "New Police Officer"}
            </Typography>
            <Button color="inherit" onClick={closeDialog}>Cancel</Button>
          </Toolbar>
        </AppBar>

        <Box sx={{ p: 3 }}>
          {dialog === "authority" && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Account Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Full Name" value={authForm.name || ""} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Email" value={authForm.email || ""} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Phone" value={authForm.phone || ""} onChange={(e) => setAuthForm({ ...authForm, phone: e.target.value })} /></Grid>
                <Grid item xs={12} md={3}>
                  <Select fullWidth size="small" value={authForm.role || "Authority"} onChange={(e) => setAuthForm({ ...authForm, role: e.target.value as any })}>
                    <MenuItem value="Authority">Authority</MenuItem>
                    <MenuItem value="Admin">Admin</MenuItem>
                  </Select>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Button variant="contained" onClick={saveAuthority}>Create Member</Button>
            </Paper>
          )}

          {dialog === "station" && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Station Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Station Name" value={stationForm.name || ""} onChange={(e) => setStationForm({ ...stationForm, name: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Area" value={stationForm.area || ""} onChange={(e) => setStationForm({ ...stationForm, area: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Contact" value={stationForm.contact || ""} onChange={(e) => setStationForm({ ...stationForm, contact: e.target.value })} /></Grid>
                <Grid item xs={12}><TextField fullWidth size="small" label="Address" value={stationForm.address || ""} onChange={(e) => setStationForm({ ...stationForm, address: e.target.value })} /></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Button variant="contained" onClick={saveStation}>Create Station</Button>
            </Paper>
          )}

          {dialog === "officer" && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Officer Details</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Officer Name" value={officerForm.name || ""} onChange={(e) => setOfficerForm({ ...officerForm, name: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><Select fullWidth size="small" value={officerForm.post || "Inspector"} onChange={(e) => setOfficerForm({ ...officerForm, post: e.target.value as string })}><MenuItem value="Inspector">Inspector</MenuItem><MenuItem value="SI">SI</MenuItem><MenuItem value="ASI">ASI</MenuItem><MenuItem value="Constable">Constable</MenuItem></Select></Grid>
                <Grid item xs={12} md={4}><Select fullWidth size="small" value={officerForm.department || "Crime"} onChange={(e) => setOfficerForm({ ...officerForm, department: e.target.value as string })}><MenuItem value="Crime">Crime</MenuItem><MenuItem value="Traffic">Traffic</MenuItem><MenuItem value="Cyber">Cyber</MenuItem><MenuItem value="Operations">Operations</MenuItem></Select></Grid>
                <Grid item xs={12} md={6}>
                  <Select
                    fullWidth size="small" displayEmpty
                    value={officerForm.stationId || ""}
                    onChange={(e) => {
                      const sid = e.target.value as string;
                      const st = stationRows.find((station) => station.id === sid);
                      setOfficerForm({ ...officerForm, stationId: sid, stationName: st?.name || "" });
                    }}
                  >
                    <MenuItem value="" disabled>Select Station</MenuItem>
                    {stationRows
                      .filter((station) => station.active)
                      .map((station) => (
                        <MenuItem key={station.id} value={station.id}>
                          {station.name}
                        </MenuItem>
                      ))}
                  </Select>
                </Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Phone" value={officerForm.phone || ""} onChange={(e) => setOfficerForm({ ...officerForm, phone: e.target.value })} /></Grid>
                <Grid item xs={12} md={3}><TextField fullWidth size="small" label="Email (optional)" value={officerForm.email || ""} onChange={(e) => setOfficerForm({ ...officerForm, email: e.target.value })} /></Grid>
              </Grid>
              <Divider sx={{ my: 2 }} />
              <Button variant="contained" onClick={saveOfficer}>Create Officer</Button>
            </Paper>
          )}
        </Box>
      </Dialog>
    </Box>
  );
};

export default UserAdminControlSection;
