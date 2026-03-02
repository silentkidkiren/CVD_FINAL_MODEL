import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/auth/LoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import AdminFederatedPage from './pages/admin/AdminFederatedPage';
import AdminHospitalsPage from './pages/admin/AdminHospitalsPage';
import AdminModelsPage from './pages/admin/AdminModelsPage';
import HospitalPredictionPage from './pages/hospital/HospitalPredictionPage';
import HospitalPatientsPage from './pages/hospital/HospitalPatientsPage';
import HospitalTrainingPage from './pages/hospital/HospitalTrainingPage';
import HospitalReportsPage from './pages/hospital/HospitalReportsPage';
import AdminLayout from './components/admin/AdminLayout';
import HospitalLayout from './components/hospital/HospitalLayout';

function ProtectedRoute({ children, role }) {
  const { token, role: userRole } = useSelector(s => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (role && userRole !== role) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  const { token, role } = useSelector(s => s.auth);

  return (
    <Routes>
      <Route path="/login" element={
        token ? <Navigate to={role === 'admin' ? '/admin' : '/hospital'} /> : <LoginPage />
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="federated" element={<AdminFederatedPage />} />
        <Route path="hospitals" element={<AdminHospitalsPage />} />
        <Route path="models" element={<AdminModelsPage />} />
      </Route>

      {/* Hospital Routes */}
      <Route path="/hospital" element={
        <ProtectedRoute role="hospital"><HospitalLayout /></ProtectedRoute>
      }>
        <Route index element={<HospitalDashboard />} />
        <Route path="predict" element={<HospitalPredictionPage />} />
        <Route path="patients" element={<HospitalPatientsPage />} />
        <Route path="training" element={<HospitalTrainingPage />} />
        <Route path="reports" element={<HospitalReportsPage />} />
      </Route>

      <Route path="/" element={<Navigate to={token ? (role === 'admin' ? '/admin' : '/hospital') : '/login'} />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}