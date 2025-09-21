// src/pages/PoliceDashboard.tsx
import React from "react";
import {
  Container,
  Grid,
  Button,
  Typography,
  Box,
  Paper,
  Link as MuiLink,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

interface PoliceDashboardProps {
  userName: string;
  onLogout: () => void;
}

const PoliceDashboard: React.FC<PoliceDashboardProps> = ({
  userName,
  onLogout,
}) => {
  // Mock data
  const assignedCases = 8;
  const taskList = [
    "Investigate case #1234",
    "Follow up with witness",
    "Submit report for case #5678",
  ];
  const recentUpdates = [
    "Case #4321 closed",
    "New alert issued in district 5",
    "Meeting scheduled with Authority",
  ];

  const handleLogout = () => {
    // Backend logout logic goes here
    onLogout();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 6 }}>
      <Typography variant="h4" gutterBottom>
        Welcome, {userName}
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6">Assigned Cases</Typography>
            <Typography variant="h3" color="primary">
              {assignedCases}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Task List
            </Typography>
            <List dense>
              {taskList.map((task, i) => (
                <ListItem key={i}>
                  <ListItemText primary={task} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Updates
            </Typography>
            <List dense>
              {recentUpdates.map((update, i) => (
                <ListItem key={i}>
                  <ListItemText primary={update} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Navigation
        </Typography>
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
          <MuiLink href="#" underline="hover" sx={{ cursor: "pointer" }}>
            Assigned Cases (placeholder)
          </MuiLink>
          <MuiLink href="#" underline="hover" sx={{ cursor: "pointer" }}>
            Task Management (placeholder)
          </MuiLink>
          <MuiLink href="#" underline="hover" sx={{ cursor: "pointer" }}>
            Updates (placeholder)
          </MuiLink>
        </Box>
      </Box>

      <Button variant="outlined" color="error" onClick={handleLogout}>
        Logout
      </Button>
    </Container>
  );
};

export default PoliceDashboard;