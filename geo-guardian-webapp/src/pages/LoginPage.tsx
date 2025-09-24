import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Alert,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";

import logo from "/build/geo-guardian.png"; 


interface LoginPageProps {
  onLoginSuccess: (role: "authority" | "police", name: string) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication logic
    if (username === "authority" && password === "password") {
      onLoginSuccess("authority", "Authority User");
    } else if (username === "police" && password === "password") {
      onLoginSuccess("police", "Police Officer");
    } else {
      setError("Invalid username or password");
    }
  };



  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          padding: 4,
          boxShadow: 3,
          borderRadius: 2,
          backgroundColor: "#f6f6f6",
        }}
      >
        {/* Logo at top */}
        <Box sx={{ textAlign: "center", mb: 2 }}>
          <img
            src={logo}
            alt="Geo Guardian Logo"
            style={{ width: 150, height: 100 }} // Adjust size as needed
          />
        </Box>
        <Typography component="h1" variant="h5" align="center" gutterBottom sx={{ fontWeight: "bold", color: "#003366" }}>
          Geo Guardian Login
        </Typography>
        <br/>
      
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <TextField
            label="UserName"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoFocus
          />
          <TextField
            label="Password"
            variant="outlined"
            margin="normal"
            required
            fullWidth
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* To match the sample - add CAPTCHA input. The CAPTCHA image logic can be added later */}
          <Box sx={{ mt: 2 }}>
            {/* <img src={captchaImage} alt="captcha" /> */}
            {/* Placeholder for CAPTCHA */}
            <Typography variant="body2" sx={{ mb: 1 }}>
              Captcha (Captcha Verification Code):
            </Typography>
            <TextField
              label="Enter Captcha"
              variant="outlined"
              margin="normal"
              required
              fullWidth
              // value={} // To be handled if you implement CAPTCHA feature
            />
          </Box>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2, backgroundColor: "#004080" }}
          >
            LOGIN
          </Button>

          <Typography variant="body2" align="center">
            Don't have an account?{" "}
            <Link component={RouterLink} to="/register" underline="hover">
              Register here
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default LoginPage;
