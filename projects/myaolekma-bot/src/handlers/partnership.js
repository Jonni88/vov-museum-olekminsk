/**
 * Сотрудничество
 */

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'partnership',
    step: 'topic',
    data: {}
  });
  
  bot.sendMessage(chatId, 
    '🤝 *Сотрудничество*\n\n' +
    'Опишите ваше предложение о сотрудничестве:\n' +
    '(сфера, условия, ожидания)',
    { parse_mode: 'Markdown' }
  );
}

async function handleCallback(bot, query, userStates) {
  if (query.data === 'partner_cancel') {
    userStates.delete(query.message.chat.id);
    await bot.editMessageText('❌ Отменено', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);
  
  if (!state || state.context !== 'partnership') return;
  
  if (state.step === 'topic') {
    if (text.length < 10) {
      await bot.sendMessage(chatId, '⚠️ Описание слишком короткое. Расскажите подробнее:');
      return;
    }
    
    state.data.topic = text;
    state.step = 'contacts';
    await bot.sendMessage(chatId, 
      `✅ Сохранено\n\n📞 Введите ваши контактные данные:`
    );
    return;
  }
  
  if (state.step === 'contacts') {
    state.data.contacts = text;
    
    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);
    
    await bot.sendMessage(chatId, 
      `🙏 *Спасибо!*\n\n` +
      `Ваши данные отправлены. Админ их проверит и если будут вопросы — свяжется с вами.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );
    
    userStates.delete(chatId);
  }
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;
  
  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;
  
  let message = `🤝 *Новое предложение о сотрудничестве!*\n\n`;
  message += `*Тема:*\n${data.topic}\n\n`;
  message += `*Контакты:* ${data.contacts}\n\n`;
  message += `*Отправитель:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;
  
  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Ответить', callback_data: `admin_partner_reply:${userChatId}` }
        ]
      ]
    }
  });
}

module.exports = {
  start,
  handleCallback,
  handleMessage
};
