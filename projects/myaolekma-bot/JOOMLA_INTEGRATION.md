# Интеграция с Joomla 6

## Вариант 1: API Joomla (рекомендуется)

### Установка Joomla API
1. В админке Joomla: **System → Global Configuration → API**
2. Включить API
3. Создать API Token для бота

### Настройка бота
В `.env` добавь:
```
JOOMLA_API_KEY=your_api_token_here
JOOMLA_API_ENDPOINT=/api/index.php/v1
```

### Публикация через API
В `moderation.js` раскомментируй функцию `publishToJoomla`:

```javascript
const axios = require('axios');

async function publishToJoomla(submission) {
  const article = {
    title: submission.name,
    alias: slugify(submission.name),
    introtext: formatDescription(submission),
    catid: getCategoryId(submission.type), // ID категории
    state: 1, // 1 = опубликовано
    language: '*'
  };
  
  const response = await axios.post(
    `${config.joomla.siteUrl}/api/index.php/v1/content/articles`,
    { data: article },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Joomla-Token': config.joomla.apiKey
      }
    }
  );
  
  return response.data;
}
```

## Вариант 2: Прямой доступ к MySQL

Если API недоступен:

```javascript
const mysql = require('mysql2/promise');

async function publishToJoomla(submission) {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'joomla_user',
    password: 'password',
    database: 'joomla_db'
  });
  
  const [result] = await connection.execute(
    `INSERT INTO jos_content 
     (title, alias, introtext, catid, state, created, created_by, language) 
     VALUES (?, ?, ?, ?, 1, NOW(), 0, '*')`,
    [
      submission.name,
      slugify(submission.name),
      formatDescription(submission),
      getCategoryId(submission.type)
    ]
  );
  
  await connection.end();
  return { articleId: result.insertId };
}
```

## Вариант 3: Custom Endpoint (PHP)

Создай файл `bot-endpoint.php` на сайте:

```php
<?php
// /bot-endpoint.php
header('Content-Type: application/json');

$secret = $_SERVER['HTTP_X_BOT_SECRET'] ?? '';
if ($secret !== 'your_secret_key') {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$data = json_decode(file_get_contents('php://input'), true);

// Подключаемся к Joomla
define('_JEXEC', 1);
require_once 'includes/defines.php';
require_once 'includes/framework.php';

$app = JFactory::getApplication('site');
$user = JFactory::getUser();

// Создаём статью
$article = new stdClass();
$article->title = $data['name'];
$article->alias = JFilterOutput::stringURLSafe($data['name']);
$article->introtext = formatContent($data);
$article->catid = getCategoryId($data['type']);
$article->state = 1;
$article->created = JFactory::getDate()->toSql();

JFactory::getDbo()->insertObject('#__content', $article);

echo json_encode(['success' => true, 'id' => $article->id]);
```

## Категории контента

Настрой соответствие типов и ID категорий в `config.js`:

```javascript
categories: {
  company: 2,    // ID категории "Компании"
  service: 3,    // ID категории "Услуги"
  ad: 4          // ID категории "Объявления"
}
```

## Дополнительные поля (Custom Fields)

Если используешь Custom Fields в Joomla:

```javascript
async function saveCustomFields(articleId, submission) {
  const fields = {
    'phones': submission.phones,
    'email': submission.email,
    'address': submission.address,
    'schedule': submission.schedule,
    'social': submission.social
  };
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value) {
      await connection.execute(
        `INSERT INTO jos_fields_values (field_id, item_id, value) 
         VALUES ((SELECT id FROM jos_fields WHERE name = ?), ?, ?)`,
        [fieldName, articleId, value]
      );
    }
  }
}
```

## Форматирование описания

```javascript
function formatDescription(submission) {
  let html = `<p>${submission.description}</p>`;
  
  if (submission.schedule) {
    html += `<p><strong>График работы:</strong> ${submission.schedule}</p>`;
  }
  if (submission.phones) {
    html += `<p><strong>Телефон:</strong> ${submission.phones}</p>`;
  }
  if (submission.email) {
    html += `<p><strong>Email:</strong> <a href="mailto:${submission.email}">${submission.email}</a></p>`;
  }
  if (submission.address) {
    html += `<p><strong>Адрес:</strong> ${submission.address}</p>`;
  }
  if (submission.social) {
    html += `<p><strong>Соцсети:</strong> ${submission.social}</p>`;
  }
  
  return html;
}
```

## Полезные ссылки

- [Joomla API Documentation](https://docs.joomla.org/J4.x:Joomla_Core_APIs)
- [Creating Articles via API](https://docs.joomla.org/J4.x:Joomla_Core_APIs/Content/Articles)
