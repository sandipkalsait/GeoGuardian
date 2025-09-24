// src/pages/PoliceDashboard.tsx
import React, { useState } from "react";
import {
  Container,
  Grid,
  Button,
  Typography,
  Box,
  Paper,
  TextField,
  CircularProgress,
  Card,
  CardContent,
} from "@mui/material";

interface PoliceDashboardProps {
  userName: string;
  onLogout: () => void;
}

const PoliceDashboard: React.FC<PoliceDashboardProps> = ({
  userName,
  onLogout,
}) => {
  // State for case login
  const [caseId, setCaseId] = useState("");
  const [casePassword, setCasePassword] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Mock approved case data (replace with API later)
  const approvedCase = {
    user: {
      name: "Rahul Mehta",
      id: "U101",
      phone: "+91 98765 43210",
    },
    location: "19.9975° N, 73.7898° E",
    status: "Active SOS Case",
  };

  const handleCaseRequest = () => {
    setIsRequesting(true);

    // Simulate backend call + authority approval delay
    setTimeout(() => {
      setIsRequesting(false);
      setIsApproved(true); // Authority approves
    }, 2000);
  };

  const handleLogout = () => {
    onLogout();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6, mb: 6 }}>
      <Typography variant="h4" gutterBottom>
        👮 Police Dashboard — Welcome, {userName}
      </Typography>

      {/* If no case approved yet */}
      {!isApproved ? (
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Enter Case Credentials
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case ID"
                value={caseId}
                onChange={(e) => setCaseId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Case Password"
                type="password"
                value={casePassword}
                onChange={(e) => setCasePassword(e.target.value)}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleCaseRequest}
              disabled={!caseId || !casePassword || isRequesting}
            >
              {isRequesting ? (
                <>
                  <CircularProgress size={20} sx={{ mr: 1 }} /> Requesting...
                </>
              ) : (
                "Request Access"
              )}
            </Button>
          </Box>
          {isRequesting && (
            <Typography sx={{ mt: 2 }} color="text.secondary">
              Waiting for authority approval...
            </Typography>
          )}
        </Paper>
      ) : (
        // After approval → Show case details
        <Box sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
            🚨 Active Case Details
          </Typography>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">User Information</Typography>
              <Typography>Name: {approvedCase.user.name}</Typography>
              <Typography>User ID: {approvedCase.user.id}</Typography>
              <Typography>Phone: {approvedCase.user.phone}</Typography>
            </CardContent>
          </Card>

          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6">Location</Typography>
              <Typography>Last Known: {approvedCase.location}</Typography>
              {/* Later → Add Map Component */}
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6">Case Status</Typography>
              <Typography>{approvedCase.status}</Typography>
              <Box sx={{ mt: 2, display: "flex", gap: 2 }}>
                <Button variant="contained" color="warning">
                  Mark In-Progress
                </Button>
                <Button variant="contained" color="success">
                  Mark Resolved
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Logout */}
      <Box sx={{ mt: 5 }}>
        <Button variant="outlined" color="error" onClick={handleLogout}>
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default PoliceDashboard;
