import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './PrizeRedemptionsPage.css';

const REDEMPTION_STATUS_NAMES = {
  pending: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено'
};

const STATUS_COLORS = {
  pending: '#fbbf24',
  approved: '#34d399',
  rejected: '#f87171'
};

const PrizeRedemptionsPage = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [filter, setFilter] = useState('pending');
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    fetchRedemptions();
  }, [filter]);

  const fetchRedemptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const url = filter 
        ? `/api/admin/bonus-redemptions?status=${filter}`
        : '/api/admin/bonus-redemptions';
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedemptions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заявок:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('Пожалуйста, выберите статус');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        `/api/admin/bonus-redemptions/${selectedRedemption.id}`,
        {
          status: newStatus,
          admin_notes: adminNotes
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Обновляем заявку в списке
      setRedemptions(redemptions.map(r => 
        r.id === selectedRedemption.id ? response.data : r
      ));

      setSelectedRedemption(null);
      alert('Статус заявки обновлен');
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при обновлении статуса');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadgeStyle = (status) => ({
    backgroundColor: STATUS_COLORS[status],
    color: 'white',
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '500'
  });

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  return (
    <div className="prize-redemptions-page">
      <h1>Управление заявками на награждение</h1>

      <div className="filters">
        <button
          className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => setFilter('pending')}
        >
          На рассмотрении ({redemptions.filter(r => r.status === 'pending').length})
        </button>
        <button
          className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => setFilter('approved')}
        >
          Одобрено ({redemptions.filter(r => r.status === 'approved').length})
        </button>
        <button
          className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
          onClick={() => setFilter('rejected')}
        >
          Отклонено ({redemptions.filter(r => r.status === 'rejected').length})
        </button>
      </div>

      {redemptions.length === 0 ? (
        <div className="no-data">
          <p>Нет заявок с таким статусом</p>
        </div>
      ) : (
        <div className="redemptions-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Email</th>
                <th>Бонусы</th>
                <th>Награда</th>
                <th>Статус</th>
                <th>Дата</th>
                <th>Действие</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.map(redemption => (
                <tr key={redemption.id}>
                  <td>#{redemption.id}</td>
                  <td>{redemption.user_username}</td>
                  <td>{redemption.user_email}</td>
                  <td className="bonus-col">-{redemption.bonus_amount}</td>
                  <td className="reward-col">{redemption.reward_type}</td>
                  <td>
                    <span style={getStatusBadgeStyle(redemption.status)}>
                      {REDEMPTION_STATUS_NAMES[redemption.status]}
                    </span>
                  </td>
                  <td>{new Date(redemption.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <button
                      className="btn-view"
                      onClick={() => {
                        setSelectedRedemption(redemption);
                        setNewStatus(redemption.status);
                        setAdminNotes(redemption.admin_notes || '');
                      }}
                    >
                      Подробнее
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модаль для просмотра и обновления */}
      {selectedRedemption && (
        <div className="modal-overlay" onClick={() => setSelectedRedemption(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Заявка #{selectedRedemption.id}</h2>
              <button className="close-btn" onClick={() => setSelectedRedemption(null)}>✕</button>
            </div>

            <div className="modal-body">
              <div className="info-section">
                <h3>Информация о пользователе</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Пользователь:</label>
                    <p>{selectedRedemption.user_username}</p>
                  </div>
                  <div className="info-item">
                    <label>Email:</label>
                    <p>{selectedRedemption.user_email}</p>
                  </div>
                  <div className="info-item">
                    <label>ID пользователя:</label>
                    <p>#{selectedRedemption.user_id}</p>
                  </div>
                </div>
              </div>

              <div className="info-section">
                <h3>Информация о заявке</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Потрачено бонусов:</label>
                    <p className="bonus-value">-{selectedRedemption.bonus_amount}</p>
                  </div>
                  <div className="info-item">
                    <label>Вид награды:</label>
                    <p>{selectedRedemption.reward_type}</p>
                  </div>
                  <div className="info-item">
                    <label>Дата создания:</label>
                    <p>{new Date(selectedRedemption.created_at).toLocaleString('ru-RU')}</p>
                  </div>
                </div>

                {selectedRedemption.contact_info && (
                  <div className="info-item full-width">
                    <label>Контактная информация:</label>
                    <p>{selectedRedemption.contact_info}</p>
                  </div>
                )}
              </div>

              <div className="info-section">
                <h3>Действия администратора</h3>
                
                <div className="form-group">
                  <label>Статус</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="form-select"
                  >
                    <option value="pending">На рассмотрении</option>
                    <option value="approved">Одобрено</option>
                    <option value="rejected">Отклонено</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Заметки администратора</label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Ваши заметки по этой заявке..."
                    rows="4"
                    className="form-textarea"
                  />
                </div>
              </div>

              {selectedRedemption.admin_notes && selectedRedemption.status !== newStatus && (
                <div className="previous-notes">
                  <strong>Предыдущие заметки:</strong>
                  <p>{selectedRedemption.admin_notes}</p>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  className="btn-secondary"
                  onClick={() => setSelectedRedemption(null)}
                  disabled={updating}
                >
                  Закрыть
                </button>
                <button 
                  className="btn-primary"
                  onClick={handleUpdateStatus}
                  disabled={updating}
                >
                  {updating ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrizeRedemptionsPage;