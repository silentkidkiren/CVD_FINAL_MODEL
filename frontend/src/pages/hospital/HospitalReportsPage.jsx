import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import {
  Box, Card, CardContent, Typography, Table, TableBody, TableCell,
  TableHead, TableRow, Chip, Button, CircularProgress, Dialog,
  DialogTitle, DialogContent, DialogActions, Divider, LinearProgress, Grid
} from "@mui/material";
import { Assessment, Close, CheckCircle, Cancel, HourglassEmpty } from "@mui/icons-material";
import api from "../../services/api";
import { alpha } from "@mui/material/styles";
import { COLORS, RISK_COLORS } from "../../theme/theme";

const FEATURE_LABELS = {
  age: "Age", sex: "Sex", cp: "Chest Pain Type", trestbps: "Resting BP (mmHg)",
  chol: "Cholesterol (mg/dL)", fbs: "Fasting Blood Sugar", restecg: "Resting ECG",
  thalach: "Max Heart Rate (bpm)", exang: "Exercise Angina", oldpeak: "ST Depression",
  slope: "ST Slope", ca: "Major Vessels", thal: "Thalassemia"
};

export default function HospitalReportsPage() {
  const { hospital_id } = useSelector(s => s.auth);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    if (hospital_id) {
      api.get(`/predictions/hospital/${hospital_id}?limit=50`).then(r => {
        setPredictions(r.data);
        setLoading(false);
      });
    }
  }, [hospital_id]);

  const openReport = async (pred) => {
    try {
      const allPreds = await api.get(`/predictions/hospital/${hospital_id}?limit=100`);
      const full = allPreds.data.find(p => p.id === pred.id);
      setSelected(full || pred);
    } catch {
      setSelected(pred);
    }
  };

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

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {[
          { label: "TOTAL PREDICTIONS", value: predictions.length, color: COLORS.cyan },
          { label: "DOCTOR APPROVED", value: approvedCount, color: COLORS.green },
          { label: "REJECTED / CORRECTED", value: rejectedCount, color: COLORS.red },
          { label: "PENDING REVIEW", value: pendingCount, color: COLORS.amber },
        ].map(s => (
          <Card key={s.label} sx={{ flex: 1 }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="overline" color="text.secondary" sx={{ fontSize: "0.6rem" }}>{s.label}</Typography>
              <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}><CircularProgress /></Box>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>PATIENT</TableCell>
                  <TableCell>CVD TYPE</TableCell>
                  <TableCell>PROBABILITY</TableCell>
                  <TableCell>RISK LEVEL</TableCell>
                  <TableCell>DOCTOR REVIEW</TableCell>
                  <TableCell>DATE</TableCell>
                  <TableCell>REPORT</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {predictions.map(p => (
                  <TableRow key={p.id} sx={{ "&:hover": { bgcolor: alpha(COLORS.cyan, 0.04) } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.patient_name}</Typography>
                      <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", color: COLORS.textMuted }}>{p.patient_id}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption">{p.cvd_type}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", fontWeight: 600, color: COLORS.cyan }}>
                        {(p.cvd_probability * 100).toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.risk_level?.toUpperCase()} size="small"
                        sx={{ bgcolor: alpha(RISK_COLORS[p.risk_level] || COLORS.textMuted, 0.15), color: RISK_COLORS[p.risk_level] || COLORS.textMuted, fontFamily: "JetBrains Mono", fontSize: "0.65rem" }} />
                    </TableCell>
                    <TableCell>
                      {p.doctor_approved === true && <Chip label="Approved" size="small" color="success" icon={<CheckCircle sx={{ fontSize: "14px !important" }} />} sx={{ fontSize: "0.65rem" }} />}
                      {p.doctor_approved === false && <Chip label="Rejected" size="small" color="error" icon={<Cancel sx={{ fontSize: "14px !important" }} />} sx={{ fontSize: "0.65rem" }} />}
                      {p.doctor_approved === null && <Chip label="Pending" size="small" icon={<HourglassEmpty sx={{ fontSize: "14px !important" }} />} sx={{ fontSize: "0.65rem" }} />}
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{new Date(p.created_at).toLocaleDateString()}</Typography></TableCell>
                    <TableCell>
                      <Button size="small" startIcon={<Assessment sx={{ fontSize: 14 }} />} variant="outlined"
                        onClick={() => openReport(p)} sx={{ fontSize: "0.7rem", py: 0.3 }}>
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

      {/* Report Modal */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="md" fullWidth
        PaperProps={{ sx: { bgcolor: COLORS.navyMid, border: `1px solid ${alpha(COLORS.cyan, 0.2)}`, borderRadius: 3 } }}>
        {selected && (
          <>
            <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Box>
                <Typography variant="h6" fontWeight={700}>Prediction Report</Typography>
                <Typography variant="caption" color="text.secondary">{selected.patient_name} · {selected.patient_id}</Typography>
              </Box>
              <Button onClick={() => setSelected(null)} size="small" sx={{ minWidth: 0 }}><Close /></Button>
            </DialogTitle>
            <DialogContent>
              {/* Risk banner */}
              <Box sx={{
                p: 2, mb: 3, borderRadius: 2,
                bgcolor: alpha(RISK_COLORS[selected.risk_level] || COLORS.cyan, 0.1),
                border: `1px solid ${alpha(RISK_COLORS[selected.risk_level] || COLORS.cyan, 0.3)}`,
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <Box>
                  <Typography variant="h6" fontWeight={700} sx={{ color: RISK_COLORS[selected.risk_level] }}>
                    {selected.risk_level?.toUpperCase()} RISK — {selected.cvd_type}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(selected.created_at).toLocaleString()}
                  </Typography>
                </Box>
                <Typography variant="h3" fontWeight={800} sx={{ color: RISK_COLORS[selected.risk_level] }}>
                  {(selected.cvd_probability * 100).toFixed(1)}%
                </Typography>
              </Box>

              {/* Ensemble scores */}
              {selected.ensemble_scores && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Ensemble Model Scores</Typography>
                  <Grid container spacing={1}>
                    {Object.entries(selected.ensemble_scores).map(([model, score]) => (
                      <Grid item xs={6} key={model}>
                        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha(COLORS.cyan, 0.06), border: `1px solid ${alpha(COLORS.cyan, 0.1)}` }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", textTransform: "uppercase", fontWeight: 600 }}>{model}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", color: COLORS.cyan }}>{(score * 100).toFixed(1)}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={score * 100} sx={{ height: 4, borderRadius: 2 }} />
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}

              <Divider sx={{ mb: 3, borderColor: alpha(COLORS.cyan, 0.1) }} />

              {/* AI Explanation */}
              {selected.llm_explanation && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>AI Clinical Explanation</Typography>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(COLORS.navyLight, 0.8), border: `1px solid ${alpha(COLORS.cyan, 0.1)}` }}>
                    <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                      {selected.llm_explanation}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Doctor feedback */}
              {selected.doctor_feedback && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Doctor Feedback</Typography>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: alpha(selected.doctor_approved ? COLORS.green : COLORS.red, 0.08), border: `1px solid ${alpha(selected.doctor_approved ? COLORS.green : COLORS.red, 0.2)}` }}>
                    <Typography variant="body2">{selected.doctor_feedback}</Typography>
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setSelected(null)} variant="outlined">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
