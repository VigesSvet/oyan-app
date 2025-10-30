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
  const [expandedRows, setExpandedRows] = useState(new Set());
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

  const toggleRowExpansion = (reportId, e) => {
    e.stopPropagation();
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(reportId)) {
      newExpandedRows.delete(reportId);
    } else {
      newExpandedRows.add(reportId);
    }
    setExpandedRows(newExpandedRows);
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
                <th className="expand-cell-reports"></th>
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
                <React.Fragment key={report.id}>
                  <tr 
                    onClick={() => handleRowClick(report.id)}
                    className={`clickable-row expandable-row-reports ${expandedRows.has(report.id) ? 'expanded' : ''}`}
                  >
                    <td className="expand-cell-reports">
                      <button 
                        className="expand-btn-reports"
                        onClick={(e) => toggleRowExpansion(report.id, e)}
                        title={expandedRows.has(report.id) ? 'Свернуть' : 'Развернуть'}
                      >
                        ▶
                      </button>
                    </td>
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
                  {expandedRows.has(report.id) && (
                    <tr className="expansion-row-reports">
                      <td colSpan="7">
                        <div className="expansion-content-reports">
                          {report.description && (
                            <div className="expansion-item-reports">
                              <strong>Описание:</strong>
                              <p>{report.description}</p>
                            </div>
                          )}
                          <div className="expansion-info-reports">
                            {report.incident_date && (
                              <div className="info-column-reports">
                                <strong>Дата инцидента:</strong>
                                <span>{report.incident_date}</span>
                              </div>
                            )}
                            {report.kuy_number && (
                              <div className="info-column-reports">
                                <strong>№ КУИ:</strong>
                                <span>{report.kuy_number}</span>
                              </div>
                            )}
                            {report.erdr_number && (
                              <div className="info-column-reports">
                                <strong>№ ЕРДР:</strong>
                                <span>{report.erdr_number}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default ReportsPage;