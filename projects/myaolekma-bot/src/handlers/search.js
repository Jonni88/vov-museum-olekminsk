/**
 * Поиск по сайту
 */

const axios = require('axios');
const cheerio = require('cheerio');

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'search',
    step: 'query',
    data: {}
  });

  bot.sendMessage(chatId,
    '🔍 *Поиск по сайту*\n\n' +
    'Введите запрос для поиска:\n' +
    'Например: электрик, доставка еды, автосервис',
    { parse_mode: 'Markdown' }
  );
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'search') return;

  if (state.step === 'query') {
    if (text.length < 2) {
      await bot.sendMessage(chatId, '⚠️ Запрос слишком короткий. Введите минимум 2 символа:');
      return;
    }

    // Показываем "ищем"
    bot.sendChatAction(chatId, 'typing');

    // Здесь можно добавить реальный поиск по сайту
    // Пока показываем заглушку с ссылкой
    const searchUrl = `${config.siteUrl}/search?query=${encodeURIComponent(text)}`;

    await bot.sendMessage(chatId,
      `🔍 *Результаты поиска:* «${text}»\n\n` +
      `Поиск выполнен на сайте мояолекма.рф\n\n` +
      `👇 Откройте результаты по ссылке:`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '🔍 Открыть результаты поиска', url: searchUrl }],
            [{ text: '🏠 Главное меню', callback_data: 'search_done' }]
          ]
        }
      }
    );

    userStates.delete(chatId);
  }
}

module.exports = {
  start,
  handleMessage
};
