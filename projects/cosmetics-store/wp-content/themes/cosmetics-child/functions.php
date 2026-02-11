<?php
/**
 * Child Theme для косметики
 * На базе Blocksy или Astra
 * 
 * Theme Name: Cosmetics Child
 * Template: blocksy
 */

// Подключение Google Fonts
add_action('wp_enqueue_scripts', function() {
    wp_enqueue_style(
        'google-fonts', 
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;700&family=Inter:wght@300;400;500;600&display=swap',
        [],
        null
    );
    
    wp_enqueue_style(
        'parent-style',
        get_template_directory_uri() . '/style.css'
    );
    
    wp_enqueue_style(
        'child-style',
        get_stylesheet_directory_uri() . '/style.css',
        ['parent-style'],
        '1.0.0'
    );
    
    // Современные иконки
    wp_enqueue_script(
        'phosphor-icons',
        'https://unpkg.com/@phosphor-icons/web',
        [],
        null,
        true
    );
});

// Добавляем поддержку WooCommerce
add_action('after_setup_theme', function() {
    add_theme_support('woocommerce');
    add_theme_support('wc-product-gallery-zoom');
    add_theme_support('wc-product-gallery-lightbox');
    add_theme_support('wc-product-gallery-slider');
});

// Кастомные размеры изображений
add_action('after_setup_theme', function() {
    add_image_size('product-grid', 400, 500, true);
    add_image_size('product-large', 800, 1000, false);
});

// Удаляем стандартные стили WooCommerce (если нужно)
// add_filter('woocommerce_enqueue_styles', '__return_empty_array');

// Кастомные метки товаров
add_filter('woocommerce_sale_flash', function($html, $post, $product) {
    $percentage = '';
    if ($product->is_type('simple')) {
        $regular = $product->get_regular_price();
        $sale = $product->get_sale_price();
        if ($regular > 0) {
            $percentage = round((($regular - $sale) / $regular) * 100);
        }
    }
    
    return '<span class="onsale">-' . $percentage . '%</span>';
}, 10, 3);

// Мини-корзина в хедере
add_filter('woocommerce_add_to_cart_fragments', function($fragments) {
    $fragments['.cart-count'] = '<span class="cart-count">' . WC()->cart->get_cart_contents_count() . '</span>';
    return $fragments;
});

// Добавляем бейдж "Новинка" для товаров за последние 30 дней
function is_new_product($product_id) {
    $created = strtotime(get_the_date('Y-m-d', $product_id));
    $days = (time() - $created) / 86400;
    return $days <= 30;
}

add_action('woocommerce_before_shop_loop_item_title', function() {
    global $product;
    if (is_new_product($product->get_id())) {
        echo '<span class="product-badge new">NEW</span>';
    }
}, 9);

// Хлебные крошки кастомные
add_filter('woocommerce_breadcrumb_defaults', function($defaults) {
    $defaults['delimiter'] = ' <i class="ph ph-caret-right"></i> ';
    $defaults['wrap_before'] = '<nav class="woocommerce-breadcrumb">';
    return $defaults;
});

// Табы на странице товара
add_filter('woocommerce_product_tabs', function($tabs) {
    // Переименовываем табы
    $tabs['description']['title'] = 'Описание';
    $tabs['reviews']['title'] = 'Отзывы (' . get_comments_number() . ')';
    $tabs['additional_information']['title'] = 'Характеристики';
    
    return $tabs;
});

// AJAX добавление в корзину
add_action('wp_ajax_add_to_cart', 'custom_add_to_cart_ajax');
add_action('wp_ajax_nopriv_add_to_cart', 'custom_add_to_cart_ajax');

function custom_add_to_cart_ajax() {
    $product_id = $_POST['product_id'];
    $quantity = $_POST['quantity'] ?? 1;
    
    WC()->cart->add_to_cart($product_id, $quantity);
    
    wp_send_json([
        'success' => true,
        'cart_count' => WC()->cart->get_cart_contents_count(),
        'cart_total' => WC()->cart->get_cart_total()
    ]);
}

// Шорткод для баннера акции
add_shortcode('promo_banner', function($atts) {
    $atts = shortcode_atts([
        'title' => 'Специальное предложение',
        'subtitle' => 'Скидка 20% на первый заказ',
        'button' => 'Получить скидку',
        'code' => 'WELCOME20'
    ], $atts);
    
    ob_start();
    ?>
    <div class="promo-banner">
        <div class="promo-content">
            <h3><?php echo esc_html($atts['title']); ?></h3>
            <p><?php echo esc_html($atts['subtitle']); ?></p>
            <div class="promo-code">
                <code><?php echo esc_html($atts['code']); ?></code>
                <button onclick="copyPromoCode(this)" data-code="<?php echo esc_attr($atts['code']); ?>">
                    Скопировать
                </button>
            </div>
        </div>
    </div>
    <?php
    return ob_get_clean();
});

// Шорткод категорий с иконками
add_shortcode('category_grid', function() {
    $categories = get_terms([
        'taxonomy' => 'product_cat',
        'hide_empty' => false,
        'parent' => 0
    ]);
    
    ob_start();
    ?>
    <div class="category-grid">
        <?php foreach ($categories as $cat) : 
            $thumbnail_id = get_term_meta($cat->term_id, 'thumbnail_id', true);
            $image = wp_get_attachment_url($thumbnail_id);
        ?>
        <a href="<?php echo get_term_link($cat); ?>" class="category-card">
            <?php if ($image) : ?>
                <img src="<?php echo esc_url($image); ?>" alt="<?php echo esc_attr($cat->name); ?>">
            <?php endif; ?>
            <h4><?php echo esc_html($cat->name); ?></h4>
            <span class="count"><?php echo $cat->count; ?> товаров</span>
        </a>
        <?php endforeach; ?>
    </div>
    <?php
    return ob_get_clean();
});
