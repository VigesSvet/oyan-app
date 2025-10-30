import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import '../AdminPage.css';
import './ModerationPage.css';

const REPORT_TYPE_NAMES = {
  drug_dealer: 'Наркозакладчики',
  drug_graffiti: 'Наркограффити',
  drug_den: 'Наркопритон',
  drug_addict: 'Проживание наркозависимых',
  overdose: 'Передозировка',
  other: 'Иные сведения'
};

const STATUS_NAMES = {
  new: 'Новый',
  confirmed: 'Подтвержден',
  rejected: 'Отклонен'
};

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [pendingCount, setPendingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter === 'all' 
        ? '/api/admin/reports'
        : `/api/admin/reports?status=${filter}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
      
      // Подсчитаем pending
      const pending = response.data.filter(r => r.status === 'new').length;
      setPendingCount(pending);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  const handleRowClick = (reportId) => {
    navigate(`/admin/reports/${reportId}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pendingCount={pendingCount}>
      <h1>Архив обращений</h1>

      {/* Фильтры */}
      <div className="filters" style={{ marginBottom: '24px' }}>
        <button 
          className={filter === 'all' ? 'btn-primary' : 'btn-secondary'}
          onClick={() => setFilter('all')}
        >
          Все
        </button>
        <button 
          className={filter === 'new' ? 'btn-warning' : 'btn-secondary'}
          onClick={() => setFilter('new')}
        >
          Новые
        </button>
        <button 
          className={filter === 'confirmed' ? 'btn-success' : 'btn-secondary'}
          onClick={() => setFilter('confirmed')}
        >
          Подтвержденные
        </button>
        <button 
          className={filter === 'rejected' ? 'btn-danger' : 'btn-secondary'}
          onClick={() => setFilter('rejected')}
        >
          Отклоненные
        </button>
      </div>

      <div className="moderation-table-wrapper">
        {reports.length === 0 ? (
          <div className="no-reports">
            <p>Нет обращений</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ТИП</th>
                <th>ДАТА</th>
                <th>АДРЕС</th>
                <th>СТАТУС</th>
                <th>МОДЕРАТОР</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr 
                  key={report.id}
                  onClick={() => handleRowClick(report.id)}
                  className="clickable-row"
                >
                  <td className="id-cell">
                    <a href={`/admin/reports/${report.id}`} onClick={(e) => e.preventDefault()}>
                      #{report.id}
                    </a>
                  </td>
                  <td>{REPORT_TYPE_NAMES[report.report_type]}</td>
                  <td>{new Date(report.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="address-cell">{report.address}</td>
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(report.status)}`}>
                      {STATUS_NAMES[report.status]}
                    </span>
                  </td>
                  <td>{report.moderator_username || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;