import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>OYUN - Карта Наркоситуаций</h1>
        </Link>
        
        <nav className="nav">
          <Link to="/" className="nav-link">Карта</Link>
          
          {user ? (
            <>
              <Link to="/profile" className="nav-link">Личный кабинет</Link>
              {user.is_admin && (
                <Link to="/admin" className="nav-link">Админ-панель</Link>
              )}
              <span className="user-info">👤 {user.username}</span>
              <button onClick={handleLogout} className="btn-secondary">
                Выйти
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-link">Вход</Link>
              <Link to="/register" className="nav-link">Регистрация</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;