/**
 * Получение доступа к организации (она уже есть на сайте)
 */

function start(bot, chatId, userStates) {
  userStates.set(chatId, {
    context: 'claim_access',
    step: 'org_name',
    data: {}
  });
  
  bot.sendMessage(chatId, 
    '🔐 *Получение доступа к организации*\n\n' +
    'Введите *название организации*, как она указана на сайте:',
    { parse_mode: 'Markdown' }
  );
}

async function handleCallback(bot, query, userStates) {
  if (query.data === 'claim_cancel') {
    userStates.delete(query.message.chat.id);
    await bot.editMessageText('❌ Отменено', {
      chat_id: query.message.chat.id,
      message_id: query.message.message_id
    });
  }
}

async function handleMessage(bot, msg, userStates, config) {
  const chatId = msg.chat.id;
  const text = msg.text;
  const state = userStates.get(chatId);
  
  if (!state || state.context !== 'claim_access') return;
  
  if (state.step === 'org_name') {
    state.data.orgName = text;
    state.step = 'proof';
    await bot.sendMessage(chatId, 
      `✅ Название: *${text}*\n\n📎 *Подтверждение владения*\n\n` +
      `Отправьте фото документа, подтверждающего ваше отношение к организации:\n` +
      `(ИНН, договор, доверенность, фото с табличкой и т.д.)\n\n` +
      `Или напишите, каким образом вы связаны с организацией:`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
  
  if (state.step === 'proof') {
    state.data.proofText = text;
    state.step = 'contacts';
    await bot.sendMessage(chatId, 
      `✅ Сохранено\n\n📞 Введите ваши контактные данные (телефон, email):`
    );
    return;
  }
  
  if (state.step === 'contacts') {
    state.data.contacts = text;
    
    // Отправляем админу
    await sendToAdmin(bot, chatId, msg.from, state.data, config);
    
    await bot.sendMessage(chatId, 
      `🙏 *Спасибо!*\n\n` +
      `Ваши данные отправлены. Админ их проверит и если будут вопросы — свяжется с вами.`,
      { parse_mode: 'Markdown', reply_markup: { keyboard: [['🏠 Главное меню']], resize_keyboard: true } }
    );
    
    userStates.delete(chatId);
  }
}

async function handlePhoto(bot, msg, userStates) {
  const chatId = msg.chat.id;
  const state = userStates.get(chatId);
  
  if (!state || state.step !== 'proof') return;
  
  const photos = msg.photo;
  const largestPhoto = photos[photos.length - 1];
  
  state.data.proofPhoto = {
    fileId: largestPhoto.file_id
  };
  state.step = 'contacts';
  
  await bot.sendMessage(chatId, 
    `✅ Фото документа получено\n\n📞 Введите ваши контактные данные (телефон, email):`
  );
}

async function sendToAdmin(bot, userChatId, user, data, config) {
  if (!config.adminChatId) return;
  
  const userLink = user.username ? `@${user.username}` : `[${user.first_name}](tg://user?id=${userChatId})`;
  
  let message = `🔐 *Запрос доступа к организации!*\n\n`;
  message += `*Организация:* ${data.orgName}\n`;
  message += `*Контакты:* ${data.contacts}\n\n`;
  
  if (data.proofText) {
    message += `*Подтверждение:* ${data.proofText}\n\n`;
  }
  
  message += `*Запросил:* ${userLink}\n`;
  message += `*ID:* ${userChatId}`;
  
  // Отправляем сообщение
  await bot.sendMessage(config.adminChatId, message, {
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [
          { text: '✅ Подтвердить', callback_data: `admin_claim_approve:${userChatId}` },
          { text: '❌ Отклонить', callback_data: `admin_claim_reject:${userChatId}` }
        ]
      ]
    }
  });
  
  // Если есть фото — отправляем отдельно
  if (data.proofPhoto) {
    await bot.sendPhoto(config.adminChatId, data.proofPhoto.fileId, {
      caption: `📎 Документ от ${userLink}`,
      parse_mode: 'Markdown'
    });
  }
}

module.exports = {
  start,
  handleCallback,
  handleMessage,
  handlePhoto
};
