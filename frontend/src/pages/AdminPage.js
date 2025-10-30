import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AdminPage.css';

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

const AdminPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());

  useEffect(() => {
    fetchReports();
    fetchStats();
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
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
    }
  };

  const handleStatusUpdate = async (reportId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/reports/${reportId}`,
        { 
          status: newStatus,
          admin_notes: adminNotes 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      alert('Статус обращения обновлен');
      setSelectedReport(null);
      setAdminNotes('');
      fetchReports();
      fetchStats();
    } catch (error) {
      alert('Ошибка обновления статуса: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async (reportId) => {
    if (!window.confirm('Вы уверены, что хотите удалить это обращение?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/reports/${reportId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      alert('Обращение удалено');
      setSelectedReport(null);
      fetchReports();
      fetchStats();
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.detail || error.message));
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'new': return 'badge-new';
      case 'confirmed': return 'badge-confirmed';
      case 'rejected': return 'badge-rejected';
      default: return '';
    }
  };

  const toggleRowExpansion = (reportId) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(reportId)) {
      newExpandedRows.delete(reportId);
    } else {
      newExpandedRows.add(reportId);
    }
    setExpandedRows(newExpandedRows);
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="admin-page">
      <div className="container">
        <h1>Админ-панель</h1>

        {stats && (
          <div className="stats-grid">
            <div className="stat-card">
              <h3>{stats.total_reports}</h3>
              <p>Всего обращений</p>
            </div>
            <div className="stat-card stat-new">
              <h3>{stats.new_reports}</h3>
              <p>Новых</p>
            </div>
            <div className="stat-card stat-confirmed">
              <h3>{stats.confirmed_reports}</h3>
              <p>Подтверждено</p>
            </div>
            <div className="stat-card stat-rejected">
              <h3>{stats.rejected_reports}</h3>
              <p>Отклонено</p>
            </div>
          </div>
        )}

        <div className="filters">
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

        <div className="reports-table">
          <h2>Обращения ({reports.length})</h2>
          
          {reports.length === 0 ? (
            <div className="no-reports">
              <p>Нет обращений</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th className="expand-cell"></th>
                    <th>ID</th>
                    <th>Тип</th>
                    <th>Адрес</th>
                    <th>Статус</th>
                    <th>Дата создания</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <React.Fragment key={report.id}>
                      <tr className={`expandable-row ${expandedRows.has(report.id) ? 'expanded' : ''}`}>
                        <td className="expand-cell">
                          <button 
                            className="expand-btn"
                            onClick={() => toggleRowExpansion(report.id)}
                            title={expandedRows.has(report.id) ? 'Свернуть' : 'Развернуть'}
                          >
                            ▶
                          </button>
                        </td>
                        <td>{report.id}</td>
                        <td>{REPORT_TYPE_NAMES[report.report_type]}</td>
                        <td>{report.address}</td>
                        <td>
                          <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                            {STATUS_NAMES[report.status]}
                          </span>
                        </td>
                        <td>{new Date(report.created_at).toLocaleString('ru-RU')}</td>
                        <td>
                          <button 
                            className="btn-primary small"
                            onClick={() => {
                              setSelectedReport(report);
                              setAdminNotes(report.admin_notes || '');
                            }}
                          >
                            Просмотр
                          </button>
                        </td>
                      </tr>
                      {expandedRows.has(report.id) && (
                        <tr className="expansion-row">
                          <td colSpan="7">
                            <div className="expansion-content">
                              {report.description && (
                                <div className="expansion-item">
                                  <strong>Описание:</strong>
                                  <p>{report.description}</p>
                                </div>
                              )}
                              <div className="expansion-info">
                                {report.incident_date && (
                                  <div className="info-column">
                                    <strong>Дата инцидента:</strong>
                                    <span>{report.incident_date}</span>
                                  </div>
                                )}
                                {report.kuy_number && (
                                  <div className="info-column">
                                    <strong>№ КУИ:</strong>
                                    <span>{report.kuy_number}</span>
                                  </div>
                                )}
                                {report.erdr_number && (
                                  <div className="info-column">
                                    <strong>№ ЕРДР:</strong>
                                    <span>{report.erdr_number}</span>
                                  </div>
                                )}
                                {report.moderator_username && (
                                  <div className="info-column">
                                    <strong>Модератор:</strong>
                                    <span>{report.moderator_username}</span>
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
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Обращение #{selectedReport.id}</h2>
                <button className="close-btn" onClick={() => setSelectedReport(null)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="report-details">
                  <p><strong>Тип:</strong> {REPORT_TYPE_NAMES[selectedReport.report_type]}</p>
                  <p><strong>Текущий статус:</strong> 
                    <span className={`badge ${getStatusBadgeClass(selectedReport.status)}`}>
                      {STATUS_NAMES[selectedReport.status]}
                    </span>
                  </p>
                  <p><strong>Адрес:</strong> {selectedReport.address}</p>
                  <p><strong>Координаты:</strong> {selectedReport.latitude}, {selectedReport.longitude}</p>
                  <p><strong>Описание:</strong> {selectedReport.description}</p>
                  {selectedReport.incident_date && (
                    <p><strong>Дата инцидента:</strong> {selectedReport.incident_date}</p>
                  )}
                  {selectedReport.kuy_number && (
                    <p><strong>№ КУИ:</strong> {selectedReport.kuy_number}</p>
                  )}
                  {selectedReport.erdr_number && (
                    <p><strong>№ ЕРДР:</strong> {selectedReport.erdr_number}</p>
                  )}
                  <p><strong>Дата создания:</strong> {new Date(selectedReport.created_at).toLocaleString('ru-RU')}</p>
                  
                  {selectedReport.photo_url && (
                    <div>
                      <strong>Фото:</strong>
                      <img 
                        src={`https://oyan-app.onrender.com${selectedReport.photo_url}`} 
                        alt="Фото" 
                        className="modal-photo"
                      />
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label>Заметки администратора:</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows="3"
                    placeholder="Добавьте заметки (опционально)"
                  />
                </div>

                <div className="modal-actions">
                  <button 
                    className="btn-success"
                    onClick={() => handleStatusUpdate(selectedReport.id, 'confirmed')}
                    disabled={selectedReport.status === 'confirmed'}
                  >
                    Подтвердить
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleStatusUpdate(selectedReport.id, 'rejected')}
                    disabled={selectedReport.status === 'rejected'}
                  >
                    Отклонить
                  </button>
                  <button 
                    className="btn-danger"
                    onClick={() => handleDelete(selectedReport.id)}
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;