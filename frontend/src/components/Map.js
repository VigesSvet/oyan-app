import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import './Map.css';

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

// Цвета маркеров для разных типов обращений
const MARKER_COLORS = {
  drug_dealer: '#0066FF',      // Синий - наркозакладчики
  drug_graffiti: '#FFD700',    // Желтый - наркограффити
  drug_den: '#FF0000',          // Красный - наркопритон
  drug_addict: '#FF8C00',       // Оранжевый - наркозависимые
  overdose: '#8B00FF',          // Фиолетовый - передозировка
  other: '#808080'              // Серый - прочее
};

const REPORT_TYPE_NAMES = {
  drug_dealer: 'Наркозакладчики',
  drug_graffiti: 'Наркограффити',
  drug_den: 'Наркопритон',
  drug_addict: 'Проживание наркозависимых',
  overdose: 'Передозировка',
  other: 'Иные сведения'
};

// Создание SVG маркера
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2" opacity="0.9"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16]
  });
};

const Map = ({ reports, onMarkerClick, center = [49.95, 82.6167], isStatic = false }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerClusterGroupRef = useRef(null);
  const heatmapLayerRef = useRef(null);
  const [showHeatmap, setShowHeatmap] = useState(false);

  // Инициализация карты
  useEffect(() => {
    if (!mapContainer.current) return;

    // Создаем карту без стандартных кнопок масштабирования
    const map = L.map(mapContainer.current, {
      zoomControl: false,
      dragging: !isStatic,
      touchZoom: !isStatic,
      doubleClickZoom: !isStatic,
      scrollWheelZoom: !isStatic,
      keyboard: !isStatic
    }).setView(center, 13);

    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    // Создаем группу с кластеризацией
    const markerClusterGroup = new L.markerClusterGroup({
      maxClusterRadius: 80,
      disableClusteringAtZoom: 16
    });

    mapRef.current = map;
    markerClusterGroupRef.current = markerClusterGroup;
    map.addLayer(markerClusterGroup);

    // Добавляем масштаб
    L.control.scale().addTo(map);

    return () => {
      map.remove();
    };
  }, []);

  // Создание маркера с всплывающим окном
  const createMarker = (report) => {
    const color = MARKER_COLORS[report.report_type] || MARKER_COLORS.other;
    const icon = createCustomIcon(color);

    const popupContent = `
      <div style="max-width: 300px; font-family: Arial, sans-serif; font-size: 12px;">
        <h3 style="margin: 0 0 10px 0; font-size: 14px; color: #333;">
          ${REPORT_TYPE_NAMES[report.report_type]}
        </h3>
        <p style="margin: 5px 0;"><strong>Адрес:</strong> ${report.address}</p>
        <p style="margin: 5px 0;"><strong>Описание:</strong> ${report.description}</p>
        ${report.incident_date ? `<p style="margin: 5px 0;"><strong>Дата инцидента:</strong> ${report.incident_date}</p>` : ''}
        ${report.kuy_number ? `<p style="margin: 5px 0;"><strong>№ КУИ:</strong> ${report.kuy_number}</p>` : ''}
        ${report.erdr_number ? `<p style="margin: 5px 0;"><strong>№ ЕРДР:</strong> ${report.erdr_number}</p>` : ''}
        ${report.photo_url ? `<img src="http://localhost:8000${report.photo_url}" alt="Фото" style="max-width: 100%; margin-top: 10px; border-radius: 5px;" />` : ''}
      </div>
    `;

    const marker = L.marker([report.latitude, report.longitude], { icon })
      .bindPopup(popupContent)
      .bindTooltip(REPORT_TYPE_NAMES[report.report_type], { permanent: false });

    marker.on('click', () => {
      if (onMarkerClick) {
        onMarkerClick(report);
      }
    });

    return marker;
  };

  useEffect(() => {
    if (!mapRef.current || !markerClusterGroupRef.current || !reports) return;

    const markerClusterGroup = markerClusterGroupRef.current;
    
    markerClusterGroup.clearLayers();

    if (showHeatmap) {
      if (heatmapLayerRef.current) {
        mapRef.current.removeLayer(heatmapLayerRef.current);
      }

      const locationCounts = {};
      reports.forEach(report => {
        const key = `${report.latitude.toFixed(4)},${report.longitude.toFixed(4)}`;
        locationCounts[key] = (locationCounts[key] || 0) + 1;
      });

      const maxCount = Math.max(...Object.values(locationCounts));

      const createHeatmap = () => {
        const heatData = reports.map(report => {
          const key = `${report.latitude.toFixed(4)},${report.longitude.toFixed(4)}`;
          const count = locationCounts[key];
          return [
            report.latitude, 
            report.longitude,
            count / maxCount
          ];
        });

        const heatmapLayer = window.L.heatLayer(heatData, {
          radius: 25,
          blur: 15,
          maxZoom: 17,
          max: 1.0,
          minOpacity: 0.5,
          gradient: {
            0.0: 'blue',
            0.5: 'lime',
            1.0: 'red'
          }
        });

        heatmapLayer.addTo(mapRef.current);
        heatmapLayerRef.current = heatmapLayer;
      };

      if (!window.L.heatLayer) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
        script.onload = () => {
          createHeatmap();
        };
        document.head.appendChild(script);
      } else {
        createHeatmap();
      }
    } else {
      if (heatmapLayerRef.current) {
        mapRef.current.removeLayer(heatmapLayerRef.current);
        heatmapLayerRef.current = null;
      }

      reports.forEach(report => {
        const marker = createMarker(report);
        markerClusterGroup.addLayer(marker);
      });

      // Автоматически фокусируемся на маркерах
      if (markerClusterGroup.getLayers().length > 0) {
        mapRef.current.fitBounds(markerClusterGroup.getBounds(), { padding: [50, 50] });
      }
    }

  }, [reports, showHeatmap, onMarkerClick]);

  // Переключение режима отображения
  const toggleHeatmap = () => {
    setShowHeatmap(!showHeatmap);
  };

  // Функции для управления масштабом
  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="map-wrapper">
      <div ref={mapContainer} className="map-container" />
      
      {/* Переключатель режима и кнопки масштабирования (только в интерактивном режиме) */}
      {!isStatic && (
        <div className="map-controls">
          <div className="toggle-container">
            <div className={`toggle-icon ${!showHeatmap ? 'active' : ''}`}>
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <div className="toggle-switch" onClick={toggleHeatmap}>
              <div className={`toggle-slider ${showHeatmap ? 'active' : ''}`}></div>
            </div>
            <div className={`toggle-icon ${showHeatmap ? 'active' : ''}`}>
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
          </div>
          
          {/* Кастомные кнопки масштабирования */}
          <div className="zoom-controls">
            <button className="zoom-btn" onClick={zoomIn} title="Приблизить">
              <span className="material-symbols-outlined">add</span>
            </button>
            <button className="zoom-btn" onClick={zoomOut} title="Отдалить">
              <span className="material-symbols-outlined">remove</span>
            </button>
          </div>
        </div>
      )}

      {/* Легенда (только в интерактивном режиме) */}
      {!isStatic && !showHeatmap && (
        <div className="map-legend">
          <h4>Легенда:</h4>
          {Object.entries(MARKER_COLORS).map(([type, color]) => (
            <div key={type} className="legend-item">
              <span 
                className="legend-color" 
                style={{ backgroundColor: color }}
              />
              <span className="legend-label">
                {REPORT_TYPE_NAMES[type]}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Map;