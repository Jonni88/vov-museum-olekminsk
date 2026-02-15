/**
 * Добавление контента на сайт
 * Два варианта: самостоятельно или через админа
 */

const { v4: uuidv4 } = require('uuid');

const CONTENT_TYPES = {
  organization: { icon: '🏢', name: 'Организацию', category: 'Организации' },
  news: { icon: '📰', name: 'Новость', category: 'Новости' },
  service: { icon: '🛠', name: 'Услугу', category: 'Услуги' },
  ad: { icon: '📋', name: 'Объявление', category: 'Объявления' }
};

// Показать меню выбора типа контента
function showAddMenu(bot, chatId) {
  bot.sendMessage(chatId, '📝 *Что хотите добавить на сайт?*', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🏢 Организацию', callback_data: 'add_type:organization' },
          { text: '📰 Новость', callback_data: 'add_type:news' }
        ],
        [
          { text: '🛠 Услугу', callback_data: 'add_type:service' },
          { text: '📋 Объявление', callback_data: 'add_type:ad' }
        ],
        [
          { text: '❌ Отмена', callback_data: 'add_cancel' }
        ]
      ]
    }
  });
}

// Обработка callback
async function handleCallback(bot, query, userStates, config) {
  const data = query.data;
  const chatId = query.message.chat.id;
  
  if (data === 'add_cancel') {
    await cancelAdd(bot, chatId, query.message.message_id, userStates);
    return;
  }
  
  if (data.startsWith('add_type:')) {
    const type = data.split(':')[1];
    await showMethodChoice(bot, chatId, query.message.message_id, type, userStates);
    return;
  }
  
  if (data.startsWith('add_method:')) {
    const [, type, method] = data.split(':');
    if (method === 'self') {
      await sendSelfServiceLink(bot, chatId, query.message.message_id, type, config);
    } else {
      await startAdminSubmission(bot, chatId, query.message.message_id, type, userStates);
    }
    return;
  }
}

// Показать выбор способа (самому или через админа)
async function showMethodChoice(bot, chatId, messageId, type, userStates) {
  const typeInfo = CONTENT_TYPES[type];
  
  const text = `${typeInfo.icon} *Добавление ${typeInfo.name.toLowerCase()}*

Как вы хотите добавить информацию?`;

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✏️ Заполнить самому', callback_data: `add_method:${type}:self` }
        ],
        [
          { text: '📤 Отправить админу', callback_data: `add_method:${type}:admin` }
        ],
        [
          { text: '◀️ Назад', callback_data: 'add_back' }
        ]
      ]
    }
  });
}

// Вариант 1: Отправить ссылку на самостоятельное заполнение
async function sendSelfServiceLink(bot, chatId, messageId, type, config) {
  const typeInfo = CONTENT_TYPES[type];
  
  const text = `${typeInfo.icon} *Добавление ${typeInfo.name.toLowerCase()}*

✏️ *Заполнить самому*

Для добавления информации вам нужно:
1. Зарегистрироваться на сайте
2. Авторизоваться
3. Заполнить форму

👇 Нажмите на кнопку ниже:`;

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '📝 Регистрация', url: config.siteRegisterUrl },
          { text: '🔐 Вход', url: config.siteLoginUrl }
        ],
        [
          { text: '🏠 Главное меню', callback_data: 'add_cancel' }
        ]
      ]
    }
  });
}

// Вариант 2: Начать отправку данных админу
async function startAdminSubmission(bot, chatId, messageId, type, userStates) {
  const typeInfo = CONTENT_TYPES[type];
  const submissionId = uuidv4();
  
  userStates.set(chatId, {
    context: 'add_content',
    type: type,
    typeName: typeInfo.name,
    step: 'name',
    data: { submissionId, type },
    messageId: messageId
  });
  
  const text = `${typeInfo.icon} *Отправка данных админу*

Я задам несколько вопросов, а потом передам всё администратору.

📝 *Вопрос 1 из 6*
Введите *название* ${typeInfo.name.toLowerCase()}:`;

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown'
  });
}

// Обработка сообщений при добавлении через админа
async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);
  
  if (!state || state.context !== 'add_content') return;
  
  switch (state.step) {
    case 'name':
      if (text.length < 2) {
        await bot.sendMessage(chatId, '⚠️ Название слишком короткое. Попробуйте ещё раз:');
        return;
      }
      state.data.name = text;
      state.step = 'description';
      await bot.sendMessage(chatId, 
        `✅ Название: *${text}*\n\n📝 *Вопрос 2*\nВведите *описание*:`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case 'description':
      if (text.length < 10) {
        await bot.sendMessage(chatId, '⚠️ Описание слишком короткое (минимум 10 символов):');
        return;
      }
      state.data.description = text;
      state.step = 'contacts';
      await bot.sendMessage(chatId, 
        `✅ Описание сохранено\n\n📞 *Вопрос 3*\nВведите *контактные данные* (телефон, email):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case 'contacts':
      state.data.contacts = text;
      state.step = 'address';
      await bot.sendMessage(chatId, 
        `✅ Контакты: *${text}*\n\n📍 *Вопрос 4*\nВведите *адрес* (или "нет"):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case 'address':
      state.data.address = text.toLowerCase() === 'нет' ? null : text;
      state.step = 'schedule';
      await bot.sendMessage(chatId, 
        `✅ Адрес: *${state.data.address || 'не указан'}*\n\n🕐 *Вопрос 5*\nВведите *график работы* (или "нет"):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case 'schedule':
      state.data.schedule = text.toLowerCase() === 'нет' ? null : text;
      state.step = 'social';
      await bot.sendMessage(chatId, 
        `✅ График: *${state.data.schedule || 'не указан'}*\n\n🔗 *Вопрос 6*\nСсылки на *соцсети* (или "нет"):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case 'social':
      state.data.social = text.toLowerCase() === 'нет' ? null : text;
      state.step = 'photo';
      await bot.sendMessage(chatId, 
        `✅ Соцсети: *${state.data.social || 'не указаны'}*\n\n📸 *Последний вопрос*\nОтправьте *фото* (логотип, фото организации) или напишите "нет":`
      );
      break;
  }
}

// Обработка фото
async function handlePhoto(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (!state || state.step !== 'photo') return;
  
  const photos = msg.photo;
  const largestPhoto = photos[photos.length - 1];
  
  state.data.photo = {
    fileId: largestPhoto.file_id
  };
  
  await showConfirmation(bot, chatId, state, userStates);
}

// Показать подтверждение
async function showConfirmation(bot, chatId, state, userStates) {
  const data = state.data;
  const typeInfo = CONTENT_TYPES[state.type];
  
  let summary = `📋 *Проверьте данные:*\n\n`;
  summary += `*Тип:* ${typeInfo.name}\n`;
  summary += `*Название:* ${data.name}\n`;
  summary += `*Описание:* ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}\n`;
  summary += `*Контакты:* ${data.contacts}\n`;
  if (data.address) summary += `*Адрес:* ${data.address}\n`;
  if (data.schedule) summary += `*График:* ${data.schedule}\n`;
  if (data.social) summary += `*Соцсети:* ${data.social}\n`;
  if (data.photo) summary += `*Фото:* ✅ добавлено\n`;
  
  summary += `\nВсё верно?`;
  
  await bot.sendMessage(chatId, summary, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Отправить админу', callback_data: `add_confirm:${data.submissionId}` }
        ],
        [
          { text: '🔄 Заполнить заново', callback_data: `add_restart:${state.type}` }
        ]
      ]
    }
  });
  
  // Сохраняем для обработки подтверждения
  state.step = 'confirm';
}

// Отмена
async function cancelAdd(bot, chatId, messageId, userStates) {
  userStates.delete(chatId);
  await bot.editMessageText('❌ Отменено. Выберите действие:', {
    chat_id: chatId,
    message_id: messageId,
    reply_markup: {
      inline_keyboard: [
        [{ text: '🏠 Главное меню', callback_data: 'main_menu' }]
      ]
    }
  });
}

// Отправка админу
async function sendToAdmin(bot, chatId, user, state, config) {
  if (!config.adminChatId) return;
  
  const data = state.data;
  const typeInfo = CONTENT_TYPES[state.type];
  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${chatId})`;
  
  let message = `📝 *Новая заявка на добавление!*\n\n`;
  message += `*Тип:* ${typeInfo.name}\n`;
  message += `*Название:* ${data.name}\n\n`;
  message += `*Описание:*\n${data.description}\n\n`;
  message += `*Контакты:* ${data.contacts}\n`;
  if (data.address) message += `*Адрес:* ${data.address}\n`;
  if (data.schedule) message += `*График:* ${data.schedule}\n`;
  if (data.social) message += `*Соцсети:* ${data.social}\n`;
  message += `\n*Отправил:* ${userLink}\n`;
  message += `*ID:* ${chatId}`;
  
  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Добавлено на сайт', callback_data: `admin_done:${chatId}` }
        ]
      ]
    }
  });
  
  // Отправляем фото если есть
  if (data.photo) {
    await bot.sendPhoto(config.adminChatId, data.photo.fileId, {
      caption: `📎 Фото к заявке от ${userLink}`
    });
  }
}

module.exports = {
  showAddMenu,
  handleCallback,
  handleMessage,
  handlePhoto,
  sendToAdmin
};
