import React, { useState, useEffect } from 'react';
import '../pages/MapPage.css';
import './NewsPagePublic.css';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedNews, setSelectedNews] = useState(null);

  // Получить все опубликованные новости
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('https://oyan-app.onrender.com/api/news');
      
      if (!response.ok) {
        throw new Error('Ошибка при загрузке новостей');
      }

      const data = await response.json();
      setNews(data);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '40px' }}>
      <div style={{ marginBottom: '40px' }}>
        <h1 style={{ marginBottom: '16px' }}>Новости</h1>
        <p style={{ color: '#6C757D', fontSize: '16px', margin: 0 }}>
          Последние новости и обновления проекта
        </p>
      </div>

      {error && (
        <div style={{
          background: '#FFEBEE',
          color: '#D32F2F',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '24px',
        }}>
          ❌ {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ fontSize: '16px', color: '#6C757D' }}>Загрузка новостей...</p>
        </div>
      ) : news.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📰</div>
          <p style={{ fontSize: '16px', color: '#6C757D', margin: 0 }}>
            Новостей пока нет. Проверьте позже.
          </p>
        </div>
      ) : (
        <div className="news-grid">
          {news.map((item) => (
            <div key={item.id} className="news-card" onClick={() => setSelectedNews(item)}>
              {item.image_url && (
                <div className="news-card-image">
                  <img src={`https://oyan-app.onrender.com${item.image_url}`} alt={item.title} />
                </div>
              )}
              <div className="news-card-header">
                <h3 className="news-card-title">{item.title}</h3>
              </div>
              <p className="news-card-excerpt">{item.content.substring(0, 150)}...</p>
              <div className="news-card-footer">
                <span className="news-card-date">
                  {new Date(item.created_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
                <button className="news-card-button">Читать далее →</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно с полным текстом новости */}
      {selectedNews && (
        <div className="news-modal-overlay" onClick={() => setSelectedNews(null)}>
          <div className="news-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="news-modal-close" onClick={() => setSelectedNews(null)}>
              ✕
            </button>
            
            {selectedNews.image_url && (
              <div className="news-modal-image">
                <img src={`https://oyan-app.onrender.com${selectedNews.image_url}`} alt={selectedNews.title} />
              </div>
            )}
            
            <div className="news-modal-header">
              <h2>{selectedNews.title}</h2>
              <p className="news-modal-date">
                {new Date(selectedNews.created_at).toLocaleDateString('ru-RU', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>

            <div className="news-modal-body">
              {selectedNews.content.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewsPage;