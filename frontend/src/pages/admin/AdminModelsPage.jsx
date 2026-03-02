import { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Chip, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, LinearProgress } from '@mui/material';
import { Memory, CheckCircle } from '@mui/icons-material';
import api from '../../services/api';
import { alpha } from '@mui/material/styles';
import { COLORS } from '../../theme/theme';

export default function AdminModelsPage() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/models/global').then(r => { setModels(r.data); setLoading(false); });
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', pt: 10 }}><CircularProgress /></Box>;

  const current = models.find(m => m.is_current);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">AI MODELS</Typography>
        <Typography variant="h4" fontWeight={800}>Global Model Registry</Typography>
        <Typography color="text.secondary">Track all federated model versions and their performance</Typography>
      </Box>

      {current && (
        <Card sx={{ mb: 3, border: `1px solid ${alpha(COLORS.green, 0.4)}`, background: `linear-gradient(135deg, ${alpha(COLORS.green, 0.08)}, ${alpha(COLORS.cyan, 0.04)})` }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <CheckCircle sx={{ color: COLORS.green, fontSize: 20 }} />
                  <Typography variant="overline" sx={{ color: COLORS.green }}>CURRENT ACTIVE MODEL</Typography>
                </Box>
                <Typography variant="h5" fontWeight={700}>Global Model {current.version}</Typography>
                <Typography color="text.secondary">Round {current.round_number} · {current.participating_hospitals} hospitals participated</Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h3" fontWeight={800} sx={{ color: COLORS.green }}>{(current.accuracy * 100).toFixed(1)}%</Typography>
                <Typography variant="caption" color="text.secondary">Global Accuracy</Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Version History</Typography>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Round</TableCell>
                <TableCell>Accuracy</TableCell>
                <TableCell>Hospitals</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {models.map((m) => (
                <TableRow key={m.id} sx={{
                  bgcolor: m.is_current ? alpha(COLORS.green, 0.04) : 'transparent',
                  '&:hover': { bgcolor: alpha(COLORS.cyan, 0.04) }
                }}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Memory sx={{ fontSize: 16, color: m.is_current ? COLORS.green : COLORS.textMuted }} />
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 600 }}>{m.version}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono' }}>Round #{m.round_number}</Typography></TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: COLORS.cyan }}>{(m.accuracy * 100).toFixed(1)}%</Typography>
                      <LinearProgress variant="determinate" value={m.accuracy * 100} sx={{ height: 4, width: 70 }} />
                    </Box>
                  </TableCell>
                  <TableCell>{m.participating_hospitals}</TableCell>
                  <TableCell>
                    <Chip label={m.is_current ? 'ACTIVE' : 'ARCHIVED'} size="small" color={m.is_current ? 'success' : 'default'}
                      sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{new Date(m.created_at).toLocaleDateString()}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Box>
  );
}