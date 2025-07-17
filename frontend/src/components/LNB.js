import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';
import SportsMmaIcon from '@mui/icons-material/SportsMma';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 220;

function LNB() {
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', background: '#23233b', color: '#fff' },
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap>FIT.LOL</Typography>
      </Toolbar>
      <List>
        <ListItem button selected={location.pathname === '/'} onClick={() => navigate('/')}
          sx={{ pl: 4 }}>
          <ListItemIcon sx={{ color: '#fff' }}><GroupIcon /></ListItemIcon>
          <ListItemText primary="멤버 관리" />
        </ListItem>
        <ListItem button selected={location.pathname === '/matches'} onClick={() => navigate('/matches')}
          sx={{ pl: 4 }}>
          <ListItemIcon sx={{ color: '#fff' }}><SportsMmaIcon /></ListItemIcon>
          <ListItemText primary="경기 등록/관리" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default LNB;
