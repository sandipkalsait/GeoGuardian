import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Button,
  Grid,
  Chip,
  Divider,
} from "@mui/material";

const rescueTeams = [
  { id: "TeamA", name: "Rescue Team A", contact: "123-456-7890", available: true },
  { id: "TeamB", name: "Rescue Team B", contact: "987-654-3210", available: false },
  { id: "TeamC", name: "Rescue Team C", contact: "555-666-7777", available: true },
];

// Example alerts ready for dispatch
const activeAlerts = [
  { id: "ALRT-2001", description: "Flood in Sector 5" },
  { id: "ALRT-2002", description: "Landslide near Highway 23" },
];

const EmergencyResponseCoordinationSection = () => {
  const [selectedAlert, setSelectedAlert] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");

  const handleDispatch = () => {
    if (!selectedAlert || !selectedTeam) {
      alert("Please select an alert and a rescue team before dispatching.");
      return;
    }
    alert(`Dispatched ${selectedTeam} to alert ${selectedAlert}`);
    // You can integrate backend API calls here
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="#003366" fontWeight="bold">
        Emergency Response Coordination
      </Typography>

      {/* Contact & Availability Table */}
      <Typography variant="subtitle1" mb={1}>Rescue Teams Contact & Availability</Typography>
      <Paper sx={{ mb: 4 }}>
        <TableContainer sx={{ maxHeight: 280 }}>
          <Table stickyHeader size="small" aria-label="rescue teams table">
            <TableHead sx={{ backgroundColor: "#d8d2c4" }}>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Availability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rescueTeams.map(team => (
                <TableRow key={team.id}>
                  <TableCell>{team.name}</TableCell>
                  <TableCell>{team.contact}</TableCell>
                  <TableCell>
                    <Chip
                      label={team.available ? "Available" : "Unavailable"}
                      color={team.available ? "success" : "error"}
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dispatch Interface */}
      <Typography variant="subtitle1" mb={1}>Dispatch Alert to Rescue Team</Typography>
      <Grid container spacing={2} alignItems="center" mb={4}>
        <Grid item xs={12} sm={5}>
          <Select
            fullWidth
            displayEmpty
            value={selectedAlert}
            onChange={(e) => setSelectedAlert(e.target.value)}
            size="small"
          >
            <MenuItem value="" disabled>Select Alert</MenuItem>
            {activeAlerts.map(alert => (
              <MenuItem key={alert.id} value={alert.id}>
                {alert.id} - {alert.description}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={5}>
          <Select
            fullWidth
            displayEmpty
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            size="small"
          >
            <MenuItem value="" disabled>Select Rescue Team</MenuItem>
            {rescueTeams.filter(t => t.available).map(team => (
              <MenuItem key={team.id} value={team.name}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </Grid>
        <Grid item xs={12} sm={2}>
          <Button variant="contained" color="primary" fullWidth onClick={handleDispatch}>
            Dispatch
          </Button>
        </Grid>
      </Grid>

      {/* Map Placeholder */}
      <Box
        sx={{
          height: 400,
          borderRadius: 2,
          backgroundColor: "#fff",
          boxShadow: 3,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#999",
          fontSize: 18,
        }}
      >
        Route and Safety Zone Map Placeholder
      </Box>
    </Box>
  );
};

export default EmergencyResponseCoordinationSection;


import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Grid,
  Select,
  MenuItem,
  TextField,
  Tooltip,
  Divider,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import type { GridColDef, GridRenderCellParams } from "@mui/x-data-grid";
import type { ChipProps } from "@mui/material/Chip";

import RoomIcon from "@mui/icons-material/Room";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalPoliceIcon from "@mui/icons-material/LocalPolice";
import SendIcon from "@mui/icons-material/Send";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";

// Mock rescue teams
const rescueTeams = [
  { id: "TeamA", name: "Rescue Team A", contact: "123-456-7890", available: true, lat: 19.076, lng: 72.8777 },
  { id: "TeamB", name: "Rescue Team B", contact: "987-654-3210", available: false, lat: 18.5204, lng: 73.8567 },
  { id: "TeamC", name: "Rescue Team C", contact: "555-666-7777", available: true, lat: 21.1458, lng: 79.0882 },
];

// Mock alerts
const activeAlerts = [
  { id: "ALRT-2001", description: "Flood in Sector 5" },
  { id: "ALRT-2002", description: "Landslide near Highway 23" },
];

// Types
type SosStatus = "New" | "Acknowledged" | "Dispatched" | "Resolved";
type Priority = "Critical" | "High" | "Medium" | "Low";

interface SosRecord {
  id: string;
  touristName: string;
  phone: string;
  location: string;
  lat: number;
  lng: number;
  time: string;
  status: SosStatus;
  priority: Priority;
  assignedTeamId?: string;
  etaMinutes?: number;
  notes?: string;
}

// Mock SOS
const initialSos: SosRecord[] = [
  {
    id: "SOS-9001",
    touristName: "John Doe",
    phone: "+91-99999-11111",
    location: "Gate 2, City Museum",
    lat: 18.5204,
    lng: 73.8567,
    time: "2025-09-24 13:58",
    status: "New",
    priority: "High",
  },
  {
    id: "SOS-9002",
    touristName: "Jane Smith",
    phone: "+91-88888-22222",
    location: "Riverside Park North",
    lat: 19.076,
    lng: 72.8777,
    time: "2025-09-24 14:01",
    status: "Acknowledged",
    priority: "Critical",
  },
];

// Helpers
const statusToChipColor = (s: SosStatus): ChipProps["color"] => {
  switch (s) {
    case "Resolved":
      return "success";
    case "Dispatched":
      return "info";
    case "Acknowledged":
      return "warning";
    default:
      return "default";
  }
};

const priorityChipSx = (p: Priority) => ({
  bgcolor:
    p === "Critical" ? "error.main" : p === "High" ? "warning.dark" : p === "Medium" ? "info.main" : "grey.500",
  color: "common.white",
});

const Card = ({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: 2,
      overflow: "hidden",
      border: "1px solid rgba(15,76,117,0.08)",
      boxShadow: "0 8px 28px rgba(20,35,52,0.06)",
      bgcolor: "background.paper",
    }}
  >
    <Box
      sx={{
        px: 2,
        py: 1.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 1,
        background:
          "linear-gradient(180deg, rgba(15,76,117,0.04), rgba(15,76,117,0.02))",
        borderBottom: "1px solid rgba(15,76,117,0.08)",
      }}
    >
      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>{actions}</Box>
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Paper>
);

const EmergencyResponseCoordinationSection: React.FC = () => {
  const [sos, setSos] = useState<SosRecord[]>(initialSos);
  const [filterStatus, setFilterStatus] = useState<SosStatus | "All">("All");
  const [selected, setSelected] = useState<SosRecord | null>(null);

  const [selectedManualAlert, setSelectedManualAlert] = useState<string>("");
  const [selectedManualTeam, setSelectedManualTeam] = useState<string>("");
  const [dispatchNotes, setDispatchNotes] = useState("");

  const filteredSos = useMemo(
    () => sos.filter((r) => filterStatus === "All" || r.status === filterStatus),
    [sos, filterStatus]
  );

  const nearestAvailableTeam = (lat: number, lng: number) => {
    const avail = rescueTeams.filter((t) => t.available);
    if (!avail.length) return undefined;
    const dist = (a: number, b: number, c: number, d: number) => Math.hypot(a - c, b - d);
    return avail.reduce((best, t) => {
      const d = dist(lat, lng, t.lat, t.lng);
      return !best || d < best.d ? { t, d } : best;
    }, null as null | { t: (typeof rescueTeams)[number]; d: number })?.t;
  };

  const acknowledge = (id: string) =>
    setSos((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Acknowledged" } : r)));

  const autoAssignAndDispatch = (rec: SosRecord) => {
    const team = nearestAvailableTeam(rec.lat, rec.lng);
    if (!team) {
      alert("No available team found");
      return;
    }
    const eta = Math.max(3, Math.round(Math.random() * 12));
    setSos((prev) =>
      prev.map((r) =>
        r.id === rec.id ? { ...r, status: "Dispatched", assignedTeamId: team.id, etaMinutes: eta } : r
      )
    );
  };

  const resolve = (id: string) =>
    setSos((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Resolved" } : r)));

  // Row alias
  type SosRow = SosRecord;

  // Columns
  const sosColumns: GridColDef<SosRow>[] = [
    {
      field: "id",
      headerName: "SOS ID",
      width: 120,
      renderCell: (p: GridRenderCellParams<SosRow, SosRow["id"]>) => (
        <Typography fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
          {p.value}
        </Typography>
      ),
    },
    { field: "time", headerName: "Time", width: 140 },
    { field: "touristName", headerName: "Tourist", width: 150 },
    { field: "phone", headerName: "Phone", width: 150 },
    {
      field: "location",
      headerName: "Location",
      width: 180,
      renderCell: (p: GridRenderCellParams<SosRow, SosRow["location"]>) => (
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
          <RoomIcon fontSize="small" sx={{ color: "error.main" }} />
          <Typography>{p.value}</Typography>
        </Box>
      ),
    },
    {
      field: "priority",
      headerName: "Priority",
      width: 110,
      renderCell: (p: GridRenderCellParams<SosRow, SosRow["priority"]>) => {
        const val = (p.value ?? "Low") as Priority;
        return <Chip label={val} size="small" sx={priorityChipSx(val)} />;
      },
    },
    {
      field: "status",
      headerName: "Status",
      width: 130,
      renderCell: (p: GridRenderCellParams<SosRow, SosRow["status"]>) => {
        const val = (p.value ?? "New") as SosStatus;
        return <Chip label={val} size="small" color={statusToChipColor(val)} />;
      },
    },
    {
      field: "assignedTeamId",
      headerName: "Team",
      width: 140,
      valueGetter: (p: { row: SosRow }) => {
        const t = rescueTeams.find((x) => x.id === p.row.assignedTeamId);
        return t ? t.name : "-";
      },
    },
    {
      field: "etaMinutes",
      headerName: "ETA (min)",
      width: 110,
      valueFormatter: (p: { row: SosRow }) => {
        const v = p.row.etaMinutes;
        return v != null ? String(v) : "-";
      },
    },
    {
      field: "actions",
      headerName: "Actions",
      width: 260,
      sortable: false,
      filterable: false,
      renderCell: (params: GridRenderCellParams<SosRow>) => {
        const rec = params.row;
        return (
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Acknowledge">
              <span>
                <IconButton
                  color="warning"
                  onClick={() => acknowledge(rec.id)}
                  disabled={rec.status !== "New"}
                >
                  <CheckCircleIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Auto-assign & Dispatch">
              <span>
                <IconButton
                  color="primary"
                  onClick={() => autoAssignAndDispatch(rec)}
                  disabled={rec.status === "Resolved" || rec.status === "Dispatched"}
                >
                  <LocalPoliceIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Mark Resolved">
              <span>
                <IconButton
                  color="success"
                  onClick={() => resolve(rec.id)}
                  disabled={rec.status !== "Dispatched"}
                >
                  <DoneAllIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Details">
              <IconButton color="default" onClick={() => setSelected(rec)}>
                <InfoOutlinedIcon />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
  ];

  const handleManualDispatch = () => {
    if (!selectedManualAlert || !selectedManualTeam) {
      alert("Select an alert and a team");
      return;
    }
    alert(`Dispatched ${selectedManualTeam} to ${selectedManualAlert}\nNotes: ${dispatchNotes}`);
    setDispatchNotes("");
    setSelectedManualTeam("");
    setSelectedManualAlert("");
  };

  const gridCommon = {
    density: "compact" as const,
    disableRowSelectionOnClick: true,
    autoHeight: false,
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Card
        title="Active SOS"
        subtitle="Incoming SOS from tourists with live status and SLA"
        actions={
          <Select
            size="small"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as SosStatus | "All")}
            sx={{ minWidth: 160 }}
          >
            <MenuItem value="All">All Status</MenuItem>
            <MenuItem value="New">New</MenuItem>
            <MenuItem value="Acknowledged">Acknowledged</MenuItem>
            <MenuItem value="Dispatched">Dispatched</MenuItem>
            <MenuItem value="Resolved">Resolved</MenuItem>
          </Select>
        }
      >
        <Box sx={{ height: 420 }}>
          <DataGrid<SosRow>
            rows={filteredSos as SosRow[]}
            columns={sosColumns}
            getRowId={(r) => r.id}
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
            pageSizeOptions={[5, 10]}
            initialState={{ pagination: { paginationModel: { page: 0, pageSize: 5 } } }}
            {...gridCommon}
          />
        </Box>
      </Card>

      <Card title="Dispatch Alert to Rescue Team" subtitle="Manual assignment for non‑SOS incidents">
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <Select
              fullWidth
              displayEmpty
              value={selectedManualAlert}
              onChange={(e) => setSelectedManualAlert(e.target.value)}
              size="small"
            >
              <MenuItem value="" disabled>
                Select Alert
              </MenuItem>
              {activeAlerts.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.id} — {a.description}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Select
              fullWidth
              displayEmpty
              value={selectedManualTeam}
              onChange={(e) => setSelectedManualTeam(e.target.value)}
              size="small"
            >
              <MenuItem value="" disabled>
                Select Rescue Team
              </MenuItem>
              {rescueTeams.filter((t) => t.available).map((t) => (
                <MenuItem key={t.id} value={t.id}>
                  {t.name}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={3}>
            <TextField
              size="small"
              fullWidth
              placeholder="Dispatch notes (optional)"
              value={dispatchNotes}
              onChange={(e) => setDispatchNotes(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm="auto">
            <Button variant="contained" color="primary" startIcon={<SendIcon />} onClick={handleManualDispatch}>
              Dispatch
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card title="Rescue Teams" subtitle="Contact directory and availability">
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
          {rescueTeams.map((t) => (
            <Paper key={t.id} variant="outlined" sx={{ p: 2, borderRadius: 2, display: "flex", flexDirection: "column", gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t.contact}
              </Typography>
              <Chip label={t.available ? "Available" : "Unavailable"} color={t.available ? "success" : "error"} size="small" sx={{ alignSelf: "start" }} />
            </Paper>
          ))}
        </Box>
      </Card>

      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>SOS Details</DialogTitle>
        <Divider />
        <DialogContent>
          {selected && (
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5, mt: 1 }}>
              <Typography>
                <strong>ID:</strong>{" "}
                <span style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}>{selected.id}</span>
              </Typography>
              <Typography>
                <strong>Time:</strong> {selected.time}
              </Typography>
              <Typography>
                <strong>Tourist:</strong> {selected.touristName}
              </Typography>
              <Typography>
                <strong>Phone:</strong> {selected.phone}
              </Typography>
              <Typography sx={{ gridColumn: "1 / -1" }}>
                <strong>Location:</strong> {selected.location} ({selected.lat}, {selected.lng})
              </Typography>
              <Typography>
                <strong>Status:</strong> {selected.status}
              </Typography>
              <Typography>
                <strong>Priority:</strong> {selected.priority}
              </Typography>
              <Typography>
                <strong>Team:</strong> {selected.assignedTeamId ?? "-"}
              </Typography>
              <Typography>
                <strong>ETA:</strong> {selected.etaMinutes ?? "-"} min
              </Typography>
              <Box sx={{ gridColumn: "1 / -1" }}>
                <Typography>
                  <strong>Notes:</strong> {selected.notes ?? "-"}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmergencyResponseCoordinationSection;
