import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

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

const ProfilePage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchMyReports();
  }, []);

  const fetchMyReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/reports/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="profile-page">
      <div className="container">
        <div className="profile-header">
          <h1>Личный кабинет</h1>
          <div className="user-info-card">
            <p><strong>Имя:</strong> {user.username}</p>
            <p><strong>Телефон:</strong> {user.phone_number}</p>
            <p><strong>Статус:</strong> {user.is_phone_verified ? '✅ Подтвержден' : '⏳ Не подтвержден'}</p>
            <p><strong>Роль:</strong> {user.is_admin ? 'Администратор' : 'Пользователь'}</p>
          </div>
        </div>

        <div className="reports-section">
          <h2>Мои обращения ({reports.length})</h2>
          
          {reports.length === 0 ? (
            <div className="no-reports">
              <p>У вас пока нет обращений</p>
            </div>
          ) : (
            <div className="reports-grid">
              {reports.map(report => (
                <div key={report.id} className="report-card">
                  <div className="report-card-header">
                    <span className={`badge ${getStatusBadgeClass(report.status)}`}>
                      {STATUS_NAMES[report.status]}
                    </span>
                    <span className="report-date">
                      {new Date(report.created_at).toLocaleDateString('ru-RU')}
                    </span>
                  </div>
                  
                  <h3>{REPORT_TYPE_NAMES[report.report_type]}</h3>
                  <p className="report-address">📍 {report.address}</p>
                  <p className="report-description">{report.description}</p>
                  
                  {report.photo_url && (
                    <img 
                      src={`http://localhost:8000${report.photo_url}`} 
                      alt="Фото" 
                      className="report-photo"
                    />
                  )}

                  {report.admin_notes && (
                    <div className="admin-notes">
                      <strong>Заметки администратора:</strong>
                      <p>{report.admin_notes}</p>
                    </div>
                  )}

                  <button 
                    className="btn-secondary"
                    onClick={() => setSelectedReport(report)}
                  >
                    Подробнее
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedReport && (
          <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Детали обращения</h2>
                <button className="close-btn" onClick={() => setSelectedReport(null)}>✕</button>
              </div>
              
              <div className="modal-body">
                <p><strong>Тип:</strong> {REPORT_TYPE_NAMES[selectedReport.report_type]}</p>
                <p><strong>Статус:</strong> 
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
                      src={`http://localhost:8000${selectedReport.photo_url}`} 
                      alt="Фото" 
                      className="modal-photo"
                    />
                  </div>
                )}

                {selectedReport.admin_notes && (
                  <div className="admin-notes">
                    <strong>Заметки администратора:</strong>
                    <p>{selectedReport.admin_notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;