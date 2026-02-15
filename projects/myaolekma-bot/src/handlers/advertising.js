/**
 * Реклама на сайте
 */

const ADVERTISING_TYPES = [
  { id: 'banner', name: 'Баннер на главной', icon: '🖼' },
  { id: 'article', name: 'Рекламная статья', icon: '📝' },
  { id: 'listing', name: 'Выделенное объявление', icon: '📌' },
  { id: 'other', name: 'Другое', icon: '📎' }
];

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'advertising',
    step: 'type',
    data: {}
  });
  
  const keyboard = ADVERTISING_TYPES.map(t => [
    { text: `${t.icon} ${t.name}`, callback_data: `adv_type:${t.id}` }
  ]);
  keyboard.push([{ text: '❌ Отмена', callback_data: 'adv_cancel' }]);
  
  bot.sendMessage(chatId, '📢 *Реклама на сайте мояолекма.рф*\n\nВыберите тип рекламы:', {
    parse_mode: 'Markdown',
    reply_markup: { inline_keyboard: keyboard }
  });
}

async function handleCallback(bot, query, userStates) {
  const data = query.data;
  const chatId = query.message.chat.id;
  
  if (data === 'adv_cancel') {
    userStates.delete(chatId);
    await bot.editMessageText('❌ Отменено', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    return;
  }
  
  if (data.startsWith('adv_type:')) {
    const typeId = data.split(':')[1];
    const type = ADVERTISING_TYPES.find(t => t.id === typeId);
    const state = userStates.get(chatId);
    
    if (state) {
      state.data.type = type.name;
      state.step = 'description';
      
      await bot.editMessageText(
        `${type.icon} *${type.name}*\n\n📝 Опишите вашу рекламу (что хотите разместить, сроки, пожелания):`,
        {
          chat_id: chatId,
          message_id: query.message.message_id,
          parse_mode: 'Markdown'
        }
      );
    }
  }
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);
  
  if (!state || state.context !== 'advertising') return;
  
  if (state.step === 'description') {
    if (text.length < 10) {
      await bot.sendMessage(chatId, '⚠️ Описание слишком короткое. Расскажите подробнее:');
      return;
    }
    
    state.data.description = text;
    state.step = 'contacts';
    await bot.sendMessage(chatId, 
      `✅ Описание сохранено\n\n📞 Введите ваши контактные данные (телефон, email, Telegram):`
    );
    return;
  }
  
  if (state.step === 'contacts') {
    state.data.contacts = text;
    
    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);
    
    await bot.sendMessage(chatId, 
      `✅ *Заявка на рекламу отправлена!*\n\n` +
      `Администратор свяжется с вами в ближайшее время.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );
    
    userStates.delete(chatId);
  }
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;
  
  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;
  
  let message = `📢 *Новая заявка на рекламу!*\n\n`;
  message += `*Тип:* ${data.type}\n`;
  message += `*Описание:*\n${data.description}\n\n`;
  message += `*Контакты:* ${data.contacts}\n\n`;
  message += `*Отправитель:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;
  
  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Взять в работу', callback_data: `admin_adv_take:${userChatId}` }
        ]
      ]
    }
  });
}

module.exports = {
  start,
  handleCallback,
  handleMessage
};
