import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, TextField, Button, Typography, Alert,
  InputAdornment, IconButton, CircularProgress, Chip
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff, Favorite, MonitorHeart } from '@mui/icons-material';
import { login, clearError } from '../../store/slices/authSlice';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../theme/theme';

const ECG_PATH = "M0,50 L60,50 L80,20 L100,80 L120,10 L140,90 L160,50 L220,50 L240,30 L260,70 L280,50 L340,50";

function AnimatedECG() {
  return (
    <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, opacity: 0.15, overflow: 'hidden', height: 100 }}>
      <svg viewBox="0 0 340 100" style={{ width: '200%', animation: 'ecgScroll 3s linear infinite' }}>
        <path d={ECG_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="2" />
        <path d={ECG_PATH} fill="none" stroke={COLORS.cyan} strokeWidth="2" transform="translate(340,0)" />
      </svg>
      <style>{`@keyframes ecgScroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </Box>
  );
}

function HeartbeatIcon() {
  return (
    <Box sx={{
      width: 80, height: 80, borderRadius: '50%',
      background: `radial-gradient(circle, ${alpha(COLORS.cyan, 0.2)}, transparent)`,
      border: `2px solid ${alpha(COLORS.cyan, 0.5)}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'heartbeat 1.5s ease-in-out infinite',
      mx: 'auto', mb: 3,
    }}>
      <MonitorHeart sx={{ fontSize: 40, color: COLORS.cyan }} />
      <style>{`@keyframes heartbeat { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }`}</style>
    </Box>
  );
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, role, token } = useSelector(s => s.auth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (token) navigate(role === 'admin' ? '/admin' : '/hospital', { replace: true });
  }, [token, role, navigate]);

  useEffect(() => { dispatch(clearError()); }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  const quickLogin = (e, p) => { setEmail(e); setPassword(p); };

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(135deg, ${COLORS.navy} 0%, ${COLORS.navyMid} 50%, ${COLORS.navy} 100%)`,
      position: 'relative', overflow: 'hidden', px: 2,
    }}>
      {/* Background orbs */}
      <Box sx={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(COLORS.cyan, 0.06)}, transparent)`, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: '10%', right: '5%', width: 300, height: 300, borderRadius: '50%', background: `radial-gradient(circle, ${alpha(COLORS.purple, 0.06)}, transparent)`, pointerEvents: 'none' }} />

      <Box sx={{ width: '100%', maxWidth: 440, position: 'relative', zIndex: 1 }}>
        {/* Logo area */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <HeartbeatIcon />
          <Typography variant="h3" sx={{ color: COLORS.white, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Cardio<span style={{ color: COLORS.cyan }}>AI</span> Pro
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.textMuted, mt: 1 }}>
            Federated CVD Prediction Platform
          </Typography>
        </Box>

        {/* Login Card */}
        <Card sx={{
          p: 4, position: 'relative', overflow: 'hidden',
          background: alpha(COLORS.navyMid, 0.9),
          border: `1px solid ${alpha(COLORS.cyan, 0.2)}`,
          backdropFilter: 'blur(30px)',
          boxShadow: `0 24px 80px ${alpha(COLORS.navy, 0.8)}, inset 0 1px 0 ${alpha(COLORS.cyan, 0.1)}`,
        }}>
          <AnimatedECG />
          <Typography variant="h5" fontWeight={700} sx={{ mb: 0.5 }}>Welcome Back</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Sign in to access your dashboard
          </Typography>

          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email Address" type="email" value={email}
              onChange={e => setEmail(e.target.value)} sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><Email sx={{ color: COLORS.textMuted, fontSize: 20 }} /></InputAdornment> }}
            />
            <TextField fullWidth label="Password" type={showPass ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)} sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock sx={{ color: COLORS.textMuted, fontSize: 20 }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small"><>{showPass ? <VisibilityOff /> : <Visibility />}</></IconButton></InputAdornment>
              }}
            />
            <Button fullWidth variant="contained" type="submit" disabled={loading} size="large"
              sx={{ py: 1.5, fontSize: '1rem', mb: 2 }}>
              {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
            </Button>
          </Box>

          {/* Quick access */}
          <Box sx={{ mt: 3, pt: 3, borderTop: `1px solid ${alpha(COLORS.cyan, 0.1)}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, textAlign: 'center' }}>
              DEMO QUICK ACCESS
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Chip label="Admin" size="small" variant="outlined" color="primary" clickable
                onClick={() => quickLogin('admin@cardioai.pro', 'Admin@123')} />
              <Chip label="Apollo Hospital" size="small" variant="outlined" clickable
                onClick={() => quickLogin('apollo@hospital.com', 'Hospital@123')} />
              <Chip label="Mayo Clinic" size="small" variant="outlined" clickable
                onClick={() => quickLogin('mayo@hospital.com', 'Hospital@123')} />
              <Chip label="Stanford" size="small" variant="outlined" clickable
                onClick={() => quickLogin('stanford@hospital.com', 'Hospital@123')} />
            </Box>
          </Box>
        </Card>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: COLORS.textMuted }}>
          🔒 HIPAA Compliant · Federated Learning · End-to-End Encrypted
        </Typography>
      </Box>
    </Box>
  );
}