/**
 * Виртуальный музей «Память Олёкминского края»
 * JavaScript функциональность
 */

// ===== Данные =====
let veteransData = [];
let photosData = [];
let documentsData = [];

// ===== Загрузка данных из JSON =====
async function loadAllData() {
    await Promise.all([
        loadVeteransData(),
        loadPhotosData(),
        loadDocumentsData()
    ]);
}

async function loadVeteransData() {
    try {
        const response = await fetch('data/veterans-moypolk.json');
        if (response.ok) {
            veteransData = await response.json();
            console.log(`✅ Загружено ${veteransData.length} ветеранов`);
        }
    } catch (error) {
        console.log('⚠️ Данные ветеранов не загружены');
        veteransData = [];
    }
}

async function loadPhotosData() {
    try {
        const response = await fetch('data/photos.json');
        if (response.ok) {
            photosData = await response.json();
            console.log(`✅ Загружено ${photosData.length} фотографий`);
        }
    } catch (error) {
        console.log('⚠️ Фотоархив не загружен');
        photosData = [];
    }
}

async function loadDocumentsData() {
    try {
        const response = await fetch('data/documents.json');
        if (response.ok) {
            documentsData = await response.json();
            console.log(`✅ Загружено ${documentsData.length} документов`);
        }
    } catch (error) {
        console.log('⚠️ Документы не загружены');
        documentsData = [];
    }
}

// ===== Данные погибших =====
const fallenData = [
    { name: "Алексеев Николай Степанович", years: "1923-1942", settlement: "с. Олёкминск" },
    { name: "Борисов Иван Михайлович", years: "1918-1943", settlement: "с. Тюкян" },
    { name: "Васильев Петр Алексеевич", years: "1921-1944", settlement: "п. Марха" },
    { name: "Григорьев Семён Дмитриевич", years: "1915-1941", settlement: "с. Олёкминск" },
    { name: "Дмитриев Андрей Васильевич", years: "1919-1943", settlement: "с. Тюкян" }
];

// ===== DOM загрузка =====
document.addEventListener('DOMContentLoaded', async function() {
    await loadAllData();
    initApp();
});

function initApp() {
    loadHeroes();
    loadGallery();
    loadDocuments();
    loadMemoryBook();
    initSearch();
    initNavigation();
    initCounters();
    initForm();
    initModal();
}

// ===== Загрузка героев =====
function loadHeroes() {
    const grid = document.getElementById('heroes-grid');
    if (!grid) return;

    grid.innerHTML = veteransData.map(veteran => createHeroCard(veteran)).join('');

    // Добавляем обработчики клика
    grid.querySelectorAll('.hero-card').forEach((card, index) => {
        card.addEventListener('click', () => openVeteranModal(veteransData[index]));
    });
}

function createHeroCard(veteran) {
    const years = veteran.birth_year && veteran.death_year 
        ? `${veteran.birth_year} — ${veteran.death_year}`
        : (veteran.birth_year ? `${veteran.birth_year} — ?` : 'Годы неизвестны');
    
    return `
        <div class="hero-card" data-id="${veteran.id}">
            <div class="hero-card-image">
                ${veteran.photo ? `<img src="${veteran.photo}" alt="${veteran.fullname}" onerror="this.style.display='none'; this.parentElement.textContent='🎖️';">` : '🎖️'}
            </div>
            <div class="hero-card-content">
                <h3>${veteran.fullname}</h3>
                <p class="hero-card-years">${years}</p>
                <p>${veteran.settlement || 'Олёкминский район'}</p>
                <div class="hero-card-awards">
                    ${(veteran.awards || []).slice(0, 2).map(a => `<span class="award-badge">${a}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

// ===== Загрузка галереи =====
function loadGallery() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;

    if (photosData.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 40px; color: #666;">
                <p>📷 Фотоархив пока пуст.</p>
                <p>Скоро здесь появятся исторические фотографии.</p>
            </div>
        `;
        return;
    }

    grid.innerHTML = photosData.map(photo => `
        <div class="gallery-item" onclick="openPhotoModal(${photo.id})">
            <div class="gallery-image">
                ${photo.url ? 
                    `<img src="${photo.url}" alt="${photo.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'gallery-placeholder\'>📷</div>';">` : 
                    '<div class="gallery-placeholder">📷</div>'
                }
            </div>
            <div class="gallery-overlay">
                <h4>${photo.title}</h4>
                ${photo.year ? `<span class="gallery-year">${photo.year}</span>` : ''}
            </div>
        </div>
    `).join('');
}

// ===== Загрузка документов =====
function loadDocuments() {
    const list = document.getElementById('documents-list');
    if (!list) return;

    if (documentsData.length === 0) {
        list.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <p>📄 Архив документов пока пуст.</p>
                <p>Скоро здесь появятся наградные листы, письма и другие документы.</p>
            </div>
        `;
        return;
    }

    const typeIcons = {
        order: '📋',
        medal: '🏅',
        letter: '✉️',
        photo: '📷',
        certificate: '📜',
        newspaper: '📰',
        other: '📄'
    };

    const typeNames = {
        order: 'Приказ',
        medal: 'Наградной лист',
        letter: 'Письмо',
        photo: 'Фотография',
        certificate: 'Свидетельство',
        newspaper: 'Газетная вырезка',
        other: 'Документ'
    };

    list.innerHTML = documentsData.map(doc => `
        <div class="document-card" onclick="openDocumentModal(${doc.id})">
            <div class="document-icon">${typeIcons[doc.type] || '📄'}</div>
            <div class="document-content">
                <h4>${doc.title}</h4>
                <p>${doc.description || 'Без описания'}</p>
                <div class="document-meta">
                    <span class="document-type">${typeNames[doc.type] || doc.type}</span>
                    ${doc.date ? `<span class="document-date">${doc.date}</span>` : ''}
                    ${doc.person ? `<span class="document-person">${doc.person}</span>` : ''}
                </div>
            </div>
        </div>
    `).join('');
}

// ===== Модальные окна для фото и документов =====
window.openPhotoModal = function(id) {
    const photo = photosData.find(p => p.id === id);
    if (!photo) return;

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');

    modalBody.innerHTML = `
        <div class="modal-photo-view">
            ${photo.url ? 
                `<img src="${photo.url}" alt="${photo.title}" onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\'modal-photo-placeholder\'>📷</div>';">` : 
                '<div class="modal-photo-placeholder">📷</div>'
            }
        </div>
        <div class="modal-photo-info">
            <h2>${photo.title}</h2>
            ${photo.year ? `<p class="photo-year">📅 ${photo.year} год</p>` : ''}
            ${photo.place ? `<p class="photo-place">📍 ${photo.place}</p>` : ''}
            ${photo.description ? `<p class="photo-desc">${photo.description}</p>` : ''}
            ${photo.source ? `<p class="photo-source">📷 ${photo.source}</p>` : ''}
        </div>
    `;

    modal.classList.add('active');
};

window.openDocumentModal = function(id) {
    const doc = documentsData.find(d => d.id === id);
    if (!doc) return;

    const modal = document.getElementById('modal');
    const modalBody = document.getElementById('modal-body');

    const typeNames = {
        order: 'Приказ',
        medal: 'Наградной лист',
        letter: 'Письмо',
        photo: 'Фотография',
        certificate: 'Свидетельство',
        newspaper: 'Газетная вырезка',
        other: 'Документ'
    };

    modalBody.innerHTML = `
        <div class="modal-document-view">
            <h2>${doc.title}</h2>
            <div class="document-details">
                <p><strong>Тип:</strong> ${typeNames[doc.type] || doc.type}</p>
                ${doc.date ? `<p><strong>Дата:</strong> ${doc.date}</p>` : ''}
                ${doc.number ? `<p><strong>Номер:</strong> ${doc.number}</p>` : ''}
                ${doc.organization ? `<p><strong>Организация:</strong> ${doc.organization}</p>` : ''}
                ${doc.person ? `<p><strong>Относится к:</strong> ${doc.person}</p>` : ''}
                ${doc.source ? `<p><strong>Источник:</strong> ${doc.source}</p>` : ''}
            </div>
            ${doc.description ? `<div class="document-description"><p>${doc.description}</p></div>` : ''}
            ${doc.url ? `<a href="${doc.url}" target="_blank" class="btn btn-primary" style="display: inline-block; margin-top: 20px;">📄 Открыть документ</a>` : ''}
        </div>
    `;

    modal.classList.add('active');
};

// ===== Загрузка книги памяти =====
function loadMemoryBook() {
    const list = document.getElementById('memory-list');
    if (!list) return;

    list.innerHTML = fallenData.map(person => `
        <div class="memory-item">
            <div class="memory-item-name">${person.name}</div>
            <div class="memory-item-info">${person.years}, ${person.settlement}</div>
        </div>
    `).join('');
}

// ===== Поиск =====
function initSearch() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    if (!searchBtn || !searchInput) return;

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    function performSearch() {
        const query = searchInput.value.trim().toLowerCase();
        if (!query) return;

        const results = veteransData.filter(v => 
            v.fullname.toLowerCase().includes(query)
        );

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p style="text-align: center; color: rgba(255,255,255,0.7);">Ничего не найдено</p>';
        } else {
            resultsContainer.innerHTML = `
                <div class="heroes-grid" style="margin-top: 30px;">
                    ${results.map(v => createHeroCard(v)).join('')}
                </div>
            `;
        }
    }
}

// ===== Навигация =====
function initNavigation() {
    const nav = document.querySelector('.main-nav');
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    // Фиксация навбара при скролле
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            nav.style.background = 'rgba(26, 26, 26, 0.98)';
        } else {
            nav.style.background = 'rgba(26, 26, 26, 0.95)';
        }
    });

    // Мобильное меню
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
    }

    // Плавный скролл
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                navMenu.classList.remove('active');
            }
        });
    });
}

// ===== Счётчики =====
function initCounters() {
    const veteransCount = document.getElementById('veterans-count');
    const heroesCount = document.getElementById('heroes-count');

    if (veteransCount) {
        animateCounter(veteransCount, 0, veteransData.length, 2000);
    }

    if (heroesCount) {
        animateCounter(heroesCount, 0, 20, 2000); // Пример: 20 Героев
    }
}

function animateCounter(element, start, end, duration) {
    let startTime = null;

    function animation(currentTime) {
        if (!startTime) startTime = currentTime;
        const progress = currentTime - startTime;
        const percentage = Math.min(progress / duration, 1);
        
        element.textContent = Math.floor(start + (end - start) * percentage);

        if (percentage < 1) {
            requestAnimationFrame(animation);
        }
    }

    requestAnimationFrame(animation);
}

// ===== Форма =====
function initForm() {
    const form = document.getElementById('veteran-form');
    if (!form) return;

    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Собираем данные
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Отправляем в Telegram
        await sendToTelegram(data);

        // Показываем уведомление
        showNotification('Спасибо! Информация отправлена на проверку.');
        form.reset();
    });
}

// ===== Отправка в Telegram =====
async function sendToTelegram(data) {
    // Настройки бота (в реальном проекте лучше использовать сервер)
    const BOT_TOKEN = '8212359042:AAESrIjZC1cgydeGwxbCnLbdZ0XiSuroMPc';
    const CHAT_ID = '615528360';
    
    const message = `📝 *Новая заявка в музей!*

👤 *ФИО:* ${data.fullname || 'Не указано'}
📅 *Годы:* ${data.birth_year || '?'} - ${data.death_year || 'н.в.'}
🏠 *Населённый пункт:* ${data.settlement || 'Не указано'}
📞 *Контакты:* ${data.contacts || 'Не указано'}

📝 *Описание:*
${data.biography || 'Нет описания'}

🏅 *Награды:* ${data.awards || 'Не указаны'}

📎 *Источник:* Виртуальный музей Олёкминского района`;

    try {
        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });
        
        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Отправлено в Telegram');
        } else {
            console.error('❌ Ошибка отправки:', result);
        }
    } catch (error) {
        console.error('❌ Ошибка сети:', error);
        // Даже если ошибка, показываем пользователю успешное сообщение
    }
}

// ===== Модальное окно =====
function initModal() {
    const modal = document.getElementById('veteran-modal');
    const closeBtn = modal?.querySelector('.modal-close');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
        });
    }

    // Закрытие по клику вне
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    }
}

function openVeteranModal(veteran) {
    const modal = document.getElementById('veteran-modal');
    const modalBody = document.getElementById('modal-body');

    if (!modal || !modalBody) return;

    modalBody.innerHTML = `
        <h2>${veteran.fullname}</h2>
        <p style="color: #666; margin-bottom: 20px;">
            ${veteran.birth_year} — ${veteran.death_year || 'н.в.'} | ${veteran.settlement}
        </p>
        
        <div style="margin-bottom: 20px;">
            ${veteran.awards.map(a => `<span class="award-badge">${a}</span>`).join(' ')}
        </div>
        
        <h3 style="margin-bottom: 10px; color: var(--color-primary);">Биография</h3>
        <p style="line-height: 1.8;">${veteran.biography}</p>
        
        <div style="margin-top: 30px; padding: 20px; background: var(--color-light); border-radius: 5px;">
            <h4 style="margin-bottom: 10px;">Воинское звание</h4>
            <p>${veteran.rank}</p>
        </div>
    `;

    modal.classList.add('active');
}

// ===== Уведомление =====
function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--color-primary);
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        box-shadow: 0 5px 20px rgba(0,0,0,0.3);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ===== Дополнительные стили для анимаций =====
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
