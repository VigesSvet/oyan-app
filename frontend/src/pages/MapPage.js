import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Map from '../components/Map';
import LegendModal from '../components/LegendModal';
import './MapPage.css';

const MapPage = ({ onReportClick, onLegendOpen }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLegendModal, setShowLegendModal] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  // Передаем обработчик открытия легенды в родительский компонент
  useEffect(() => {
    if (onLegendOpen) {
      onLegendOpen(() => setShowLegendModal(true));
    }
  }, [onLegendOpen]);

  const fetchReports = async () => {
    try {
      const response = await api.get('/api/reports?status=confirmed');
      setReports(response.data);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Загрузка карты</div>;
  }

  return (
    <div className="map-page">
      <Map reports={reports} />
      <button className="floating-report-btn" onClick={onReportClick}>
        <span className="material-symbols-outlined">edit</span>
        <span className="btn-text">Сообщить</span>
      </button>
      
      {/* Модальное окно с легендой для мобильных */}
      <LegendModal 
        isOpen={showLegendModal} 
        onClose={() => setShowLegendModal(false)} 
      />
    </div>
  );
};

export default MapPage;