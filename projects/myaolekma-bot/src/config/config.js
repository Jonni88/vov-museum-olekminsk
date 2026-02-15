require('dotenv').config();

module.exports = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  joomla: {
    siteUrl: process.env.JOOMLA_SITE_URL || 'https://мояолекма.рф',
    apiKey: process.env.JOOMLA_API_KEY,
    apiEndpoint: process.env.JOOMLA_API_ENDPOINT || '/api/v1'
  },
  search: {
    resultsPerPage: 5,
    maxDescriptionLength: 200
  },
  moderation: {
    autoApprove: false,
    notifyAdmin: true
  }
};
