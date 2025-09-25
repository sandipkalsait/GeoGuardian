// CaseFIRManagementSection.tsx
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
  Tooltip,
  IconButton,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Menu,
  Divider,
} from "@mui/material";
import DescriptionIcon from "@mui/icons-material/Description";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ReportIcon from "@mui/icons-material/Report";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import LinkIcon from "@mui/icons-material/Link";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";
import DoneAllIcon from "@mui/icons-material/DoneAll";

// Types
type Status = "Active" | "Pending" | "Closed";
type Region = "Mumbai" | "Pune" | "Nagpur" | "Other";

type EfirRow = {
  firNumber: string;
  dateFiled: string;
  complaintType: string;
  status: Status;
  assignedOfficer: string;
  region: Region;
};

type ComplaintRow = {
  id: string;
  dateCreated: string;
  category: string;
  status: Status;
  assignedTo: string;
  region: Region;
};

// Tourist directory (demo)
const touristDirectory: Record<
  string,
  { name: string; photo?: string; digitalId?: string; contact?: string }
> = {
  FIR1001: { name: "John Doe", digitalId: "DGT-1001", contact: "+91-99999-11111" },
  FIR1002: { name: "Jane Smith", digitalId: "DGT-1002", contact: "+91-88888-22222" },
  FIR1003: { name: "Ravi Patil", digitalId: "DGT-1003" },
  CMP2001: { name: "John Doe", digitalId: "DGT-1001" },
  CMP2002: { name: "Jane Smith", digitalId: "DGT-1002" },
  CMP2003: { name: "Ravi Patil", digitalId: "DGT-1003" },
};

// Mock data (replace via separate DBs later)
const efirData: EfirRow[] = [
  { firNumber: "FIR1001", dateFiled: "2025-09-20", complaintType: "Lost Passport", status: "Active", assignedOfficer: "Officer Ritesh", region: "Mumbai" },
  { firNumber: "FIR1002", dateFiled: "2025-09-18", complaintType: "Theft", status: "Pending", assignedOfficer: "Officer Priya", region: "Pune" },
  { firNumber: "FIR1003", dateFiled: "2025-09-15", complaintType: "Harassment", status: "Closed", assignedOfficer: "Officer Raj", region: "Nagpur" },
];

const complaintData: ComplaintRow[] = [
  { id: "CMP2001", dateCreated: "2025-09-21", category: "Harassment", status: "Active", assignedTo: "Desk 3", region: "Mumbai" },
  { id: "CMP2002", dateCreated: "2025-09-19", category: "Theft", status: "Pending", assignedTo: "Desk 5", region: "Pune" },
  { id: "CMP2003", dateCreated: "2025-09-16", category: "Lost Item", status: "Closed", assignedTo: "Desk 1", region: "Nagpur" },
];

const Shell = ({
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

const StatusChip = ({ value }: { value: Status }) => {
  const color = value === "Active" ? "primary" : value === "Pending" ? "warning" : "default";
  return <Chip label={value} color={color} size="small" />;
};

const Kpi = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: "info" | "warning" | "success" | "error";
}) => (
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

const CaseFIRManagementSection: React.FC = () => {
  // Local state with mock data; later, fetch from separate databases
  const [efirRows] = useState<EfirRow[]>(efirData);
  const [complaintRows, setComplaintRows] = useState<ComplaintRow[]>(complaintData);

  // Filters
  const [status, setStatus] = useState<Status | "All">("All");
  const [region, setRegion] = useState<Region | "All">("All");
  const [date, setDate] = useState<string>("");

  const regions = useMemo(
    () => Array.from(new Set([...efirRows.map((r) => r.region), ...complaintRows.map((r) => r.region)])),
    [efirRows, complaintRows]
  );

  // Filtered views
  const efirFiltered = useMemo(
    () => efirRows.filter((r) => (status === "All" || r.status === status) && (region === "All" || r.region === region)),
    [efirRows, status, region]
  );
  const complaintFiltered = useMemo(
    () => complaintRows.filter((r) => (status === "All" || r.status === status) && (region === "All" || r.region === region)),
    [complaintRows, status, region]
  );

  // KPI counts
  const efirCount = efirFiltered.length;
  const complaintCount = complaintFiltered.length;
  const casesCount = efirFiltered.filter((r) => r.status !== "Closed").length; // sample proxy
  const openItems =
    efirFiltered.filter((r) => r.status !== "Closed").length +
    complaintFiltered.filter((r) => r.status !== "Closed").length;

  // Dialog selection state
  type DetailKind = { type: "efir"; data: EfirRow } | { type: "complaint"; data: ComplaintRow };
  const [selected, setSelected] = useState<DetailKind | null>(null);

  // Status menu state
  const [statusMenuEl, setStatusMenuEl] = useState<null | HTMLElement>(null);
  const statusMenuOpen = Boolean(statusMenuEl);
  const openStatusMenu = (e: React.MouseEvent<HTMLElement>) => setStatusMenuEl(e.currentTarget);
  const closeStatusMenu = () => setStatusMenuEl(null);

  // Update status helpers
  const updateEfirStatus = (no: string, s: Status) => {
    // Keeping UI-only for FIR as efirRows is const in this design
    alert(`Set FIR ${no} to ${s}`);
  };
  const updateComplaintStatus = (id: string, s: Status) => {
    setComplaintRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: s } : r)));
  };

  // Existing action stubs remain
  // const viewEfir = (no: string) => alert(`View FIR ${no}`);
  const editEfir = (no: string) => alert(`Edit FIR ${no}`);
  const downloadEfir = (no: string) => alert(`Download FIR ${no}`);
  // const viewComplaint = (id: string) => alert(`View Complaint ${id}`);
  const linkToCase = (id: string) => alert(`Link Complaint ${id} → Case`);
  const closeComplaint = (id: string) =>
    setComplaintRows((prev) => prev.map((r) => (r.id === id ? { ...r, status: "Closed" } : r)));

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top filters */}
      <Shell
        title="Filters"
        subtitle={`${region === "All" ? "All Regions" : region} • ${status === "All" ? "All Status" : status}${date ? " • " + date : ""}`}
        actions={<Button size="small" variant="outlined">Export CSV</Button>}
      >
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={3}>
            <Select fullWidth size="small" value={status} onChange={(e) => setStatus(e.target.value as Status | "All")}>
              <MenuItem value="All">All Status</MenuItem>
              <MenuItem value="Active">Active</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Closed">Closed</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <Select fullWidth size="small" value={region} onChange={(e) => setRegion(e.target.value as Region | "All")}>
              <MenuItem value="All">All Regions</MenuItem>
              {regions.map((r) => (
                <MenuItem key={r} value={r}>
                  {r}
                </MenuItem>
              ))}
            </Select>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <TextField fullWidth size="small" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={3} sx={{ display: "flex", gap: 1 }}>
            <Button variant="text" size="small" onClick={() => { setStatus("All"); setRegion("All"); setDate(""); }}>
              Reset
            </Button>
          </Grid>
        </Grid>
      </Shell>

      {/* KPIs */}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="E‑FIR" value={efirCount} icon={<DescriptionIcon color="info" />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Complaints" value={complaintCount} icon={<ReportIcon color="warning" />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Active Cases" value={casesCount} icon={<AssignmentIcon color="success" />} color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Kpi label="Open Items" value={openItems} icon={<Badge color="error" variant="dot"><Box /></Badge>} color="error" />
        </Grid>
      </Grid>

      {/* E‑FIR Table */}
      <Shell title="E‑FIR Records" subtitle="Digital FIR entries from E‑FIR database">
        <TableContainer sx={{ maxHeight: 380 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>FIR Number</TableCell>
                <TableCell>Date Filed</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Officer</TableCell>
                <TableCell>Region</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {efirFiltered.map((r) => (
                <TableRow key={r.firNumber} hover>
                  <TableCell>
                    <Typography fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">{r.firNumber}</Typography>
                  </TableCell>
                  <TableCell>{r.dateFiled}</TableCell>
                  <TableCell>{r.complaintType}</TableCell>
                  <TableCell><StatusChip value={r.status} /></TableCell>
                  <TableCell>{r.assignedOfficer}</TableCell>
                  <TableCell>{r.region}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => setSelected({ type: "efir", data: r })}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton size="small" color="warning" onClick={() => editEfir(r.firNumber)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Download">
                      <IconButton size="small" color="primary" onClick={() => downloadEfir(r.firNumber)}>
                        <CloudDownloadIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {efirFiltered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>
                    No E‑FIR found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Complaints Table */}
      <Shell title="Complaints" subtitle="Complaints records from Complaints database">
        <TableContainer sx={{ maxHeight: 380 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Complaint ID</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned</TableCell>
                <TableCell>Region</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {complaintFiltered.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">{r.id}</Typography>
                  </TableCell>
                  <TableCell>{r.dateCreated}</TableCell>
                  <TableCell>{r.category}</TableCell>
                  <TableCell><StatusChip value={r.status} /></TableCell>
                  <TableCell>{r.assignedTo}</TableCell>
                  <TableCell>{r.region}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View">
                      <IconButton size="small" onClick={() => setSelected({ type: "complaint", data: r })}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Link to Case">
                      <IconButton size="small" color="primary" onClick={() => linkToCase(r.id)}>
                        <LinkIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Close">
                      <IconButton size="small" color="success" onClick={() => closeComplaint(r.id)}>
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {complaintFiltered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ color: "text.secondary" }}>
                    No complaints found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Shell>

      {/* Linked cases overview */}
      <Shell title="Linked Cases Overview" subtitle="Quick snapshot of FIR–Complaint associations">
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Recently Linked</Typography>
              <Typography variant="body2" color="text.secondary">FIR1002 ⇄ CMP2002 (Theft) • Pending verification</Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Awaiting Assignment</Typography>
              <Typography variant="body2" color="text.secondary">CMP2003 (Lost Item) • No case linked</Typography>
            </Paper>
          </Grid>
        </Grid>
      </Shell>

      {/* Preview Dialog */}
      {selected && (
        <Dialog open onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
          <DialogTitle>{selected.type === "efir" ? "Preview E‑FIR" : "Preview Complaint"}</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 2, mb: 1 }}>
              <Avatar
                src={(() => {
                  const key = selected.type === "efir" ? selected.data.firNumber : selected.data.id;
                  return touristDirectory[key]?.photo || undefined;
                })()}
                sx={{ width: 64, height: 64 }}
              />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  {(() => {
                    const key = selected.type === "efir" ? selected.data.firNumber : selected.data.id;
                    return touristDirectory[key]?.name || "Tourist";
                  })()}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {(() => {
                    const key = selected.type === "efir" ? selected.data.firNumber : selected.data.id;
                    const t = touristDirectory[key];
                    const did = t?.digitalId ? ` • ${t.digitalId}` : "";
                    const ph = t?.contact ? ` • ${t.contact}` : "";
                    return `${selected.type === "efir" ? selected.data.firNumber : selected.data.id}${did}${ph}`;
                  })()}
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 1.5 }} />

            {selected.type === "efir" ? (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                <Typography><strong>FIR Number:</strong> {selected.data.firNumber}</Typography>
                <Typography><strong>Date Filed:</strong> {selected.data.dateFiled}</Typography>
                <Typography><strong>Type:</strong> {selected.data.complaintType}</Typography>
                <Typography><strong>Status:</strong> {selected.data.status}</Typography>
                <Typography><strong>Officer:</strong> {selected.data.assignedOfficer}</Typography>
                <Typography><strong>Region:</strong> {selected.data.region}</Typography>
              </Box>
            ) : (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
                <Typography><strong>Complaint ID:</strong> {selected.data.id}</Typography>
                <Typography><strong>Date:</strong> {selected.data.dateCreated}</Typography>
                <Typography><strong>Category:</strong> {selected.data.category}</Typography>
                <Typography><strong>Status:</strong> {selected.data.status}</Typography>
                <Typography><strong>Assigned:</strong> {selected.data.assignedTo}</Typography>
                <Typography><strong>Region:</strong> {selected.data.region}</Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <Button variant="contained" color="primary" startIcon={<VisibilityIcon />} onClick={openStatusMenu}>
                Action / Status
              </Button>
              <Menu anchorEl={statusMenuEl} open={statusMenuOpen} onClose={closeStatusMenu}>
                <MenuItem
                  onClick={() => {
                    if (selected.type === "efir") updateEfirStatus(selected.data.firNumber, "Pending");
                    else updateComplaintStatus(selected.data.id, "Pending");
                    closeStatusMenu();
                  }}
                >
                  Pending
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (selected.type === "efir") updateEfirStatus(selected.data.firNumber, "Active");
                    else updateComplaintStatus(selected.data.id, "Active");
                    closeStatusMenu();
                  }}
                >
                  In process (Open)
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    if (selected.type === "efir") updateEfirStatus(selected.data.firNumber, "Closed");
                    else updateComplaintStatus(selected.data.id, "Closed");
                    closeStatusMenu();
                  }}
                >
                  Solved & Close
                </MenuItem>
              </Menu>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<DoneAllIcon />}
                onClick={() => {
                  if (selected.type === "efir") updateEfirStatus(selected.data.firNumber, "Closed");
                  else updateComplaintStatus(selected.data.id, "Closed");
                }}
              >
                Close
              </Button>
              <Button variant="contained" startIcon={<AssignmentIcon />} onClick={() => alert("Track route on map")}>
                Track
              </Button>
              <Button variant="text" onClick={() => setSelected(null)}>Dismiss</Button>
            </Box>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default CaseFIRManagementSection;
