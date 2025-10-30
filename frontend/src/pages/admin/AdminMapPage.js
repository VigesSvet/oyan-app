import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import Map from '../../components/Map';
import './AdminMapPage.css';

const AdminMapPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    pending: true,
    confirmed: true,
    rejected: false,
    heatmap: false
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/reports', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: !prev[filterName]
    }));
  };

  const filteredReports = reports.filter(report => {
    if (report.status === 'new' && !filters.pending) return false;
    if (report.status === 'confirmed' && !filters.confirmed) return false;
    if (report.status === 'rejected' && !filters.rejected) return false;
    return true;
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="admin-map-page">
        <div className="map-container">
          <Map reports={filteredReports} />
          
          {/* Плавающий блок с фильтрами */}
          <div className="map-filters">
            <h3>Фильтры</h3>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.pending}
                onChange={() => handleFilterChange('pending')}
              />
              <span className="filter-label">Ожидают</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.confirmed}
                onChange={() => handleFilterChange('confirmed')}
              />
              <span className="filter-label">Подтвержденные</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.rejected}
                onChange={() => handleFilterChange('rejected')}
              />
              <span className="filter-label">Отклоненные</span>
            </label>
            <label className="filter-checkbox">
              <input
                type="checkbox"
                checked={filters.heatmap}
                onChange={() => handleFilterChange('heatmap')}
              />
              <span className="filter-label">Heatmap</span>
            </label>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminMapPage;