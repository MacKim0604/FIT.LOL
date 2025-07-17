import React from 'react';
import { CssBaseline, Box, Typography } from '@mui/material';
import LNB from './components/LNB';
import MemberList from './components/MemberList';
import MatchRegister from './components/MatchRegister';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <div style={{ display: 'flex' }}>
        <LNB />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<><Typography variant="h4" gutterBottom style={{ marginTop: 32, marginLeft: 32 }}>FIT.LOL 멤버 관리</Typography><MemberList /></>} />
            <Route path="/matches" element={<MatchRegister />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
