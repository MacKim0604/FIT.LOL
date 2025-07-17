import React, { useEffect, useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Table, TableHead, TableRow, TableCell, TableBody, Select, MenuItem, Typography, Switch, FormControlLabel, CircularProgress
} from '@mui/material';
import axios from 'axios';

// 경기 등록 모달: 멤버 선택 후 최근 경기 N건 조회 및 토글로 추가
function MatchAddModal({ open, onClose, members, onAddMatches }) {
  const [selectedMember, setSelectedMember] = useState('');
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState({});
  const [count, setCount] = useState(5);

  useEffect(() => {
    setMatches([]);
    setSelected({});
  }, [open]);

  const fetchMatches = async () => {
    if (!selectedMember) return;
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:4000/api/riot/matches/${selectedMember}?count=${count}`);
      setMatches(res.data || []);
      setSelected({});
    } catch (e) {
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (matchId) => {
    setSelected((prev) => ({ ...prev, [matchId]: !prev[matchId] }));
  };

  const handleAdd = () => {
    const selectedMatches = matches.filter(m => selected[m.matchId]);
    onAddMatches(selectedMatches);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>경기 추가</DialogTitle>
      <DialogContent>
        <Typography gutterBottom>멤버 선택 후 최근 경기 불러오기</Typography>
        <Select
          value={selectedMember}
          onChange={e => setSelectedMember(e.target.value)}
          displayEmpty
          fullWidth
        >
          <MenuItem value=""><em>멤버 선택</em></MenuItem>
          {members.map(m => (
            <MenuItem key={m.id} value={m.name}>{m.name}{m.tag ? `#${m.tag}` : ''}</MenuItem>
          ))}
        </Select>
        <Button onClick={fetchMatches} variant="contained" sx={{ mt: 2, mb: 2 }} disabled={!selectedMember || loading}>경기 불러오기</Button>
        {loading && <CircularProgress size={24} sx={{ ml: 2 }} />}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>선택</TableCell>
              <TableCell>Match ID</TableCell>
              <TableCell>게임 모드</TableCell>
              <TableCell>날짜</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {matches.map(match => (
              <TableRow key={match.matchId}>
                <TableCell>
                  <FormControlLabel
                    control={<Switch checked={!!selected[match.matchId]} onChange={() => handleToggle(match.matchId)} />}
                    label=""
                  />
                </TableCell>
                <TableCell>{match.matchId}</TableCell>
                <TableCell>{match.queueType || '-'}</TableCell>
                <TableCell>{match.date ? new Date(match.date).toLocaleString() : '-'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button onClick={handleAdd} variant="contained" disabled={Object.values(selected).every(v => !v)}>추가</Button>
      </DialogActions>
    </Dialog>
  );
}

// 경기 등록/관리 페이지
export default function MatchRegister() {
  const [matches, setMatches] = useState([]); // 등록된 경기 목록
  const [members, setMembers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetchMatches();
    fetchMembers();
  }, []);

  const fetchMatches = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/matches');
      setMatches(res.data || []);
    } catch {
      setMatches([]);
    }
  };
  const fetchMembers = async () => {
    try {
      const res = await axios.get('http://localhost:4000/api/members');
      setMembers(res.data || []);
    } catch {
      setMembers([]);
    }
  };
  const handleAddMatches = async (newMatches) => {
    // 등록 API 호출
    await axios.post('http://localhost:4000/api/matches', newMatches);
    fetchMatches();
  };

  return (
    <div style={{ padding: 32 }}>
      <Typography variant="h5" gutterBottom>경기 등록/관리</Typography>
      <Button variant="contained" onClick={() => setModalOpen(true)} sx={{ mb: 2 }}>경기 추가</Button>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Match ID</TableCell>
            <TableCell>등록일</TableCell>
            <TableCell>등록자</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {matches.map(match => (
            <TableRow key={match.matchId}>
              <TableCell>{match.matchId}</TableCell>
              <TableCell>{match.registeredAt ? new Date(match.registeredAt).toLocaleString() : '-'}</TableCell>
              <TableCell>{match.registrant || '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <MatchAddModal open={modalOpen} onClose={() => setModalOpen(false)} members={members} onAddMatches={handleAddMatches} />
    </div>
  );
}
