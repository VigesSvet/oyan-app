import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './DashboardPage.css';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [dateAnalytics, setDateAnalytics] = useState([]);
  const [typeAnalytics, setTypeAnalytics] = useState([]);
  const [districtAnalytics, setDistrictAnalytics] = useState([]);
  const [statusAnalytics, setStatusAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // day, week, month

  useEffect(() => {
    fetchAllAnalytics();
  }, [period]);

  const fetchAllAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Загружаем все данные параллельно
      const [statsRes, dateRes, typeRes, districtRes, statusRes] = await Promise.all([
        axios.get('/api/admin/stats', { headers }),
        axios.get(`/api/admin/analytics/by-date?period=${period}`, { headers }),
        axios.get('/api/admin/analytics/by-type', { headers }),
        axios.get('/api/admin/analytics/by-district', { headers }),
        axios.get('/api/admin/analytics/by-status', { headers })
      ]);

      setStats(statsRes.data);
      setDateAnalytics(dateRes.data);
      setTypeAnalytics(typeRes.data);
      setDistrictAnalytics(districtRes.data);
      setStatusAnalytics(statusRes.data);
    } catch (error) {
      console.error('Ошибка загрузки аналитики:', error);
    } finally {
      setLoading(false);
    }
  };

  // Расчет дополнительных метрик
  const calculateMetrics = () => {
    if (!stats) return {};

    const processed = stats.confirmed_reports + stats.rejected_reports;
    const processedPercent = stats.total_reports > 0 
      ? ((processed / stats.total_reports) * 100).toFixed(1)
      : 0;

    const mostPopularCategory = typeAnalytics.length > 0
      ? typeAnalytics.reduce((max, item) => item.value > max.value ? item : max)
      : null;

    const topDistrict = districtAnalytics.length > 0 ? districtAnalytics[0] : null;

    return {
      processedPercent,
      mostPopularCategory,
      topDistrict,
      responseRate: ((stats.confirmed_reports / stats.total_reports) * 100 || 0).toFixed(1)
    };
  };

  const metrics = calculateMetrics();

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pendingCount={stats?.new_reports || 0}>
      <div className="dashboard-container">
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

        {/* Дополнительные метрики */}
        <div className="additional-metrics">
          <div className="metric-card">
            <div className="metric-label">Обработано</div>
            <div className="metric-value">{metrics.processedPercent}%</div>
            <div className="metric-subtitle">от всех обращений</div>
          </div>
          <div className="metric-card">
            <div className="metric-label">Коэффициент верификации</div>
            <div className="metric-value">{metrics.responseRate}%</div>
            <div className="metric-subtitle">верифицировано</div>
          </div>
          {metrics.mostPopularCategory && (
            <div className="metric-card">
              <div className="metric-label">Топ категория</div>
              <div className="metric-value">{metrics.mostPopularCategory.value}</div>
              <div className="metric-subtitle">{metrics.mostPopularCategory.name}</div>
            </div>
          )}
          {metrics.topDistrict && (
            <div className="metric-card">
              <div className="metric-label">Топ район</div>
              <div className="metric-value">{metrics.topDistrict.count}</div>
              <div className="metric-subtitle">{metrics.topDistrict.district}</div>
            </div>
          )}
        </div>

        {/* Фильтр по периодам */}
        <div className="period-filter">
          <button 
            className={`filter-btn ${period === 'day' ? 'active' : ''}`}
            onClick={() => setPeriod('day')}
          >
            День
          </button>
          <button 
            className={`filter-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            Неделя
          </button>
          <button 
            className={`filter-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Месяц
          </button>
        </div>

        {/* Графики */}
        <div className="charts-grid">
          
          {/* График динамики обращений */}
          <div className="chart-card full-width">
            <h3>Динамика обращений</h3>
            {dateAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dateAnalytics} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: '4px'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#6B95B3" 
                    dot={{ fill: '#6B95B3', r: 4 }}
                    activeDot={{ r: 6 }}
                    strokeWidth={2}
                    name="Обращения"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Нет данных за выбранный период</p>
            )}
          </div>

          {/* Круговая диаграмма по категориям */}
          <div className="chart-card">
            <h3>Распределение по категориям</h3>
            {typeAnalytics.length > 0 && typeAnalytics.some(t => t.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={typeAnalytics.filter(t => t.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {typeAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} обращений`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Нет данных</p>
            )}
            <div className="chart-legend">
              {typeAnalytics.map((item, idx) => (
                <div key={idx} className="legend-item">
                  <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                  <span className="legend-label">{item.name}</span>
                  <span className="legend-value">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Столбчатый график по районам */}
          <div className="chart-card">
            <h3>Обращения по районам</h3>
            {districtAnalytics.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={districtAnalytics}
                  margin={{ top: 5, right: 30, left: 0, bottom: 60 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis type="number" />
                  <YAxis dataKey="district" type="category" width={150} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#6B95B3" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Нет данных</p>
            )}
          </div>

          {/* Диаграмма по статусам */}
          <div className="chart-card">
            <h3>Распределение по статусам</h3>
            {statusAnalytics.length > 0 && statusAnalytics.some(s => s.value > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusAnalytics.filter(s => s.value > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusAnalytics.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} обращений`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="no-data">Нет данных</p>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default DashboardPage;