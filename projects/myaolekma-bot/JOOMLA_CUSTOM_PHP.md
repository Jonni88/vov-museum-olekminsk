# Custom PHP Endpoint для интеграции с Joomla 6

## Что это?

Вместо стандартного API Joomla, бот будет отправлять данные на специальный PHP-скрипт на твоём сайте. Этот скрипт сам создаёт статьи в Joomla.

## Преимущества

- ✅ Не нужно возиться с API-токенами
- ✅ Прямой доступ к БД и классам Joomla
- ✅ Можно добавить кастомную логику (пре-модерация, уведомления)
- ✅ Работает даже если API Joomla отключён

---

## 📁 Создание endpoint

### 1. Создай файл `bot-endpoint.php` в корне сайта

```php
<?php
/**
 * Endpoint для Telegram бота мояолекма.рф
 * Принимает данные и создаёт статьи в Joomla
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type, X-Bot-Secret');

// === НАСТРОЙКИ ===
define('BOT_SECRET_KEY', 'твой_секретный_ключ_минимум_32_символа'); // Измени!
define('DEFAULT_CATEGORY_COMPANY', 2);   // ID категории "Компании"
define('DEFAULT_CATEGORY_SERVICE', 3);   // ID категории "Услуги"
define('DEFAULT_CATEGORY_AD', 4);        // ID категории "Объявления"
define('DEFAULT_AUTHOR_ID', 42);         // ID пользователя-автора статей

// === ПРОВЕРКА БЕЗОПАСНОСТИ ===
$secret = $_SERVER['HTTP_X_BOT_SECRET'] ?? '';
if ($secret !== BOT_SECRET_KEY) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized', 'code' => 403]);
    exit;
}

// === ПОЛУЧЕНИЕ ДАННЫХ ===
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON', 'code' => 400]);
    exit;
}

// === ПОДКЛЮЧЕНИЕ К JOOMLA ===
try {
    define('_JEXEC', 1);
    define('JPATH_BASE', __DIR__);
    
    require_once JPATH_BASE . '/includes/defines.php';
    require_once JPATH_BASE . '/includes/framework.php';
    
    // Загружаем Joomla
    $app = Joomla\CMS\Factory::getApplication('site');
    $app->initialise();
    
    // Получаем доступ к базе данных
    $db = Joomla\CMS\Factory::getDbo();
    $user = Joomla\CMS\Factory::getUser(DEFAULT_AUTHOR_ID);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Joomla initialization failed: ' . $e->getMessage()]);
    exit;
}

// === ОБРАБОТКА ДЕЙСТВИЙ ===
$action = $data['action'] ?? 'create';

switch ($action) {
    case 'create':
        handleCreate($data, $db, $user);
        break;
        
    case 'test':
        echo json_encode(['success' => true, 'message' => 'Connection OK', 'joomla_version' => JVERSION]);
        break;
        
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Unknown action: ' . $action]);
}

// === ФУНКЦИЯ СОЗДАНИЯ СТАТЬИ ===
function handleCreate($data, $db, $user) {
    // Проверяем обязательные поля
    if (empty($data['name']) || empty($data['description'])) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing required fields: name, description']);
        return;
    }
    
    // Определяем категорию
    $categoryId = getCategoryId($data['type'] ?? 'company');
    
    // Генерируем алиас (URL-friendly название)
    $alias = generateAlias($data['name']);
    
    // Проверяем уникальность алиаса
    $alias = makeUniqueAlias($db, $alias);
    
    // Формируем introtext
    $introtext = formatContent($data);
    
    // Дата создания
    $now = Joomla\CMS\Factory::getDate()->toSql();
    
    // === СОЗДАЁМ СТАТЬЮ ===
    $article = new stdClass();
    $article->title = htmlspecialchars($data['name'], ENT_QUOTES, 'UTF-8');
    $article->alias = $alias;
    $article->introtext = $introtext;
    $article->fulltext = '';
    $article->catid = $categoryId;
    $article->state = 1; // 1 = опубликовано, 0 = черновик
    $article->created = $now;
    $article->created_by = $user->id;
    $article->modified = $now;
    $article->modified_by = $user->id;
    $article->publish_up = $now;
    $article->language = '*';
    $article->access = 1; // Public
    $article->metadata = '{}';
    $article->attribs = '{}';
    $article->images = '{}';
    $article->urls = '{}';
    $article->version = 1;
    $article->ordering = 0;
    $article->metakey = '';
    $article->metadesc = generateMetaDesc($data);
    
    try {
        $result = $db->insertObject('#__content', $article);
        $articleId = $db->insertid();
        
        // Сохраняем custom fields (если есть)
        saveCustomFields($db, $articleId, $data);
        
        // Сохраняем фото (если есть URL)
        if (!empty($data['photo_url'])) {
            saveFeaturedImage($db, $articleId, $data['photo_url']);
        }
        
        // Генерируем URL статьи
        $articleUrl = generateArticleUrl($db, $articleId, $alias, $categoryId);
        
        echo json_encode([
            'success' => true,
            'article_id' => $articleId,
            'url' => $articleUrl,
            'title' => $article->title
        ]);
        
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// === ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ===

function getCategoryId($type) {
    $map = [
        'company' => DEFAULT_CATEGORY_COMPANY,
        'service' => DEFAULT_CATEGORY_SERVICE,
        'ad' => DEFAULT_CATEGORY_AD
    ];
    return $map[$type] ?? DEFAULT_CATEGORY_COMPANY;
}

function generateAlias($title) {
    // Транслитерация русского текста
    $translit = [
        'а' => 'a', 'б' => 'b', 'в' => 'v', 'г' => 'g', 'д' => 'd',
        'е' => 'e', 'ё' => 'yo', 'ж' => 'zh', 'з' => 'z', 'и' => 'i',
        'й' => 'y', 'к' => 'k', 'л' => 'l', 'м' => 'm', 'н' => 'n',
        'о' => 'o', 'п' => 'p', 'р' => 'r', 'с' => 's', 'т' => 't',
        'у' => 'u', 'ф' => 'f', 'х' => 'h', 'ц' => 'ts', 'ч' => 'ch',
        'ш' => 'sh', 'щ' => 'sch', 'ъ' => '', 'ы' => 'y', 'ь' => '',
        'э' => 'e', 'ю' => 'yu', 'я' => 'ya',
        'А' => 'A', 'Б' => 'B', 'В' => 'V', 'Г' => 'G', 'Д' => 'D',
        'Е' => 'E', 'Ё' => 'Yo', 'Ж' => 'Zh', 'З' => 'Z', 'И' => 'I',
        'Й' => 'Y', 'К' => 'K', 'Л' => 'L', 'М' => 'M', 'Н' => 'N',
        'О' => 'O', 'П' => 'P', 'Р' => 'R', 'С' => 'S', 'Т' => 'T',
        'У' => 'U', 'Ф' => 'F', 'Х' => 'H', 'Ц' => 'Ts', 'Ч' => 'Ch',
        'Ш' => 'Sh', 'Щ' => 'Sch', 'Ъ' => '', 'Ы' => 'Y', 'Ь' => '',
        'Э' => 'E', 'Ю' => 'Yu', 'Я' => 'Ya'
    ];
    
    $alias = strtr($title, $translit);
    $alias = preg_replace('/[^a-zA-Z0-9\-\s]/', '', $alias);
    $alias = preg_replace('/\s+/', '-', $alias);
    $alias = strtolower(trim($alias, '-'));
    
    return $alias ?: 'untitled';
}

function makeUniqueAlias($db, $alias) {
    $original = $alias;
    $counter = 1;
    
    while (true) {
        $query = $db->getQuery(true)
            ->select('COUNT(*)')
            ->from('#__content')
            ->where('alias = ' . $db->quote($alias));
        $db->setQuery($query);
        
        if ($db->loadResult() == 0) {
            return $alias;
        }
        
        $alias = $original . '-' . $counter;
        $counter++;
    }
}

function formatContent($data) {
    $html = '<p>' . nl2br(htmlspecialchars($data['description'])) . '</p>';
    
    if (!empty($data['schedule'])) {
        $html .= '<p><strong>График работы:</strong> ' . htmlspecialchars($data['schedule']) . '</p>';
    }
    
    if (!empty($data['phones'])) {
        $phones = array_map('trim', explode(',', $data['phones']));
        $html .= '<p><strong>Телефон:</strong> ';
        $phoneLinks = [];
        foreach ($phones as $phone) {
            $clean = preg_replace('/[^0-9+]/', '', $phone);
            $phoneLinks[] = '<a href="tel:' . $clean . '">' . htmlspecialchars($phone) . '</a>';
        }
        $html .= implode(', ', $phoneLinks) . '</p>';
    }
    
    if (!empty($data['email'])) {
        $html .= '<p><strong>Email:</strong> <a href="mailto:' . htmlspecialchars($data['email']) . '">' . 
                 htmlspecialchars($data['email']) . '</a></p>';
    }
    
    if (!empty($data['address'])) {
        $html .= '<p><strong>Адрес:</strong> ' . htmlspecialchars($data['address']) . '</p>';
    }
    
    if (!empty($data['social'])) {
        $html .= '<p><strong>Соцсети:</strong> ' . htmlspecialchars($data['social']) . '</p>';
    }
    
    return $html;
}

function generateMetaDesc($data) {
    $desc = strip_tags($data['description']);
    return substr($desc, 0, 160);
}

function saveCustomFields($db, $articleId, $data) {
    // Здесь сохраняешь в custom fields Joomla (если используешь)
    // Например: phones, email, address в отдельные поля
    
    $fields = [
        'phones' => $data['phones'] ?? null,
        'email' => $data['email'] ?? null,
        'address' => $data['address'] ?? null,
        'schedule' => $data['schedule'] ?? null,
        'social' => $data['social'] ?? null
    ];
    
    foreach ($fields as $fieldName => $value) {
        if (empty($value)) continue;
        
        // Найди ID поля по имени
        $query = $db->getQuery(true)
            ->select('id')
            ->from('#__fields')
            ->where('name = ' . $db->quote($fieldName))
            ->where('state = 1');
        $db->setQuery($query);
        $fieldId = $db->loadResult();
        
        if ($fieldId) {
            $fieldValue = new stdClass();
            $fieldValue->field_id = $fieldId;
            $fieldValue->item_id = $articleId;
            $fieldValue->value = $value;
            
            $db->insertObject('#__fields_values', $fieldValue);
        }
    }
}

function saveFeaturedImage($db, $articleId, $photoUrl) {
    // Сохраняет ссылку на изображение в поле images
    $images = json_encode(['image_intro' => $photoUrl, 'image_fulltext' => $photoUrl]);
    
    $query = $db->getQuery(true)
        ->update('#__content')
        ->set('images = ' . $db->quote($images))
        ->where('id = ' . (int)$articleId);
    $db->setQuery($query);
    $db->execute();
}

function generateArticleUrl($db, $articleId, $alias, $catId) {
    // Получаем алиас категории
    $query = $db->getQuery(true)
        ->select('alias')
        ->from('#__categories')
        ->where('id = ' . (int)$catId);
    $db->setQuery($query);
    $catAlias = $db->loadResult();
    
    // Формируем URL (зависит от настроек SEF)
    $base = rtrim(Joomla\CMS\Uri\Uri::root(), '/');
    return $base . '/index.php/' . ($catAlias ? $catAlias . '/' : '') . $alias;
}
```

---

## 🔧 Настройка бота

### 1. Обнови `config.js`

```javascript
module.exports = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  joomla: {
    siteUrl: process.env.JOOMLA_SITE_URL || 'https://мояолекма.рф',
    apiSecret: process.env.JOOMLA_API_SECRET, // Секретный ключ
    endpoint: process.env.JOOMLA_ENDPOINT || '/bot-endpoint.php'
  },
  // ...
};
```

### 2. Обнови `.env`

```
BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_telegram_id
JOOMLA_SITE_URL=https://мояолекма.рф
JOOMLA_API_SECRET=твой_секретный_ключ_минимум_32_символа
JOOMLA_ENDPOINT=/bot-endpoint.php
```

### 3. Обнови `moderation.js`

```javascript
async function publishToJoomla(submission) {
  const axios = require('axios');
  const config = require('../config/config');
  
  const response = await axios.post(
    config.joomla.siteUrl + config.joomla.endpoint,
    {
      action: 'create',
      type: submission.type,
      name: submission.name,
      description: submission.description,
      schedule: submission.schedule,
      phones: submission.phones,
      email: submission.email,
      address: submission.address,
      social: submission.social,
      photo_url: submission.photo ? getPhotoUrl(submission.photo) : null
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'X-Bot-Secret': config.joomla.apiSecret
      },
      timeout: 30000
    }
  );
  
  return response.data;
}

// Получение URL фото из Telegram
async function getPhotoUrl(photo) {
  // Здесь логика получения URL фото
  // Нужно скачать фото с серверов Telegram и залить на свой сервер
  // или использовать внешнее хранилище
  return null; // Пока заглушка
}
```

---

## 🧪 Тестирование

### 1. Проверь доступность endpoint

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Bot-Secret: твой_секретный_ключ" \
  -d '{"action":"test"}' \
  https://мояолекма.рф/bot-endpoint.php
```

Ожидаемый ответ:
```json
{"success":true,"message":"Connection OK","joomla_version":"6.x.x"}
```

### 2. Тест создания статьи

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Bot-Secret: твой_секретный_ключ" \
  -d '{
    "action":"create",
    "type":"company",
    "name":"Тестовая компания",
    "description":"Описание тестовой компании",
    "phones":"89241234567",
    "email":"test@example.com"
  }' \
  https://мояолекма.рф/bot-endpoint.php
```

---

## ⚠️ Важные моменты

### Безопасность
- **Секретный ключ** должен быть длинным и случайным
- Храни ключ в `.env`, никогда не коммить в git
- Можно добавить IP whitelist (разрешить только IP сервера бота)

### Фото
- Telegram не даёт прямых URL на фото
- Нужно либо скачивать фото и загружать на сервер
- Либо использовать внешнее хранилище (Cloudinary, S3)

### Категории
- Узнай ID категорий в админке Joomla: **Content → Categories**
- Обнови `DEFAULT_CATEGORY_*` в PHP-скрипте

### Ошибки
- Все ошибки пишутся в `error_log` сервера
- Проверяй: `/var/log/apache2/error.log` или `/var/log/nginx/error.log`

---

## 🐛 Отладка

Если не работает, проверь:

1. **Права на файл:**
   ```bash
   chmod 644 bot-endpoint.php
   chown www-data:www-data bot-endpoint.php
   ```

2. **PHP версия:** Должна быть 8.1+

3. **Расширения PHP:**
   ```bash
   php -m | grep -i json
   php -m | grep -i mysqli
   ```

4. **Логи ошибок:**
   ```php
   // Добавь в начало скрипта для отладки
   error_reporting(E_ALL);
   ini_set('display_errors', 1);
   ```

Есть вопросы по коду? Какой вариант выбираешь? 🕵️
