import React from 'react';
import { Box, Typography, Paper } from '@mui/material';

const CaseFIRManagementSection: React.FC = () => (
  <Box>
    <Typography variant="h6">Case & FIR Management</Typography>
    <Paper sx={{ p: 2, mt: 1 }}>
      <Typography variant="body2">This section manages eFIRs and complaints.</Typography>
    </Paper>
  </Box>
);

export default CaseFIRManagementSection;
