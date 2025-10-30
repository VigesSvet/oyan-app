import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import AdminLayout from '../../components/AdminLayout';
import './ReportDetailPage.css';

const REPORT_TYPE_NAMES = {
  drug_dealer: 'Наркозакладчики',
  drug_graffiti: 'Наркограффити',
  drug_den: 'Наркопритон',
  drug_addict: 'Проживание наркозависимых',
  overdose: 'Передозировка',
  other: 'Иные сведения'
};

const STATUS_NAMES = {
  new: 'Новое',
  confirmed: 'Верифицировано',
  rejected: 'Отклонено'
};

const ReportDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminNotes, setAdminNotes] = useState('');
  const [kuyNumber, setKuyNumber] = useState('');
  const [erdrNumber, setErdrNumber] = useState('');
  const [takenMeasures, setTakenMeasures] = useState('');

  useEffect(() => {
    fetchReport();
  }, [id]);

  const fetchReport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReport(response.data);
      setAdminNotes(response.data.admin_notes || '');
      setKuyNumber(response.data.kuy_number || '');
      setErdrNumber(response.data.erdr_number || '');
    } catch (error) {
      console.error('Ошибка загрузки обращения:', error);
      alert('Обращение не найдено');
      navigate('/admin/moderation');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/admin/reports/${id}`,
        {
          status: newStatus,
          admin_notes: adminNotes,
          kuy_number: kuyNumber,
          erdr_number: erdrNumber
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Статус обновлен');
      navigate('/admin/moderation');
    } catch (error) {
      alert('Ошибка: ' + (error.response?.data?.detail || error.message));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Удалить это обращение?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/reports/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Обращение удалено');
      navigate('/admin/moderation');
    } catch (error) {
      alert('Ошибка удаления: ' + (error.response?.data?.detail || error.message));
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  if (!report) {
    return (
      <AdminLayout>
        <div>Обращение не найдено</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="report-detail-page">
        <h1>Модерация обращения #{report.id}</h1>

        <div className="detail-layout">
          {/* Левая колонка (60%) */}
          <div className="detail-left">
            {/* Карточка с картой */}
            <div className="detail-card">
              <h3>Карта</h3>
              <div className="map-placeholder">
                <p>Здесь будет встроенная 2GIS карта с маркером</p>
                <p><strong>Координаты:</strong> {report.latitude}, {report.longitude}</p>
                <p><strong>Адрес:</strong> {report.address}</p>
              </div>
            </div>

            {/* Приложенные фото */}
            {report.photo_url && (
              <div className="detail-card">
                <h3>Приложенные фото</h3>
                <div className="photo-gallery">
                  <img 
                    src={`http://localhost:8000${report.photo_url}`} 
                    alt="Фото" 
                    className="report-photo"
                  />
                </div>
              </div>
            )}

            {/* Описание */}
            <div className="detail-card">
              <h3>Описание от пользователя</h3>
              <p><strong>Тип:</strong> {REPORT_TYPE_NAMES[report.report_type]}</p>
              <p><strong>Описание:</strong></p>
              <div className="description-box">
                {report.description}
              </div>
              {report.incident_date && (
                <p><strong>Дата инцидента:</strong> {report.incident_date}</p>
              )}
              <p><strong>Дата создания:</strong> {new Date(report.created_at).toLocaleString('ru-RU')}</p>
            </div>
          </div>

          {/* Правая колонка (40%) */}
          <div className="detail-right">
            <div className="detail-card decision-card">
              <h3>✅ Решение</h3>
              
              <div className="form-group">
                <label>Текущий статус:</label>
                <div className={`status-badge-large status-${report.status}`}>
                  {STATUS_NAMES[report.status]}
                </div>
              </div>

              <div className="form-group">
                <label>КУИ/ЕРДР:</label>
                <input
                  type="text"
                  value={kuyNumber}
                  onChange={(e) => setKuyNumber(e.target.value)}
                  placeholder="Номер КУИ"
                />
                <input
                  type="text"
                  value={erdrNumber}
                  onChange={(e) => setErdrNumber(e.target.value)}
                  placeholder="Номер ЕРДР"
                  style={{ marginTop: '8px' }}
                />
              </div>

              <div className="form-group">
                <label>Принятые меры:</label>
                <textarea
                  value={takenMeasures}
                  onChange={(e) => setTakenMeasures(e.target.value)}
                  placeholder="Опишите принятые меры..."
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Комментарий модератора:</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Добавьте комментарий..."
                  rows="4"
                />
              </div>

              <div className="action-buttons">
                <button 
                  className="btn-outline-danger"
                  onClick={() => handleStatusUpdate('rejected')}
                  disabled={report.status === 'rejected'}
                >
                  Отклонить
                </button>
                <button 
                  className="btn-success"
                  onClick={() => handleStatusUpdate('confirmed')}
                  disabled={report.status === 'confirmed'}
                >
                  Верифицировать
                </button>
              </div>

              <button 
                className="btn-danger"
                onClick={handleDelete}
                style={{ width: '100%', marginTop: '12px' }}
              >
                Удалить обращение
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ReportDetailPage;