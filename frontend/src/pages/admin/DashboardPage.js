import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pendingCount={stats?.new_reports || 0}>
      <h1>Аналитика</h1>

      {/* KPI Виджеты */}
      {stats && (
        <div className="kpi-grid">
          <div className="kpi-card kpi-total">
            <div className="kpi-label">Всего обращений</div>
            <div className="kpi-value">{stats.total_reports}</div>
          </div>
          <div className="kpi-card kpi-new">
            <div className="kpi-label">Новых</div>
            <div className="kpi-value">{stats.new_reports}</div>
          </div>
          <div className="kpi-card kpi-confirmed">
            <div className="kpi-label">Верифицировано</div>
            <div className="kpi-value">{stats.confirmed_reports}</div>
          </div>
          <div className="kpi-card kpi-rejected">
            <div className="kpi-label">Отклонено</div>
            <div className="kpi-value">{stats.rejected_reports}</div>
          </div>
        </div>
      )}

      {/* Заглушка для графиков */}
      <div className="dashboard-placeholder">
        <div className="placeholder-card">
          <h3>📈 Динамика обращений</h3>
          <p>Здесь будет линейный график с динамикой обращений по дням</p>
        </div>
        <div className="placeholder-card">
          <h3>📊 Распределение по типам</h3>
          <p>Здесь будет круговой график распределения обращений по категориям</p>
        </div>
        <div className="placeholder-card">
          <h3>🗺️ Обращения по районам</h3>
          <p>Здесь будет столбчатый график по районам города</p>
        </div>
        <div className="placeholder-card">
          <h3>📍 Карта "Живые сигналы"</h3>
          <p>Здесь будет мини-карта 2GIS с pending точками</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;