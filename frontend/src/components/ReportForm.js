import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './ReportForm.css';

import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix for marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
});

const REPORT_TYPES = [
  { value: 'drug_dealer', label: 'Наркозакладчики (синий)' },
  { value: 'drug_graffiti', label: 'Наркограффити (желтый)' },
  { value: 'drug_den', label: 'Наркопритон (красный)' },
  { value: 'drug_addict', label: 'Проживание наркозависимых' },
  { value: 'overdose', label: 'Передозировка' },
  { value: 'other', label: 'Иные сведения' }
];

const ReportForm = ({ onClose, onSuccess }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  
  const [formData, setFormData] = useState({
    report_type: 'drug_dealer',
    latitude: 49.95,
    longitude: 82.6167,
    address: '',
    description: '',
    incident_date: '',
    kuy_number: '',
    erdr_number: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Инициализация карты
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = L.map(mapContainerRef.current).setView(
      [formData.latitude, formData.longitude],
      13
    );

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Маркер для выбора места
    const marker = L.marker([formData.latitude, formData.longitude], {
      draggable: true
    }).addTo(map);

    marker.bindPopup('Перетащите маркер или кликните на карту');
    marker.openPopup();

    // Обновление координат при перемещении маркера
    marker.on('dragend', function() {
      const latLng = marker.getLatLng();
      setFormData(prev => ({
        ...prev,
        latitude: parseFloat(latLng.lat.toFixed(6)),
        longitude: parseFloat(latLng.lng.toFixed(6))
      }));
    });

    // Добавление маркера при клике на карту
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      setFormData(prev => ({
        ...prev,
        latitude: parseFloat(e.latlng.lat.toFixed(6)),
        longitude: parseFloat(e.latlng.lng.toFixed(6))
      }));
    });

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'latitude' || name === 'longitude' 
        ? (value === '' ? '' : parseFloat(value))
        : value
    }));

    // Обновление маркера если изменились координаты
    if ((name === 'latitude' || name === 'longitude') && markerRef.current) {
      const newLat = name === 'latitude' ? parseFloat(value) : formData.latitude;
      const newLng = name === 'longitude' ? parseFloat(value) : formData.longitude;
      if (!isNaN(newLat) && !isNaN(newLng)) {
        markerRef.current.setLatLng([newLat, newLng]);
        if (mapRef.current) {
          mapRef.current.panTo([newLat, newLng]);
        }
      }
    }
  };

  const handlePhotoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });
      if (photo) {
        data.append('photo', photo);
      }

      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      await axios.post('/api/reports', data, {
        headers: {
          ...headers,
          'Content-Type': 'multipart/form-data'
        }
      });

      alert('Обращение успешно отправлено! Оно будет проверено администратором.');
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при отправке обращения');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-form-fullscreen">
      <div className="report-form-map-container" ref={mapContainerRef} />
      
      <div className="report-form-panel">
        <div className="report-form-header">
          <h2>Подать обращение</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={handleSubmit} className="report-form">
          {error && <div className="error">{error}</div>}

          <div className="form-group">
            <label>Тип обращения *</label>
            <select
              name="report_type"
              value={formData.report_type}
              onChange={handleChange}
              required
            >
              {REPORT_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Широта *</label>
              <input
                type="number"
                step="0.000001"
                name="latitude"
                value={formData.latitude}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Долгота *</label>
              <input
                type="number"
                step="0.000001"
                name="longitude"
                value={formData.longitude}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Адрес *</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="Укажите адрес происшествия"
              required
            />
          </div>

          <div className="form-group">
            <label>Описание *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Подробное описание ситуации"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Дата и время инцидента</label>
            <input
              type="datetime-local"
              name="incident_date"
              value={formData.incident_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>№ КУИ</label>
              <input
                type="text"
                name="kuy_number"
                value={formData.kuy_number}
                onChange={handleChange}
                placeholder="Номер КУИ (если есть)"
              />
            </div>
            <div className="form-group">
              <label>№ ЕРДР</label>
              <input
                type="text"
                name="erdr_number"
                value={formData.erdr_number}
                onChange={handleChange}
                placeholder="Номер ЕРДР (если есть)"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Фото</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                id="photo-input"
                accept="image/*"
                onChange={handlePhotoChange}
              />
              <label htmlFor="photo-input" className="file-label">
                {photo ? photo.name : 'Выберите файл'}
              </label>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Отмена
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportForm;