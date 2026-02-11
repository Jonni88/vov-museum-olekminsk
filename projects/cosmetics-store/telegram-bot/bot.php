<?php
/**
 * Telegram Bot для WooCommerce
 * Отправляет уведомления о заказах, получает команды
 */

// Конфигурация
require_once 'config.php';

/**
 * Отправка сообщения в Telegram
 */
function sendTelegramMessage($chat_id, $message, $reply_markup = null) {
    $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/sendMessage";
    
    $data = [
        'chat_id' => $chat_id,
        'text' => $message,
        'parse_mode' => 'HTML'
    ];
    
    if ($reply_markup) {
        $data['reply_markup'] = json_encode($reply_markup);
    }
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($result, true);
}

/**
 * Установка webhook
 */
function setWebhook() {
    $url = "https://api.telegram.org/bot" . BOT_TOKEN . "/setWebhook";
    $webhook_url = WEBHOOK_URL;
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, ['url' => $webhook_url]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $result = curl_exec($ch);
    curl_close($ch);
    
    return json_decode($result, true);
}

/**
 * Обработка входящих сообщений
 */
function handleMessage($update) {
    $message = $update['message'] ?? null;
    $callback = $update['callback_query'] ?? null;
    
    if ($message) {
        $chat_id = $message['chat']['id'];
        $text = $message['text'] ?? '';
        
        switch ($text) {
            case '/start':
                $welcome = "👋 Добро пожаловать в бот магазина косметики!\n\n";
                $welcome .= "Здесь вы можете:\n";
                $welcome .= "📦 Проверить статус заказа\n";
                $welcome .= "🎁 Узнать об акциях\n";
                $welcome .= "💬 Написать в поддержку\n\n";
                $welcome .= "Выберите действие:";
                
                $keyboard = [
                    'inline_keyboard' => [
                        [['text' => '📦 Мои заказы', 'callback_data' => 'orders']],
                        [['text' => '🎁 Акции', 'callback_data' => 'promo']],
                        [['text' => '💬 Поддержка', 'callback_data' => 'support']]
                    ]
                ];
                
                sendTelegramMessage($chat_id, $welcome, $keyboard);
                break;
                
            case '/help':
                $help = "📋 <b>Доступные команды:</b>\n\n";
                $help .= "/start — Главное меню\n";
                $help .= "/orders — Список заказов\n";
                $help .= "/status [номер] — Статус заказа\n";
                $help .= "/promo — Актуальные акции\n";
                $help .= "/support — Связь с поддержкой";
                
                sendTelegramMessage($chat_id, $help);
                break;
                
            case '/promo':
                sendPromo($chat_id);
                break;
                
            case '/support':
                $support = "💬 <b>Связь с поддержкой</b>\n\n";
                $support .= "Напишите нам: @support_username\n";
                $support .= "Или позвоните: +7 (XXX) XXX-XX-XX\n\n";
                $support .= "Режим работы: Пн-Пт 10:00-19:00";
                
                sendTelegramMessage($chat_id, $support);
                break;
                
            default:
                // Проверка на номер заказа
                if (preg_match('/^#?(\d+)$/', $text, $matches)) {
                    sendOrderStatus($chat_id, $matches[1]);
                } else {
                    sendTelegramMessage($chat_id, "Используйте /start для вызова меню или /help для списка команд.");
                }
        }
    }
    
    // Обработка callback-кнопок
    if ($callback) {
        $chat_id = $callback['message']['chat']['id'];
        $data = $callback['data'];
        
        switch ($data) {
            case 'orders':
                sendTelegramMessage($chat_id, "Введите номер заказа (например: #1234) или напишите /orders");
                break;
            case 'promo':
                sendPromo($chat_id);
                break;
            case 'support':
                sendTelegramMessage($chat_id, "Напишите нам: @support_username");
                break;
        }
    }
}

/**
 * Отправка информации об акциях
 */
function sendPromo($chat_id) {
    $promo = "🎁 <b>Актуальные акции:</b>\n\n";
    $promo .= "1️⃣ Скидка 15% на первый заказ\n";
    $promo .= "Промокод: <code>WELCOME15</code>\n\n";
    $promo .= "2️⃣ Бесплатная доставка от 3000 ₽\n\n";
    $promo .= "3️⃣ Подарок при заказе от 5000 ₽\n\n";
    $promo .= "🛒 <a href='https://your-site.com/shop'>Перейти в магазин</a>";
    
    sendTelegramMessage($chat_id, $promo);
}

/**
 * Отправка статуса заказа (заглушка - подключить к WooCommerce API)
 */
function sendOrderStatus($chat_id, $order_id) {
    // Здесь интеграция с WooCommerce REST API
    $status = "📦 <b>Заказ #{$order_id}</b>\n\n";
    $status .= "Статус: <b>В обработке</b> ✅\n";
    $status .= "Сумма: 2 500 ₽\n";
    $status .= "Дата: 11.02.2026\n\n";
    $status .= "Детали заказа доступны в <a href='https://your-site.com/my-account/orders/'>личном кабинете</a>";
    
    sendTelegramMessage($chat_id, $status);
}

// ===== WEBHOOK HANDLER =====

// Получаем входящие данные
$content = file_get_contents("php://input");
$update = json_decode($content, true);

if ($update) {
    handleMessage($update);
}

// Ответ для Telegram (чтобы не было ошибок)
echo json_encode(['ok' => true]);
