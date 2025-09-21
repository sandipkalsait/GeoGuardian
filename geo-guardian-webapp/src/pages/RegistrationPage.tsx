// src/pages/RegistrationPage.tsx
import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
  MenuItem,
  Grid,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import logo from "/build/geo-guardian.png";

const roles = [
  { value: "authority", label: "Authority" },
  { value: "police", label: "Police" },
];

const accessLevels = [
  { value: "admin", label: "Admin" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
];

const RegistrationPage: React.FC = () => {
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [location, setLocation] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [accessLevel, setAccessLevel] = useState("");
  const [rank, setRank] = useState("");
  const [trainingDetails, setTrainingDetails] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRoleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRole(event.target.value);
    setAccessLevel("");
    setRank("");
    setTrainingDetails("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validation as before
    if (
      !fullName ||
      !username ||
      !email ||
      !phone ||
      !department ||
      !role ||
      !password ||
      !confirmPassword ||
      !employeeId
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    if (role === "authority" && !accessLevel) {
      setError("Please select access level for Authority.");
      return;
    }
    if (role === "police" && !rank) {
      setError("Please enter rank for Police.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSuccess("Registration successful! You can now log in.");

    // Clear form
    setFullName("");
    setUsername("");
    setEmail("");
    setPhone("");
    setDepartment("");
    setRole("");
    setPassword("");
    setConfirmPassword("");
    setEmployeeId("");
    setLocation("");
    setSupervisor("");
    setAccessLevel("");
    setRank("");
    setTrainingDetails("");
  };

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          marginTop: 8,
          padding: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: "#f6f6f6",
        }}
      >
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img src={logo} alt="Geo Guardian Logo" style={{ width: 150, height: 100 }} />
        </Box>

        <Typography
          component="h1"
          variant="h5"
          align="center"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#003366" }}
        >
          Geo Guardian Registration
        </Typography>
        <br/>
      
        
        

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Full Name"
                variant="outlined"
                required
                fullWidth
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Username"
                variant="outlined"
                required
                fullWidth
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                variant="outlined"
                type="email"
                required
                fullWidth
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone Number"
                variant="outlined"
                type="tel"
                required
                fullWidth
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Department / Unit"
                variant="outlined"
                required
                fullWidth
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="Role"
                variant="outlined"
                required
                fullWidth
                value={role}
                onChange={handleRoleChange}
              >
                {roles.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Employee / ID Number"
                variant="outlined"
                required
                fullWidth
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Location (Optional)"
                variant="outlined"
                fullWidth
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Supervisor / Manager Contact (Optional)"
                variant="outlined"
                fullWidth
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
              />
            </Grid>

            {role === "authority" && (
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Access Level"
                  variant="outlined"
                  required
                  fullWidth
                  value={accessLevel}
                  onChange={(e) => setAccessLevel(e.target.value)}
                >
                  {accessLevels.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            )}

            {role === "police" && (
              <>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Rank"
                    variant="outlined"
                    required
                    fullWidth
                    value={rank}
                    onChange={(e) => setRank(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    label="Training / Certification Details (Optional)"
                    variant="outlined"
                    multiline
                    minRows={2}
                    fullWidth
                    value={trainingDetails}
                    onChange={(e) => setTrainingDetails(e.target.value)}
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12} sm={6}>
              <TextField
                label="Password"
                variant="outlined"
                required
                fullWidth
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirm Password"
                variant="outlined"
                required
                fullWidth
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </Grid>

          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, backgroundColor: "#004080" }}
          >
            Register
          </Button>

          <Typography variant="body2" align="center">
            Already have an account?{" "}
            <Link component={RouterLink} to="/login" underline="hover">
              Sign in here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegistrationPage;
