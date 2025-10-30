import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Header from './components/Header';
import MapPage from './pages/MapPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import DashboardPage from './pages/admin/DashboardPage';
import ModerationPage from './pages/admin/ModerationPage';
import ReportsPage from './pages/admin/ReportsPage';
import ReportDetailPage from './pages/admin/ReportDetailPage';
import AdminMapPage from './pages/admin/AdminMapPage';
import AdminNewsPage from './pages/admin/NewsPage';
import PublicNewsPage from './pages/NewsPage';
import PrizesPage from './pages/admin/PrizesPage';
import PrizeRedemptionsPage from './pages/admin/PrizeRedemptionsPage';
import ReportForm from './components/ReportForm';
import AdminLayout from './components/AdminLayout';
import './App.css';

// Компонент для защищенных маршрутов
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

// Компонент для админских маршрутов
const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  return user && user.is_admin ? children : <Navigate to="/" />;
};

function AppContent() {
  const [showReportForm, setShowReportForm] = useState(false);

  const handleReportClick = () => {
    setShowReportForm(true);
  };

  const handleReportSuccess = () => {
    setShowReportForm(false);
    // Можно добавить обновление данных
  };

  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<MapPage onReportClick={handleReportClick} />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/news" element={<PublicNewsPage />} />
        <Route path="/about" element={<div className="container"><h1>О проекте (в разработке)</h1></div>} />
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <ProfilePage />
            </PrivateRoute>
          } 
        />
        {/* Старая админка - редирект на новую */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <Navigate to="/admin/dashboard" replace />
            </AdminRoute>
          } 
        />
        
        {/* Новые роуты админ-панели */}
        <Route 
          path="/admin/dashboard" 
          element={
            <AdminRoute>
              <DashboardPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/moderation" 
          element={
            <AdminRoute>
              <ModerationPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/reports" 
          element={
            <AdminRoute>
              <ReportsPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/reports/:id" 
          element={
            <AdminRoute>
              <ReportDetailPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/map" 
          element={
            <AdminRoute>
              <AdminMapPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/news" 
          element={
            <AdminRoute>
              <AdminNewsPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/prizes" 
          element={
            <AdminRoute>
              <PrizesPage />
            </AdminRoute>
          } 
        />
        <Route 
          path="/admin/prize-redemptions" 
          element={
            <AdminRoute>
              <AdminLayout>
                <PrizeRedemptionsPage />
              </AdminLayout>
            </AdminRoute>
          } 
        />
      </Routes>

      {/* Глобальная форма отчета */}
      {showReportForm && (
        <ReportForm
          onClose={() => setShowReportForm(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;