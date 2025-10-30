import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './BottomNavigation.css';

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleProfileClick = (e) => {
    if (!user) {
      e.preventDefault();
      navigate('/login');
    }
  };

  return (
    <nav className="bottom-navigation">
      <Link 
        to="/" 
        className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}
      >
        <span className="material-symbols-outlined">map</span>
        <span className="bottom-nav-label">Карта</span>
      </Link>

      <Link 
        to="/news" 
        className={`bottom-nav-item ${isActive('/news') ? 'active' : ''}`}
      >
        <span className="material-symbols-outlined">newspaper</span>
        <span className="bottom-nav-label">Новости</span>
      </Link>

      <Link 
        to="/profile" 
        className={`bottom-nav-item ${isActive('/profile') || isActive('/login') ? 'active' : ''}`}
        onClick={handleProfileClick}
      >
        <span className="material-symbols-outlined">account_circle</span>
        <span className="bottom-nav-label">{user ? 'Профиль' : 'Войти'}</span>
      </Link>
    </nav>
  );
};

export default BottomNavigation;