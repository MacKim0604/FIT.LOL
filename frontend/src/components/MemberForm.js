import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, MenuItem } from '@mui/material';
import axios from 'axios';

const LINE_OPTIONS = [
  { value: 'TOP', label: '탑' },
  { value: 'JUNGLE', label: '정글' },
  { value: 'MID', label: '미드' },
  { value: 'ADC', label: '원딜' },
  { value: 'SUPPORT', label: '서폿' }
];

function MemberForm({ open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [line, setLine] = useState('');
  const [winRate, setWinRate] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name || !line) {
      setError('이름과 라인은 필수입니다.');
      return;
    }
    try {
      await axios.post('http://localhost:4000/api/members', {
        name,
        line,
        win_rate: winRate ? parseFloat(winRate) : null
      });
      setName('');
      setLine('');
      setWinRate('');
      setError('');
      if (onSuccess) onSuccess();
    } catch (e) {
      setError('등록 실패: ' + (e.response?.data?.error || e.message));
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>멤버 추가</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="이름"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
        />
        <TextField
          select
          margin="dense"
          label="라인"
          fullWidth
          value={line}
          onChange={e => setLine(e.target.value)}
        >
          {LINE_OPTIONS.map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          margin="dense"
          label="승률 (0~1, 예: 0.55)"
          fullWidth
          value={winRate}
          onChange={e => setWinRate(e.target.value)}
          type="number"
          inputProps={{ min: 0, max: 1, step: 0.01 }}
        />
        {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>취소</Button>
        <Button variant="contained" onClick={handleSubmit}>등록</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberForm;
