import React from 'react';
import AdminLayout from '../../components/AdminLayout';
import './CRUDPage.css';

const PrizesPage = () => {
  return (
    <AdminLayout>
      <h1>Управление призами</h1>
      
      <div className="crud-header">
        <button className="btn-primary">+ Добавить приз</button>
      </div>

      <div className="crud-placeholder">
        <p>🎁 Здесь будет CRUD-интерфейс для управления призами:</p>
        <ul>
          <li>Таблица (Название, Цена в баллах, Статус: Активен/Неактивен)</li>
          <li>Кнопки "Редактировать" и "Удалить"</li>
          <li>Форма с полями: Название, Описание, Цена в баллах, Загрузка картинки</li>
          <li>Чекбокс "Активен"</li>
        </ul>
      </div>
    </AdminLayout>
  );
};

export default PrizesPage;