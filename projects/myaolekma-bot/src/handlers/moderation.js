// Хранилище заявок (в памяти или заменить на БД)
const pendingSubmissions = new Map();

/**
 * Сохранить заявку
 */
function saveSubmission(id, data) {
  pendingSubmissions.set(id, data);
}

/**
 * Получить заявку
 */
function getSubmission(id) {
  return pendingSubmissions.get(id);
}

/**
 * Удалить заявку
 */
function deleteSubmission(id) {
  pendingSubmissions.delete(id);
}

/**
 * Обработка callback-запросов модерации
 */
async function handleCallback(bot, query, config) {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  
  // Проверяем, что callback от админа
  if (chatId.toString() !== config.adminChatId) {
    await bot.answerCallbackQuery(query.id, { 
      text: '⛔ Только администратор может модерировать',
      show_alert: true 
    });
    return;
  }
  
  if (data.startsWith('approve:')) {
    const submissionId = data.split(':')[1];
    await approveSubmission(bot, chatId, messageId, submissionId, query);
  } 
  else if (data.startsWith('reject:')) {
    const submissionId = data.split(':')[1];
    await rejectSubmission(bot, chatId, messageId, submissionId, query);
  }
  else if (data.startsWith('view:')) {
    const submissionId = data.split(':')[1];
    await viewFullSubmission(bot, chatId, submissionId, query);
  }
}

/**
 * Одобрение заявки
 */
async function approveSubmission(bot, chatId, messageId, submissionId, query) {
  const submission = getSubmission(submissionId);
  
  if (!submission) {
    await bot.answerCallbackQuery(query.id, { 
      text: '❌ Заявка не найдена (возможно, уже обработана)',
      show_alert: true 
    });
    return;
  }
  
  try {
    // Здесь логика публикации на Joomla
    // await publishToJoomla(submission);
    
    console.log('Publishing to Joomla:', submission);
    
    // Обновляем сообщение админа
    await bot.editMessageCaption(
      query.message.caption + '\n\n✅ *ОДОБРЕНО* админом',
      {
        chat_id: chatId,
        message_id: messageId,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [] }
      }
    );
    
    // Уведомляем пользователя
    await bot.sendMessage(
      submission.userId,
      `🎉 *Отличные новости!*\n\n` +
      `Твоя заявка «${submission.name}» одобрена и опубликована на сайте мояолекма.рф!\n\n` +
      `👉 ${config.joomla.siteUrl}`,
      { parse_mode: 'Markdown' }
    );
    
    deleteSubmission(submissionId);
    
    await bot.answerCallbackQuery(query.id, { text: '✅ Одобрено!' });
    
  } catch (error) {
    console.error('Approval error:', error);
    await bot.answerCallbackQuery(query.id, { 
      text: '❌ Ошибка при публикации',
      show_alert: true 
    });
  }
}

/**
 * Отклонение заявки
 */
async function rejectSubmission(bot, chatId, messageId, submissionId, query) {
  const submission = getSubmission(submissionId);
  
  if (!submission) {
    await bot.answerCallbackQuery(query.id, { 
      text: '❌ Заявка не найдена (возможно, уже обработана)',
      show_alert: true 
    });
    return;
  }
  
  // Запрашиваем причину отклонения
  await bot.sendMessage(chatId, 
    `❌ *Отклонение заявки* «${submission.name}»\n\n` +
    `Напиши причину отклонения (или отправь «без комментария»):`,
    { parse_mode: 'Markdown' }
  );
  
  // Сохраняем состояние ожидания причины
  // В реальном проекте: await saveAdminState(chatId, { action: 'awaiting_reject_reason', submissionId });
  
  await bot.answerCallbackQuery(query.id, { text: 'Введите причину отклонения' });
}

/**
 * Показать полную информацию о заявке
 */
async function viewFullSubmission(bot, chatId, submissionId, query) {
  const submission = getSubmission(submissionId);
  
  if (!submission) {
    await bot.answerCallbackQuery(query.id, { 
      text: '❌ Заявка не найдена',
      show_alert: true 
    });
    return;
  }
  
  let fullText = `📋 *ПОЛНАЯ ИНФОРМАЦИЯ О ЗАЯВКЕ*\n\n`;
  fullText += `*ID:* ${submissionId}\n`;
  fullText += `*Тип:* ${submission.typeName}\n`;
  fullText += `*Название:* ${submission.name}\n\n`;
  fullText += `*Описание:*\n${submission.description}\n\n`;
  
  if (submission.schedule) fullText += `*График:* ${submission.schedule}\n`;
  if (submission.phones) fullText += `*Телефоны:* ${submission.phones}\n`;
  if (submission.email) fullText += `*Email:* ${submission.email}\n`;
  if (submission.address) fullText += `*Адрес:* ${submission.address}\n`;
  if (submission.social) fullText += `*Соцсети:* ${submission.social}\n`;
  
  fullText += `\n*Отправитель:* @${submission.username || 'неизвестно'}`;
  fullText += `\n*Время:* ${new Date(submission.submittedAt).toLocaleString('ru-RU')}`;
  
  await bot.sendMessage(chatId, fullText, { parse_mode: 'Markdown' });
  await bot.answerCallbackQuery(query.id);
}

/**
 * Публикация в Joomla (заглушка)
 * В реальном проекте — интеграция с Joomla API
 */
async function publishToJoomla(submission) {
  // Примеры интеграции:
  
  // 1. Через Joomla API (если установлена поддержка)
  // const response = await axios.post(`${config.joomla.siteUrl}/api/index.php/v1/content/articles`, {
  //   title: submission.name,
  //   introtext: submission.description,
  //   catid: getCategoryId(submission.type),
  //   state: 1 // опубликовано
  // }, {
  //   headers: { 'X-Joomla-Token': config.joomla.apiKey }
  // });
  
  // 2. Через прямой доступ к БД MySQL
  // const connection = await mysql.createConnection({...});
  // await connection.execute('INSERT INTO jos_content (...) VALUES (...)', [...]);
  
  // 3. Через webhook/endpoint
  // await axios.post(`${config.joomla.siteUrl}/custom-endpoint.php`, submission);
  
  console.log('Would publish to Joomla:', submission);
  return { success: true, articleId: '12345' };
}

module.exports = {
  handleCallback,
  saveSubmission,
  getSubmission,
  deleteSubmission,
  publishToJoomla
};
