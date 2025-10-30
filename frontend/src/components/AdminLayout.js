import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './AdminLayout.css';

const AdminLayout = ({ children, pendingCount = 0 }) => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: '◆', label: 'Аналитика' },
    { path: '/admin/moderation', icon: '✓', label: 'Модерирование', badge: pendingCount },
    { path: '/admin/reports', icon: '→', label: 'Статусы' },
    { path: '/admin/map', icon: '◉', label: 'Карта' },
    { path: '/admin/news', icon: '☰', label: 'Новости' },
    { path: '/admin/prize-redemptions', icon: '★', label: 'Заявки на награды' },
  ];

  return (
    <div className="admin-layout">
      {/* Темный сайдбар */}
      <aside className="admin-sidebar">
        {/* Логотип */}
        <div className="sidebar-logo">
          <h1>OYAN</h1>
          <span className="sidebar-subtitle">Админ-панель</span>
        </div>

        {/* Навигация */}
        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link ${isActive(item.path)}`}
            >
              <span className="sidebar-label">{item.label}</span>
              {item.badge > 0 && (
                <span className="sidebar-badge">{item.badge}</span>
              )}
            </Link>
          ))}
        </nav>

        {/* Профиль внизу */}
        <Link to="/profile" className="sidebar-profile">
          <div className="profile-info">
            <div className="profile-avatar">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div className="profile-details">
              <div className="profile-name">{user?.username}</div>
              <div className="profile-role">Администратор</div>
            </div>
          </div>
        </Link>
      </aside>

      {/* Светлая область контента */}
      <main className="admin-content">
        {children}
      </main>
    </div>
  );
};

export default AdminLayout;