import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Button, Chip,
  Table, TableBody, TableCell, TableHead, TableRow, CircularProgress,
  LinearProgress, Alert
} from '@mui/material';
import { Hub, PlayArrow, CheckCircle, Schedule } from '@mui/icons-material';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../services/api';
import { alpha } from '@mui/material/styles';
import { COLORS, CHART_COLORS } from '../../theme/theme';
import { useSnackbar } from 'notistack';

export default function AdminFederatedPage() {
  const [history, setHistory] = useState([]);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const { enqueueSnackbar } = useSnackbar();

  const fetchHistory = async () => {
    const res = await api.get('/admin/federated/history');
    setHistory(res.data);
  };

  useEffect(() => { fetchHistory(); }, []);

  const runFederated = async () => {
    setRunning(true);
    try {
      const res = await api.post('/admin/federated/run');
      setLastResult(res.data);
      enqueueSnackbar(`Federated Round ${res.data.round_number} completed! Global accuracy: ${(res.data.global_accuracy * 100).toFixed(1)}%`, { variant: 'success' });
      fetchHistory();
    } catch (e) {
      enqueueSnackbar('Federated round failed', { variant: 'error' });
    }
    setRunning(false);
  };

  const chartData = [...history].reverse().map(s => ({
    round: `R${s.round_number}`,
    accuracy: parseFloat((s.global_accuracy * 100).toFixed(2)),
    hospitals: s.participating_hospitals?.length || 0,
  }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="overline" color="primary">FEDERATED LEARNING</Typography>
          <Typography variant="h4" fontWeight={800}>FL Control Center</Typography>
          <Typography color="text.secondary">Coordinate model training across the hospital network</Typography>
        </Box>
        <Button variant="contained" startIcon={running ? <CircularProgress size={16} color="inherit" /> : <PlayArrow />}
          onClick={runFederated} disabled={running} size="large">
          {running ? 'Running FL Round...' : 'Run Federated Round'}
        </Button>
      </Box>

      {lastResult && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setLastResult(null)}>
          Round {lastResult.round_number} completed — Global accuracy: {(lastResult.global_accuracy * 100).toFixed(1)}% across {lastResult.participating_hospitals} hospitals
        </Alert>
      )}

      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="overline" color="text.secondary">Total FL Rounds</Typography>
              <Typography variant="h2" fontWeight={800} sx={{ color: COLORS.cyan }}>{history.length}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="overline" color="text.secondary">Latest Global Accuracy</Typography>
              <Typography variant="h2" fontWeight={800} sx={{ color: COLORS.green }}>
                {history[0] ? `${(history[0].global_accuracy * 100).toFixed(1)}%` : 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="overline" color="text.secondary">Strategy</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: COLORS.amber, mt: 1 }}>FedAvg</Typography>
              <Typography variant="caption" color="text.secondary">Federated Averaging</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Global Model Accuracy Over FL Rounds</Typography>
          <Box sx={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="accGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cyan} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={COLORS.cyan} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(COLORS.cyan, 0.05)} />
                <XAxis dataKey="round" tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <YAxis domain={[70, 100]} tickFormatter={v => `${v}%`} tick={{ fill: COLORS.textMuted, fontSize: 11, fontFamily: 'JetBrains Mono' }} />
                <Tooltip formatter={(v) => [`${v}%`, 'Global Accuracy']} contentStyle={{ backgroundColor: COLORS.navyLight, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 8 }} />
                <Area type="monotone" dataKey="accuracy" stroke={COLORS.cyan} strokeWidth={2.5} fill="url(#accGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Round History</Typography>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Round</TableCell>
                <TableCell>Hospitals</TableCell>
                <TableCell>Global Accuracy</TableCell>
                <TableCell>Strategy</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((s) => (
                <TableRow key={s.id} sx={{ '&:hover': { bgcolor: alpha(COLORS.cyan, 0.04) } }}>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: COLORS.cyan }}>Round #{s.round_number}</Typography></TableCell>
                  <TableCell>{s.participating_hospitals?.length || 0} hospitals</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: COLORS.green }}>
                        {(s.global_accuracy * 100).toFixed(1)}%
                      </Typography>
                      <LinearProgress variant="determinate" value={s.global_accuracy * 100} sx={{ height: 4, width: 60, borderRadius: 2 }} />
                    </Box>
                  </TableCell>
                  <TableCell><Chip label={s.aggregation_strategy} size="small" sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} /></TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" icon={s.status === 'completed' ? <CheckCircle sx={{ fontSize: '14px !important' }} /> : <Schedule sx={{ fontSize: '14px !important' }} />}
                      color={s.status === 'completed' ? 'success' : 'default'} sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{new Date(s.started_at).toLocaleDateString()}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}