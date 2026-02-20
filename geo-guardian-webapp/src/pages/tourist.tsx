// TouristAdminPage.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Select,
  MenuItem,
  Button,
  Checkbox,
  FormControlLabel,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Avatar,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Divider,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  IconButton,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import FactCheckIcon from "@mui/icons-material/FactCheck";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DownloadIcon from "@mui/icons-material/Download";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import PersonAddAlt1Icon from "@mui/icons-material/PersonAddAlt1";
import { useTouristsRealtime } from "../hooks/useRealtimeData";
import type { TouristIdentityRecord } from "../Services/realtimeDataService";

type VerifyMethod = "Biometric" | "Document" | "OTP";

type Tourist = {
  touristId: string;
  groupId?: string;
  relation?: string;
  fullName: string;
  age: number | "";
  gender: "Male" | "Female" | "Other" | "";
  address: string;
  country: string;
  passportNo: string;
  visaType: string;
  visaNumber: string;
  documentType: "Passport" | "ID Card" | "Driving License" | "";
  documentNumber: string;
  photo?: string;
  createdAt: string;
  journeyStart: string;
  entryAirport: string;
  isActive: boolean;
  phone: string;
  emergencyPhone: string;
  isVerified?: boolean;
  verificationMethod?: VerifyMethod;
  isPrimary?: boolean;
};

const initialTourists: Tourist[] = [];

const mapRealtimeTourist = (tourist: TouristIdentityRecord): Tourist => {
  const rawGender = tourist.raw.gender;
  const rawDocumentType = tourist.documentType;
  const rawVerificationMethod = tourist.raw.verificationMethod;

  const gender =
    rawGender === "Male" || rawGender === "Female" || rawGender === "Other"
      ? rawGender
      : "";
  const documentType =
    rawDocumentType === "Passport" ||
    rawDocumentType === "ID Card" ||
    rawDocumentType === "Driving License"
      ? rawDocumentType
      : "";
  const verificationMethod =
    rawVerificationMethod === "Biometric" ||
    rawVerificationMethod === "Document" ||
    rawVerificationMethod === "OTP"
      ? rawVerificationMethod
      : undefined;

  return {
    touristId: tourist.touristId || tourist.digitalId || tourist.id,
    groupId:
      typeof tourist.raw.groupId === "string" ? tourist.raw.groupId : undefined,
    relation:
      typeof tourist.raw.relation === "string" ? tourist.raw.relation : undefined,
    fullName: tourist.fullName || "",
    age: typeof tourist.raw.age === "number" ? tourist.raw.age : "",
    gender,
    address: tourist.address || "",
    country: tourist.nationality || "",
    passportNo: tourist.documentNumber || "",
    visaType: typeof tourist.raw.visaType === "string" ? tourist.raw.visaType : "",
    visaNumber:
      typeof tourist.raw.visaNumber === "string" ? tourist.raw.visaNumber : "",
    documentType,
    documentNumber: tourist.documentNumber || "",
    photo: typeof tourist.raw.photo === "string" ? tourist.raw.photo : undefined,
    createdAt: tourist.createdAt
      ? tourist.createdAt.toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    journeyStart: tourist.itineraryStartDate || "",
    entryAirport:
      typeof tourist.raw.entryAirport === "string"
        ? tourist.raw.entryAirport
        : "",
    isActive: tourist.isActive,
    phone: tourist.phoneNumber || "",
    emergencyPhone: tourist.emergencyContacts[0] || "",
    isVerified: tourist.isVerified,
    verificationMethod,
    isPrimary:
      typeof tourist.raw.isPrimary === "boolean" ? tourist.raw.isPrimary : true,
  };
};

const genBlockchainId = () => `GGBC-${Math.random().toString(16).slice(2, 10)}`;
const genGroupId = () => `GRP-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
const airports = ["Mumbai (BOM)", "Delhi (DEL)", "Bengaluru (BLR)", "Hyderabad (HYD)", "Chennai (MAA)", "Kolkata (CCU)"];
const visaTypes = ["Tourist","Business","e-Visa","Transit","Medical"];

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

const TouristAdminPage: React.FC = () => {
  const { data: realtimeTourists } = useTouristsRealtime();
  const [tourists, setTourists] = useState<Tourist[]>(initialTourists);
  const [hydratedFromRealtime, setHydratedFromRealtime] = useState(false);

  useEffect(() => {
    if (!hydratedFromRealtime && realtimeTourists.length) {
      setTourists(realtimeTourists.map(mapRealtimeTourist));
      setHydratedFromRealtime(true);
    }
  }, [hydratedFromRealtime, realtimeTourists]);

  // Primary form
  const [form, setForm] = useState<Tourist>({
    touristId: genBlockchainId(),
    fullName: "",
    age: "",
    gender: "",
    address: "",
    country: "",
    passportNo: "",
    visaType: "",
    visaNumber: "",
    documentType: "",
    documentNumber: "",
    photo: undefined,
    createdAt: new Date().toISOString().slice(0,10),
    journeyStart: "",
    entryAirport: "",
    isActive: true,
    phone: "",
    emergencyPhone: "",
    isVerified: false,
    verificationMethod: undefined,
    isPrimary: true,
  });

  // View dialog + verify modal
  const [viewing, setViewing] = useState<Tourist | null>(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [method, setMethod] = useState<VerifyMethod>("Document");

  // Verification method state
  const [bioCaptured, setBioCaptured] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [otpTarget, setOtpTarget] = useState<string>("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState<string>("");

  const resetMethodState = () => {
    setBioCaptured(false);
    setDocFile(null);
    setOtpTarget("");
    setOtpSent(false);
    setOtpCode("");
  };

  // Group builder and Member form
  const [askGroup, setAskGroup] = useState<null | { primary: Tourist; groupId: string }>(null);
  const [groupMembers, setGroupMembers] = useState<Tourist[]>([]);
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<Tourist | null>(null);

  const openMemberDialog = () => {
    if (!askGroup) return;
    setMemberForm({
      touristId: genBlockchainId(),
      groupId: askGroup.groupId,
      relation: "",
      fullName: "",
      age: "",
      gender: "",
      address: askGroup.primary.address,
      country: askGroup.primary.country,
      passportNo: "",
      visaType: askGroup.primary.visaType,
      visaNumber: "",
      documentType: askGroup.primary.documentType,
      documentNumber: "",
      photo: undefined,
      createdAt: askGroup.primary.createdAt,
      journeyStart: askGroup.primary.journeyStart,
      entryAirport: askGroup.primary.entryAirport,
      isActive: true,
      phone: "",
      emergencyPhone: "",
      isVerified: false,
      verificationMethod: undefined,
      isPrimary: false,
    });
    setMemberDialogOpen(true);
  };

  const saveMemberFromDialog = () => {
    if (!memberForm) return;
    const req = ["relation","fullName","age","gender","passportNo","documentNumber","phone"] as const;
    for (const k of req) {
      const v = (memberForm as any)[k];
      if (!v && v !== 0) return alert("Please fill all required member fields.");
    }
    setGroupMembers((prev) => [memberForm, ...prev]);
    setMemberDialogOpen(false);
    setMemberForm(null);
  };

  const removeGroupMember = (id: string) => {
    setGroupMembers((prev) => prev.filter((m) => m.touristId !== id));
  };

  // Primary actions
  const validatePrimary = () => {
    const req: (keyof Tourist)[] = ["fullName","age","gender","address","country","passportNo","visaType","documentType","documentNumber","createdAt","journeyStart","entryAirport","phone","emergencyPhone"];
    return req.every((k) => {
      const v = (form as any)[k];
      return !(v === "" || v === undefined || v === null);
    });
  };

  const savePrimaryThenAskGroup = () => {
    if (!validatePrimary()) return alert("Please fill all required fields.");
    const gid = genGroupId();
    const primary: Tourist = { ...form, groupId: gid, isPrimary: true, isVerified: false, verificationMethod: undefined };
    setTourists((prev) => [primary, ...prev]);
    setAskGroup({ primary, groupId: gid });
    setForm({
      touristId: genBlockchainId(),
      fullName: "",
      age: "",
      gender: "",
      address: "",
      country: "",
      passportNo: "",
      visaType: "",
      visaNumber: "",
      documentType: "",
      documentNumber: "",
      photo: undefined,
      createdAt: new Date().toISOString().slice(0,10),
      journeyStart: "",
      entryAirport: "",
      isActive: true,
      phone: "",
      emergencyPhone: "",
      isVerified: false,
      verificationMethod: undefined,
      isPrimary: true,
    });
  };

  const finalizeGroup = () => {
    if (groupMembers.length === 0) {
      setAskGroup(null);
      return;
    }
    // Validate once more
    for (const m of groupMembers) {
      const ok = m.fullName && m.relation && m.age !== "" && m.gender && m.passportNo && m.documentNumber && m.phone;
      if (!ok) return alert("Please fill required fields for all members (Name, Relation, Age, Gender, Passport, Document No, Phone).");
    }
    setTourists((prev) => [...groupMembers, ...prev]);
    setGroupMembers([]);
    setAskGroup(null);
  };

  // Verify
  const verifyReady = (() => {
    switch (method) {
      case "Biometric": return bioCaptured;
      case "Document": return !!docFile;
      case "OTP": return otpSent && /^\d{6}$/.test(otpCode);
      default: return false;
    }
  })();

  const openVerify = (t: Tourist) => {
    setViewing(t);
    setMethod("Document");
    resetMethodState();
    setVerifyOpen(true);
  };

  const confirmVerify = () => {
    if (!viewing || !verifyReady) return;
    setTourists((prev) => prev.map(t => t.touristId === viewing.touristId ? { ...t, isVerified: true, verificationMethod: method } : t));
    setViewing((v) => v ? { ...v, isVerified: true, verificationMethod: method } : v);
    setVerifyOpen(false);
    resetMethodState();
  };

  const totals = useMemo(() => ({
    active: tourists.filter(t => t.isActive).length,
    verified: tourists.filter(t => t.isVerified).length,
    total: tourists.length,
    groups: new Set(tourists.map(t => t.groupId).filter(Boolean)).size,
  }), [tourists]);

  const exportCsv = () => {
    if (tourists.length === 0) return;
    const rows = tourists.map(({ photo, ...t }) => t);
    const csv = [Object.keys(rows[0] || {}).join(","), ...rows.map((r) => Object.values(r).map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `tourists_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      {/* Navbar */}
      <AppBar position="sticky" elevation={0} sx={{ bgcolor: "rgba(255,255,255,0.8)", color: "text.primary", backdropFilter: "blur(10px)", borderBottom: "1px solid rgba(15,76,117,0.08)" }}>
        <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box component="img" src="/geo-guardian.png" alt="GeoGuardian" sx={{ height: 36 }} />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>Geo Guardian</Typography>
              <Typography variant="caption" color="text.secondary">Tourist Administration</Typography>
            </Box>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button size="small" variant="outlined" startIcon={<DownloadIcon />} onClick={exportCsv}>Export CSV</Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ p: { xs: 2, md: 3 }, display: "flex", flexDirection: "column", gap: 3, maxWidth: 1300, mx: "auto" }}>
        {/* Add Tourist (Primary) */}
        <Shell title="Add Tourist (Primary)" subtitle={`Active: ${totals.active} • Verified: ${totals.verified} • Total: ${totals.total} • Groups: ${totals.groups}`}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={8}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Tourist ID (auto)" value={form.touristId} disabled /></Grid>
                <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Full Name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Grid>

                <Grid item xs={12} md={3}><TextField fullWidth size="small" type="number" label="Age" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></Grid>
                <Grid item xs={12} md={3}>
                  <Select fullWidth size="small" displayEmpty value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as any })}>
                    <MenuItem value="" disabled>Gender</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} /></Grid>

                <Grid item xs={12}><TextField fullWidth size="small" label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></Grid>

                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Passport No." value={form.passportNo} onChange={(e) => setForm({ ...form, passportNo: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}>
                  <Select fullWidth size="small" displayEmpty value={form.visaType} onChange={(e) => setForm({ ...form, visaType: e.target.value })}>
                    <MenuItem value="" disabled>Visa Type</MenuItem>
                    {visaTypes.map(v => <MenuItem key={v} value={v}>{v}</MenuItem>)}
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Visa Number" value={form.visaNumber} onChange={(e) => setForm({ ...form, visaNumber: e.target.value })} /></Grid>

                <Grid item xs={12} md={4}>
                  <Select fullWidth size="small" displayEmpty value={form.documentType} onChange={(e) => setForm({ ...form, documentType: e.target.value as any })}>
                    <MenuItem value="" disabled>Document Type</MenuItem>
                    <MenuItem value="Passport">Passport</MenuItem>
                    <MenuItem value="ID Card">ID Card</MenuItem>
                    <MenuItem value="Driving License">Driving License</MenuItem>
                  </Select>
                </Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Document Number" value={form.documentNumber} onChange={(e) => setForm({ ...form, documentNumber: e.target.value })} /></Grid>

                <Grid item xs={12} md={4}><TextField fullWidth size="small" type="date" label="Created At" InputLabelProps={{ shrink: true }} value={form.createdAt} onChange={(e) => setForm({ ...form, createdAt: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" type="date" label="Journey Start" InputLabelProps={{ shrink: true }} value={form.journeyStart} onChange={(e) => setForm({ ...form, journeyStart: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}>
                  <Select fullWidth size="small" displayEmpty value={form.entryAirport} onChange={(e) => setForm({ ...form, entryAirport: e.target.value })}>
                    <MenuItem value="" disabled>Entry Airport</MenuItem>
                    {airports.map(a => <MenuItem key={a} value={a}>{a}</MenuItem>)}
                  </Select>
                </Grid>

                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><TextField fullWidth size="small" label="Emergency Number" value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} /></Grid>
                <Grid item xs={12} md={4}><FormControlLabel control={<Checkbox checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />} label="Active" /></Grid>
              </Grid>
            </Grid>

            <Grid item xs={12} md={4}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: "100%" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Photo & Actions</Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
                  <Avatar src={form.photo} sx={{ width: 72, height: 72 }} />
                  <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />} component="label">
                    Upload Photo
                    <input type="file" hidden accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => setForm((prev) => ({ ...prev, photo: String(r.result) }));
                      r.readAsDataURL(f);
                    }} />
                  </Button>
                </Box>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Button variant="contained" onClick={savePrimaryThenAskGroup}>Save & Add Group</Button>
                  <Button variant="outlined" onClick={() => setForm((prev) => ({ ...prev, touristId: genBlockchainId() }))}>Re‑generate ID</Button>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Shell>

        {/* Tourists Table */}
        <Shell title="Tourists" subtitle="Primary and group members">
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  {["Group ID","Primary","Relation","ID","Name","Age","Gender","Country","Passport","Doc No","Phone","Active","Verified","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                </TableRow>
              </TableHead>
              <TableBody>
                {tourists.map((t) => (
                  <TableRow key={t.touristId} hover>
                    <TableCell>{t.groupId || "-"}</TableCell>
                    <TableCell>{t.isPrimary ? "Yes" : "No"}</TableCell>
                    <TableCell>{t.relation || (t.isPrimary ? "Self" : "-")}</TableCell>
                    <TableCell>{t.touristId}</TableCell>
                    <TableCell>{t.fullName}</TableCell>
                    <TableCell>{t.age}</TableCell>
                    <TableCell>{t.gender}</TableCell>
                    <TableCell>{t.country}</TableCell>
                    <TableCell>{t.passportNo}</TableCell>
                    <TableCell>{t.documentNumber}</TableCell>
                    <TableCell>{t.phone}</TableCell>
                    <TableCell>{t.isActive ? "Yes" : "No"}</TableCell>
                    <TableCell>{t.isVerified ? <Chip size="small" color="success" label={`Verified (${t.verificationMethod})`} /> : <Chip size="small" color="warning" label="Unverified" />}</TableCell>
                    <TableCell>
                      <Tooltip title="View">
                        <IconButton size="small" onClick={() => setViewing(t)}><VisibilityIcon fontSize="small" /></IconButton>
                      </Tooltip>
                      <Tooltip title="Verify">
                        <IconButton size="small" color="primary" onClick={() => openVerify(t)}>
                          <FactCheckIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {tourists.length === 0 && (
                  <TableRow><TableCell colSpan={14} align="center" sx={{ color: "text.secondary" }}>No tourists found</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Shell>
      </Box>

      {/* View Dialog */}
      {viewing && (
        <Dialog open onClose={() => setViewing(null)} maxWidth="md" fullWidth>
          <DialogTitle>Tourist Details</DialogTitle>
          <DialogContent dividers>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "140px 1fr" }, gap: 2 }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Avatar src={viewing.photo} sx={{ width: 96, height: 96 }} />
              </Box>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}>
                <Typography><strong>Group ID:</strong> {viewing.groupId || "-"}</Typography>
                <Typography><strong>Primary:</strong> {viewing.isPrimary ? "Yes" : "No"}</Typography>
                <Typography><strong>Relation:</strong> {viewing.relation || (viewing.isPrimary ? "Self" : "-")}</Typography>
                <Typography><strong>ID:</strong> {viewing.touristId}</Typography>
                <Typography><strong>Name:</strong> {viewing.fullName}</Typography>
                <Typography><strong>Age:</strong> {viewing.age}</Typography>
                <Typography><strong>Gender:</strong> {viewing.gender}</Typography>
                <Typography><strong>Country:</strong> {viewing.country}</Typography>
                <Typography><strong>Address:</strong> {viewing.address}</Typography>
                <Typography><strong>Passport:</strong> {viewing.passportNo}</Typography>
                <Typography><strong>Visa:</strong> {viewing.visaType}{viewing.visaNumber ? ` / ${viewing.visaNumber}` : ""}</Typography>
                <Typography><strong>Doc Type:</strong> {viewing.documentType}</Typography>
                <Typography><strong>Doc No:</strong> {viewing.documentNumber}</Typography>
                <Typography><strong>Created At:</strong> {viewing.createdAt}</Typography>
                <Typography><strong>Journey Start:</strong> {viewing.journeyStart}</Typography>
                <Typography><strong>Entry Airport:</strong> {viewing.entryAirport}</Typography>
                <Typography><strong>Phone:</strong> {viewing.phone}</Typography>
                <Typography><strong>Emergency:</strong> {viewing.emergencyPhone}</Typography>
                <Typography><strong>Status:</strong> {viewing.isActive ? "Active" : "Inactive"} • {viewing.isVerified ? `Verified (${viewing.verificationMethod})` : "Unverified"}</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ justifyContent: "space-between" }}>
            <Button variant="contained" startIcon={<FactCheckIcon />} onClick={() => openVerify(viewing)}>
              Verify Tourist
            </Button>
            <Button variant="text" onClick={() => setViewing(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Verify Modal */}
      <Dialog open={verifyOpen} onClose={() => { setVerifyOpen(false); resetMethodState(); }} maxWidth="xs" fullWidth>
        <DialogTitle>Verification</DialogTitle>
        <DialogContent dividers>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Method</FormLabel>
            <RadioGroup value={method} onChange={(e) => { setMethod(e.target.value as VerifyMethod); resetMethodState(); }}>
              <FormControlLabel value="Biometric" control={<Radio />} label="Biometric (face/fingerprint)" />
              <FormControlLabel value="Document" control={<Radio />} label="Document (passport/visa)" />
              <FormControlLabel value="OTP" control={<Radio />} label="OTP to phone/email" />
            </RadioGroup>
          </FormControl>

          {method === "Biometric" && (
            <Box sx={{ p: 1, border: "1px dashed rgba(15,76,117,0.25)", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Simulate biometric capture.</Typography>
              <Button variant="outlined" onClick={() => setBioCaptured(true)}>Capture Biometric</Button>
              {bioCaptured && <Chip sx={{ ml: 1 }} size="small" color="success" label="Captured" />}
            </Box>
          )}

          {method === "Document" && (
            <Box sx={{ p: 1, border: "1px dashed rgba(15,76,117,0.25)", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Upload passport/visa scan (image/PDF).</Typography>
              <Button variant="outlined" component="label">
                Upload File
                <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              </Button>
              {docFile && <Chip sx={{ ml: 1 }} size="small" color="success" label={docFile.name} />}
            </Box>
          )}

          {method === "OTP" && (
            <Box sx={{ display: "grid", gap: 1, p: 1, border: "1px dashed rgba(15,76,117,0.25)", borderRadius: 2 }}>
              <TextField size="small" label="Send OTP to" placeholder="+91-XXXX or email" value={otpTarget} onChange={(e) => setOtpTarget(e.target.value)} />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="outlined" disabled={!otpTarget} onClick={() => setOtpSent(true)}>Send OTP</Button>
                {otpSent && <Chip size="small" color="info" label="OTP Sent" />}
              </Box>
              <TextField size="small" label="Enter 6-digit OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary">
            Confirm will update this tourist as Verified only when the selected method is completed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" startIcon={<VerifiedIcon />} disabled={
            method === "Biometric" ? !bioCaptured :
            method === "Document" ? !docFile :
            method === "OTP" ? !(otpSent && /^\d{6}$/.test(otpCode)) : true
          } onClick={confirmVerify}>
            Confirm
          </Button>
          <Button variant="text" onClick={() => { setVerifyOpen(false); resetMethodState(); }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Group Builder Dialog */}
      <Dialog open={Boolean(askGroup)} onClose={() => { setAskGroup(null); setGroupMembers([]); }} maxWidth="md" fullWidth>
        <DialogTitle>Is the tourist traveling with a group?</DialogTitle>
        <DialogContent dividers>
          {askGroup && (
            <>
              <Typography variant="body2" sx={{ mb: 1.5 }}>
                Primary: {askGroup.primary.fullName} • Group ID: {askGroup.groupId}
              </Typography>

              <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                <Button variant="outlined" startIcon={<PersonAddAlt1Icon />} onClick={openMemberDialog}>Add Member</Button>
                <Button variant="text" onClick={() => { setAskGroup(null); setGroupMembers([]); }}>No, only Primary</Button>
              </Box>

              {groupMembers.length > 0 && (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 340 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {["Relation","Name","Age","Gender","Passport","Doc No","Phone","Actions"].map(h => <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupMembers.map((m) => (
                        <TableRow key={m.touristId}>
                          <TableCell>{m.relation}</TableCell>
                          <TableCell>{m.fullName}</TableCell>
                          <TableCell>{m.age}</TableCell>
                          <TableCell>{m.gender}</TableCell>
                          <TableCell>{m.passportNo}</TableCell>
                          <TableCell>{m.documentNumber}</TableCell>
                          <TableCell>{m.phone}</TableCell>
                          <TableCell>
                            <IconButton size="small" color="error" onClick={() => removeGroupMember(m.touristId)}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      {groupMembers.length === 0 && (
                        <TableRow><TableCell colSpan={8} align="center" sx={{ color: "text.secondary" }}>No members added</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={finalizeGroup} disabled={groupMembers.length === 0}>Save Group Members</Button>
          <Button variant="text" onClick={() => { setAskGroup(null); setGroupMembers([]); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Member Form Dialog */}
      <Dialog open={memberDialogOpen} onClose={() => { setMemberDialogOpen(false); setMemberForm(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Add Group Member</DialogTitle>
        <DialogContent dividers>
          {memberForm && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Relation (e.g., Spouse, Child)" value={memberForm.relation || ""} onChange={(e) => setMemberForm({ ...memberForm, relation: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Full Name" value={memberForm.fullName} onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })} /></Grid>

              <Grid item xs={12} md={3}><TextField fullWidth size="small" type="number" label="Age" value={memberForm.age} onChange={(e) => setMemberForm({ ...memberForm, age: Number(e.target.value) })} /></Grid>
              <Grid item xs={12} md={3}>
                <Select fullWidth size="small" displayEmpty value={memberForm.gender || ""} onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value as any })}>
                  <MenuItem value="" disabled>Gender</MenuItem>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Phone" value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} /></Grid>

              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Passport No." value={memberForm.passportNo} onChange={(e) => setMemberForm({ ...memberForm, passportNo: e.target.value })} /></Grid>
              <Grid item xs={12} md={6}><TextField fullWidth size="small" label="Document Number" value={memberForm.documentNumber} onChange={(e) => setMemberForm({ ...memberForm, documentNumber: e.target.value })} /></Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar src={memberForm.photo} sx={{ width: 56, height: 56 }} />
                  <Button size="small" variant="outlined" startIcon={<AddPhotoAlternateIcon />} component="label">
                    Upload Photo
                    <input type="file" hidden accept="image/*" onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = () => setMemberForm((prev) => prev ? { ...prev, photo: String(r.result) } : prev);
                      r.readAsDataURL(f);
                    }} />
                  </Button>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={saveMemberFromDialog} disabled={!memberForm}>Save Member</Button>
          <Button variant="text" onClick={() => { setMemberDialogOpen(false); setMemberForm(null); }}>Cancel</Button>
        </DialogActions>
      </Dialog>

      {/* Verify Modal */}
      <Dialog open={verifyOpen} onClose={() => { setVerifyOpen(false); resetMethodState(); }} maxWidth="xs" fullWidth>
        <DialogTitle>Verification</DialogTitle>
        <DialogContent dividers>
          <FormControl sx={{ mb: 2 }}>
            <FormLabel>Method</FormLabel>
            <RadioGroup value={method} onChange={(e) => { setMethod(e.target.value as VerifyMethod); resetMethodState(); }}>
              <FormControlLabel value="Biometric" control={<Radio />} label="Biometric (face/fingerprint)" />
              <FormControlLabel value="Document" control={<Radio />} label="Document (passport/visa)" />
              <FormControlLabel value="OTP" control={<Radio />} label="OTP to phone/email" />
            </RadioGroup>
          </FormControl>

          {method === "Biometric" && (
            <Box sx={{ p: 1, border: "1px dashed rgba(15,76,117,0.25)", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Simulate biometric capture.</Typography>
              <Button variant="outlined" onClick={() => setBioCaptured(true)}>Capture Biometric</Button>
              {bioCaptured && <Chip sx={{ ml: 1 }} size="small" color="success" label="Captured" />}
            </Box>
          )}

          {method === "Document" && (
            <Box sx={{ p: 1, border: "1px dashed rgba(15,76,117,0.25)", borderRadius: 2 }}>
              <Typography variant="body2" sx={{ mb: 1 }}>Upload passport/visa scan (image/PDF).</Typography>
              <Button variant="outlined" component="label">
                Upload File
                <input type="file" hidden accept="image/*,.pdf" onChange={(e) => setDocFile(e.target.files?.[0] || null)} />
              </Button>
              {docFile && <Chip sx={{ ml: 1 }} size="small" color="success" label={docFile.name} />}
            </Box>
          )}

          {method === "OTP" && (
            <Box sx={{ display: "grid", gap: 1, p: 1, border: "1px dashed rgba(15,76,117,0.25)", borderRadius: 2 }}>
              <TextField size="small" label="Send OTP to" placeholder="+91-XXXX or email" value={otpTarget} onChange={(e) => setOtpTarget(e.target.value)} />
              <Box sx={{ display: "flex", gap: 1 }}>
                <Button variant="outlined" disabled={!otpTarget} onClick={() => setOtpSent(true)}>Send OTP</Button>
                {otpSent && <Chip size="small" color="info" label="OTP Sent" />}
              </Box>
              <TextField size="small" label="Enter 6-digit OTP" value={otpCode} onChange={(e) => setOtpCode(e.target.value)} />
            </Box>
          )}

          <Divider sx={{ my: 1.5 }} />
          <Typography variant="caption" color="text.secondary">
            Confirm will update this tourist as Verified only when the selected method is completed.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" startIcon={<VerifiedIcon />} disabled={
            method === "Biometric" ? !bioCaptured :
            method === "Document" ? !docFile :
            method === "OTP" ? !(otpSent && /^\d{6}$/.test(otpCode)) : true
          } onClick={confirmVerify}>
            Confirm
          </Button>
          <Button variant="text" onClick={() => { setVerifyOpen(false); resetMethodState(); }}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TouristAdminPage;
