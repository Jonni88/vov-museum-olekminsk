const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const searchHandler = require('./handlers/search');
const addContentHandler = require('./handlers/addContent');
const moderationHandler = require('./handlers/moderation');

// Проверка конфигурации
if (!config.botToken) {
  console.error('❌ Ошибка: BOT_TOKEN не указан в .env');
  process.exit(1);
}

if (!config.adminChatId) {
  console.warn('⚠️  Внимание: ADMIN_CHAT_ID не указан — модерация работать не будет');
}

// Инициализация бота
const bot = new TelegramBot(config.botToken, { polling: true });

console.log('🤖 Бот мояолекма.рф запущен!');
console.log(`🔗 Сайт: ${config.joomla.siteUrl}`);

// Хранилище состояний пользователей (в памяти или заменить на БД)
const userStates = new Map();

// ============ КОМАНДЫ ============

// /start
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name;
  
  const welcomeText = `👋 Привет, ${userName}!

Я бот сайта *мояолекма.рф* — твоего справочника по Олёкминскому району.

Вот что я умею:
🔍 *Поиск* — найду компании, услуги, объявления
➕ *Добавить* — размещу информацию о твоей компании или услуге

Выбери действие в меню ниже 👇`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: {
      keyboard: [
        ['🔍 Поиск', '➕ Добавить на сайт'],
        ['❓ Помощь']
      ],
      resize_keyboard: true
    }
  });
});

// /help
bot.onText(/\/help|❓ Помощь/, (msg) => {
  const chatId = msg.chat.id;
  
  const helpText = `📚 *Как пользоваться ботом*

*🔍 Поиск:*
Просто нажми кнопку «Поиск» и напиши запрос — я найду информацию на сайте.

Примеры запросов:
• «электрик»
• «доставка еды»  
• «шиномонтаж»

*➕ Добавить на сайт:*
Если ты хочешь разместить информацию о своей компании или услуге:
1. Нажми «Добавить на сайт»
2. Выбери тип записи
3. Ответь на вопросы бота
4. Отправь заявку на модерацию

После проверки администратором твоя запись появится на сайте!

📞 По вопросам: @Jonni88`;

  bot.sendMessage(chatId, helpText, { parse_mode: 'Markdown' });
});

// ============ ОБРАБОТКА СООБЩЕНИЙ ============

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  
  // Игнорируем команды
  if (text && text.startsWith('/')) return;
  
  // Игнорируем кнопки меню (обрабатываем отдельно)
  if (text === '🔍 Поиск') {
    userStates.set(chatId, { action: 'search', step: 'waiting_query' });
    bot.sendMessage(chatId, '🔍 Введи поисковый запрос. Например: «электрик» или «доставка еды»', {
      reply_markup: { remove_keyboard: true }
    });
    return;
  }
  
  if (text === '➕ Добавить на сайт') {
    addContentHandler.start(bot, chatId, userStates);
    return;
  }
  
  // Обработка состояний
  const state = userStates.get(chatId);
  
  if (state) {
    if (state.action === 'search' && state.step === 'waiting_query') {
      await searchHandler.handleSearch(bot, chatId, text, config);
      userStates.delete(chatId);
      return;
    }
    
    if (state.action === 'add_content') {
      await addContentHandler.handleStep(bot, chatId, msg, userStates, config);
      return;
    }
  }
  
  // Если не распознали — предлагаем меню
  bot.sendMessage(chatId, 'Выбери действие:', {
    reply_markup: {
      keyboard: [
        ['🔍 Поиск', '➕ Добавить на сайт'],
        ['❓ Помощь']
      ],
      resize_keyboard: true
    }
  });
});

// ============ INLINE КНОПКИ (МОДЕРАЦИЯ) ============

bot.on('callback_query', async (query) => {
  const data = query.data;
  
  if (data.startsWith('approve:') || data.startsWith('reject:')) {
    await moderationHandler.handleCallback(bot, query, config);
  }
  
  if (data.startsWith('search_page:')) {
    await searchHandler.handlePagination(bot, query, config);
  }
  
  if (data.startsWith('add_type:')) {
    await addContentHandler.handleTypeSelection(bot, query, userStates);
  }
  
  bot.answerCallbackQuery(query.id);
});

// ============ ОБРАБОТКА ФОТО ============

bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (state && state.action === 'add_content') {
    await addContentHandler.handlePhoto(bot, chatId, msg, userStates);
  }
});

// ============ ОШИБКИ ============

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Бот остановлен');
  bot.stopPolling();
  process.exit(0);
});
