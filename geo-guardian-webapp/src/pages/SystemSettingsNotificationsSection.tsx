import React, { useState } from "react";
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

const SystemSettingsNotificationsSection: React.FC = () => {
  const [alertThreshold, setAlertThreshold] = useState(5);

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
  });


  const [integrationUrls, setIntegrationUrls] = useState({
    lawEnforcementApi: "",
    emergencyServicesApi: "",
  });

  const handleNotificationToggle = (name: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleIntegrationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setIntegrationUrls((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveSettings = () => {
    alert("Settings saved!");
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom color="#003366" fontWeight="bold">
        System Settings and Notifications
      </Typography>

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
              Save Settings
            </Button>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SystemSettingsNotificationsSection;
