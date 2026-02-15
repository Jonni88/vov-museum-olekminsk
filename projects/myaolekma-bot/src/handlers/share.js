/**
 * Поделиться организацией
 */

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'share',
    step: 'organization',
    data: {}
  });

  bot.sendMessage(chatId,
    '📤 *Поделиться организацией*\n\n' +
    'Введите *название организации*, которой хотите поделиться:',
    { parse_mode: 'Markdown' }
  );
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'share') return;

  if (state.step === 'organization') {
    state.data.organization = text;

    // Генерируем красивое сообщение для шеринга
    const shareText = generateShareText(state.data.organization, config);

    await bot.sendMessage(chatId,
      `✅ Готово!\n\n` +
      `Вот сообщение для отправки друзьям:`,
      { parse_mode: 'Markdown' }
    );

    // Отправляем сообщение которое можно переслать
    await bot.sendMessage(chatId, shareText, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '➡️ Отправить другу', url: `https://t.me/share/url?text=${encodeURIComponent(shareText)}` }]
        ]
      }
    });

    userStates.delete(chatId);
  }
}

function generateShareText(orgName, config) {
  return `🏢 *${orgName}*\n\n` +
         `Нашёл на справочнике Олёкминского района *мояолекма.рф*!\n\n` +
         `👉 ${config.siteUrl}\n\n` +
         `Рекомендую 👍`;
}

module.exports = {
  start,
  handleMessage
};
