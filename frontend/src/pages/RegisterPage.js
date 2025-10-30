import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { handleApiError } from '../utils/errorHandler';
import { formatPhoneNumber, getCleanPhoneNumber } from '../utils/phoneFormatter';
import axios from 'axios';
import './AuthPages.css';

const RegisterPage = () => {
  const [step, setStep] = useState(1); // 1 = ввод телефона, 2 = ввод кода и данных
  const [formData, setFormData] = useState({
    phone_number: '',
    username: '',
    password: '',
    confirmPassword: '',
    verification_code: ''
  });
  const [demoCode, setDemoCode] = useState(''); // Для демо показа кода
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({
      ...formData,
      phone_number: formatted
    });
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanPhone = getCleanPhoneNumber(formData.phone_number);
      const response = await axios.post('/api/auth/send-code', {
        phone_number: cleanPhone
      });
      
      setDemoCode(response.data.code); // ДЕМО: показываем код
      alert(`ДЕМО: Код отправлен! Код: ${response.data.code}`);
      setStep(2);
    } catch (err) {
      console.error('Send code error:', err.response?.data);
      setError(handleApiError(err, 'Ошибка отправки кода'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (formData.password.length < 6) {
      setError('Пароль должен быть не менее 6 символов');
      return;
    }

    setLoading(true);

    try {
      const cleanPhone = getCleanPhoneNumber(formData.phone_number);
      await register(
        cleanPhone,
        formData.username,
        formData.password,
        formData.verification_code
      );
      alert('Регистрация успешна! Теперь вы можете войти.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err.response?.data);
      setError(handleApiError(err, 'Ошибка регистрации'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Регистрация</h2>
          
          {step === 1 ? (
            // Шаг 1: Ввод телефона
            <form onSubmit={handleSendCode}>
              {error && <div className="error">{error}</div>}

              <div className="form-group">
                <label>Номер телефона</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handlePhoneChange}
                  placeholder="+7 (777) 123-45-67"
                  maxLength="18"
                  required
                />
                <small>Формат: +7 (XXX) XXX-XX-XX</small>
              </div>

              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Отправка...' : 'Получить код'}
              </button>
            </form>
          ) : (
            // Шаг 2: Ввод кода и данных
            <form onSubmit={handleSubmit}>
              {error && <div className="error">{error}</div>}
              
              {demoCode && (
                <div className="demo-code-info" style={{
                  background: '#e7f3ff',
                  padding: '10px',
                  borderRadius: '5px',
                  marginBottom: '15px',
                  textAlign: 'center'
                }}>
                  <strong>🔐 ДЕМО Код: {demoCode}</strong>
                  <p style={{ fontSize: '12px', margin: '5px 0 0 0' }}>
                    В реальном приложении код придет по SMS
                  </p>
                </div>
              )}

              <div className="form-group">
                <label>Код подтверждения</label>
                <input
                  type="text"
                  name="verification_code"
                  value={formData.verification_code}
                  onChange={handleChange}
                  placeholder="Введите 6-значный код"
                  maxLength="6"
                  required
                />
              </div>

              <div className="form-group">
                <label>Имя пользователя</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Введите имя пользователя"
                  required
                />
              </div>

              <div className="form-group">
                <label>Пароль</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Введите пароль (минимум 6 символов)"
                  required
                />
              </div>

              <div className="form-group">
                <label>Подтвердите пароль</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Повторите пароль"
                  required
                />
              </div>

              <button type="submit" className="btn-primary full-width" disabled={loading}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </button>
              
              <button 
                type="button" 
                className="btn-secondary full-width" 
                onClick={() => setStep(1)}
                style={{ marginTop: '10px' }}
              >
                Назад
              </button>
            </form>
          )}

          <div className="auth-footer">
            <p>Уже есть аккаунт? <Link to="/login">Войти</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;