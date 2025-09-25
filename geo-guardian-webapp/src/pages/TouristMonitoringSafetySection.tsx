import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Grid,
  Chip,
} from "@mui/material";

const touristLocations = [
  { id: 1, name: "John Doe", lat: 19.076, lng: 72.8777, lastSeen: "2025-09-23 09:30" },
  { id: 2, name: "Jane Smith", lat: 18.5204, lng: 73.8567, lastSeen: "2025-09-23 09:28" },
  { id: 3, name: "Alice Johnson", lat: 28.7041, lng: 77.1025, lastSeen: "2025-09-23 09:15" },
];

const aiAlerts = [
  { id: "RISK-001", description: "Loitering detected near restricted zone", severity: "High", timestamp: "2025-09-23 08:45" },
  { id: "RISK-002", description: "Unauthorized crossing of safety boundary", severity: "Medium", timestamp: "2025-09-23 08:30" },
];

const severityColors: Record<string, "error" | "warning" | "default"> = {
  High: "error",
  Medium: "warning",
  Low: "default"
};

const TouristMonitoringSafetySection = () => {
  const [geoFenceEnabled, setGeoFenceEnabled] = useState(true);
  const [hotspotManagementEnabled, setHotspotManagementEnabled] = useState(false);

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="#003366" fontWeight="bold">
        Tourist Monitoring & Safety Zones
      </Typography>

      {/* Geo-tagged locations */}
      <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Geo-tagged Tourist Locations</Typography>
      <Paper sx={{ maxHeight: 240, overflowY: "auto", mb: 4 }}>
        <Table stickyHeader size="small" aria-label="tourist locations table">
          <TableHead sx={{ backgroundColor: "#d8d2c4" }}>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Latitude</TableCell>
              <TableCell>Longitude</TableCell>
              <TableCell>Last Seen</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {touristLocations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell>{loc.name}</TableCell>
                <TableCell>{loc.lat}</TableCell>
                <TableCell>{loc.lng}</TableCell>
                <TableCell>{loc.lastSeen}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Live Movement Heatmap Placeholder */}
      <Box sx={{
        height: 300,
        borderRadius: 2,
        backgroundColor: "#fff",
        boxShadow: 3,
        mb: 4,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        color: "#999",
        fontSize: 18,
      }}>
        Live Movement Heatmap Placeholder
      </Box>

      {/* AI Alerts */}
      <Typography variant="subtitle1" gutterBottom>AI Alerts for Risky Behaviors</Typography>
      <Grid container spacing={2} mb={4}>
        {aiAlerts.map((alert) => (
          <Grid item key={alert.id} xs={12} sm={6} md={4}>
            <Card sx={{ backgroundColor: "#fff", boxShadow: 3 }}>
              <CardContent>
                <Typography variant="body1" fontWeight="bold">
                  {alert.description}
                </Typography>
                <Chip label={alert.severity} color={severityColors[alert.severity]} size="small" sx={{ mt:1, mb:1 }} />
                <Typography variant="caption" color="text.secondary">
                  {alert.timestamp}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Geo-fencing and Hotspot Controls */}
      <Typography variant="subtitle1" gutterBottom>Geo-fencing & Hotspot Management</Typography>
      <FormControlLabel
        control={
          <Switch
            checked={geoFenceEnabled}
            onChange={() => setGeoFenceEnabled(!geoFenceEnabled)}
            color="primary"
          />
        }
        label="Enable Geo-fencing"
      />
      <FormControlLabel
        control={
          <Switch
            checked={hotspotManagementEnabled}
            onChange={() => setHotspotManagementEnabled(!hotspotManagementEnabled)}
            color="primary"
          />
        }
        label="Enable Hotspot Traffic Management"
      />
    </Box>
  );
};

export default TouristMonitoringSafetySection;
