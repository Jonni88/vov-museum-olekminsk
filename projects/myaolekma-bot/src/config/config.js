require('dotenv').config();

module.exports = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  siteUrl: process.env.SITE_URL || 'https://мояолекма.рф',
  siteRegisterUrl: process.env.SITE_REGISTER_URL || 'https://мояолекма.рф/register',
  siteLoginUrl: process.env.SITE_LOGIN_URL || 'https://мояолекма.рф/login',
  secretKey: process.env.SECRET_KEY || 'default-secret-key-change-in-production'
};
