import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button, CircularProgress } from '@mui/material';
import { Assessment, Download, CheckCircle, Cancel, HourglassEmpty } from '@mui/icons-material';
import api from '../../services/api';
import { alpha } from '@mui/material/styles';
import { COLORS, RISK_COLORS } from '../../theme/theme';

export default function HospitalReportsPage() {
  const { hospital_id } = useSelector(s => s.auth);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (hospital_id) {
      api.get(`/predictions/hospital/${hospital_id}?limit=50`).then(r => {
        setPredictions(r.data);
        setLoading(false);
      });
    }
  }, [hospital_id]);

  const approvedCount = predictions.filter(p => p.doctor_approved === true).length;
  const rejectedCount = predictions.filter(p => p.doctor_approved === false).length;
  const pendingCount = predictions.filter(p => p.doctor_approved === null).length;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">REPORTS</Typography>
        <Typography variant="h4" fontWeight={800}>Prediction Reports</Typography>
        <Typography color="text.secondary">History of all CVD predictions and doctor reviews</Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        {[
          { label: 'Total Predictions', value: predictions.length, color: COLORS.cyan },
          { label: 'Doctor Approved', value: approvedCount, color: COLORS.green, icon: <CheckCircle sx={{ fontSize: 16 }} /> },
          { label: 'Rejected / Corrected', value: rejectedCount, color: COLORS.red, icon: <Cancel sx={{ fontSize: 16 }} /> },
          { label: 'Pending Review', value: pendingCount, color: COLORS.amber, icon: <HourglassEmpty sx={{ fontSize: 16 }} /> },
        ].map(s => (
          <Card key={s.label} sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary">{s.label}</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {s.icon && <Box sx={{ color: s.color }}>{s.icon}</Box>}
                <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Patient</TableCell>
                  <TableCell>CVD Type</TableCell>
                  <TableCell>Probability</TableCell>
                  <TableCell>Risk Level</TableCell>
                  <TableCell>Doctor Review</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Report</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predictions.map(p => (
                  <TableRow key={p.id} sx={{ '&:hover': { bgcolor: alpha(COLORS.cyan, 0.04) } }}>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{p.patient_name}</Typography>
                        <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: COLORS.textMuted }}>{p.patient_id}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono' }}>{p.cvd_type}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', fontWeight: 600, color: COLORS.cyan }}>
                        {(p.cvd_probability * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.risk_level?.toUpperCase()} size="small"
                        sx={{ bgcolor: alpha(RISK_COLORS[p.risk_level] || COLORS.textMuted, 0.15), color: RISK_COLORS[p.risk_level] || COLORS.textMuted, fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
                    </TableCell>
                    <TableCell>
                      {p.doctor_approved === true && <Chip label="Approved" size="small" color="success" icon={<CheckCircle sx={{ fontSize: '14px !important' }} />} sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />}
                      {p.doctor_approved === false && <Chip label="Rejected" size="small" color="error" icon={<Cancel sx={{ fontSize: '14px !important' }} />} sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />}
                      {p.doctor_approved === null && <Chip label="Pending" size="small" icon={<HourglassEmpty sx={{ fontSize: '14px !important' }} />} sx={{ fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />}
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{new Date(p.created_at).toLocaleDateString()}</Typography></TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<Assessment sx={{ fontSize: 14 }} />} variant="outlined"
                        sx={{ fontSize: '0.7rem', py: 0.3 }}>
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}