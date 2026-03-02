import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, LinearProgress,
  Table, TableBody, TableCell, TableHead, TableRow, CircularProgress,
  Avatar
} from '@mui/material';
import { LocalHospital, TrendingUp } from '@mui/icons-material';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import api from '../../services/api';
import { alpha } from '@mui/material/styles';
import { COLORS, CHART_COLORS } from '../../theme/theme';

export default function AdminHospitalsPage() {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/hospitals/comparison').then(r => { setHospitals(r.data); setLoading(false); });
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;

  const barData = hospitals.map(h => ({
    name: h.name.split(' ')[0],
    accuracy: parseFloat((h.accuracy * 100).toFixed(1)),
    patients: h.total_patients,
    predictions: h.total_predictions,
  }));

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">NETWORK</Typography>
        <Typography variant="h4" fontWeight={800}>Hospital Overview</Typography>
        <Typography color="text.secondary">Performance comparison across all {hospitals.length} federated hospitals</Typography>
      </Box>

      {/* Bar chart */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Accuracy Comparison</Typography>
          <Box sx={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(COLORS.cyan, 0.05)} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis domain={[70, 100]} tickFormatter={v => `${v}%`} tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip formatter={v => [`${v}%`, 'Accuracy']} contentStyle={{ backgroundColor: COLORS.navyLight, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 8 }} />
                <Bar dataKey="accuracy" fill={COLORS.cyan} radius={[4, 4, 0, 0]}
                  label={{ position: 'top', fill: COLORS.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono', formatter: v => `${v}%` }} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Hospital cards grid */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {hospitals.map((h, i) => (
          <Grid item xs={12} sm={6} md={3} key={h.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Avatar sx={{ width: 40, height: 40, bgcolor: alpha(CHART_COLORS[i % CHART_COLORS.length], 0.15), color: CHART_COLORS[i % CHART_COLORS.length], fontSize: '0.7rem', fontWeight: 700 }}>
                    {h.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{h.name}</Typography>
                    <Typography variant="caption" color="text.secondary">{h.city}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Accuracy</Typography>
                  <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: COLORS.cyan, fontWeight: 600 }}>{(h.accuracy * 100).toFixed(1)}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={h.accuracy * 100} sx={{ mb: 2, height: 5 }} />
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{h.total_patients}</Typography>
                    <Typography variant="caption" color="text.secondary">Patients</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{h.total_predictions}</Typography>
                    <Typography variant="caption" color="text.secondary">Predictions</Typography>
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700}>{h.total_rounds}</Typography>
                    <Typography variant="caption" color="text.secondary">Rounds</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Full table */}
      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Detailed Hospital Statistics</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>#</TableCell>
                <TableCell>Hospital</TableCell>
                <TableCell>City</TableCell>
                <TableCell>Accuracy</TableCell>
                <TableCell>Patients</TableCell>
                <TableCell>Predictions</TableCell>
                <TableCell>FL Rounds</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...hospitals].sort((a, b) => b.accuracy - a.accuracy).map((h, i) => (
                <TableRow key={h.id} sx={{ '&:hover': { bgcolor: alpha(COLORS.cyan, 0.04) } }}>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: i < 3 ? COLORS.amber : COLORS.textMuted, fontWeight: 700 }}>#{i + 1}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{h.name}</Typography></TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{h.city}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: COLORS.green, fontWeight: 600 }}>{(h.accuracy * 100).toFixed(1)}%</Typography>
                      <LinearProgress variant="determinate" value={h.accuracy * 100} sx={{ height: 4, width: 60 }} />
                    </Box>
                  </TableCell>
                  <TableCell>{h.total_patients}</TableCell>
                  <TableCell>{h.total_predictions}</TableCell>
                  <TableCell><Chip label={h.total_rounds} size="small" sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.7rem' }} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}