import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import './CRUDPage.css';

const NewsPage = () => {
  return (
    <AdminLayout>
      <h1>Управление новостями</h1>
      
      <div className="crud-header">
        <button className="btn-primary">+ Написать новость</button>
      </div>

      <div className="crud-placeholder">
        <p>📰 Здесь будет CRUD-интерфейс для управления новостями:</p>
        <ul>
          <li>Таблица со списком новостей (Заголовок, Дата, Статус)</li>
          <li>Кнопки "Редактировать" и "Удалить"</li>
          <li>Форма создания/редактирования с WYSIWYG редактором</li>
          <li>Чекбокс "Опубликовать"</li>
        </ul>
      </div>
    </AdminLayout>
  );
};

export default NewsPage;