const { v4: uuidv4 } = require('uuid');

// Шаги добавления контента
const STEPS = {
  SELECT_TYPE: 'select_type',
  NAME: 'name',
  PHOTO: 'photo',
  DESCRIPTION: 'description',
  SCHEDULE: 'schedule',
  SOCIAL: 'social',
  PHONES: 'phones',
  EMAIL: 'email',
  ADDRESS: 'address',
  CONFIRM: 'confirm'
};

const STEP_NAMES = {
  [STEPS.NAME]: 'название',
  [STEPS.PHOTO]: 'фото',
  [STEPS.DESCRIPTION]: 'описание',
  [STEPS.SCHEDULE]: 'график работы',
  [STEPS.SOCIAL]: 'соцсети',
  [STEPS.PHONES]: 'телефоны',
  [STEPS.EMAIL]: 'email',
  [STEPS.ADDRESS]: 'адрес'
};

/**
 * Начало процесса добавления контента
 */
function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    action: 'add_content',
    step: STEPS.SELECT_TYPE,
    data: {},
    tempId: uuidv4()
  });
  
  bot.sendMessage(chatId, '➕ *Добавление на сайт мояолекма.рф*\n\nВыбери тип записи:', {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '🏢 Компания', callback_data: 'add_type:company' },
          { text: '🛠 Услуга', callback_data: 'add_type:service' }
        ],
        [
          { text: '📋 Объявление', callback_data: 'add_type:ad' }
        ],
        [
          { text: '❌ Отмена', callback_data: 'add_cancel' }
        ]
      ]
    }
  });
}

/**
 * Обработка выбора типа
 */
async function handleTypeSelection(bot, query, userStates) {
  const data = query.data;
  const chatId = query.message.chat.id;
  const messageId = query.message.message_id;
  
  if (data === 'add_cancel') {
    userStates.delete(chatId);
    await bot.editMessageText('❌ Добавление отменено', {
      chat_id: chatId,
      message_id: messageId
    });
    await showMainMenu(bot, chatId);
    return;
  }
  
  const type = data.split(':')[1];
  const typeNames = {
    company: 'Компания',
    service: 'Услуга',
    ad: 'Объявление'
  };
  
  const state = userStates.get(chatId);
  if (state) {
    state.data.type = type;
    state.data.typeName = typeNames[type];
    state.step = STEPS.NAME;
    
    await bot.editMessageText(`✅ Тип: *${typeNames[type]}*\n\n📝 Введи *название* (например: «Мастерская по ремонту обуви»):`, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: 'Markdown'
    });
  }
}

/**
 * Обработка шага
 */
async function handleStep(bot, chatId, msg, userStates, config) {
  const state = userStates.get(chatId);
  if (!state) return;
  
  const text = msg.text;
  
  switch (state.step) {
    case STEPS.NAME:
      if (!text || text.trim().length < 2) {
        await bot.sendMessage(chatId, '⚠️ Название слишком короткое. Введи минимум 2 символа:');
        return;
      }
      state.data.name = text.trim();
      state.step = STEPS.PHOTO;
      await bot.sendMessage(chatId, 
        `✅ Название: *${state.data.name}*\n\n📸 Отправь *фото* или *логотип* (можно пропустить — отправь «-»):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case STEPS.PHOTO:
      // Фото обрабатывается отдельно в handlePhoto
      if (text === '-') {
        state.data.photo = null;
        state.step = STEPS.DESCRIPTION;
        await bot.sendMessage(chatId, 
          `📸 Фото: *не добавлено*\n\n📝 Введи *описание* (чем занимаешься, что предлагаешь):`, 
          { parse_mode: 'Markdown' }
        );
      } else {
        await bot.sendMessage(chatId, '⚠️ Отправь фото или напиши «-» чтобы пропустить:');
      }
      break;
      
    case STEPS.DESCRIPTION:
      if (!text || text.trim().length < 10) {
        await bot.sendMessage(chatId, '⚠️ Описание слишком короткое. Минимум 10 символов:');
        return;
      }
      state.data.description = text.trim();
      state.step = STEPS.SCHEDULE;
      await bot.sendMessage(chatId, 
        `✅ Описание сохранено\n\n🕐 Введи *график работы* (например: «Пн-Пт 9:00-18:00, Сб 10:00-15:00» или «-»):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case STEPS.SCHEDULE:
      state.data.schedule = text === '-' ? null : text.trim();
      state.step = STEPS.SOCIAL;
      await bot.sendMessage(chatId, 
        `✅ График: *${state.data.schedule || 'не указан'}*\n\n🔗 Введи *ссылки на соцсети* (через запятую или «-»):\nПример: vk.com/group, instagram.com/name`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case STEPS.SOCIAL:
      state.data.social = text === '-' ? null : text.trim();
      state.step = STEPS.PHONES;
      await bot.sendMessage(chatId, 
        `✅ Соцсети: *${state.data.social || 'не указаны'}*\n\n📞 Введи *номера телефонов* (через запятую):\nПример: 89241234567, 8411-123456`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case STEPS.PHONES:
      if (!text || text.trim().length < 5) {
        await bot.sendMessage(chatId, '⚠️ Укажи хотя бы один телефон:');
        return;
      }
      state.data.phones = text.trim();
      state.step = STEPS.EMAIL;
      await bot.sendMessage(chatId, 
        `✅ Телефоны: *${state.data.phones}*\n\n📧 Введи *email* (или «-»):`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case STEPS.EMAIL:
      state.data.email = text === '-' ? null : text.trim();
      state.step = STEPS.ADDRESS;
      await bot.sendMessage(chatId, 
        `✅ Email: *${state.data.email || 'не указан'}*\n\n📍 Введи *адрес* (или «-»):\nПример: ул. Ленина, 15`, 
        { parse_mode: 'Markdown' }
      );
      break;
      
    case STEPS.ADDRESS:
      state.data.address = text === '-' ? null : text.trim();
      state.step = STEPS.CONFIRM;
      await showConfirmation(bot, chatId, state);
      break;
      
    case STEPS.CONFIRM:
      if (text.toLowerCase() === 'отправить') {
        await submitForModeration(bot, chatId, state, config);
        userStates.delete(chatId);
      } else if (text.toLowerCase() === 'изменить') {
        state.step = STEPS.NAME;
        await bot.sendMessage(chatId, '📝 Начнём сначала. Введи *название*:', { parse_mode: 'Markdown' });
      } else if (text.toLowerCase() === 'отмена') {
        userStates.delete(chatId);
        await bot.sendMessage(chatId, '❌ Добавление отменено');
        await showMainMenu(bot, chatId);
      } else {
        await bot.sendMessage(chatId, 'Напиши: *отправить*, *изменить* или *отмена*', { parse_mode: 'Markdown' });
      }
      break;
  }
}

/**
 * Обработка фото
 */
async function handlePhoto(bot, chatId, msg, userStates) {
  const state = userStates.get(chatId);
  if (!state || state.step !== STEPS.PHOTO) return;
  
  // Берём фото максимального размера
  const photos = msg.photo;
  const largestPhoto = photos[photos.length - 1];
  
  state.data.photo = {
    fileId: largestPhoto.file_id,
    width: largestPhoto.width,
    height: largestPhoto.height
  };
  state.step = STEPS.DESCRIPTION;
  
  await bot.sendMessage(chatId, 
    `✅ Фото добавлено\n\n📝 Введи *описание* (чем занимаешься, что предлагаешь):`, 
    { parse_mode: 'Markdown' }
  );
}

/**
 * Показать предпросмотр перед отправкой
 */
async function showConfirmation(bot, chatId, state) {
  const data = state.data;
  
  let preview = `📋 *Проверь данные перед отправкой:*\n\n`;
  preview += `*Тип:* ${data.typeName}\n`;
  preview += `*Название:* ${data.name}\n`;
  preview += `*Описание:* ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}\n`;
  
  if (data.schedule) preview += `*График:* ${data.schedule}\n`;
  if (data.social) preview += `*Соцсети:* ${data.social}\n`;
  preview += `*Телефоны:* ${data.phones}\n`;
  if (data.email) preview += `*Email:* ${data.email}\n`;
  if (data.address) preview += `*Адрес:* ${data.address}\n`;
  
  preview += `\n✅ Всё верно? Напиши: *отправить*, *изменить* или *отмена*`;
  
  // Если есть фото — отправляем его с описанием
  if (data.photo) {
    await bot.sendPhoto(chatId, data.photo.fileId, {
      caption: preview,
      parse_mode: 'Markdown'
    });
  } else {
    await bot.sendMessage(chatId, preview, { parse_mode: 'Markdown' });
  }
}

/**
 * Отправка на модерацию
 */
async function submitForModeration(bot, chatId, state, config) {
  const data = state.data;
  data.userId = chatId;
  data.username = state.username;
  data.submittedAt = new Date().toISOString();
  data.status = 'pending';
  
  // Здесь сохраняем в БД или файл
  // В реальном проекте: await saveToDatabase(data);
  console.log('New submission:', data);
  
  // Отправляем пользователю подтверждение
  await bot.sendMessage(chatId, 
    `✅ *Заявка отправлена на модерацию!*\n\n` +
    `После проверки администратором твоя запись появится на сайте.\n` +
    `Обычно это занимает 1-2 дня.`,
    { parse_mode: 'Markdown' }
  );
  
  // Уведомляем админа
  if (config.adminChatId) {
    await notifyAdmin(bot, config.adminChatId, data, state.tempId);
  }
  
  await showMainMenu(bot, chatId);
}

/**
 * Уведомление администратора
 */
async function notifyAdmin(bot, adminChatId, data, tempId) {
  let message = `🔔 *Новая заявка на публикацию!*\n\n`;
  message += `*Тип:* ${data.typeName}\n`;
  message += `*Название:* ${data.name}\n`;
  message += `*Описание:* ${data.description.substring(0, 200)}${data.description.length > 200 ? '...' : ''}\n`;
  
  if (data.schedule) message += `*График:* ${data.schedule}\n`;
  if (data.phones) message += `*Телефоны:* ${data.phones}\n`;
  if (data.email) message += `*Email:* ${data.email}\n`;
  if (data.address) message += `*Адрес:* ${data.address}\n`;
  if (data.social) message += `*Соцсети:* ${data.social}\n`;
  
  message += `\n*Отправитель:* @${data.username || 'неизвестно'} (ID: ${data.userId})`;
  
  const keyboard = {
    inline_keyboard: [
      [
        { text: '✅ Одобрить', callback_data: `approve:${tempId}` },
        { text: '❌ Отклонить', callback_data: `reject:${tempId}` }
      ],
      [
        { text: '📝 Посмотреть полностью', callback_data: `view:${tempId}` }
      ]
    ]
  };
  
  if (data.photo) {
    await bot.sendPhoto(adminChatId, data.photo.fileId, {
      caption: message,
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  } else {
    await bot.sendMessage(adminChatId, message, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }
}

/**
 * Показать главное меню
 */
async function showMainMenu(bot, chatId) {
  await bot.sendMessage(chatId, 'Выбери действие:', {
    reply_markup: {
      keyboard: [
        ['🔍 Поиск', '➕ Добавить на сайт'],
        ['❓ Помощь']
      ],
      resize_keyboard: true
    }
  });
}

module.exports = {
  start,
  handleTypeSelection,
  handleStep,
  handlePhoto,
  STEPS
};
