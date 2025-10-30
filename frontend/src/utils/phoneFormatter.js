/**
 * Форматирует номер телефона в формат: +7 (XXX) XXX-XX-XX
 * @param {string} value - Введённое значение
 * @returns {string} - Отформатированный номер
 */
export const formatPhoneNumber = (value) => {
  // Убираем все символы кроме цифр и плюса
  let cleaned = value.replace(/\D/g, '');
  
  // Если пусто, вернём пусто
  if (!cleaned) return '';
  
  // Если первая цифра не 7, добавим 7
  if (cleaned[0] !== '7' && cleaned.length > 0) {
    if (cleaned.length === 10) {
      cleaned = '7' + cleaned;
    }
  }
  
  // Ограничиваем до 11 цифр (7 + 10 цифр)
  cleaned = cleaned.slice(0, 11);
  
  // Форматируем
  if (cleaned.length <= 1) {
    return '+' + cleaned;
  } else if (cleaned.length <= 4) {
    return '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1);
  } else if (cleaned.length <= 7) {
    return '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4);
  } else if (cleaned.length <= 9) {
    return '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4, 7) + '-' + cleaned.slice(7);
  } else {
    return '+' + cleaned.slice(0, 1) + ' (' + cleaned.slice(1, 4) + ') ' + cleaned.slice(4, 7) + '-' + cleaned.slice(7, 9) + '-' + cleaned.slice(9);
  }
};

/**
 * Возвращает чистый номер телефона для отправки на сервер (только цифры с плюсом)
 * @param {string} formatted - Отформатированный номер
 * @returns {string} - Номер в формате +7XXXXXXXXXX
 */
export const getCleanPhoneNumber = (formatted) => {
  const cleaned = formatted.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned[0] === '7') {
    return '+' + cleaned;
  }
  return formatted;
};