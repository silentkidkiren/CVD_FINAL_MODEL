import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const fetchHospitalStats = createAsyncThunk('hospital/stats', async (id) => {
  const res = await api.get(`/hospitals/${id}/stats`);
  return res.data;
});

export const trainLocalModel = createAsyncThunk('hospital/train', async ({ id, rounds }) => {
  const res = await api.post(`/hospitals/${id}/train`, null, { params: { num_rounds: rounds } });
  return res.data;
});

export const fetchPatients = createAsyncThunk('hospital/patients', async (id) => {
  const res = await api.get(`/hospitals/${id}/patients`);
  return res.data;
});

const hospitalSlice = createSlice({
  name: 'hospital',
  initialState: {
    stats: null,
    patients: [],
    training: false,
    trainingResult: null,
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHospitalStats.fulfilled, (state, action) => { state.stats = action.payload; })
      .addCase(trainLocalModel.pending, (state) => { state.training = true; })
      .addCase(trainLocalModel.fulfilled, (state, action) => { state.training = false; state.trainingResult = action.payload; })
      .addCase(trainLocalModel.rejected, (state) => { state.training = false; })
      .addCase(fetchPatients.fulfilled, (state, action) => { state.patients = action.payload; });
  }
});

export default hospitalSlice.reducer;