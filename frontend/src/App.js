import React from 'react';
import { CssBaseline, Box, Typography } from '@mui/material';
import LNB from './components/LNB';
import MemberList from './components/MemberList';

function App() {
  return (
    <Box sx={{ display: 'flex', height: '100vh', background: '#f9f9fb' }}>
      <CssBaseline />
      <LNB />
      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Typography variant="h4" gutterBottom>FIT.LOL 멤버 관리</Typography>
        <MemberList />
      </Box>
    </Box>
  );
}

export default App;
