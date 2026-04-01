import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Grid, Card, CardContent, Typography, Button,
  Slider, Select, MenuItem, FormControl, InputLabel, Chip, CircularProgress,
  Alert, Divider, LinearProgress, Tabs, Tab, Paper, Tooltip
} from "@mui/material";
import { Psychology, Favorite, Warning, CheckCircle, ThumbUp, ThumbDown, Info } from "@mui/icons-material";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, Cell } from "recharts";
import { createPrediction, submitFeedback, clearCurrent } from "../../store/slices/predictionSlice";
import { alpha } from "@mui/material/styles";
import { COLORS, RISK_COLORS, CHART_COLORS } from "../../theme/theme";
import api from "../../services/api";
import { useSnackbar } from "notistack";

const RISK_CONFIG = {
  low: { color: COLORS.green, icon: <CheckCircle />, label: "Low Risk", bg: alpha(COLORS.green, 0.1) },
  medium: { color: COLORS.amber, icon: <Warning />, label: "Medium Risk", bg: alpha(COLORS.amber, 0.1) },
  high: { color: "#FF6600", icon: <Warning />, label: "High Risk", bg: alpha("#FF6600", 0.1) },
  critical: { color: COLORS.red, icon: <Warning />, label: "CRITICAL RISK", bg: alpha(COLORS.red, 0.1) },
};

const FIELD_INFO = {
  age: {
    label: "Age",
    min: 20, max: 90, unit: "years", step: 1,
    tip: "Patient age in years. CVD risk increases significantly after age 45 for men and 55 for women.",
    suggestion: "Enter the patient exact age. If unknown, estimate from records."
  },
  trestbps: {
    label: "Resting Blood Pressure",
    min: 80, max: 220, unit: "mmHg", step: 1,
    tip: "Blood pressure measured at rest. Normal is below 120 mmHg. Above 140 mmHg is hypertension.",
    suggestion: "Use the most recent BP reading taken at rest. Normal value: 90–120 mmHg."
  },
  chol: {
    label: "Cholesterol",
    min: 100, max: 600, unit: "mg/dL", step: 1,
    tip: "Serum cholesterol level. Above 240 mg/dL is considered high and increases heart disease risk.",
    suggestion: "Use fasting lipid panel result. Normal range: 150–200 mg/dL."
  },
  thalach: {
    label: "Max Heart Rate Achieved",
    min: 60, max: 220, unit: "bpm", step: 1,
    tip: "Maximum heart rate during stress/exercise test. Lower max HR can indicate poor cardiac function.",
    suggestion: "Use result from treadmill stress test. If unavailable, estimate: 220 minus patient age."
  },
  oldpeak: {
    label: "ST Depression",
    min: 0, max: 7, unit: "", step: 0.1,
    tip: "ST segment depression on ECG during exercise vs rest. Higher values indicate more cardiac stress.",
    suggestion: "Read from ECG stress test report. If no test done, use 0. Normal is 0–1."
  },
};

const CATEGORICAL_INFO = {
  sex: { tip: "Biological sex of the patient. Males have higher CVD risk at younger ages." },
  cp: { tip: "Type of chest pain. Typical angina (0) is most associated with heart disease. Asymptomatic (3) can still indicate silent CVD." },
  exang: { tip: "Does the patient experience chest pain or angina during physical exercise? Indicates reduced blood flow under stress." },
  ca: { tip: "Number of major blood vessels (0–3) visible on fluoroscopy scan. More blocked vessels = higher risk." },
  thal: { tip: "Thalassemia blood disorder type. Reversible defect (2) is most associated with coronary artery disease." },
  fbs: { tip: "Is fasting blood sugar above 120 mg/dL? Elevated fasting glucose is a diabetes marker and CVD risk factor." },
};

function FieldLabel({ label, tip, suggestion }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Tooltip
        arrow
        placement="right"
        title={
          <Box sx={{ p: 0.5 }}>
            <Typography variant="caption" sx={{ display: "block", fontWeight: 600, mb: 0.5 }}>{tip}</Typography>
            {suggestion && (
              <Typography variant="caption" sx={{ display: "block", color: COLORS.cyan, fontStyle: "italic" }}>
                💡 {suggestion}
              </Typography>
            )}
          </Box>
        }
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: "#0A1628",
              border: `1px solid ${alpha(COLORS.cyan, 0.3)}`,
              borderRadius: 2,
              maxWidth: 280,
              p: 1.5,
            }
          }
        }}
      >
        <Info sx={{ fontSize: 13, color: COLORS.textMuted, cursor: "help", "&:hover": { color: COLORS.cyan } }} />
      </Tooltip>
    </Box>
  );
}

export default function HospitalPredictionPage() {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { current, loading, error } = useSelector(s => s.predictions);
  const { hospital_id } = useSelector(s => s.auth);
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [tab, setTab] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [features, setFeatures] = useState({
    age: 55, sex: 1, cp: 0, trestbps: 130, chol: 250, fbs: 0,
    restecg: 1, thalach: 150, exang: 0, oldpeak: 1.0, slope: 1, ca: 1, thal: 2
  });

  useEffect(() => {
    if (hospital_id) {
      api.get(`/hospitals/${hospital_id}/patients`).then(r => setPatients(r.data)).catch(() => {});
    }
    return () => dispatch(clearCurrent());
  }, [hospital_id]);

  const handlePredict = () => {
    if (!selectedPatient) { enqueueSnackbar("Please select a patient first", { variant: "warning" }); return; }
    const patient = patients.find(p => p.id === selectedPatient);
    dispatch(createPrediction({ patient_id: patient.patient_id, features }));
    setFeedbackSubmitted(false);
    setFeedback("");
  };

  const handleFeedback = (approved) => {
    if (!current) return;
    dispatch(submitFeedback({ id: current.id, feedback, approved }));
    setFeedbackSubmitted(true);
    enqueueSnackbar("Feedback submitted — model will retrain!", { variant: "success" });
  };

  const shapeData = current
    ? Object.entries(current.shap_values || {}).map(([k, v]) => ({
        name: k, value: Math.abs(v), direction: v > 0 ? "risk" : "protective"
      })).sort((a, b) => b.value - a.value).slice(0, 10)
    : [];

  const riskConf = current ? RISK_CONFIG[current.risk_level] || RISK_CONFIG.medium : null;

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="overline" color="primary">AI PREDICTION</Typography>
        <Typography variant="h4" fontWeight={800}>CVD Risk Assessment</Typography>
        <Typography color="text.secondary">
          Hover over the <Info sx={{ fontSize: 13, verticalAlign: "middle", color: COLORS.cyan }} /> icon next to each field for guidance
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>Patient Data Input</Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Select Patient</InputLabel>
                <Select value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} label="Select Patient">
                  {patients.map(p => (
                    <MenuItem key={p.id} value={p.id}>{p.name} · {p.patient_id} · Age {p.age}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Clinical Parameters</Typography>

              <Grid container spacing={2}>
                {Object.entries(FIELD_INFO).map(([key, info]) => (
                  <Grid item xs={12} key={key}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                      <FieldLabel label={info.label} tip={info.tip} suggestion={info.suggestion} />
                      <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", color: COLORS.cyan, fontWeight: 600 }}>
                        {features[key]}{info.unit}
                      </Typography>
                    </Box>
                    <Slider value={features[key]} min={info.min} max={info.max} step={info.step}
                      onChange={(_, v) => setFeatures(f => ({ ...f, [key]: v }))}
                      sx={{ color: COLORS.cyan }} />
                  </Grid>
                ))}

                <Grid item xs={6}>
                  <FieldLabel label="Sex" tip={CATEGORICAL_INFO.sex.tip} />
                  <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                    <Select value={features.sex} onChange={e => setFeatures(f => ({ ...f, sex: e.target.value }))}>
                      <MenuItem value={0}>Female</MenuItem>
                      <MenuItem value={1}>Male</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FieldLabel label="Chest Pain Type" tip={CATEGORICAL_INFO.cp.tip} />
                  <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                    <Select value={features.cp} onChange={e => setFeatures(f => ({ ...f, cp: e.target.value }))}>
                      <MenuItem value={0}>Typical Angina</MenuItem>
                      <MenuItem value={1}>Atypical Angina</MenuItem>
                      <MenuItem value={2}>Non-anginal Pain</MenuItem>
                      <MenuItem value={3}>Asymptomatic</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FieldLabel label="Exercise Angina" tip={CATEGORICAL_INFO.exang.tip} />
                  <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                    <Select value={features.exang} onChange={e => setFeatures(f => ({ ...f, exang: e.target.value }))}>
                      <MenuItem value={0}>No</MenuItem>
                      <MenuItem value={1}>Yes</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FieldLabel label="Major Vessels (CA)" tip={CATEGORICAL_INFO.ca.tip} />
                  <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                    <Select value={features.ca} onChange={e => setFeatures(f => ({ ...f, ca: e.target.value }))}>
                      {[0,1,2,3].map(v => <MenuItem key={v} value={v}>{v} vessel{v !== 1 ? "s" : ""}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FieldLabel label="Thalassemia" tip={CATEGORICAL_INFO.thal.tip} />
                  <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                    <Select value={features.thal} onChange={e => setFeatures(f => ({ ...f, thal: e.target.value }))}>
                      <MenuItem value={0}>Normal</MenuItem>
                      <MenuItem value={1}>Fixed Defect</MenuItem>
                      <MenuItem value={2}>Reversible Defect</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={6}>
                  <FieldLabel label="Fasting Blood Sugar" tip={CATEGORICAL_INFO.fbs.tip} />
                  <FormControl fullWidth size="small" sx={{ mt: 0.5 }}>
                    <Select value={features.fbs} onChange={e => setFeatures(f => ({ ...f, fbs: e.target.value }))}>
                      <MenuItem value={0}>Below 120 mg/dL</MenuItem>
                      <MenuItem value={1}>Above 120 mg/dL</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}

              <Button fullWidth variant="contained" size="large"
                startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <Psychology />}
                onClick={handlePredict} disabled={loading} sx={{ mt: 3 }}>
                {loading ? "Analyzing..." : "Run CVD Prediction"}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={7}>
          {!current && !loading && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, opacity: 0.4 }}>
              <Favorite sx={{ fontSize: 80, color: COLORS.textMuted, mb: 2 }} />
              <Typography color="text.secondary">Select a patient and run prediction to see results</Typography>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400 }}>
              <CircularProgress size={60} color="primary" />
              <Typography sx={{ mt: 2, color: COLORS.textMuted }}>Running ensemble models and SHAP analysis...</Typography>
            </Box>
          )}

          {current && (
            <Box>
              <Card sx={{ mb: 2.5, background: riskConf?.bg, border: `1px solid ${riskConf?.color}40` }}>
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                      <Box sx={{ color: riskConf?.color }}>{riskConf?.icon}</Box>
                      <Box>
                        <Typography variant="h5" fontWeight={800} sx={{ color: riskConf?.color }}>{riskConf?.label}</Typography>
                        <Typography variant="body2" color="text.secondary">{current.cvd_type}</Typography>
                      </Box>
                    </Box>
                    <Box sx={{ textAlign: "right" }}>
                      <Typography variant="h3" fontWeight={800} sx={{ color: riskConf?.color, lineHeight: 1 }}>
                        {(current.cvd_probability * 100).toFixed(1)}%
                      </Typography>
                      <Typography variant="caption" color="text.secondary">CVD Probability</Typography>
                    </Box>
                  </Box>
                  <LinearProgress variant="determinate" value={current.cvd_probability * 100}
                    sx={{ mt: 2, height: 8, borderRadius: 4,
                      bgcolor: alpha(riskConf?.color, 0.15),
                      "& .MuiLinearProgress-bar": { bgcolor: riskConf?.color, borderRadius: 4 }
                    }} />
                </CardContent>
              </Card>

              <Card>
               <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
                  <Tabs 
                    value={tab} 
                    onChange={(_, v) => setTab(v)}
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab label="Scores" />
                    <Tab label="SHAP" />
                    <Tab label="Explanation" />
                    <Tab label="Feedback" />
                  </Tabs>
                </Box>
                <CardContent>
                  {tab === 0 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Individual Model CVD Probability Scores</Typography>
                      {Object.entries(current.ensemble_scores || {}).map(([model, score], i) => (
                        <Box key={model} sx={{ mb: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", fontWeight: 600, textTransform: "uppercase" }}>{model}</Typography>
                            <Typography variant="caption" sx={{ fontFamily: "JetBrains Mono", color: CHART_COLORS[i] }}>{(score * 100).toFixed(1)}%</Typography>
                          </Box>
                          <LinearProgress variant="determinate" value={score * 100}
                            sx={{ height: 8, borderRadius: 4,
                              bgcolor: alpha(CHART_COLORS[i], 0.1),
                              "& .MuiLinearProgress-bar": { bgcolor: CHART_COLORS[i], borderRadius: 4 }
                            }} />
                        </Box>
                      ))}
                    </Box>
                  )}

                  {tab === 1 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>SHAP Feature Importance — Red = Risk Factor, Green = Protective</Typography>
                      <Box sx={{ height: 280 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={shapeData} layout="vertical" barSize={14}>
                            <XAxis type="number" tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                            <YAxis dataKey="name" type="category" width={70} tick={{ fill: COLORS.textMuted, fontSize: 10 }} />
                            <RTooltip />
                            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                              {shapeData.map((d, i) => <Cell key={i} fill={d.direction === "risk" ? COLORS.red : COLORS.green} />)}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </Box>
                      <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
                        <Chip size="small" sx={{ bgcolor: alpha(COLORS.red, 0.15), color: COLORS.red }} label="Risk Factor" />
                        <Chip size="small" sx={{ bgcolor: alpha(COLORS.green, 0.15), color: COLORS.green }} label="Protective Factor" />
                      </Box>
                    </Box>
                  )}

                  {tab === 2 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>AI-Generated Clinical Explanation (Groq LLM + SHAP)</Typography>
                      <Paper sx={{ p: 2.5, bgcolor: alpha(COLORS.navyLight, 0.8), borderRadius: 2 }}>
                        <Typography variant="body2" sx={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}>
                          {current.llm_explanation}
                        </Typography>
                      </Paper>
                    </Box>
                  )}

                  {tab === 3 && (
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>Doctor Review and Feedback (Human-in-the-Loop)</Typography>
                      {feedbackSubmitted ? (
                        <Alert severity="success" icon={<CheckCircle />}>
                          Feedback recorded! Model will retrain using this data via continuous learning.
                        </Alert>
                      ) : (
                        <>
                          <Alert severity="info" sx={{ mb: 2 }}>
                            Review the AI prediction above. Approve if correct, or reject and add notes if the diagnosis needs correction. Your feedback retrains the model.
                          </Alert>
                          <Box component="textarea"
                            value={feedback}
                            onChange={e => setFeedback(e.target.value)}
                            placeholder="Add your clinical observations, corrections, or notes about this prediction..."
                            style={{
                              width: "100%", minHeight: 100, padding: 12,
                              background: alpha(COLORS.navyLight, 0.8),
                              border: `1px solid ${alpha(COLORS.cyan, 0.2)}`,
                              borderRadius: 8, color: "white", fontFamily: "Sora, sans-serif",
                              fontSize: 14, resize: "vertical", outline: "none", marginBottom: 12
                            }}
                          />
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Button variant="contained" color="success" startIcon={<ThumbUp />} onClick={() => handleFeedback(true)} fullWidth>
                              Approve Prediction
                            </Button>
                            <Button variant="outlined" color="error" startIcon={<ThumbDown />} onClick={() => handleFeedback(false)} fullWidth>
                              Reject / Correct
                            </Button>
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", textAlign: "center" }}>
                            Your feedback triggers continuous learning — the model improves with every review!
                          </Typography>
                        </>
                      )}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          )}
        </Grid>
      </Grid>
    </Box>
  );
}
