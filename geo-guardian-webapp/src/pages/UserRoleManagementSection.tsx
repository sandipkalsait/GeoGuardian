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

type Authority = {
  id: string;
  name: string;
  role: "Admin" | "Authority";
  email: string;
  phone?: string;
  active: boolean;
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
  const [authorities, setAuthorities] = useState<Authority[]>(initialAuthorities);
  const [stations, setStations] = useState<PoliceStation[]>(initialStations);
  const [officers, setOfficers] = useState<PoliceOfficer[]>(initialOfficers);

  const activeAuthorities = useMemo(() => authorities.filter(a => a.active).length, [authorities]);
  const activeStations = useMemo(() => stations.filter(s => s.active).length, [stations]);
  const activeOfficers = useMemo(() => officers.filter(o => o.active).length, [officers]);

  // Dialog router
  const [dialog, setDialog] = useState<null | "authority" | "station" | "officer">(null);

  // Forms
  const [authForm, setAuthForm] = useState<Partial<Authority>>({ role: "Authority", active: true });
  const [stationForm, setStationForm] = useState<Partial<PoliceStation>>({ active: true });
  const [officerForm, setOfficerForm] = useState<Partial<PoliceOfficer>>({ active: true, post: "Inspector", department: "Crime" });

  const closeDialog = () => setDialog(null);

  const saveAuthority = () => {
    if (!authForm.name || !authForm.email) return alert("Name and Email required");
    const id = `AUTH-${String(authorities.length + 1).padStart(3, "0")}`;
    setAuthorities(prev => [...prev, { id, name: authForm.name!, role: (authForm.role as any) || "Authority", email: authForm.email!, phone: authForm.phone || "", active: true }]);
    setAuthForm({ role: "Authority", active: true });
    closeDialog();
  };

  const saveStation = () => {
    if (!stationForm.name || !stationForm.area || !stationForm.address || !stationForm.contact) return alert("All fields required");
    const id = `PS-${String(stations.length + 1).padStart(4, "0")}`;
    setStations(prev => [...prev, { id, name: stationForm.name!, area: stationForm.area!, address: stationForm.address!, contact: stationForm.contact!, active: true }]);
    setStationForm({ active: true });
    closeDialog();
  };

  const saveOfficer = () => {
    if (!officerForm.name || !officerForm.stationId || !officerForm.stationName || !officerForm.post || !officerForm.department || !officerForm.phone) {
      return alert("Fill all officer fields");
    }
    const id = `PO-${String(officers.length + 1).padStart(4, "0")}`;
    setOfficers(prev => [...prev, {
      id,
      name: officerForm.name!,
      post: officerForm.post!,
      department: officerForm.department!,
      stationId: officerForm.stationId!,
      stationName: officerForm.stationName!,
      phone: officerForm.phone!,
      email: officerForm.email || "",
      active: true,
    }]);
    setOfficerForm({ active: true, post: "Inspector", department: "Crime" });
    closeDialog();
  };

  const deactivateOfficer = (id: string) => setOfficers(prev => prev.map(o => (o.id === id ? { ...o, active: false } : o)));
  const deactivateStation = (id: string) => setStations(prev => prev.map(s => (s.id === id ? { ...s, active: false } : s)));
  const deactivateAuthority = (id: string) => setAuthorities(prev => prev.map(a => (a.id === id ? { ...a, active: false } : a)));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Active Authorities" value={activeAuthorities} icon={<AdminPanelSettingsIcon color="info" />} color="info" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Active Stations" value={activeStations} icon={<AccountBalanceIcon color="success" />} color="success" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Active Officers" value={activeOfficers} icon={<LocalPoliceIcon color="warning" />} color="warning" /></Grid>
        <Grid item xs={12} sm={6} md={3}><Kpi label="Total Entities" value={authorities.length + stations.length + officers.length} icon={<AddIcon color="error" />} color="error" /></Grid>
      </Grid>

      {/* Authorities */}
      <Shell title="Authority Members" count={authorities.filter(a => a.active).length} icon={<AdminPanelSettingsIcon />} onAdd={() => setDialog("authority")}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Role</TableCell><TableCell>Email</TableCell><TableCell>Phone</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {authorities.filter(a => a.active).map(a => (
                <TableRow key={a.id} hover>
                  <TableCell>{a.id}</TableCell>
                  <TableCell>{a.name}</TableCell>
                  <TableCell>{a.role}</TableCell>
                  <TableCell>{a.email}</TableCell>
                  <TableCell>{a.phone || "-"}</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deactivateAuthority(a.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Stations */}
      <Shell title="Police Stations" count={stations.filter(s => s.active).length} icon={<AccountBalanceIcon />} onAdd={() => setDialog("station")}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Area</TableCell><TableCell>Address</TableCell><TableCell>Contact</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stations.filter(s => s.active).map(s => (
                <TableRow key={s.id} hover>
                  <TableCell>{s.id}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  <TableCell>{s.area}</TableCell>
                  <TableCell>{s.address}</TableCell>
                  <TableCell>{s.contact}</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deactivateStation(s.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Officers */}
      <Shell title="Police Officers" count={officers.filter(o => o.active).length} icon={<LocalPoliceIcon />} onAdd={() => setDialog("officer")}>
        <TableContainer sx={{ maxHeight: 360 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell><TableCell>Name</TableCell><TableCell>Post</TableCell><TableCell>Department</TableCell><TableCell>Station</TableCell><TableCell>Phone</TableCell><TableCell>Email</TableCell><TableCell>Status</TableCell><TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {officers.filter(o => o.active).map(o => (
                <TableRow key={o.id} hover>
                  <TableCell>{o.id}</TableCell>
                  <TableCell>{o.name}</TableCell>
                  <TableCell>{o.post}</TableCell>
                  <TableCell>{o.department}</TableCell>
                  <TableCell>{o.stationName}</TableCell>
                  <TableCell>{o.phone}</TableCell>
                  <TableCell>{o.email || "-"}</TableCell>
                  <TableCell><Chip label="Active" color="success" size="small" /></TableCell>
                  <TableCell align="right">
                    <Tooltip title="View"><IconButton size="small"><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" color="warning"><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Deactivate"><IconButton size="small" color="error" onClick={() => deactivateOfficer(o.id)}><DeleteOutlineIcon fontSize="small" /></IconButton></Tooltip>
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
                      const st = stations.find(s => s.id === sid);
                      setOfficerForm({ ...officerForm, stationId: sid, stationName: st?.name || "" });
                    }}
                  >
                    <MenuItem value="" disabled>Select Station</MenuItem>
                    {stations.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
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
