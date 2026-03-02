import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Chip, LinearProgress } from '@mui/material';
import { People, Analytics, MonitorHeart, TrendingUp } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchHospitalStats } from '../../store/slices/hospitalSlice';
import { alpha } from '@mui/material/styles';
import { COLORS, RISK_COLORS, CHART_COLORS } from '../../theme/theme';

function StatCard({ icon, label, value, color = COLORS.cyan }) {
  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="overline" color="text.secondary">{label}</Typography>
            <Typography variant="h3" fontWeight={800} sx={{ color, lineHeight: 1 }}>{value}</Typography>
          </Box>
          <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(color, 0.12) }}>
            <Box sx={{ color }}>{icon}</Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function HospitalDashboard() {
  const dispatch = useDispatch();
  const { stats } = useSelector(s => s.hospital);
  const { hospital_id, hospital_name } = useSelector(s => s.auth);

  useEffect(() => { if (hospital_id) dispatch(fetchHospitalStats(hospital_id)); }, [hospital_id]);

  if (!stats) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;

  const trainingData = stats.training_rounds.slice(-10).map(r => ({
    round: `R${r.round}`, accuracy: parseFloat((r.accuracy * 100).toFixed(2)), loss: parseFloat(r.loss.toFixed(3))
  }));

  const riskData = Object.entries(stats.risk_distribution).map(([k, v]) => ({ name: k, value: v }));
  const cvdData = Object.entries(stats.cvd_type_distribution).map(([k, v]) => ({ name: k.split(' ').slice(0, 2).join(' '), value: v }));

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">HOSPITAL DASHBOARD</Typography>
        <Typography variant="h4" fontWeight={800}>{hospital_name}</Typography>
        <Typography color="text.secondary">{stats.hospital.city} · Real-time CVD prediction analytics</Typography>
      </Box>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard icon={<People />} label="Total Patients" value={stats.total_patients} /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={<Analytics />} label="Predictions" value={stats.total_predictions} color={COLORS.purple} /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={<MonitorHeart />} label="Approved" value={stats.approved_predictions} color={COLORS.green} /></Grid>
        <Grid item xs={6} md={3}><StatCard icon={<TrendingUp />} label="FL Rounds" value={stats.training_rounds.length} color={COLORS.amber} /></Grid>
      </Grid>

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Model Accuracy Progress</Typography>
              <Box sx={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trainingData}>
                    <defs>
                      <linearGradient id="accGrad2" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(COLORS.cyan, 0.05)} />
                    <XAxis dataKey="round" tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <YAxis domain={[70, 100]} tickFormatter={v => `${v}%`} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v}%`, 'Accuracy']} contentStyle={{ backgroundColor: COLORS.navyLight, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 8 }} />
                    <Area type="monotone" dataKey="accuracy" stroke={COLORS.cyan} strokeWidth={2} fill="url(#accGrad2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: 300 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 1 }}>Risk Distribution</Typography>
              <Box sx={{ height: 180, display: 'flex', justifyContent: 'center' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {riskData.map((entry, i) => (
                        <Cell key={i} fill={RISK_COLORS[entry.name] || COLORS.textMuted} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: COLORS.navyLight, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, justifyContent: 'center' }}>
                {riskData.map((r) => (
                  <Chip key={r.name} label={`${r.name}: ${r.value}`} size="small"
                    sx={{ bgcolor: alpha(RISK_COLORS[r.name] || COLORS.textMuted, 0.15), color: RISK_COLORS[r.name] || COLORS.textMuted, fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* CVD type distribution */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>CVD Type Distribution</Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            {cvdData.map((d, i) => (
              <Box key={d.name} sx={{ flex: '1 1 180px', p: 2, borderRadius: 2, bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.08), border: `1px solid ${alpha(CHART_COLORS[i % CHART_COLORS.length], 0.2)}` }}>
                <Typography variant="h5" fontWeight={800} sx={{ color: CHART_COLORS[i % CHART_COLORS.length] }}>{d.value}</Typography>
                <Typography variant="caption" color="text.secondary">{d.name}</Typography>
                <LinearProgress variant="determinate" value={d.value / Math.max(...cvdData.map(x => x.value)) * 100}
                  sx={{ mt: 1, height: 3, bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.15), '& .MuiLinearProgress-bar': { bgcolor: CHART_COLORS[i % CHART_COLORS.length] } }} />
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}