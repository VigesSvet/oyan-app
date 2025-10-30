import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Map from '../components/Map';
import ReportForm from '../components/ReportForm';
import './MapPage.css';

const MapPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showReportForm, setShowReportForm] = useState(false);

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

  const handleReportSuccess = () => {
    fetchReports();
  };

  if (loading) {
    return <div className="loading">Загрузка карты...</div>;
  }

  return (
    <div className="map-page">
      <Map reports={reports} />
      
      <button 
        className="add-report-btn btn-primary"
        onClick={() => setShowReportForm(true)}
      >
        + Подать обращение
      </button>

      {showReportForm && (
        <ReportForm
          onClose={() => setShowReportForm(false)}
          onSuccess={handleReportSuccess}
        />
      )}
    </div>
  );
};

export default MapPage;