import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { handleApiError } from '../utils/errorHandler';
import { formatPhoneNumber, getCleanPhoneNumber } from '../utils/phoneFormatter';
import './AuthPages.css';

const LoginPage = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhoneNumber(formatted);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const cleanPhone = getCleanPhoneNumber(phoneNumber);
      await login(cleanPhone, password);
      navigate('/profile');
    } catch (err) {
      console.error('Login error:', err.response?.data);
      setError(handleApiError(err, 'Ошибка входа'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <h2>Вход в систему</h2>
          
          <form onSubmit={handleSubmit}>
            {error && <div className="error">{error}</div>}

            <div className="form-group">
              <label>Номер телефона</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={handlePhoneChange}
                placeholder="+7 (777) 123-45-67"
                maxLength="18"
                required
              />
              <small>Формат: +7 (XXX) XXX-XX-XX</small>
            </div>

            <div className="form-group">
              <label>Пароль</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>

            <button type="submit" className="btn-primary full-width" disabled={loading}>
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>

          <div className="auth-footer">
            <p>Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;