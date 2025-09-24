import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  Paper,
} from "@mui/material";

// Sample tourist data
const initialTouristData = [
  { touristId: 101, fullName: "John Doe", email: "tourist1@example.com", documentNumber: "X1234567" },
  { touristId: 102, fullName: "Jane Smith", email: "tourist2@example.com", documentNumber: "Y7654321" },
];

const TouristPage: React.FC = () => {
  const [touristData, setTouristData] = useState(initialTouristData);
  const [form, setForm] = useState({ fullName: "", email: "", documentNumber: "", photo: null as File | null });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setForm({ ...form, photo: e.target.files[0] });
  };

  const handleAddTourist = () => {
    const newTourist = { touristId: Date.now(), ...form };
    setTouristData([...touristData, newTourist]);
    setForm({ fullName: "", email: "", documentNumber: "", photo: null });
  };

  return (
    <Box sx={{ p: 3 }}>
      {/* Logo */}
      <Box sx={{ mb: 3 }}>
        <img src="/geo-guardian.png" alt="Logo" style={{ height: 60 }} />
      </Box>

      <Typography variant="h6" mb={2}>Add Tourist</Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 4, flexWrap: "wrap" }}>
        <TextField label="Full Name" name="fullName" value={form.fullName} onChange={handleInputChange} />
        <TextField label="Email" name="email" value={form.email} onChange={handleInputChange} />
        <TextField label="Document Number" name="documentNumber" value={form.documentNumber} onChange={handleInputChange} />
        <Button variant="outlined" component="label">
          Upload Photo
          <input type="file" hidden accept="image/*" onChange={handlePhotoChange} />
        </Button>
        <Button variant="contained" onClick={handleAddTourist}>Add Tourist</Button>
      </Box>

      <Typography variant="h6" mb={2}>Existing Tourists</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              {["ID","Full Name","Email","Document Number"].map((header) => (
                <TableCell key={header} sx={{ fontWeight: 700 }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <tbody>
            {touristData.map(t => (
              <TableRow key={t.touristId}>
                <TableCell>{t.touristId}</TableCell>
                <TableCell>{t.fullName}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell>{t.documentNumber}</TableCell>
              </TableRow>
            ))}
          </tbody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default TouristPage;
