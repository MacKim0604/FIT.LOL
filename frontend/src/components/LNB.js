import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import GroupIcon from '@mui/icons-material/Group';

const drawerWidth = 220;

function LNB() {
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
        <ListItem button selected>
          <ListItemIcon sx={{ color: '#fff' }}><GroupIcon /></ListItemIcon>
          <ListItemText primary="멤버 관리" />
        </ListItem>
      </List>
    </Drawer>
  );
}

export default LNB;
