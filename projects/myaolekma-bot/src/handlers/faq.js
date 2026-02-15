/**
 * FAQ / Часто задаваемые вопросы
 */

const FAQ_ITEMS = [
  {
    question: 'Как добавить организацию?',
    answer: '📝 Нажмите «Добавить на сайт» → выберите тип → заполните данные.\n\n' +
            'Два способа:\n' +
            '1️⃣ Самостоятельно — зарегистрируйтесь на сайте\n' +
            '2️⃣ Через бота — отправьте данные админу'
  },
  {
    question: 'Сколько стоит размещение?',
    answer: '💰 Размещение организаций, услуг и объявлений — *БЕСПЛАТНО*!\n\n' +
            'Платная только реклама (баннеры, выделенные позиции).'
  },
  {
    question: 'Как удалить данные?',
    answer: '🗑 Напишите в разделе «Обратная связь» или «Актуализировать данные».\n\n' +
            'Укажите что нужно удалить и причину.'
  },
  {
    question: 'Как долго ждать публикации?',
    answer: '⏱ Обычно 1-2 рабочих дня.\n\n' +
            'После проверки администратором данные появятся на сайте.'
  },
  {
    question: 'Можно ли редактировать данные?',
    answer: '✅ Да! Используйте раздел «🔐 Моя организация».\n\n' +
            'Подтвердите владение — и получите доступ к редактированию.'
  },
  {
    question: 'Как связаться с админом?',
    answer: '👤 Напишите в разделе «💬 Обратная связь» или напрямую: @Jonni88'
  }
];

function showFAQ(bot, chatId) {
  const keyboard = FAQ_ITEMS.map((item, index) => [
    { text: `${index + 1}. ${item.question}`, callback_data: `faq_item:${index}` }
  ]);
  keyboard.push([{ text: '🏠 Главное меню', callback_data: 'faq_done' }]);

  bot.sendMessage(chatId,
    '❓ *Часто задаваемые вопросы*\n\n' +
    'Выберите вопрос, чтобы увидеть ответ:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  );
}

async function handleCallback(bot, query, userStates) {
  const data = query.data;
  const chatId = query.message.chat.id;

  if (data === 'faq_done') {
    userStates.delete(chatId);
    await bot.editMessageText('✅ Возвращайтесь, если будут вопросы!', {
      chat_id: chatId,
      message_id: query.message.message_id
    });
    return;
  }

  if (data.startsWith('faq_item:')) {
    const index = parseInt(data.split(':')[1]);
    const item = FAQ_ITEMS[index];

    await bot.editMessageText(
      `❓ *${item.question}*\n\n${item.answer}`,
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '◀️ Назад к вопросам', callback_data: 'faq_back' }]
          ]
        }
      }
    );
  }

  if (data === 'faq_back') {
    const keyboard = FAQ_ITEMS.map((item, index) => [
      { text: `${index + 1}. ${item.question}`, callback_data: `faq_item:${index}` }
    ]);
    keyboard.push([{ text: '🏠 Главное меню', callback_data: 'faq_done' }]);

    await bot.editMessageText(
      '❓ *Часто задаваемые вопросы*\n\nВыберите вопрос:',
      {
        chat_id: chatId,
        message_id: query.message.message_id,
        parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: keyboard }
      }
    );
  }
}

module.exports = {
  showFAQ,
  handleCallback
};
