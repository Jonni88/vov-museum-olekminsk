<?php
/**
 * Плагин: WooCommerce Telegram Notifications
 * Отправляет уведомления в Telegram при событиях в магазине
 * 
 * Plugin Name: WC Telegram Notifications
 * Description: Отправляет уведомления о заказах в Telegram
 * Version: 1.0
 * Author: Your Name
 */

if (!defined('ABSPATH')) exit;

require_once plugin_dir_path(__FILE__) . 'config.php';

class WC_Telegram_Notifications {
    
    public function __construct() {
        // Новый заказ
        add_action('woocommerce_new_order', [$this, 'notify_new_order'], 10, 1);
        
        // Заказ оплачен
        add_action('woocommerce_payment_complete', [$this, 'notify_payment_received'], 10, 1);
        
        // Статус заказа изменён
        add_action('woocommerce_order_status_changed', [$this, 'notify_status_change'], 10, 3);
        
        // Новый отзыв
        add_action('comment_post', [$this, 'notify_new_review'], 10, 2);
    }
    
    /**
     * Отправка сообщения в Telegram
     */
    private function send_telegram($message) {
        $bot_token = get_option('wc_telegram_bot_token');
        $chat_ids = explode(',', get_option('wc_telegram_chat_ids', ''));
        
        if (empty($bot_token) || empty($chat_ids)) {
            return false;
        }
        
        foreach ($chat_ids as $chat_id) {
            $chat_id = trim($chat_id);
            if (empty($chat_id)) continue;
            
            $url = "https://api.telegram.org/bot{$bot_token}/sendMessage";
            $data = [
                'chat_id' => $chat_id,
                'text' => $message,
                'parse_mode' => 'HTML'
            ];
            
            wp_remote_post($url, [
                'body' => $data,
                'timeout' => 30
            ]);
        }
        
        return true;
    }
    
    /**
     * Уведомление о новом заказе
     */
    public function notify_new_order($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        
        $items = $order->get_items();
        $products_list = '';
        
        foreach ($items as $item) {
            $products_list .= "• {$item->get_name()} x{$item->get_quantity()}\n";
        }
        
        $message = "🛍 <b>НОВЫЙ ЗАКАЗ #{$order_id}</b>\n\n";
        $message .= "👤 Клиент: {$order->get_formatted_billing_full_name()}\n";
        $message .= "📱 Телефон: {$order->get_billing_phone()}\n";
        $message .= "📧 Email: {$order->get_billing_email()}\n\n";
        $message .= "📦 Товары:\n{$products_list}\n";
        $message .= "💰 Сумма: {$order->get_total()} {$order->get_currency()}\n";
        $message .= "💳 Оплата: {$order->get_payment_method_title()}\n";
        $message .= "🚚 Доставка: {$order->get_shipping_method()}";
        
        $this->send_telegram($message);
    }
    
    /**
     * Уведомление об оплате
     */
    public function notify_payment_received($order_id) {
        $order = wc_get_order($order_id);
        if (!$order) return;
        
        $message = "💵 <b>ОПЛАТА ПОЛУЧЕНА</b>\n\n";
        $message .= "Заказ #{$order_id}\n";
        $message .= "Сумма: {$order->get_total()} {$order->get_currency()}\n";
        $message .= "Клиент: {$order->get_formatted_billing_full_name()}";
        
        $this->send_telegram($message);
    }
    
    /**
     * Уведомление о смене статуса
     */
    public function notify_status_change($order_id, $old_status, $new_status) {
        $status_labels = [
            'pending' => '⏳ В ожидании',
            'processing' => '🔄 В обработке',
            'on-hold' => '⏸ На удержании',
            'completed' => '✅ Выполнен',
            'cancelled' => '❌ Отменён',
            'refunded' => '↩ Возврат',
            'failed' => '⚠️ Ошибка'
        ];
        
        $old_label = $status_labels[$old_status] ?? $old_status;
        $new_label = $status_labels[$new_status] ?? $new_status;
        
        $message = "📝 <b>СТАТУС ЗАКАЗА ИЗМЕНЁН</b>\n\n";
        $message .= "Заказ #{$order_id}\n";
        $message .= "{$old_label} → {$new_label}";
        
        $this->send_telegram($message);
    }
    
    /**
     * Уведомление о новом отзыве
     */
    public function notify_new_review($comment_id, $comment_approved) {
        $comment = get_comment($comment_id);
        if (!$comment || $comment->comment_type !== 'review') return;
        
        $product = wc_get_product($comment->comment_post_ID);
        if (!$product) return;
        
        $rating = get_comment_meta($comment_id, 'rating', true);
        $stars = str_repeat('⭐', intval($rating));
        
        $message = "⭐ <b>НОВЫЙ ОТЗЫВ</b>\n\n";
        $message .= "Товар: {$product->get_name()}\n";
        $message .= "Автор: {$comment->comment_author}\n";
        $message .= "Оценка: {$stars}\n\n";
        $message .= "💬 {$comment->comment_content}";
        
        $this->send_telegram($message);
    }
}

new WC_Telegram_Notifications();

// ===== АДМИНКА =====

add_action('admin_menu', function() {
    add_options_page(
        'Telegram Notifications',
        'Telegram',
        'manage_options',
        'wc-telegram',
        'wc_telegram_settings_page'
    );
});

function wc_telegram_settings_page() {
    if (isset($_POST['save_telegram_settings'])) {
        update_option('wc_telegram_bot_token', sanitize_text_field($_POST['bot_token']));
        update_option('wc_telegram_chat_ids', sanitize_text_field($_POST['chat_ids']));
        echo '<div class="updated"><p>Настройки сохранены!</p></div>';
    }
    
    $bot_token = get_option('wc_telegram_bot_token');
    $chat_ids = get_option('wc_telegram_chat_ids');
    ?>
    <div class="wrap">
        <h1>Telegram Notifications</h1>
        <form method="post">
            <table class="form-table">
                <tr>
                    <th>Bot Token</th>
                    <td>
                        <input type="text" name="bot_token" value="<?php echo esc_attr($bot_token); ?>" class="regular-text">
                        <p class="description">Получите у @BotFather</p>
                    </td>
                </tr>
                <tr>
                    <th>Chat IDs</th>
                    <td>
                        <input type="text" name="chat_ids" value="<?php echo esc_attr($chat_ids); ?>" class="regular-text">
                        <p class="description">ID чатов через запятую для уведомлений</p>
                    </td>
                </tr>
            </table>
            <?php submit_button('Сохранить', 'primary', 'save_telegram_settings'); ?>
        </form>
    </div>
    <?php
}
