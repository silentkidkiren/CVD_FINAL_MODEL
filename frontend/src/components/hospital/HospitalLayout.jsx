import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Drawer, AppBar, Toolbar, List, ListItem, ListItemIcon,
  ListItemText, Typography, Avatar, Chip, IconButton, Divider, Tooltip
} from '@mui/material';
import {
  Dashboard, Psychology, People, ModelTraining,
  Assessment, Logout, MonitorHeart, NotificationsNone
} from '@mui/icons-material';
import { logout } from '../../store/slices/authSlice';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../theme/theme';

const DRAWER_WIDTH = 260;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/hospital', icon: <Dashboard /> },
  { label: 'CVD Prediction', path: '/hospital/predict', icon: <Psychology /> },
  { label: 'Patients', path: '/hospital/patients', icon: <People /> },
  { label: 'Model Training', path: '/hospital/training', icon: <ModelTraining /> },
  { label: 'Reports', path: '/hospital/reports', icon: <Assessment /> },
];

export default function HospitalLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { hospital_name } = useSelector(s => s.auth);

  const initials = hospital_name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'H';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Drawer variant="permanent" sx={{
        width: DRAWER_WIDTH,
        '& .MuiDrawer-paper': { width: DRAWER_WIDTH, borderRight: `1px solid ${alpha(COLORS.cyan, 0.12)}`, bgcolor: COLORS.navyMid }
      }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2,
            background: `linear-gradient(135deg, ${COLORS.red}, #FF6B9D)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <MonitorHeart sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>
              Cardio<span style={{ color: COLORS.cyan }}>AI</span>
            </Typography>
            <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block' }}>Hospital Portal</Typography>
          </Box>
        </Box>

        <Box sx={{ mx: 2, mb: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(COLORS.cyan, 0.06), border: `1px solid ${alpha(COLORS.cyan, 0.15)}` }}>
          <Typography variant="caption" sx={{ color: COLORS.textMuted, display: 'block', mb: 0.5, fontFamily: 'JetBrains Mono', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Connected as</Typography>
          <Typography variant="body2" fontWeight={600} noWrap>{hospital_name || 'Hospital'}</Typography>
        </Box>

        <Divider sx={{ borderColor: alpha(COLORS.cyan, 0.1) }} />

        <List sx={{ px: 1.5, pt: 2 }}>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path;
            return (
              <ListItem key={item.path} onClick={() => navigate(item.path)} sx={{
                borderRadius: 2, mb: 0.5, cursor: 'pointer',
                bgcolor: active ? alpha(COLORS.cyan, 0.12) : 'transparent',
                border: active ? `1px solid ${alpha(COLORS.cyan, 0.3)}` : '1px solid transparent',
                '&:hover': { bgcolor: alpha(COLORS.cyan, 0.08) }
              }}>
                <ListItemIcon sx={{ color: active ? COLORS.cyan : COLORS.textMuted, minWidth: 40 }}>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} primaryTypographyProps={{
                  fontWeight: active ? 600 : 400,
                  color: active ? COLORS.white : COLORS.textMuted,
                  fontSize: '0.875rem'
                }} />
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ mt: 'auto', p: 2 }}>
          <Divider sx={{ borderColor: alpha(COLORS.cyan, 0.1), mb: 2 }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: alpha(COLORS.red, 0.2), color: COLORS.red, fontSize: '0.75rem', fontWeight: 700 }}>{initials}</Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{hospital_name}</Typography>
              <Typography variant="caption" color="text.secondary" noWrap>Hospital Account</Typography>
            </Box>
            <Tooltip title="Logout">
              <IconButton size="small" onClick={() => { dispatch(logout()); navigate('/login'); }}>
                <Logout sx={{ fontSize: 18, color: COLORS.textMuted }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Drawer>

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar sx={{ justifyContent: 'flex-end', gap: 1 }}>
            <Chip label="● FEDERATED" size="small" sx={{ bgcolor: alpha(COLORS.purple, 0.15), color: COLORS.purple, fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
            <IconButton size="small"><NotificationsNone /></IconButton>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, p: 3, overflow: 'auto' }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}