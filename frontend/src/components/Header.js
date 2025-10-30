import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ onReportClick, onInfoClick }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Левая часть: Логотип */}
        <Link to="/" className="logo">
          <h1>OYAN</h1>
        </Link>
        
        {/* Центр: Навигация */}
        <nav className="nav">
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/')}`}>
              Карта
            </Link>
            <Link to="/news" className={`nav-link ${isActive('/news')}`}>
              Новости
            </Link>
          </div>
        </nav>

        {/* Правая часть: Действия */}
        <div className="nav-actions">
          {/* Кнопка инфо для мобильной версии */}
          {location.pathname === '/' && onInfoClick && (
            <button className="btn-info-mobile" onClick={onInfoClick}>
              <span className="material-symbols-outlined">info</span>
            </button>
          )}
          
          {user ? (
            <>
              {user.is_admin && (
                <Link to="/admin" className="btn-outline-primary">
                  Админ-панель
                </Link>
              )}
              <Link to="/profile" className="user-info">
                <div className="user-avatar">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span>{user.username}</span>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <button className="btn-outline-primary">Войти</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;