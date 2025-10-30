import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import './CRUDPage.css';

const NewsPage = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    is_published: false,
    image_url: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Получить все новости
  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/admin/news', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

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

  // Открыть модальное окно для создания новой новости
  const handleCreateClick = () => {
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      is_published: false,
      image_url: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  // Открыть модальное окно для редактирования
  const handleEditClick = (newsItem) => {
    setEditingNews(newsItem);
    setFormData({
      title: newsItem.title,
      content: newsItem.content,
      is_published: newsItem.is_published,
      image_url: newsItem.image_url || '',
    });
    setImageFile(null);
    setImagePreview(newsItem.image_url || null);
    setShowModal(true);
  };

  // Закрыть модальное окно
  const handleCloseModal = () => {
    setShowModal(false);
    setEditingNews(null);
    setFormData({
      title: '',
      content: '',
      is_published: false,
      image_url: '',
    });
    setImageFile(null);
    setImagePreview(null);
  };

  // Обновить поля формы
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  // Обработка загрузки изображения
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Сохранить новость
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim()) {
      setError('Заполните все поля');
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const requestBody = { ...formData };
      
      // Если есть новый файл изображения, загружаем его
      if (imageFile) {
        const formDataWithFile = new FormData();
        formDataWithFile.append('file', imageFile);
        
        const uploadResponse = await fetch('http://localhost:8000/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: formDataWithFile,
        });

        if (!uploadResponse.ok) {
          const errorData = await uploadResponse.json();
          throw new Error(errorData.detail || 'Ошибка при загрузке изображения. Проверьте, что сервер запущен.');
        }

        const uploadData = await uploadResponse.json();
        requestBody.image_url = uploadData.file_path || uploadData.url;
      }

      let response;
      if (editingNews) {
        // Обновление существующей новости
        response = await fetch(`http://localhost:8000/api/admin/news/${editingNews.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      } else {
        // Создание новой новости
        response = await fetch('http://localhost:8000/api/admin/news', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        });
      }

      if (!response.ok) {
        throw new Error('Ошибка при сохранении новости');
      }

      // Обновить список новостей
      await fetchNews();
      handleCloseModal();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  // Удалить новость
  const handleDelete = async (newsId) => {
    if (!window.confirm('Вы уверены, что хотите удалить эту новость?')) {
      return;
    }

    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`http://localhost:8000/api/admin/news/${newsId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка при удалении новости');
      }

      // Обновить список новостей
      await fetchNews();
    } catch (err) {
      setError(err.message);
      console.error(err);
    }
  };

  return (
    <AdminLayout>
      <h1>Управление новостями</h1>

      {error && (
        <div style={{
          background: '#FFEBEE',
          color: '#D32F2F',
          padding: '12px 16px',
          borderRadius: '6px',
          marginBottom: '16px',
        }}>
          ❌ {error}
        </div>
      )}

      <div className="crud-header">
        <button className="btn-primary" onClick={handleCreateClick}>
          + Написать новость
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>Загрузка...</p>
        </div>
      ) : news.length === 0 ? (
        <div className="news-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">—</div>
            <p>Нет новостей. Создайте первую новость!</p>
          </div>
        </div>
      ) : (
        <div className="news-table-container">
          <table className="news-table">
            <thead>
              <tr>
                <th>Заголовок</th>
                <th>Статус</th>
                <th>Дата создания</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {news.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <div style={{ fontSize: '12px', color: '#6C757D', marginTop: '4px' }}>
                      {item.content.substring(0, 50)}...
                    </div>
                  </td>
                  <td>
                    <span className={`news-status ${item.is_published ? 'status-published' : 'status-draft'}`}>
                      {item.is_published ? 'Опубликовано' : 'Черновик'}
                    </span>
                  </td>
                  <td>{new Date(item.created_at).toLocaleDateString('ru-RU')}</td>
                  <td>
                    <div className="news-actions">
                      <button className="btn-edit" onClick={() => handleEditClick(item)}>
                        Редактировать
                      </button>
                      <button className="btn-delete" onClick={() => handleDelete(item.id)}>
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingNews ? 'Редактировать новость' : 'Новая новость'}</h2>
              <button className="modal-close" onClick={handleCloseModal}>
                ✕
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Заголовок *</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Введите заголовок новости"
                  required
                />
              </div>

              <div className="form-group">
                <label>Содержание *</label>
                <textarea
                  name="content"
                  value={formData.content}
                  onChange={handleFormChange}
                  placeholder="Введите содержание новости"
                  required
                />
              </div>

              <div className="form-group">
                <label>Изображение</label>
                <div style={{
                  border: '2px dashed #007BFF',
                  borderRadius: '8px',
                  padding: '16px',
                  textAlign: 'center',
                  backgroundColor: '#F8F9FA',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}>
                  <input
                    type="file"
                    id="imageInput"
                    onChange={handleImageChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="imageInput" style={{
                    cursor: 'pointer',
                    display: 'block',
                    margin: 0,
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>⬆</div>
                    <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>
                      Нажмите для загрузки изображения
                    </p>
                    <p style={{ margin: 0, fontSize: '12px', color: '#6C757D' }}>
                      или перетащите файл сюда
                    </p>
                  </label>
                </div>
                {imagePreview && (
                  <div style={{ marginTop: '12px', position: 'relative', width: '100%' }}>
                    <img
                      src={imagePreview}
                      alt="Preview"
                      style={{
                        maxWidth: '100%',
                        maxHeight: '200px',
                        width: '100%',
                        height: 'auto',
                        borderRadius: '8px',
                        display: 'block',
                        objectFit: 'cover',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      style={{
                        marginTop: '8px',
                        padding: '6px 12px',
                        backgroundColor: '#DC3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        width: '100%',
                        fontWeight: '600',
                      }}
                    >
                      Удалить изображение
                    </button>
                  </div>
                )}
              </div>

              <div className="form-group">
                <div className="checkbox-group">
                  <input
                    type="checkbox"
                    id="is_published"
                    name="is_published"
                    checked={formData.is_published}
                    onChange={handleFormChange}
                  />
                  <label htmlFor="is_published" style={{ margin: 0 }}>
                    Опубликовать новость
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                  Отмена
                </button>
                <button type="submit" className="btn-save">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default NewsPage;