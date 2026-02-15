/**
 * Актуализация данных организации
 */

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'update_data',
    step: 'organization',
    data: {}
  });

  bot.sendMessage(chatId,
    '🔄 *Актуализация данных*\n\n' +
    'Укажите *название организации*, данные которой нужно обновить:',
    { parse_mode: 'Markdown' }
  );
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'update_data') return;

  if (state.step === 'organization') {
    state.data.organization = text;
    state.step = 'changes';
    await bot.sendMessage(chatId,
      `✅ Организация: *${text}*\n\n` +
      `Опишите, *что изменилось*:\n` +
      `• Телефон\n` +
      `• Адрес\n` +
      `• График работы\n` +
      `• Название\n` +
      `• Другое\n\n` +
      `Напишите подробно:`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (state.step === 'changes') {
    if (text.length < 10) {
      await bot.sendMessage(chatId, '⚠️ Опишите подробнее, что именно изменилось:');
      return;
    }

    state.data.changes = text;
    state.step = 'new_data';
    await bot.sendMessage(chatId,
      `✅ Сохранено\n\n` +
      `Введите *актуальные данные* (телефон, адрес, график и т.д.):`
    );
    return;
  }

  if (state.step === 'new_data') {
    state.data.newData = text;

    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);

    await bot.sendMessage(chatId,
      `🙏 *Спасибо!*\n\n` +
      `Актуальные данные отправлены админу. Информация на сайте будет обновлена.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );

    userStates.delete(chatId);
  }
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;

  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;

  let message = `🔄 *Актуализация данных!*\n\n`;
  message += `*Организация:* ${data.organization}\n\n`;
  message += `*Что изменилось:*\n${data.changes}\n\n`;
  message += `*Актуальные данные:*\n${data.newData}\n\n`;
  message += `*Отправил:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;

  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Данные обновлены', callback_data: `admin_update_done:${userChatId}` }
        ]
      ]
    }
  });
}

module.exports = {
  start,
  handleMessage
};
