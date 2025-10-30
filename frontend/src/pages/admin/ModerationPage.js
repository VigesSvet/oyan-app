import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import './ModerationPage.css';

const REPORT_TYPE_NAMES = {
  drug_dealer: 'Наркозакладчики',
  drug_graffiti: 'Наркограффити',
  drug_den: 'Наркопритон',
  drug_addict: 'Проживание наркозависимых',
  overdose: 'Передозировка',
  other: 'Иные сведения'
};

const STATUS_NAMES = {
  new: 'Ожидает',
  confirmed: 'Подтвержден',
  rejected: 'Отклонен'
};

const ModerationPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/reports?status=new', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReports(response.data);
    } catch (error) {
      console.error('Ошибка загрузки обращений:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRowClick = (reportId) => {
    navigate(`/admin/reports/${reportId}`);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="loading">Загрузка...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pendingCount={reports.length}>
      <h1>Входящие (Ожидают модерации)</h1>

      <div className="moderation-table-wrapper">
        {reports.length === 0 ? (
          <div className="no-reports">
            <p>Нет обращений, ожидающих модерации</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>ТИП</th>
                <th>ДАТА</th>
                <th>АДРЕС</th>
                <th>СТАТУС</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr 
                  key={report.id} 
                  onClick={() => handleRowClick(report.id)}
                  className="clickable-row"
                >
                  <td className="id-cell">
                    <a href={`/admin/reports/${report.id}`} onClick={(e) => e.preventDefault()}>
                      #{report.id}
                    </a>
                  </td>
                  <td>{REPORT_TYPE_NAMES[report.report_type]}</td>
                  <td>{new Date(report.created_at).toLocaleDateString('ru-RU')}</td>
                  <td className="address-cell">{report.address}</td>
                  <td>
                    <span className="status-badge status-pending">{STATUS_NAMES[report.status] || 'Ожидает'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
};

export default ModerationPage;