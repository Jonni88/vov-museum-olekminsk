/**
 * Добавление недостающего хэштега
 */

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'hashtag',
    step: 'organization',
    data: {}
  });

  bot.sendMessage(chatId,
    '#️⃣ *Добавление хэштега*\n\n' +
    'Укажите название *организации или услуги*, к которой нужно добавить хэштег:',
    { parse_mode: 'Markdown' }
  );
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'hashtag') return;

  if (state.step === 'organization') {
    state.data.organization = text;
    state.step = 'hashtag';
    await bot.sendMessage(chatId,
      `✅ Организация: *${text}*\n\n` +
      `Какой *хэштег* нужно добавить?\n` +
      `Примеры: #сантехника #доставка #строительство`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  if (state.step === 'hashtag') {
    // Проверяем формат хэштега
    if (!text.includes('#')) {
      await bot.sendMessage(chatId, '⚠️ Укажите хэштег со знаком # (например: #сантехника):');
      return;
    }

    state.data.hashtag = text;

    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);

    await bot.sendMessage(chatId,
      `🙏 *Спасибо!*\n\n` +
      `Хэштег отправлен админу на проверку.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );

    userStates.delete(chatId);
  }
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;

  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;

  let message = `#️⃣ *Запрос на добавление хэштега!*\n\n`;
  message += `*Организация/услуга:* ${data.organization}\n`;
  message += `*Хэштег:* ${data.hashtag}\n\n`;
  message += `*Отправил:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;

  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Добавлено', callback_data: `admin_hashtag_done:${userChatId}` }
        ]
      ]
    }
  });
}

module.exports = {
  start,
  handleMessage
};
