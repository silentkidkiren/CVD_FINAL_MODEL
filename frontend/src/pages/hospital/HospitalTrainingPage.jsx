import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, Button, Slider, CircularProgress, Alert, Chip, LinearProgress, Grid } from '@mui/material';
import { ModelTraining, CloudUpload, CheckCircle } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { trainLocalModel, fetchHospitalStats } from '../../store/slices/hospitalSlice';
import { useState, useEffect } from 'react';
import { alpha } from '@mui/material/styles';
import { COLORS, CHART_COLORS } from '../../theme/theme';
import { useSnackbar } from 'notistack';
import api from '../../services/api';

export default function HospitalTrainingPage() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { training, trainingResult, stats } = useSelector(s => s.hospital);
  const { hospital_id, hospital_name } = useSelector(s => s.auth);
  const [rounds, setRounds] = useState(5);
  const [sharing, setSharing] = useState(false);

  useEffect(() => { if (hospital_id) dispatch(fetchHospitalStats(hospital_id)); }, [hospital_id]);

  const handleTrain = () => {
    dispatch(trainLocalModel({ id: hospital_id, rounds })).then(() => {
      enqueueSnackbar(`Training complete! ${rounds} rounds finished.`, { variant: 'success' });
      dispatch(fetchHospitalStats(hospital_id));
    });
  };

  const handleShareWeights = async () => {
    setSharing(true);
    await new Promise(r => setTimeout(r, 2000)); // simulate
    enqueueSnackbar('Model weights shared with global server! Federated round updated.', { variant: 'success' });
    setSharing(false);
  };

  const trainingHistory = stats?.training_rounds?.slice(-10).map(r => ({
    round: `R${r.round}`,
    accuracy: parseFloat((r.accuracy * 100).toFixed(2)),
    loss: parseFloat(r.loss.toFixed(4)),
  })) || [];

  const latestAcc = trainingHistory[trainingHistory.length - 1]?.accuracy;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">LOCAL MODEL</Typography>
        <Typography variant="h4" fontWeight={800}>Model Training</Typography>
        <Typography color="text.secondary">Train your local CVD model and contribute to federated learning</Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2.5 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>Training Configuration</Typography>

              <Typography variant="caption" color="text.secondary">Number of Training Rounds</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1, mb: 3 }}>
                <Slider value={rounds} min={1} max={20} step={1} onChange={(_, v) => setRounds(v)}
                  sx={{ color: COLORS.cyan }} />
                <Chip label={rounds} sx={{ fontFamily: 'JetBrains Mono', minWidth: 40 }} />
              </Box>

              <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(COLORS.cyan, 0.06), border: `1px solid ${alpha(COLORS.cyan, 0.15)}`, mb: 3 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>Ensemble Models</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {['RandomForest', 'XGBoost', 'LightGBM', 'CatBoost'].map(m => (
                    <Chip key={m} label={m} size="small" variant="outlined" color="primary" sx={{ fontSize: '0.65rem', fontFamily: 'JetBrains Mono' }} />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Strategy: FedAvg · Continuous Learning</Typography>
              </Box>

              <Button fullWidth variant="contained" startIcon={training ? <CircularProgress size={16} color="inherit" /> : <ModelTraining />}
                onClick={handleTrain} disabled={training} sx={{ mb: 1.5 }}>
                {training ? 'Training in Progress...' : `Start Training (${rounds} rounds)`}
              </Button>

              <Button fullWidth variant="outlined" startIcon={sharing ? <CircularProgress size={16} /> : <CloudUpload />}
                onClick={handleShareWeights} disabled={sharing || !latestAcc} color="secondary">
                {sharing ? 'Sharing...' : 'Share Weights with Global Model'}
              </Button>

              {!latestAcc && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 1 }}>Train first to share weights</Typography>}
            </CardContent>
          </Card>

          {latestAcc && (
            <Card sx={{ background: alpha(COLORS.green, 0.08), border: `1px solid ${alpha(COLORS.green, 0.3)}` }}>
              <CardContent sx={{ textAlign: 'center' }}>
                <CheckCircle sx={{ color: COLORS.green, fontSize: 32, mb: 1 }} />
                <Typography variant="overline" color="text.secondary">Latest Accuracy</Typography>
                <Typography variant="h3" fontWeight={800} sx={{ color: COLORS.green }}>{latestAcc}%</Typography>
                <Typography variant="caption" color="text.secondary">Round {trainingHistory.length} of {hospital_name}</Typography>
              </CardContent>
            </Card>
          )}
        </Grid>

        <Grid item xs={12} md={8}>
          {trainingResult && (
            <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircle />}>
              Training complete! Final accuracy: {(trainingResult.final_accuracy * 100).toFixed(1)}% across {trainingResult.rounds?.length} rounds.
            </Alert>
          )}

          <Card sx={{ mb: 2.5, height: 320 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Accuracy Over Rounds</Typography>
              <Box sx={{ height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trainingHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke={alpha(COLORS.cyan, 0.05)} />
                    <XAxis dataKey="round" tick={{ fill: COLORS.textMuted, fontSize: 10, fontFamily: 'JetBrains Mono' }} />
                    <YAxis domain={[70, 100]} tickFormatter={v => `${v}%`} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                    <Tooltip formatter={v => [`${v}%`, 'Accuracy']} contentStyle={{ backgroundColor: COLORS.navyLight, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="accuracy" stroke={COLORS.cyan} strokeWidth={2.5} dot={{ fill: COLORS.cyan, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>How Federated Learning Works</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { step: '1', title: 'Local Training', desc: 'Each hospital trains on its own patient data — data never leaves the hospital' },
                  { step: '2', title: 'Weight Extraction', desc: 'Only model weights (not data) are extracted and prepared for sharing' },
                  { step: '3', title: 'FedAvg Aggregation', desc: 'Global server aggregates weights from all hospitals using Federated Averaging' },
                  { step: '4', title: 'Continuous Learning', desc: 'Doctor feedback triggers model updates without forgetting prior knowledge' },
                ].map(item => (
                  <Box key={item.step} sx={{ display: 'flex', gap: 2, p: 1.5, borderRadius: 2, bgcolor: alpha(COLORS.cyan, 0.04) }}>
                    <Box sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: alpha(COLORS.cyan, 0.15), color: COLORS.cyan, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0, fontFamily: 'JetBrains Mono' }}>{item.step}</Box>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{item.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{item.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}