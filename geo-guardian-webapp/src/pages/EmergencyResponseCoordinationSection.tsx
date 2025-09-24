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
  TextField,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DoneAllIcon from "@mui/icons-material/DoneAll";

const rescueTeams = [
  { id: "TeamA", name: "Rescue Team A", contact: "123-456-7890", available: true },
  { id: "TeamB", name: "Rescue Team B", contact: "987-654-3210", available: false },
  { id: "TeamC", name: "Rescue Team C", contact: "555-666-7777", available: true },
];

const activeAlerts = [
  { id: "ALRT-2001", description: "Flood in Sector 5" },
  { id: "ALRT-2002", description: "Landslide near Highway 23" },
];

// Mock recent SOS from tourists
type SosStatus = "New" | "Acknowledged" | "Resolved";
type Priority = "Critical" | "High" | "Medium" | "Low";

type SosItem = {
  id: string;
  tourist: string;
  phone: string;
  location: string;
  time: string;
  status: SosStatus;
  priority: Priority;
};

const initialSos: SosItem[] = [
  { id: "SOS-9001", tourist: "John Doe", phone: "+91-99999-11111", location: "City Museum - Gate 2", time: "14:02", status: "New", priority: "High" },
  { id: "SOS-9002", tourist: "Jane Smith", phone: "+91-88888-22222", location: "Riverside Park North", time: "14:06", status: "Acknowledged", priority: "Critical" },
];

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
      boxShadow: "0 8px 24px rgba(20,35,52,0.06)",
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
      <Box sx={{ display: "flex", gap: 1 }}>{actions}</Box>
    </Box>
    <Box sx={{ p: 2 }}>{children}</Box>
  </Paper>
);

const EmergencyResponseCoordinationSection: React.FC = () => {
  // Dispatch UI state
  const [selectedAlert, setSelectedAlert] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [priority, setPriority] = useState<Priority>("High");
  const [notes, setNotes] = useState("");

  // SOS list
  const [sos, setSos] = useState<SosItem[]>(initialSos);

  const handleDispatch = () => {
    if (!selectedAlert || !selectedTeam) {
      alert("Please select an alert and a rescue team before dispatching.");
      return;
    }
    alert(
      `Dispatched ${selectedTeam} to alert ${selectedAlert}\nPriority: ${priority}\nNotes: ${notes || "-"}`
    );
    setNotes("");
  };

  const acknowledgeSos = (id: string) =>
    setSos((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Acknowledged" } : s)));

  const resolveSos = (id: string) =>
    setSos((prev) => prev.map((s) => (s.id === id ? { ...s, status: "Resolved" } : s)));

  const chipForStatus = (st: SosStatus) =>
    st === "Resolved"
      ? { color: "success", label: "Resolved" }
      : st === "Acknowledged"
      ? { color: "warning", label: "Acknowledged" }
      : { color: "default", label: "New" };

  const chipForPriority = (p: Priority) => ({
    label: p,
    sx: {
      bgcolor:
        p === "Critical" ? "error.main" : p === "High" ? "warning.dark" : p === "Medium" ? "info.main" : "grey.500",
      color: "common.white",
    },
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Recent SOS from tourists */}
      <Card title="Active SOS" subtitle="Incoming SOS and status progression">
        <TableContainer sx={{ maxHeight: 320 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>SOS ID</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Tourist</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sos.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                      {row.id}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell>{row.tourist}</TableCell>
                  <TableCell>{row.phone}</TableCell>
                  <TableCell>{row.location}</TableCell>
                  <TableCell>
                    <Chip size="small" {...chipForPriority(row.priority)} />
                  </TableCell>
                  <TableCell>
                    <Chip size="small" color={chipForStatus(row.status).color as any} label={chipForStatus(row.status).label} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Details">
                      <IconButton size="small" color="default">
                        <InfoOutlinedIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Acknowledge">
                      <span>
                        <IconButton
                          size="small"
                          color="warning"
                          disabled={row.status !== "New"}
                          onClick={() => acknowledgeSos(row.id)}
                        >
                          <CheckCircleIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Resolve">
                      <span>
                        <IconButton
                          size="small"
                          color="success"
                          disabled={row.status === "Resolved"}
                          onClick={() => resolveSos(row.id)}
                        >
                          <DoneAllIcon fontSize="small" />
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {sos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: "text.secondary" }}>
                    No active SOS
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Dispatch Interface */}
      <Card
        title="Dispatch Alert to Rescue Team"
        subtitle="Manual assignment for non‑SOS incidents"
        actions={
          <Chip label="Ops" size="small" sx={{ bgcolor: "primary.main", color: "common.white" }} />
        }
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <Select
              fullWidth
              displayEmpty
              value={selectedAlert}
              onChange={(e) => setSelectedAlert(e.target.value)}
              size="small"
            >
              <MenuItem value="" disabled>
                Select Alert
              </MenuItem>
              {activeAlerts.map((alert) => (
                <MenuItem key={alert.id} value={alert.id}>
                  {alert.id} — {alert.description}
                </MenuItem>
              ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={3}>
            <Select
              fullWidth
              displayEmpty
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              size="small"
            >
              <MenuItem value="" disabled>
                Select Rescue Team
              </MenuItem>
              {rescueTeams
                .filter((t) => t.available)
                .map((team) => (
                  <MenuItem key={team.id} value={team.name}>
                    {team.name}
                  </MenuItem>
                ))}
            </Select>
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <Select fullWidth size="small" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
              <MenuItem value="Critical">Critical</MenuItem>
              <MenuItem value="High">High</MenuItem>
              <MenuItem value="Medium">Medium</MenuItem>
              <MenuItem value="Low">Low</MenuItem>
            </Select>
          </Grid>

          <Grid item xs={12} sm={2.5}>
            <Button variant="contained" color="primary" fullWidth onClick={handleDispatch}>
              Dispatch
            </Button>
          </Grid>

          <Grid item xs={12}>
            <TextField
              size="small"
              fullWidth
              placeholder="Dispatch notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Grid>
        </Grid>
      </Card>

      {/* Rescue Teams Contact & Availability */}
      <Card title="Rescue Teams" subtitle="Contact directory and availability">
        <TableContainer sx={{ maxHeight: 300 }}>
          <Table stickyHeader size="small" aria-label="rescue teams table">
            <TableHead>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Availability</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rescueTeams.map((team) => (
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
      </Card>

      {/* Map Placeholder */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          border: "1px solid rgba(15,76,117,0.08)",
          boxShadow: "0 8px 24px rgba(20,35,52,0.06)",
        }}
      >
        <Box
          sx={{
            height: 380,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "text.secondary",
          }}
        >
          Route and Safety Zone Map Placeholder
        </Box>
      </Paper>
    </Box>
  );
};

export default EmergencyResponseCoordinationSection;
