import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

const REDEMPTION_STATUS_NAMES = {
  pending: 'На рассмотрении',
  approved: 'Одобрено',
  rejected: 'Отклонено'
};

const BONUS_REWARDS = [
  { amount: 50, label: '50 бонусов' },
  { amount: 100, label: '100 бонусов' },
  { amount: 150, label: '150 бонусов' }
];

const ProfilePage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [showRedemptionModal, setShowRedemptionModal] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState(null);
  const [rewardType, setRewardType] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [redemptions, setRedemptions] = useState([]);
  const [redeeming, setRedeeming] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  useEffect(() => {
    fetchMyReports();
    fetchBonusInfo();
    fetchMyRedemptions();
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

  const fetchBonusInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bonuses/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBonusPoints(response.data.bonus_points);
    } catch (error) {
      console.error('Ошибка загрузки информации о бонусах:', error);
    }
  };

  const fetchMyRedemptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/bonuses/redemptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRedemptions(response.data);
    } catch (error) {
      console.error('Ошибка загрузки заявок на награждение:', error);
    }
  };

  const handleRedeemBonus = async () => {
    if (!selectedBonus || !rewardType) {
      alert('Пожалуйста, выберите награду и опишите, что вы хотите получить');
      return;
    }

    setRedeeming(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/api/bonuses/redeem',
        {
          bonus_amount: selectedBonus,
          reward_type: rewardType,
          contact_info: contactInfo
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      alert('Заявка на награждение успешно отправлена!');
      setShowRedemptionModal(false);
      setSelectedBonus(null);
      setRewardType('');
      setContactInfo('');
      fetchBonusInfo();
      fetchMyRedemptions();
    } catch (error) {
      alert(error.response?.data?.detail || 'Ошибка при отправке заявки');
    } finally {
      setRedeeming(false);
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
          <div className="profile-header-top">
            <h1>Личный кабинет</h1>
            <button className="btn-logout btn-logout-desktop" onClick={handleLogout}>
              Выход
            </button>
          </div>
          <div className="user-info-card">
            <p><strong>Имя:</strong> {user.username}</p>
            <p><strong>Телефон:</strong> {user.phone_number}</p>
            <p><strong>Статус:</strong> {user.is_phone_verified ? '✅ Подтвержден' : '⏳ Не подтвержден'}</p>
            <p><strong>Роль:</strong> {user.is_admin ? 'Администратор' : 'Пользователь'}</p>
          </div>
        </div>

        {/* Бонус секция */}
        <div className="bonus-section">
          <h2>Мои бонусы</h2>
          <div className="bonus-card">
            <div className="bonus-progress">
              <div className="bonus-info">
                <span className="bonus-amount">{bonusPoints}</span>
                <span className="bonus-label">бонусов накоплено</span>
              </div>
              <div className="bonus-bar-container">
                <div className="bonus-bar">
                  <div 
                    className="bonus-bar-fill" 
                    style={{ width: `${Math.min((bonusPoints / 150) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="bonus-milestones">
                  <div className="milestone">50</div>
                  <div className="milestone">100</div>
                  <div className="milestone">150</div>
                </div>
              </div>
            </div>

            {bonusPoints >= 50 && (
              <div className="reward-options">
                <p>Вы можете получить награду:</p>
                <div className="reward-buttons">
                  {BONUS_REWARDS.filter(r => r.amount <= bonusPoints).map(reward => (
                    <button
                      key={reward.amount}
                      className="reward-btn"
                      onClick={() => {
                        setSelectedBonus(reward.amount);
                        setShowRedemptionModal(true);
                      }}
                    >
                      {reward.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bonusPoints < 50 && (
              <div className="bonus-hint">
                Накопите еще {50 - bonusPoints} бонусов, чтобы получить первую награду
              </div>
            )}
          </div>

          {/* История заявок на награждение */}
          {redemptions.length > 0 && (
            <div className="redemptions-history">
              <h3>История заявок ({redemptions.length})</h3>
              <div className="redemptions-list">
                {redemptions.map(redemption => (
                  <div key={redemption.id} className="redemption-item">
                    <div className="redemption-header">
                      <span className="redemption-bonus">-{redemption.bonus_amount} бонусов</span>
                      <span className={`redemption-status status-${redemption.status}`}>
                        {REDEMPTION_STATUS_NAMES[redemption.status]}
                      </span>
                    </div>
                    <p className="redemption-reward">{redemption.reward_type}</p>
                    <p className="redemption-date">
                      {new Date(redemption.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
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

        <div className="profile-footer-mobile">
          <button className="btn-logout btn-logout-mobile" onClick={handleLogout}>
            Выход
          </button>
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

        {/* Модаль для выбора награды */}
        {showRedemptionModal && (
          <div className="modal-overlay" onClick={() => setShowRedemptionModal(false)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Получить награду</h2>
                <button className="close-btn" onClick={() => setShowRedemptionModal(false)}>✕</button>
              </div>
              
              <div className="modal-body">
                <div className="form-group">
                  <label><strong>Сумма бонусов: {selectedBonus}</strong></label>
                  <p className="form-hint">Ваш баланс: {bonusPoints} бонусов</p>
                </div>

                <div className="form-group">
                  <label>Вид награды *</label>
                  <select
                    value={rewardType}
                    onChange={(e) => setRewardType(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Выберите награду --</option>
                    <option value="Подарочная карта">Подарочная карта</option>
                    <option value="Скидка на покупку">Скидка на покупку</option>
                    <option value="Бесплатная доставка">Бесплатная доставка</option>
                    <option value="Промокод">Промокод</option>
                    <option value="Другое">Другое</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Дополнительная информация</label>
                  <textarea
                    value={contactInfo}
                    onChange={(e) => setContactInfo(e.target.value)}
                    placeholder="Ваши контактные данные, адрес для доставки или другая информация..."
                    rows="4"
                    className="form-textarea"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    className="btn-secondary"
                    onClick={() => setShowRedemptionModal(false)}
                    disabled={redeeming}
                  >
                    Отмена
                  </button>
                  <button 
                    className="btn-primary"
                    onClick={handleRedeemBonus}
                    disabled={redeeming}
                  >
                    {redeeming ? 'Отправка...' : 'Отправить заявку'}
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

export default ProfilePage;