import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

export const login = createAsyncThunk('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', { email, password });
    const data = res.data;
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('hospital_id', data.hospital_id || '');
    localStorage.setItem('hospital_name', data.hospital_name || '');
    return data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.detail || 'Login failed');
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    hospital_id: localStorage.getItem('hospital_id') ? parseInt(localStorage.getItem('hospital_id')) : null,
    hospital_name: localStorage.getItem('hospital_name'),
    loading: false,
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.token = null;
      state.role = null;
      state.hospital_id = null;
      state.hospital_name = null;
      localStorage.clear();
    },
    clearError: (state) => { state.error = null; }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.access_token;
        state.role = action.payload.role;
        state.hospital_id = action.payload.hospital_id;
        state.hospital_name = action.payload.hospital_name;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;