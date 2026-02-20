import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Card,
  FormGroup,
  FormControlLabel,
  Switch,
  Slider,
  TextField,
  Grid,
  Button,
} from "@mui/material";
import { useGeoGuardianRealtimeData } from "../hooks/useRealtimeData";
import { updateUserSettings } from "../Services/realtimeDataService";

type NotificationState = {
  email: boolean;
  sms: boolean;
  push: boolean;
};

type IntegrationUrls = {
  lawEnforcementApi: string;
  emergencyServicesApi: string;
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const clampThreshold = (value: number): number =>
  Math.max(1, Math.min(10, Math.round(value)));

const SystemSettingsNotificationsSection: React.FC = () => {
  const { users, safetyScores, emergencyAlerts } = useGeoGuardianRealtimeData();
  const [alertThreshold, setAlertThreshold] = useState(5);
  const [isSaving, setIsSaving] = useState(false);

  const [notifications, setNotifications] = useState<NotificationState>({
    email: true,
    sms: false,
    push: true,
  });

  const [integrationUrls, setIntegrationUrls] = useState<IntegrationUrls>({
    lawEnforcementApi: "",
    emergencyServicesApi: "",
  });

  const targetUser = useMemo(() => {
    const authorityLike = users.data.find((user) => {
      const normalized = user.userType.toLowerCase();
      return normalized.includes("authority") || normalized.includes("admin");
    });
    return authorityLike ?? users.data[0] ?? null;
  }, [users.data]);

  const suggestedThreshold = useMemo(() => {
    const validScores = safetyScores.data
      .map((score) => score.overallScore)
      .filter((score): score is number => score !== null);
    const averageScore =
      validScores.length > 0
        ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
        : 50;
    const criticalAlerts = emergencyAlerts.data.filter((alert) =>
      alert.severity.toLowerCase().includes("critical"),
    ).length;
    const baseline = clampThreshold(averageScore / 10);
    return criticalAlerts > 0 ? Math.max(1, baseline - 2) : baseline;
  }, [safetyScores.data, emergencyAlerts.data]);

  useEffect(() => {
    if (!targetUser) {
      setAlertThreshold(suggestedThreshold);
      return;
    }

    const raw = targetUser.raw as Record<string, unknown>;
    const rawNotifications = isObject(raw.notifications)
      ? (raw.notifications as Record<string, unknown>)
      : {};
    const rawIntegrationUrls = isObject(raw.integrationUrls)
      ? (raw.integrationUrls as Record<string, unknown>)
      : {};

    const storedThreshold =
      typeof raw.alertThreshold === "number"
        ? clampThreshold(raw.alertThreshold)
        : suggestedThreshold;

    setAlertThreshold(storedThreshold);
    setNotifications({
      email:
        typeof rawNotifications.email === "boolean"
          ? rawNotifications.email
          : true,
      sms:
        typeof rawNotifications.sms === "boolean" ? rawNotifications.sms : false,
      push:
        typeof rawNotifications.push === "boolean"
          ? rawNotifications.push
          : true,
    });
    setIntegrationUrls({
      lawEnforcementApi:
        typeof rawIntegrationUrls.lawEnforcementApi === "string"
          ? rawIntegrationUrls.lawEnforcementApi
          : "",
      emergencyServicesApi:
        typeof rawIntegrationUrls.emergencyServicesApi === "string"
          ? rawIntegrationUrls.emergencyServicesApi
          : "",
    });
  }, [targetUser, suggestedThreshold]);

  const handleNotificationToggle = (name: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleIntegrationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setIntegrationUrls((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = async () => {
    if (!targetUser) {
      alert("No user profile available to save settings.");
      return;
    }

    setIsSaving(true);
    try {
      await updateUserSettings(
        {
          sourceCollection: targetUser.sourceCollection,
          docId: targetUser.docId,
        },
        {
          alertThreshold,
          notifications,
          integrationUrls,
        },
      );
      alert("Settings saved.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save settings";
      alert(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="#003366" fontWeight="bold">
        System Settings and Notifications
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {targetUser
          ? `Managing settings for ${targetUser.name} (${targetUser.userType})`
          : "No profile found. Connect realtime users data to continue."}
      </Typography>
      {users.error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mb: 2 }}>
          Users sync error: {users.error}
        </Typography>
      )}

      <Grid container spacing={4}>
        {/* Alert Thresholds */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Alert Thresholds
            </Typography>
            <Typography gutterBottom>Severity threshold for alerts</Typography>
            <Slider
              value={alertThreshold}
              min={1}
              max={10}
              step={1}
              marks
              valueLabelDisplay="auto"
              onChange={(_, value) => setAlertThreshold(Array.isArray(value) ? value[0] : value)}
            />
            <Typography variant="caption" color="text.secondary">
              Suggested from live safety scores: {suggestedThreshold}/10
            </Typography>
          </Card>
        </Grid>

        {/* Notification Preferences */}
        <Grid item xs={12} md={6}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Notification Preferences
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.email}
                    onChange={() => handleNotificationToggle("email")}
                  />
                }
                label="Email Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.sms}
                    onChange={() => handleNotificationToggle("sms")}
                  />
                }
                label="SMS Notifications"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.push}
                    onChange={() => handleNotificationToggle("push")}
                  />
                }
                label="Push Notifications"
              />
            </FormGroup>
          </Card>
        </Grid>

        {/* Integration Settings */}
        <Grid item xs={12}>
          <Card sx={{ p: 2 }}>
            <Typography variant="h6" mb={2}>
              Integration Settings
            </Typography>
            <TextField
              label="Law Enforcement API URL"
              variant="outlined"
              fullWidth
              name="lawEnforcementApi"
              value={integrationUrls.lawEnforcementApi}
              onChange={handleIntegrationChange}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Emergency Services API URL"
              variant="outlined"
              fullWidth
              name="emergencyServicesApi"
              value={integrationUrls.emergencyServicesApi}
              onChange={handleIntegrationChange}
              sx={{ mb: 2 }}
            />
            <Button variant="contained" color="primary" onClick={handleSaveSettings}>
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettingsNotificationsSection;
