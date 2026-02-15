/**
 * Обратная связь: вопросы, замечания, предложения
 */

const FEEDBACK_TYPES = [
  { id: 'question', name: 'Вопрос', icon: '❓' },
  { id: 'comment', name: 'Замечание', icon: '💡' },
  { id: 'suggestion', name: 'Предложение', icon: '✨' }
];

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'feedback',
    step: 'type',
    data: {}
  });

  const keyboard = FEEDBACK_TYPES.map(t => [
    { text: `${t.icon} ${t.name}`, callback_data: `feedback_type:${t.id}` }
  ]);
  keyboard.push([{ text: '❌ Отмена', callback_data: 'feedback_cancel' }]);

  bot.sendMessage(chatId,
    '💬 *Обратная связь*\n\n' +
    'Выберите тип обращения:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  );
}

async function handleCallback(bot, query, userStates) {
  const data = query.data;
  const chatId = query.message.chat.id;

  if (data === 'feedback_cancel') {
    userStates.delete(chatId);
    await bot.editMessageText('❌ Отменено', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    return;
  }

  if (data.startsWith('feedback_type:')) {
    const typeId = data.split(':')[1];
    const type = FEEDBACK_TYPES.find(t => t.id === typeId);
    const state = userStates.get(chatId);

    if (state) {
      state.data.type = type.name;
      state.step = 'message';

      await bot.editMessageText(
        `${type.icon} *${type.name}*\n\n` +
        `Опишите ваше ${type.name.toLowerCase()}:`
        ,
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }
      );
    }
  }
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'feedback') return;

  if (state.step === 'message') {
    if (text.length < 5) {
      await bot.sendMessage(chatId, '⚠️ Сообщение слишком короткое. Опишите подробнее:');
      return;
    }

    state.data.message = text;

    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);

    await bot.sendMessage(chatId,
      `🙏 *Спасибо за обратную связь!*\n\n` +
      `Ваше сообщение отправлено администратору.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );

    userStates.delete(chatId);
  }
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;

  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;

  let message = `💬 *Обратная связь!*\n\n`;
  message += `*Тип:* ${data.type}\n\n`;
  message += `*Сообщение:*\n${data.message}\n\n`;
  message += `*Отправил:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;

  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Прочитано', callback_data: `admin_feedback_done:${userChatId}` }
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
