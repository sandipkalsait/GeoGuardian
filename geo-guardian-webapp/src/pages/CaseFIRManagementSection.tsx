import React, { useMemo, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from "@mui/material";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import { updateEmergencyAlertStatus } from "../Services/realtimeDataService";

const formatStatus = (status: string): string => {
  const normalized = status.toLowerCase();
  if (normalized.includes("resolve") || normalized.includes("close")) {
    return "Closed";
  }
  if (normalized.includes("progress") || normalized.includes("assigned")) {
    return "In Progress";
  }
  if (normalized.includes("active") || normalized.includes("pending")) {
    return "Pending";
  }
  return "Pending";
};

const statusColor = (
  status: string,
): "error" | "warning" | "success" | "default" => {
  if (status === "Closed") {
    return "success";
  }
  if (status === "In Progress") {
    return "warning";
  }
  if (status === "Pending") {
    return "error";
  }
  return "default";
};

const CaseFIRManagementSection: React.FC = () => {
  const { emergencyAlerts, tourists } = useGeoGuardianRealtimeData();
  const [updatingAlertId, setUpdatingAlertId] = useState<string | null>(null);

  const touristMap = useMemo(
    () =>
      new Map(
        tourists.data.map((tourist) => [tourist.touristId, tourist.fullName]),
      ),
    [tourists.data],
  );

  const rows = useMemo(
    () =>
      emergencyAlerts.data
        .map((alert, index) => {
          const normalizedStatus = formatStatus(alert.status);
          return {
            key: `${alert.sourceCollection}:${alert.docId}`,
            id: alert.alertId || `FIR-${String(index + 1).padStart(4, "0")}`,
            title: alert.title || alert.type || "Emergency Alert",
            description: alert.description || "No description provided",
            region: alert.address || "Unknown location",
            tourist:
              touristMap.get(alert.touristId) ||
              alert.touristId ||
              alert.userId ||
              "Unknown tourist",
            status: normalizedStatus,
            severity: alert.severity || "medium",
            createdAt:
              alert.createdAt?.toLocaleString() ||
              alert.alertTime?.toLocaleString() ||
              "-",
            sourceCollection: alert.sourceCollection,
            docId: alert.docId,
          };
        })
        .sort((left, right) => {
          if (left.status === right.status) {
            return left.id.localeCompare(right.id);
          }
          if (left.status === "Pending") return -1;
          if (right.status === "Pending") return 1;
          if (left.status === "In Progress") return -1;
          if (right.status === "In Progress") return 1;
          return 0;
        }),
    [emergencyAlerts.data, touristMap],
  );

  const kpis = useMemo(() => {
    const pending = rows.filter((row) => row.status === "Pending").length;
    const inProgress = rows.filter((row) => row.status === "In Progress").length;
    const closed = rows.filter((row) => row.status === "Closed").length;
    return { total: rows.length, pending, inProgress, closed };
  }, [rows]);

  const setAlertStatus = async (
    row: { sourceCollection: string; docId: string; id: string },
    status: string,
  ) => {
    setUpdatingAlertId(row.id);
    try {
      await updateEmergencyAlertStatus(
        {
          sourceCollection: row.sourceCollection,
          docId: row.docId,
        },
        status,
      );
    } finally {
      setUpdatingAlertId(null);
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Typography variant="h6">Case & FIR Management</Typography>
      <Typography variant="body2" color="text.secondary">
        Live case queue built from realtime emergency alerts.
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Total Cases
            </Typography>
            <Typography variant="h5">{kpis.total}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
            <Typography variant="h5">{kpis.pending}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              In Progress
            </Typography>
            <Typography variant="h5">{kpis.inProgress}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Closed
            </Typography>
            <Typography variant="h5">{kpis.closed}</Typography>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Case ID</TableCell>
                <TableCell>Tourist</TableCell>
                <TableCell>Incident</TableCell>
                <TableCell>Region</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.key} hover>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.tourist}</TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {row.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.region}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.severity}
                      color={row.severity.toLowerCase() === "critical" ? "error" : "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status}
                      color={statusColor(row.status)}
                    />
                  </TableCell>
                  <TableCell>{row.createdAt}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: "inline-flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={updatingAlertId === row.id || row.status === "In Progress"}
                        onClick={() => setAlertStatus(row, "in_progress")}
                      >
                        In Progress
                      </Button>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        disabled={updatingAlertId === row.id || row.status === "Closed"}
                        onClick={() => setAlertStatus(row, "resolved")}
                      >
                        Resolve
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    No live cases found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default CaseFIRManagementSection;
