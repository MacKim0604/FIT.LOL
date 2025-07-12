import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import MemberForm from './MemberForm';
import axios from 'axios';

function MemberList() {
  const [members, setMembers] = useState([]);
  const [openForm, setOpenForm] = useState(false);

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
              <TableCell>라인</TableCell>
              <TableCell>승률</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {members.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.id}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.line}</TableCell>
                <TableCell>{m.win_rate !== null ? `${(m.win_rate * 100).toFixed(1)}%` : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <MemberForm open={openForm} onClose={handleClose} onSuccess={handleSuccess} />
    </Box>
  );
}

export default MemberList;
