import React, { useEffect, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, CircularProgress, Box } from '@mui/material';
import axios from 'axios';

function MemberMatchModal({ open, onClose, summonerName }) {
  const [loading, setLoading] = useState(false);
  const [match, setMatch] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && summonerName) {
      setLoading(true);
      setError('');
      setMatch(null);
      axios.get(`http://localhost:4000/api/riot/latest-match/${encodeURIComponent(summonerName)}`)
        .then(res => setMatch(res.data))
        .catch(err => setError(err.response?.data?.error || err.message))
        .finally(() => setLoading(false));
    }
  }, [open, summonerName]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>최근 전적 - {summonerName}</DialogTitle>
      <DialogContent>
        {loading && <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>}
        {error && <Typography color="error">{error}</Typography>}
        {match && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1">매치 ID: {match.metadata?.matchId}</Typography>
            <Typography variant="subtitle2">게임 모드: {match.info?.gameMode}</Typography>
            <Typography>게임 종료: {new Date(match.info?.gameEndTimestamp).toLocaleString()}</Typography>
            <Typography>참가자:</Typography>
            <ul>
              {match.info?.participants?.map(p => (
                <li key={p.puuid}>
                  {p.summonerName} - {p.championName} - {p.kills}/{p.deaths}/{p.assists} - {p.win ? '승리' : '패배'}
                </li>
              ))}
            </ul>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>닫기</Button>
      </DialogActions>
    </Dialog>
  );
}

export default MemberMatchModal;
