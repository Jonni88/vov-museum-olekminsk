# 🎨 Современный дизайн магазина косметики

## Цветовая схема

| Роль | Цвет | HEX |
|------|------|-----|
| Основной | Нежно-розовый | `#FFB6C1` |
| Акцентный | Золотой | `#D4AF37` |
| Текст | Тёмно-серый | `#2D2D2D` |
| Фон | Белый/кремовый | `#FAFAFA` |
| Вторичный | Пыльная роза | `#E8D5D5` |

## Типографика

- **Заголовки:** Playfair Display (элегантный, женственный)
- **Текст:** Inter или Manrope (современный, читаемый)
- **Акценты:** Cormorant Garamond (курсив для цитат)

## Рекомендуемая тема

### Вариант 1: Blocksy (бесплатная, рекомендую)
- Современный block-based редактор
- Отличная производительность
- Встроенный конструктор хедера/футера
- WooCommerce ready

### Вариант 2: Astra Pro
- Лёгкая и быстрая
- Множество стартовых шаблонов
- Хорошая интеграция с Elementor

### Вариант 3: Flavor (премиум ~$59)
- Специально для косметики/красоты
- Встроенные шаблоны страниц
- Интеграция с Instagram

## Установка Blocksy

```bash
# Внутри контейнера WordPress
docker exec -it cosmetics_wp bash

# Или через админку:
# Внешний вид → Темы → Добавить → "Blocksy"
```

## Кастомизация через CSS

Добавить в: **Внешний вид → Настроить → Дополнительные стили**

```css
/* Основные переменные */
:root {
  --primary-color: #FFB6C1;
  --accent-color: #D4AF37;
  --text-dark: #2D2D2D;
  --bg-light: #FAFAFA;
  --rose-dust: #E8D5D5;
}

/* Глобальные стили */
body {
  font-family: 'Inter', sans-serif;
  color: var(--text-dark);
  background: var(--bg-light);
}

/* Кнопки */
.wp-block-button__link,
.button,
.woocommerce-button {
  background: linear-gradient(135deg, var(--primary-color) 0%, #FF91A4 100%);
  border: none;
  border-radius: 30px;
  padding: 14px 32px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.3);
}

.button:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.4);
}

/* Карточки товаров */
.product-card {
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
  transition: all 0.3s ease;
}

.product-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.product-image {
  position: relative;
  overflow: hidden;
}

.product-image img {
  transition: transform 0.5s ease;
}

.product-card:hover .product-image img {
  transform: scale(1.05);
}

/* Значок скидки */
.onsale {
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  position: absolute;
  top: 15px;
  left: 15px;
  box-shadow: 0 4px 10px rgba(212, 175, 55, 0.3);
}

/* Заголовки */
h1, h2, h3 {
  font-family: 'Playfair Display', serif;
  font-weight: 700;
}

/* Hero секция */
.hero-section {
  background: linear-gradient(135deg, var(--rose-dust) 0%, var(--primary-color) 100%);
  min-height: 80vh;
  display: flex;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  top: -200px;
  right: -200px;
}

/* Формы */
input, textarea, select {
  border: 2px solid #E0E0E0;
  border-radius: 12px;
  padding: 14px 18px;
  transition: border-color 0.3s;
}

input:focus, textarea:focus {
  border-color: var(--primary-color);
  outline: none;
  box-shadow: 0 0 0 3px rgba(255, 182, 193, 0.2);
}

/* Корзина */
.cart-icon {
  position: relative;
}

.cart-count {
  background: var(--accent-color);
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: -8px;
  right: -8px;
}

/* Анимации */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeInUp 0.6s ease forwards;
}

/* Отзывы */
.review-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 5px 20px rgba(0,0,0,0.05);
  position: relative;
}

.review-card::before {
  content: '"';
  font-family: 'Playfair Display', serif;
  font-size: 80px;
  color: var(--primary-color);
  opacity: 0.3;
  position: absolute;
  top: 10px;
  left: 20px;
}

/* Футер */
.site-footer {
  background: var(--text-dark);
  color: white;
  padding: 60px 0 30px;
}

.footer-widget h3 {
  color: var(--primary-color);
  font-size: 18px;
  margin-bottom: 20px;
}
```

## Структура главной страницы (современная)

```
┌─────────────────────────────────────────┐
│  Хедер: Лого | Меню | Поиск | Корзина   │
├─────────────────────────────────────────┤
│                                         │
│  🌸 HERO СЕКЦИЯ                         │
│  "Откройте природную красоту"           │
│  [Каталог] [Акции]                      │
│                                         │
├─────────────────────────────────────────┤
│  ✨ Популярные категории (иконки)       │
│  [Лицо] [Волосы] [Макияж] [Парфюм]      │
├─────────────────────────────────────────┤
│  🔥 Хиты продаж (сетка товаров)         │
│  Карточка: Фото | Название | Цена | ⭐   │
├─────────────────────────────────────────┤
│  🎁 Баннер акции (большой, яркий)       │
├─────────────────────────────────────────┤
│  💬 Отзывы клиентов (карусель)          │
├─────────────────────────────────────────┤
│  📸 Instagram лента (6 фото)            │
├─────────────────────────────────────────┤
│  📝 Подписка на рассылку                │
├─────────────────────────────────────────┤
│  Футер: колонки с ссылками, соцсети     │
└─────────────────────────────────────────┘
```

## Плагины для дизайна

### Обязательные:
- **Blocksy Companion** — расширение темы
- **Elementor** или **Gutenberg** (встроенный)
- **WooCommerce Product Add-ons** — доп. опции

### Для красоты:
- **Slider Revolution** — слайдеры (премиум)
- **Smash Balloon Instagram Feed** — лента Instagram
- **MC4WP** — красивая форма подписки

## Google Fonts подключение

Добавить в `functions.php` темы или через плагин:

```php
function add_google_fonts() {
    wp_enqueue_style('google-fonts', 
        'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Inter:wght@400;500;600&display=swap', 
        false);
}
add_action('wp_enqueue_scripts', 'add_google_fonts');
```

## Иконки

Рекомендую **Phosphor Icons** или **Lucide**:
- Современный минимализм
- Тонкие линии
- Подходят для косметики

Подключение:
```html
<script src="https://unpkg.com/@phosphor-icons/web"></script>
```

## Примеры референсов

- https://www.glossier.com/ — минимализм, розовый
- https://www.fentybeauty.com/ — современный, яркий
- https://www.kyliecosmetics.com/ — элегантный, золотой акцент

---

*Примени CSS → настрой тему → добавь контент → готово!*
