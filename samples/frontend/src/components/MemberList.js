import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import MemberForm from './MemberForm';
import MemberMatchModal from './MemberMatchModal';
import axios from 'axios';

function MemberList() {
  const [members, setMembers] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [selectedSummoner, setSelectedSummoner] = useState(null);

  const fetchMembers = async () => {
    const res = await axios.get('http://localhost:4000/api/members');
    setMembers(res.data);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAdd = () => setOpenForm(true);
  const handleClose = () => setOpenForm(false);
  const handleSuccess = () => {
    fetchMembers();
    handleClose();
  };

  const handleShowMatch = (name) => setSelectedSummoner(name);
  const handleCloseMatchModal = () => setSelectedSummoner(null);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">멤버 리스트</Typography>
        <Button variant="contained" color="primary" onClick={handleAdd}>+ 멤버 추가</Button>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>이름</TableCell>
              <TableCell>태그</TableCell>
              <TableCell>최근 전적</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.id}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.tag || '-'}</TableCell>
                <TableCell>
                  <Button size="small" variant="outlined" onClick={() => handleShowMatch(m.name)}>
                    최근 전적
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <MemberForm open={openForm} onClose={handleClose} onSuccess={handleSuccess} />
      <MemberMatchModal open={!!selectedSummoner} onClose={handleCloseMatchModal} summonerName={selectedSummoner} />
    </Box>
  );
}

export default MemberList;
