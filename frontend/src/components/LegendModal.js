import React, { useEffect } from 'react';
import './LegendModal.css';

const MARKER_COLORS = {
  drug_dealer: '#0066FF',
  drug_graffiti: '#FFD700',
  drug_den: '#FF0000',
  drug_addict: '#FF8C00',
  overdose: '#8B00FF',
  other: '#808080'
};

const REPORT_TYPE_NAMES = {
  drug_dealer: 'Наркозакладчики',
  drug_graffiti: 'Наркограффити',
  drug_den: 'Наркопритон',
  drug_addict: 'Проживание наркозависимых',
  overdose: 'Передозировка',
  other: 'Иные сведения'
};

const LegendModal = ({ isOpen, onClose }) => {
  // Блокируем прокрутку фона при открытии модального окна
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      <div className="legend-modal-overlay" onClick={onClose} />
      <div className="legend-modal">
        <div className="legend-modal-header">
          <h3>Легенда карты</h3>
          <button className="legend-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="legend-modal-content">
          {Object.entries(MARKER_COLORS).map(([type, color]) => (
            <div key={type} className="legend-modal-item">
              <span 
                className="legend-modal-color" 
                style={{ backgroundColor: color }}
              />
              <span className="legend-modal-label">
                {REPORT_TYPE_NAMES[type]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default LegendModal;