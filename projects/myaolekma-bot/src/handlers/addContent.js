/**
 * Добавление контента на сайт
 * Два варианта: самостоятельно или через админа
 * Для новости отдельный набор вопросов
 */

const { v4: uuidv4 } = require('uuid');

const CONTENT_TYPES = {
  organization: { icon: '🏢', name: 'Организацию', category: 'Организации' },
  news: { icon: '📰', name: 'Новость', category: 'Новости' },
  service: { icon: '🛠', name: 'Услугу', category: 'Услуги' },
  ad: { icon: '📋', name: 'Объявление', category: 'Объявления' },
  house: { icon: '🏠', name: 'Дом/недвижимость', category: 'Дома' }
};

// Шаги для разных типов контента
const STEPS = {
  organization: ['name', 'description', 'contacts', 'address', 'schedule', 'social', 'photo'],
  service: ['name', 'description', 'price', 'contacts', 'address', 'schedule', 'social', 'photo'],
  ad: ['name', 'description', 'price', 'contacts', 'address', 'schedule', 'social', 'photo'],
  news: ['name', 'photo', 'content', 'video', 'source', 'address', 'author'],
  house: ['name', 'description', 'price', 'address', 'contacts', 'photo']
};

// Названия шагов
const STEP_NAMES = {
  name: 'название',
  description: 'описание',
  price: 'стоимость',
  contacts: 'контактные данные',
  address: 'адрес',
  schedule: 'график работы',
  social: 'ссылки на соцсети',
  photo: 'фото',
  content: 'текст новости',
  video: 'видео (ссылка)',
  source: 'источник новости',
  author: 'автор'
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
          { text: '🏠 Дом / недвижимость', callback_data: 'add_type:house' }
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

  if (data.startsWith('add_confirm:')) {
    const chatId = query.message.chat.id;
    const state = userStates.get(chatId);
    if (state) {
      await sendToAdmin(bot, chatId, query.from, state, config);
      userStates.delete(chatId);
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
          { text: '✏️ Добавить информацию самому', callback_data: `add_method:${type}:self` }
        ],
        [
          { text: '📤 Прислать мне необходимые данные', callback_data: `add_method:${type}:admin` }
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
  const steps = STEPS[type];

  userStates.set(chatId, {
    context: 'add_content',
    type: type,
    typeName: typeInfo.name,
    step: steps[0],
    steps: steps,
    stepIndex: 0,
    data: { submissionId, type },
    messageId: messageId
  });

  const totalQuestions = steps.length;
  const isNews = type === 'news';

  let text = `${typeInfo.icon} *Отправка данных админу*

Я задам несколько вопросов, а потом передам всё администратору.

📝 *Вопрос 1 из ${totalQuestions}*
`;

  if (isNews) {
    text += `Введите *название новости*:`;
  } else {
    text += `Введите *название* ${typeInfo.name.toLowerCase()}:`;
  }

  await bot.editMessageText(text, {
    chat_id: chatId,
    message_id: messageId,
    parse_mode: 'Markdown'
  });
}

// Получить следующий шаг
function getNextStep(state) {
  const currentIndex = state.steps.indexOf(state.step);
  if (currentIndex < state.steps.length - 1) {
    return state.steps[currentIndex + 1];
  }
  return null;
}

// Получить номер текущего вопроса
function getQuestionNumber(state) {
  return state.steps.indexOf(state.step) + 1;
}

// Получить текст вопроса
function getQuestionText(step, type) {
  const stepNames = {
    name: type === 'news' ? 'название новости' : (type === 'house' ? 'заголовок объявления' : 'название'),
    description: 'описание',
    price: type === 'house' ? 'цену (например: "5 000 000 руб", "договорная", "торг")' : 'стоимость (например: "1000 руб", "договорная", "торг")',
    contacts: 'контактные данные (телефон, email)',
    address: type === 'house' ? 'адрес дома (район, улица)' : 'адрес',
    schedule: 'график работы',
    social: 'ссылки на соцсети',
    photo: 'фото',
    content: 'текст новости',
    video: 'ссылку на видео (или "нет")',
    source: 'источник новости (или "нет")',
    author: 'автора'
  };
  return stepNames[step] || step;
}

// Обработка сообщений при добавлении через админа
async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);

  if (!state || state.context !== 'add_content') return;

  const isNews = state.type === 'news';
  const currentStep = state.step;
  const totalQuestions = state.steps.length;

  // Валидация
  if (currentStep === 'name' && text.length < 2) {
    await bot.sendMessage(chatId, '⚠️ Название слишком короткое. Попробуйте ещё раз:');
    return;
  }

  if (currentStep === 'description' && text.length < 10) {
    await bot.sendMessage(chatId, '⚠️ Описание слишком короткое (минимум 10 символов):');
    return;
  }

  if (currentStep === 'content' && text.length < 10) {
    await bot.sendMessage(chatId, '⚠️ Текст новости слишком короткий (минимум 10 символов):');
    return;
  }

  // Сохраняем данные
  state.data[currentStep] = text;

  // Проверяем на "нет" для опциональных полей
  if (['video', 'source', 'schedule', 'social'].includes(currentStep) && text.toLowerCase() === 'нет') {
    state.data[currentStep] = null;
  }

  // Получаем следующий шаг
  const nextStep = getNextStep(state);

  if (!nextStep) {
    // Это был последний вопрос
    await showConfirmation(bot, chatId, state, userStates);
    return;
  }

  // Переходим к следующему вопросу
  state.step = nextStep;
  const questionNum = getQuestionNumber(state);
  const questionText = getQuestionText(nextStep, state.type);

  let response = `✅ ${STEP_NAMES[currentStep] || currentStep}: `;
  if (currentStep === 'photo') {
    response += '✅ добавлено';
  } else {
    response += text.length > 30 ? text.substring(0, 30) + '...' : text;
  }
  response += `\n\n📝 *Вопрос ${questionNum} из ${totalQuestions}*\n`;

  if (nextStep === 'photo') {
    response += `Отправьте *${questionText}* (или напишите "нет"):`;
  } else if (nextStep === 'content') {
    response += `Введите *${questionText}*:`;
  } else if (nextStep === 'author') {
    response += `Укажите *${questionText}*:`;
  } else {
    response += `Введите *${questionText}*:`;
  }

  await bot.sendMessage(chatId, response, { parse_mode: 'Markdown' });
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

  // Переходим к следующему шагу
  const nextStep = getNextStep(state);

  if (!nextStep) {
    await showConfirmation(bot, chatId, state, userStates);
    return;
  }

  state.step = nextStep;
  const questionNum = getQuestionNumber(state);
  const questionText = getQuestionText(nextStep, state.type);
  const totalQuestions = state.steps.length;

  await bot.sendMessage(chatId,
    `✅ Фото добавлено\n\n📝 *Вопрос ${questionNum} из ${totalQuestions}*\nВведите *${questionText}*:`,
    { parse_mode: 'Markdown' }
  );
}

// Показать подтверждение
async function showConfirmation(bot, chatId, state, userStates) {
  const data = state.data;
  const typeInfo = CONTENT_TYPES[state.type];
  const isNews = state.type === 'news';
  const isHouse = state.type === 'house';

  let summary = `📋 *Проверьте данные:*\n\n`;
  summary += `*Тип:* ${typeInfo.name}\n`;
  summary += `*Название:* ${data.name}\n`;

  if (isNews) {
    if (data.content) {
      summary += `*Текст:* ${data.content.substring(0, 100)}${data.content.length > 100 ? '...' : ''}\n`;
    }
    if (data.video) summary += `*Видео:* ${data.video}\n`;
    if (data.source) summary += `*Источник:* ${data.source}\n`;
    if (data.address) summary += `*Адрес:* ${data.address}\n`;
    if (data.author) summary += `*Автор:* ${data.author}\n`;
  } else if (isHouse) {
    if (data.description) {
      summary += `*Описание:* ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}\n`;
    }
    if (data.price) summary += `*Цена:* ${data.price}\n`;
    if (data.address) summary += `*Адрес:* ${data.address}\n`;
    summary += `*Контакты:* ${data.contacts}\n`;
  } else {
    if (data.description) {
      summary += `*Описание:* ${data.description.substring(0, 100)}${data.description.length > 100 ? '...' : ''}\n`;
    }
    if (data.price) summary += `*Стоимость:* ${data.price}\n`;
    summary += `*Контакты:* ${data.contacts}\n`;
    if (data.address) summary += `*Адрес:* ${data.address}\n`;
    if (data.schedule) summary += `*График:* ${data.schedule}\n`;
    if (data.social) summary += `*Соцсети:* ${data.social}\n`;
  }

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
  const isNews = state.type === 'news';
  const isHouse = state.type === 'house';
  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${chatId})`;

  let message = `📝 *Новая заявка на добавление!*\n\n`;
  message += `*Тип:* ${typeInfo.name}\n`;
  message += `*Название:* ${data.name}\n\n`;

  if (isNews) {
    message += `*Текст новости:*\n${data.content}\n\n`;
    if (data.video) message += `*Видео:* ${data.video}\n`;
    if (data.source) message += `*Источник:* ${data.source}\n`;
    if (data.address) message += `*Адрес:* ${data.address}\n`;
    if (data.author) message += `*Автор:* ${data.author}\n`;
  } else if (isHouse) {
    message += `*Описание:*\n${data.description}\n\n`;
    if (data.price) message += `*Цена:* ${data.price}\n`;
    if (data.address) message += `*Адрес:* ${data.address}\n`;
    message += `*Контакты:* ${data.contacts}\n`;
  } else {
    message += `*Описание:*\n${data.description}\n\n`;
    if (data.price) message += `*Стоимость:* ${data.price}\n`;
    message += `*Контакты:* ${data.contacts}\n`;
    if (data.address) message += `*Адрес:* ${data.address}\n`;
    if (data.schedule) message += `*График:* ${data.schedule}\n`;
    if (data.social) message += `*Соцсети:* ${data.social}\n`;
  }

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

  // Отправляем благодарность пользователю
  await bot.sendMessage(chatId,
    `🙏 *Спасибо!*\n\n` +
    `Ваши данные отправлены. Админ их проверит и если будут вопросы — свяжется с вами.`,
    { parse_mode: 'Markdown' }
  );
}

module.exports = {
  showAddMenu,
  handleCallback,
  handleMessage,
  handlePhoto,
  sendToAdmin
};
