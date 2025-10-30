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
    incident_time: ''
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Функция обратного геокодирования (преобразование координат в адрес)
  const reverseGeocode = async (lat, lng) => {
    try {
      setGeocoding(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.address) {
        // Собираем адрес из компонентов
        const addressParts = [];
        const { road, house_number, suburb, city, town, county } = data.address;
        
        if (road) {
          addressParts.push(house_number ? `${road}, ${house_number}` : road);
        }
        if (suburb && suburb !== city && suburb !== town) {
          addressParts.push(suburb);
        }
        if (city || town) {
          addressParts.push(city || town);
        }
        
        const address = addressParts.join(', ') || data.display_name;
        
        setFormData(prev => ({
          ...prev,
          address: address
        }));
      }
      setGeocoding(false);
    } catch (err) {
      console.error('Ошибка при геокодировании:', err);
      setGeocoding(false);
    }
  };

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
      const newLat = parseFloat(latLng.lat.toFixed(6));
      const newLng = parseFloat(latLng.lng.toFixed(6));
      setFormData(prev => ({
        ...prev,
        latitude: newLat,
        longitude: newLng
      }));
      reverseGeocode(newLat, newLng);
    });

    // Добавление маркера при клике на карту
    map.on('click', function(e) {
      marker.setLatLng(e.latlng);
      const newLat = parseFloat(e.latlng.lat.toFixed(6));
      const newLng = parseFloat(e.latlng.lng.toFixed(6));
      setFormData(prev => ({
        ...prev,
        latitude: newLat,
        longitude: newLng
      }));
      reverseGeocode(newLat, newLng);
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
      [name]: value
    }));
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
      
      // Объединяем дату и время
      const incidentDateTime = formData.incident_date && formData.incident_time
        ? `${formData.incident_date}T${formData.incident_time}`
        : formData.incident_date;
      
      // Добавляем все поля кроме incident_time (которое объединено с датой)
      Object.keys(formData).forEach(key => {
        if (key === 'incident_time') return; // Пропускаем время отдельно
        if (key === 'incident_date' && incidentDateTime) {
          data.append(key, incidentDateTime);
        } else if (formData[key] !== '' && key !== 'incident_date') {
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

          <div className="form-group">
            <label>Адрес *</label>
            <div className="address-input-wrapper">
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Укажите адрес происшествия"
                required
                disabled={geocoding}
              />
              {geocoding && (
                <span className="geocoding-indicator">
                  <span className="spinner"></span>
                  <span className="loading-text">Получение адреса...</span>
                </span>
              )}
            </div>
            <small className="address-hint">Адрес получается автоматически при выборе места на карте</small>
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
            <label>Дата инцидента</label>
            <input
              type="date"
              name="incident_date"
              value={formData.incident_date}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Время инцидента</label>
            <input
              type="time"
              name="incident_time"
              value={formData.incident_time}
              onChange={handleChange}
            />
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