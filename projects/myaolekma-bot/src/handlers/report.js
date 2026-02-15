/**
 * Пожаловаться на проблему
 */

const REPORT_TYPES = [
  { id: 'wrong_data', name: 'Неправильные данные', icon: '❌' },
  { id: 'not_exist', name: 'Организация не существует', icon: '🚫' },
  { id: 'spam', name: 'Спам / Мошенничество', icon: '⚠️' },
  { id: 'other', name: 'Другое', icon: '📝' }
];

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'report',
    step: 'type',
    data: {}
  });

  const keyboard = REPORT_TYPES.map(t => [
    { text: `${t.icon} ${t.name}`, callback_data: `report_type:${t.id}` }
  ]);
  keyboard.push([{ text: '❌ Отмена', callback_data: 'report_cancel' }]);

  bot.sendMessage(chatId,
    '🚨 *Сообщить о проблеме*\n\n' +
    'Выберите тип проблемы:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  );
}

async function handleCallback(bot, query, userStates) {
  const data = query.data;
  const chatId = query.message.chat.id;

  if (data === 'report_cancel') {
    userStates.delete(chatId);
    await bot.editMessageText('❌ Отменено', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    return;
  }

  if (data.startsWith('report_type:')) {
    const typeId = data.split(':')[1];
    const type = REPORT_TYPES.find(t => t.id === typeId);
    const state = userStates.get(chatId);

    if (state) {
      state.data.type = type.name;
      state.step = 'organization';

      await bot.editMessageText(
        `${type.icon} *${type.name}*\n\n` +
        `Укажите *название организации* или *ссылку* на страницу с проблемой:`,
        { chat_id: chatId, message_id: query.message.message_id, parse_mode: 'Markdown' }
      );
    }
  }
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'report') return;

  if (state.step === 'organization') {
    state.data.organization = text;
    state.step = 'details';
    await bot.sendMessage(chatId,
      `✅ Сохранено\n\n` +
      `Опишите *подробности* проблемы:`
    );
    return;
  }

  if (state.step === 'details') {
    if (text.length < 5) {
      await bot.sendMessage(chatId, '⚠️ Опишите подробнее:');
      return;
    }

    state.data.details = text;

    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);

    await bot.sendMessage(chatId,
      `🙏 *Спасибо!*\n\n` +
      `Ваша жалоба отправлена администратору. Мы проверим и примем меры.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );

    userStates.delete(chatId);
  }
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;

  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;

  let message = `🚨 *Жалоба на проблему!*\n\n`;
  message += `*Тип:* ${data.type}\n`;
  message += `*Организация:* ${data.organization}\n\n`;
  message += `*Подробности:*\n${data.details}\n\n`;
  message += `*Отправил:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;

  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Принято к сведению', callback_data: `admin_report_done:${userChatId}` }
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
