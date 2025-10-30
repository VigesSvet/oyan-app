import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Map from '../components/Map';
import './MapPage.css';

const MapPage = ({ onReportClick }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports?status=confirmed');
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
        Сообщить
      </button>
    </div>
  );
};

export default MapPage;