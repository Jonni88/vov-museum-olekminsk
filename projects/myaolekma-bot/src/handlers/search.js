const axios = require('axios');
const cheerio = require('cheerio');
const config = require('../config/config');

/**
 * Поиск по сайту мояолекма.рф
 * Использует парсинг HTML или API Joomla
 */
async function searchOnSite(query) {
  try {
    // Вариант 1: Если есть поисковый endpoint
    // const response = await axios.get(`${config.joomla.siteUrl}/search`, {
    //   params: { query, format: 'json' }
    // });
    // return response.data.results;
    
    // Вариант 2: Парсинг HTML страницы поиска
    const searchUrl = `${config.joomla.siteUrl}/index.php?option=com_search&searchword=${encodeURIComponent(query)}`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    // Парсим результаты поиска (адаптировать под реальную структуру Joomla)
    $('.search-results .result-item, .item, article').each((i, el) => {
      const title = $(el).find('h2, h3, .title, a').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const description = $(el).find('.summary, .introtext, p').first().text().trim();
      
      if (title) {
        results.push({
          title: title.substring(0, 100),
          description: description ? description.substring(0, config.search.maxDescriptionLength) + '...' : '',
          link: link ? (link.startsWith('http') ? link : `${config.joomla.siteUrl}${link}`) : config.joomla.siteUrl,
          type: 'result'
        });
      }
    });
    
    return results;
    
  } catch (error) {
    console.error('Search error:', error.message);
    return [];
  }
}

/**
 * Обработка поискового запроса
 */
async function handleSearch(bot, chatId, query, config) {
  if (!query || query.trim().length < 2) {
    await bot.sendMessage(chatId, '⚠️ Запрос слишком короткий. Введи минимум 2 символа.');
    return;
  }
  
  // Показываем "печатает"
  bot.sendChatAction(chatId, 'typing');
  
  const results = await searchOnSite(query.trim());
  
  if (results.length === 0) {
    await bot.sendMessage(
      chatId, 
      `😕 По запросу «*${query}*» ничего не найдено.\n\nПопробуй другие слова или добавь информацию через «Добавить на сайт».`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  // Показываем первую страницу результатов
  const pageSize = config.search.resultsPerPage || 5;
  const pageResults = results.slice(0, pageSize);
  const totalPages = Math.ceil(results.length / pageSize);
  
  let messageText = `🔍 *Результаты поиска:* «${query}»\n\n`;
  
  pageResults.forEach((result, index) => {
    messageText += `${index + 1}. *${result.title}*\n`;
    if (result.description) {
      messageText += `${result.description}\n`;
    }
    messageText += `[Открыть на сайте ↗](${result.link})\n\n`;
  });
  
  messageText += `📄 Страница 1 из ${totalPages} (${results.length} результатов)`;
  
  // Кнопки пагинации
  const inlineKeyboard = [];
  
  if (totalPages > 1) {
    inlineKeyboard.push([
      { text: '▶️ Следующая', callback_data: `search_page:${query}:2:${results.length}` }
    ]);
  }
  
  inlineKeyboard.push([
    { text: '🔄 Новый поиск', callback_data: 'search_new' },
    { text: '➕ Добавить', callback_data: 'add_from_search' }
  ]);
  
  await bot.sendMessage(chatId, messageText, {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

/**
 * Обработка пагинации
 */
async function handlePagination(bot, query, config) {
  const [_, searchQuery, pageStr, totalStr] = query.data.split(':');
  const page = parseInt(pageStr);
  const total = parseInt(totalStr);
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  
  bot.sendChatAction(chatId, 'typing');
  
  const results = await searchOnSite(searchQuery);
  const pageSize = config.search.resultsPerPage || 5;
  const totalPages = Math.ceil(results.length / pageSize);
  
  const startIdx = (page - 1) * pageSize;
  const pageResults = results.slice(startIdx, startIdx + pageSize);
  
  let messageText = `🔍 *Результаты поиска:* «${searchQuery}»\n\n`;
  
  pageResults.forEach((result, index) => {
    const globalIndex = startIdx + index + 1;
    messageText += `${globalIndex}. *${result.title}*\n`;
    if (result.description) {
      messageText += `${result.description}\n`;
    }
    messageText += `[Открыть на сайте ↗](${result.link})\n\n`;
  });
  
  messageText += `📄 Страница ${page} из ${totalPages} (${results.length} результатов)`;
  
  // Кнопки пагинации
  const inlineKeyboard = [];
  const navButtons = [];
  
  if (page > 1) {
    navButtons.push({ text: '◀️ Предыдущая', callback_data: `search_page:${searchQuery}:${page - 1}:${total}` });
  }
  if (page < totalPages) {
    navButtons.push({ text: '▶️ Следующая', callback_data: `search_page:${searchQuery}:${page + 1}:${total}` });
  }
  
  if (navButtons.length > 0) {
    inlineKeyboard.push(navButtons);
  }
  
  inlineKeyboard.push([
    { text: '🔄 Новый поиск', callback_data: 'search_new' },
    { text: '➕ Добавить', callback_data: 'add_from_search' }
  ]);
  
  await bot.editMessageText(messageText, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: inlineKeyboard }
  });
}

module.exports = {
  handleSearch,
  handlePagination
};
