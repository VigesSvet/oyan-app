/**
 * Обработка ошибок от FastAPI
 * @param {Error} error - Объект ошибки от axios
 * @param {string} defaultMessage - Сообщение по умолчанию
 * @returns {string} - Читаемое сообщение об ошибке
 */
export const handleApiError = (error, defaultMessage = 'Произошла ошибка') => {
  if (!error.response) {
    return 'Ошибка сети. Проверьте подключение к интернету.';
  }

  const { data } = error.response;

  // Если detail - это строка, возвращаем её
  if (typeof data?.detail === 'string') {
    return data.detail;
  }

  // Если detail - это массив объектов валидации (ошибка 422)
  if (Array.isArray(data?.detail)) {
    const errors = data.detail.map(err => {
      if (err.msg) {
        const field = err.loc ? err.loc[err.loc.length - 1] : 'поле';
        return `${field}: ${err.msg}`;
      }
      return JSON.stringify(err);
    });
    return errors.join(', ');
  }

  // Если detail - объект
  if (typeof data?.detail === 'object') {
    return JSON.stringify(data.detail);
  }

  // Если есть другое сообщение
  if (data?.message) {
    return data.message;
  }

  return defaultMessage;
};