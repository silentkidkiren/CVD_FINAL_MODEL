import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Box, Card, CardContent, Typography, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Table, TableBody,
  TableCell, TableHead, TableRow, Chip, Grid, FormControl, InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { Add, PersonAdd, Search } from '@mui/icons-material';
import { fetchPatients } from '../../store/slices/hospitalSlice';
import api from '../../services/api';
import { alpha } from '@mui/material/styles';
import { COLORS, RISK_COLORS } from '../../theme/theme';
import { useSnackbar } from 'notistack';

export default function HospitalPatientsPage() {
  const dispatch = useDispatch();
  const { patients } = useSelector(s => s.hospital);
  const { hospital_id } = useSelector(s => s.auth);
  const { enqueueSnackbar } = useSnackbar();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', age: '', gender: 'Male', contact: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (hospital_id) dispatch(fetchPatients(hospital_id)); }, [hospital_id]);

  const filtered = patients.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.patient_id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/hospitals/${hospital_id}/patients`, { ...form, age: parseInt(form.age) });
      dispatch(fetchPatients(hospital_id));
      setOpen(false);
      setForm({ name: '', age: '', gender: 'Male', contact: '' });
      enqueueSnackbar('Patient registered successfully!', { variant: 'success' });
    } catch {
      enqueueSnackbar('Failed to register patient', { variant: 'error' });
    }
    setSaving(false);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', mb: 4 }}>
        <Box>
          <Typography variant="overline" color="primary">PATIENT MANAGEMENT</Typography>
          <Typography variant="h4" fontWeight={800}>Patients</Typography>
          <Typography color="text.secondary">{patients.length} registered patients</Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />} onClick={() => setOpen(true)}>Register Patient</Button>
      </Box>

      <Card>
        <CardContent>
          <TextField fullWidth placeholder="Search by name or patient ID..." value={search}
            onChange={e => setSearch(e.target.value)} size="small" sx={{ mb: 2 }}
            InputProps={{ startAdornment: <Search sx={{ color: COLORS.textMuted, mr: 1 }} /> }} />

          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Patient ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Age</TableCell>
                <TableCell>Gender</TableCell>
                <TableCell>Predictions</TableCell>
                <TableCell>Last Risk</TableCell>
                <TableCell>Registered</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id} sx={{ '&:hover': { bgcolor: alpha(COLORS.cyan, 0.04) } }}>
                  <TableCell><Typography variant="caption" sx={{ fontFamily: 'JetBrains Mono', color: COLORS.cyan }}>{p.patient_id}</Typography></TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{p.name}</Typography></TableCell>
                  <TableCell>{p.age}</TableCell>
                  <TableCell><Chip label={p.gender} size="small" variant="outlined" /></TableCell>
                  <TableCell>{p.total_predictions}</TableCell>
                  <TableCell>
                    {p.last_risk_level ? (
                      <Chip label={p.last_risk_level?.toUpperCase()} size="small"
                        sx={{ bgcolor: alpha(RISK_COLORS[p.last_risk_level] || COLORS.textMuted, 0.15), color: RISK_COLORS[p.last_risk_level] || COLORS.textMuted, fontFamily: 'JetBrains Mono', fontSize: '0.65rem' }} />
                    ) : <Typography variant="caption" color="text.secondary">No data</Typography>}
                  </TableCell>
                  <TableCell><Typography variant="caption" color="text.secondary">{new Date(p.created_at).toLocaleDateString()}</Typography></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: COLORS.navyMid, border: `1px solid ${alpha(COLORS.cyan, 0.2)}` } }}>
        <DialogTitle>Register New Patient</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Full Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth label="Age" type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
            </Grid>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select value={form.gender} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} label="Gender">
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Contact (Optional)" value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name || !form.age}>
            {saving ? <CircularProgress size={18} /> : 'Register Patient'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}