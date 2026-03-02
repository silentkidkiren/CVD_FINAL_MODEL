import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const createPrediction = createAsyncThunk('predictions/create', async (payload, { rejectWithValue }) => {
  try {
    const res = await api.post('/predictions', payload);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Prediction failed');
  }
});

export const submitFeedback = createAsyncThunk('predictions/feedback', async ({ id, feedback, approved }) => {
  const res = await api.post(`/predictions/${id}/feedback`, {
    prediction_id: id, doctor_feedback: feedback, doctor_approved: approved
  });
  return res.data;
});

export const fetchHospitalPredictions = createAsyncThunk('predictions/fetchHospital', async (hospitalId) => {
  const res = await api.get(`/predictions/hospital/${hospitalId}`);
  return res.data;
});

const predictionSlice = createSlice({
  name: 'predictions',
  initialState: {
    current: null,
    list: [],
    loading: false,
    error: null,
    feedbackLoading: false,
  },
  reducers: {
    clearCurrent: (state) => { state.current = null; },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPrediction.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(createPrediction.fulfilled, (state, action) => {
        state.loading = false; state.current = action.payload;
      })
      .addCase(createPrediction.rejected, (state, action) => {
        state.loading = false; state.error = action.payload;
      })
      .addCase(fetchHospitalPredictions.fulfilled, (state, action) => {
        state.list = action.payload;
      })
      .addCase(submitFeedback.pending, (state) => { state.feedbackLoading = true; })
      .addCase(submitFeedback.fulfilled, (state) => { state.feedbackLoading = false; });
  }
});

export const { clearCurrent, clearError } = predictionSlice.actions;
export default predictionSlice.reducer;