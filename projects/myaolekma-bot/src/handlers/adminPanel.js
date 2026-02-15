/**
 * Панель администратора
 */

function showAdminMenu(bot, chatId, config) {
  if (chatId.toString() !== config.adminChatId) {
    bot.sendMessage(chatId, '⛔ У вас нет доступа к админ-панели');
    return;
  }
  
  bot.sendMessage(chatId, 
    '🔐 *Админ-панель*\n\n' +
    'Команды:\n' +
    '/stats — статистика бота\n' +
    '/reply [ID] [текст] — ответить пользователю',
    { parse_mode: 'Markdown' }
  );
}

function showStats(bot, chatId, config) {
  if (chatId.toString() !== config.adminChatId) return;
  
  // Здесь можно добавить реальную статистику из БД
  bot.sendMessage(chatId, 
    '📊 *Статистика бота*\n\n' +
    'В разработке...',
    { parse_mode: 'Markdown' }
  );
}

async function handleCallback(bot, query, userStates, config) {
  const data = query.data;
  const chatId = query.message.chat.id;
  
  // Проверяем что это админ
  if (chatId.toString() !== config.adminChatId) {
    await bot.answerCallbackQuery(query.id, { text: 'Нет доступа' });
    return;
  }
  
  // Обработка действий админа
  if (data.startsWith('admin_adv_take:')) {
    const userId = data.split(':')[1];
    await bot.sendMessage(chatId, `✅ Взяли заявку на рекламу от пользователя ${userId}`);
    await bot.sendMessage(userId, '📢 Ваша заявка на рекламу принята в работу!');
  }
  
  if (data.startsWith('admin_partner_reply:')) {
    const userId = data.split(':')[1];
    await bot.sendMessage(chatId, `🤝 Взяли предложение о сотрудничестве от ${userId}`);
    await bot.sendMessage(userId, '🤝 Ваше предложение о сотрудничестве рассматривается!');
  }
  
  if (data.startsWith('admin_claim_approve:')) {
    const userId = data.split(':')[1];
    await bot.sendMessage(chatId, `✅ Подтверждён доступ для ${userId}`);
    await bot.sendMessage(userId, 
      '🔐 *Доступ подтверждён!*\n\n' +
      'Теперь вы можете управлять своей организацией. ' +
      'Администратор свяжется с вами для передачи доступа.',
      { parse_mode: 'Markdown' }
    );
  }
  
  if (data.startsWith('admin_claim_reject:')) {
    const userId = data.split(':')[1];
    await bot.sendMessage(chatId, `❌ Отклонён доступ для ${userId}`);
    await bot.sendMessage(userId, 
      '🔐 К сожалению, мы не смогли подтвердить ваше право на управление организацией. ' +
      'Свяжитесь с администратором для уточнения.'
    );
  }
  
  if (data.startsWith('admin_done:')) {
    const userId = data.split(':')[1];
    await bot.sendMessage(chatId, `✅ Отметили как выполненное: ${userId}`);
    await bot.sendMessage(userId, 
      '✅ *Готово!*\n\n' +
      'Ваша информация добавлена на сайт мояолекма.рф\n\n' +
      `👉 ${config.siteUrl}`,
      { parse_mode: 'Markdown' }
    );
  }
}

module.exports = {
  showAdminMenu,
  showStats,
  handleCallback
};
