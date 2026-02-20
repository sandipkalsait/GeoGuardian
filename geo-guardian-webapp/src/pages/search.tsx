import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Grid,
  TextField,
  Typography,
} from "@mui/material";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import { updateEmergencyAlertStatus } from "../Services/realtimeDataService";

const normalizeStatus = (value: string): string => {
  const normalized = value.toLowerCase();
  if (normalized.includes("resolve") || normalized.includes("close")) {
    return "Resolved";
  }
  if (normalized.includes("progress") || normalized.includes("assigned")) {
    return "In Progress";
  }
  return "Active";
};

const statusColor = (
  value: string,
): "error" | "warning" | "success" | "default" => {
  if (value === "Resolved") {
    return "success";
  }
  if (value === "In Progress") {
    return "warning";
  }
  if (value === "Active") {
    return "error";
  }
  return "default";
};

const SearchPage: React.FC = () => {
  const initialQuery =
    new URLSearchParams(window.location.search).get("complaint") || "";
  const [query, setQuery] = useState(initialQuery);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const { emergencyAlerts, tourists } = useGeoGuardianRealtimeData();

  const touristMap = useMemo(
    () =>
      new Map(
        tourists.data.map((tourist) => [tourist.touristId, tourist.fullName]),
      ),
    [tourists.data],
  );

  const results = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const source = emergencyAlerts.data.map((alert) => ({
      id: alert.alertId || alert.id,
      key: `${alert.sourceCollection}:${alert.docId}`,
      title: alert.title || alert.type || "Emergency Alert",
      status: normalizeStatus(alert.status),
      severity: alert.severity || "medium",
      createdAt:
        alert.createdAt?.toLocaleString() ||
        alert.alertTime?.toLocaleString() ||
        "-",
      description: alert.description || "No description",
      location: alert.address || "Unknown location",
      tourist:
        touristMap.get(alert.touristId) ||
        alert.touristId ||
        alert.userId ||
        "Unknown tourist",
      sourceCollection: alert.sourceCollection,
      docId: alert.docId,
      searchable: [
        alert.alertId,
        alert.id,
        alert.touristId,
        alert.userId,
        alert.address,
        alert.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
    }));

    if (!normalizedQuery) {
      return source;
    }

    return source.filter((row) => row.searchable.includes(normalizedQuery));
  }, [emergencyAlerts.data, query, touristMap]);

  const updateStatus = async (
    row: { id: string; sourceCollection: string; docId: string },
    status: string,
  ) => {
    setUpdatingId(row.id);
    try {
      await updateEmergencyAlertStatus(
        {
          sourceCollection: row.sourceCollection,
          docId: row.docId,
        },
        status,
      );
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 6 }}>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Case Search
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Search realtime emergency alerts using complaint ID, alert ID, tourist ID, or location.
      </Typography>

      <TextField
        fullWidth
        label="Search complaint / case"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={2}>
        {results.map((row) => (
          <Grid item xs={12} md={6} key={row.key}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {row.id}
                  </Typography>
                  <Chip label={row.status} color={statusColor(row.status)} size="small" />
                </Box>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Title:</strong> {row.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Tourist:</strong> {row.tourist}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Location:</strong> {row.location}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Severity:</strong> {row.severity}
                </Typography>
                <Typography variant="body2" sx={{ mb: 0.5 }}>
                  <strong>Created:</strong> {row.createdAt}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                  {row.description}
                </Typography>
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={updatingId === row.id}
                    onClick={() => updateStatus(row, "in_progress")}
                  >
                    Mark In Progress
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    disabled={updatingId === row.id}
                    onClick={() => updateStatus(row, "resolved")}
                  >
                    Mark Resolved
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {results.length === 0 && (
        <Typography sx={{ mt: 4 }} color="text.secondary">
          No matching cases found.
        </Typography>
      )}
    </Container>
  );
};

export default SearchPage;
