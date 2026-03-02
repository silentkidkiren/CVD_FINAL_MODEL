import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Table, TableBody, TableCell, TableHead, TableRow, Chip, LinearProgress, Button
} from '@mui/material';
import { LocalHospital, People, Analytics, Hub, TrendingUp, Refresh } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import api from '../../services/api';
import { alpha } from '@mui/material/styles';
import { COLORS, RISK_COLORS, CHART_COLORS } from '../../theme/theme';

function StatCard({ icon, label, value, sub, color = COLORS.cyan }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">{label}</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color, mt: 0.5, lineHeight: 1 }}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color, 0.12) }}>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

const RISK_CHIP = {
  low: { color: 'success', label: 'Low' },
  medium: { color: 'warning', label: 'Medium' },
  high: { color: 'error', label: 'High' },
  critical: { color: 'error', label: 'Critical' },
};

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, compRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/hospitals/comparison'),
      ]);
      setStats(statsRes.data);
      setComparison(compRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
      <CircularProgress color="primary" />
    </Box>
  );

  const accHistory = comparison.flatMap(h =>
    h.accuracy_history.map(r => ({ ...r, hospital: h.name.split(' ')[0] }))
  ).slice(0, 50);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: '0.15em' }}>GLOBAL OVERVIEW</Typography>
          <Typography variant="h4" fontWeight={800}>Admin Dashboard</Typography>
          <Typography color="text.secondary">Federated network performance at a glance</Typography>
        </Box>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData} size="small">Refresh</Button>
      </Box>

      {/* Stat cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<LocalHospital />} label="Active Hospitals" value={stats?.active_hospitals} sub={`${stats?.total_hospitals} total registered`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<People />} label="Total Patients" value={stats?.total_patients?.toLocaleString()} sub="Across all hospitals" color={COLORS.purple} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Analytics />} label="Total Predictions" value={stats?.total_predictions?.toLocaleString()} sub="AI-assisted diagnoses" color={COLORS.amber} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard icon={<Hub />} label="Global Accuracy" value={`${((stats?.global_model_accuracy || 0) * 100).toFixed(1)}%`} sub={`Model ${stats?.global_model_version} · ${stats?.federated_rounds} FL rounds`} color={COLORS.green} />
        </Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {/* Hospital accuracy chart */}
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 360 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 0.5 }}>Hospital Training Accuracy</Typography>
              <Typography variant="caption" color="text.secondary">Per-round local model performance across federated network</Typography>
              <Box sx={{ mt: 2, height: 270 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(COLORS.cyan, 0.05)} />
                    <XAxis dataKey="round" tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} label={{ value: 'Round', position: 'insideBottom', fill: COLORS.textMuted, fontSize: 11 }} />
                    <YAxis domain={[0.7, 1]} tickFormatter={v => `${(v * 100).toFixed(0)}%`} tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                    <Tooltip formatter={(v) => [`${(v * 100).toFixed(1)}%`, 'Accuracy']} contentStyle={{ backgroundColor: COLORS.navyLight, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 8, fontFamily: 'Sora' }} />
                    {comparison.slice(0, 5).map((h, i) => (
                      <Line key={h.id} type="monotone" dataKey="accuracy" data={h.accuracy_history} name={h.name}
                        stroke={CHART_COLORS[i]} strokeWidth={2} dot={false} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Top hospitals */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: 360 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Hospital Rankings</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[...comparison].sort((a, b) => b.accuracy - a.accuracy).map((h, i) => (
                  <Box key={h.id}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="caption" sx={{ color: i < 3 ? COLORS.amber : COLORS.textMuted, fontFamily: 'JetBrains Mono', fontWeight: 700, width: 20 }}>#{i + 1}</Typography>
                        <Typography variant="body2" fontWeight={500} noWrap sx={{ maxWidth: 140 }}>{h.name.split(' ')[0]} {h.name.split(' ')[1]}</Typography>
                      </Box>
                      <Typography variant="caption" sx={{ color: COLORS.cyan, fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{(h.accuracy * 100).toFixed(1)}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={h.accuracy * 100} sx={{ height: 4 }} />
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent predictions */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Recent Predictions</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Patient</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>CVD Type</TableCell>
                <TableCell>Risk Level</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {stats?.recent_predictions?.map((p, i) => (
                <TableRow key={i} sx={{ '&:hover': { bgcolor: alpha(COLORS.cyan, 0.04) } }}>
                  <TableCell><Typography variant="body2" fontWeight={500}>{p.patient}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{p.hospital}</Typography></TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono' }}>{p.cvd_type}</Typography></TableCell>
                  <TableCell>
                    <Chip label={p.risk_level?.toUpperCase()} size="small"
                      sx={{ bgcolor: alpha(RISK_COLORS[p.risk_level] || COLORS.textMuted, 0.15), color: RISK_COLORS[p.risk_level] || COLORS.textMuted, fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{new Date(p.created_at).toLocaleDateString()}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}