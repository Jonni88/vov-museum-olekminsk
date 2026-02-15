const TelegramBot = require('node-telegram-bot-api');
const config = require('./config/config');
const mainMenu = require('./handlers/mainMenu');
const addContent = require('./handlers/addContent');
const advertising = require('./handlers/advertising');
const partnership = require('./handlers/partnership');
const claimAccess = require('./handlers/claimAccess');
const adminPanel = require('./handlers/adminPanel');

// Проверка конфигурации
if (!config.botToken) {
  console.error('❌ Ошибка: BOT_TOKEN не указан в .env');
  process.exit(1);
}

if (!config.adminChatId) {
  console.warn('⚠️  Внимание: ADMIN_CHAT_ID не указан');
}

// Инициализация бота
const bot = new TelegramBot(config.botToken, { polling: true });
console.log('🤖 Бот мояолекма.рф запущен!');

// Хранилище состояний пользователей
const userStates = new Map();

// ============ /START ============
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  const userName = msg.from.first_name || 'друг';
  
  const welcomeText = `👋 Привет, ${userName}!

Я помогу вам разместить информацию на сайте *мояолекма.рф* — справочнике по Олёкминскому району.

Выберите, чем я могу помочь:`;

  bot.sendMessage(chatId, welcomeText, {
    parse_mode: 'Markdown',
    reply_markup: mainMenu.getMainMenuKeyboard()
  });
});

// ============ ГЛАВНОЕ МЕНЮ ============
bot.onText(/📝 Добавить на сайт/, (msg) => {
  addContent.showAddMenu(bot, msg.chat.id);
});

bot.onText(/📢 Реклама/, (msg) => {
  advertising.start(bot, msg.chat.id, userStates);
});

bot.onText(/🤝 Сотрудничество/, (msg) => {
  partnership.start(bot, msg.chat.id, userStates);
});

bot.onText(/🔐 Моя организация/, (msg) => {
  claimAccess.start(bot, msg.chat.id, userStates);
});

bot.onText(/❓ Помощь/, (msg) => {
  mainMenu.showHelp(bot, msg.chat.id);
});

bot.onText(/🏠 Главное меню/, (msg) => {
  mainMenu.showMainMenu(bot, msg.chat.id);
});

// ============ INLINE КНОПКИ ============
bot.on('callback_query', async (query) => {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  
  // Добавление на сайт
  if (data.startsWith('add_')) {
    await addContent.handleCallback(bot, query, userStates, config);
  }
  
  // Реклама
  if (data.startsWith('adv_')) {
    await advertising.handleCallback(bot, query, userStates);
  }
  
  // Сотрудничество
  if (data.startsWith('partner_')) {
    await partnership.handleCallback(bot, query, userStates);
  }
  
  // Получить доступ
  if (data.startsWith('claim_')) {
    await claimAccess.handleCallback(bot, query, userStates);
  }
  
  // Админ панель
  if (data.startsWith('admin_')) {
    await adminPanel.handleCallback(bot, query, userStates, config);
  }
  
  bot.answerCallbackQuery(query.id);
});

// ============ ОБРАБОТКА ТЕКСТА ============
bot.on('message', async (msg) => {
  // Игнорируем команды и кнопки меню
  if (!msg.text || msg.text.startsWith('/') || mainMenu.isMenuButton(msg.text)) {
    return;
  }
  
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (!state) return;
  
  // Маршрутизация по контексту
  switch (state.context) {
    case 'add_content':
      await addContent.handleMessage(bot, msg, userStates, config);
      break;
      
    case 'advertising':
      await advertising.handleMessage(bot, msg, userStates, config);
      break;
      
    case 'partnership':
      await partnership.handleMessage(bot, msg, userStates, config);
      break;
      
    case 'claim_access':
      await claimAccess.handleMessage(bot, msg, userStates, config);
      break;
  }
});

// ============ ОБРАБОТКА ФОТО/ДОКУМЕНТОВ ============
bot.on('photo', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (state?.waitingFor === 'photo') {
    await handlePhoto(bot, msg, userStates, state);
  }
});

bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (state?.waitingFor === 'document') {
    await handleDocument(bot, msg, userStates, state);
  }
});

async function handlePhoto(bot, msg, userStates, state) {
  const photos = msg.photo;
  const largestPhoto = photos[photos.length - 1];
  
  state.data.photo = {
    fileId: largestPhoto.file_id,
    caption: msg.caption || ''
  };
  
  // Возвращаем управление соответствующему обработчику
  switch (state.context) {
    case 'add_content':
      await addContent.handlePhoto(bot, msg, userStates);
      break;
    case 'claim_access':
      await claimAccess.handlePhoto(bot, msg, userStates);
      break;
  }
}

// ============ ОШИБКИ ============
bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});

process.on('SIGINT', () => {
  console.log('\n👋 Бот остановлен');
  bot.stopPolling();
  process.exit(0);
});

// ============ АДМИН КОМАНДЫ ============
bot.onText(/\/admin/, (msg) => {
  adminPanel.showAdminMenu(bot, msg.chat.id, config);
});

bot.onText(/\/stats/, (msg) => {
  adminPanel.showStats(bot, msg.chat.id, config);
});
