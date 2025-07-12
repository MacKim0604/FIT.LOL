import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField } from '@mui/material';
import axios from 'axios';

function MemberForm({ open, onClose, onSuccess }) {
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!name) {
      setError('이름은 필수입니다.');
      return;
    }
    try {
      await axios.post('http://localhost:4000/api/members', {
        name,
        tag: tag || undefined
      });
      setName('');
      setTag('');
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
          margin="dense"
          label="태그 (예: 1234)"
          fullWidth
          value={tag}
          onChange={e => setTag(e.target.value)}
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
