/**
 * Виртуальный музей «Память Олёкминского края»
 * JavaScript функциональность
 */

// ===== Данные ветеранов (пример) =====
const veteransData = [
    {
        id: 1,
        fullname: "Иванов Иван Иванович",
        birth_year: 1920,
        death_year: 1995,
        settlement: "с. Олёкминск",
        rank: "Сержант",
        awards: ["Орден Красной Звезды", "Медаль «За отвагу»"],
        biography: "Участник Великой Отечественной войны с 1941 года. Прошёл от Сталинграда до Берлина.",
        photo: null
    },
    {
        id: 2,
        fullname: "Петров Петр Петрович",
        birth_year: 1915,
        death_year: 1943,
        settlement: "с. Тюкян",
        rank: "Младший лейтенант",
        awards: ["Орден Отечественной войны", "Медаль «За боевые заслуги»"],
        biography: "Погиб в боях за освобождение Украины. Похоронен в братской могиле.",
        photo: null
    },
    {
        id: 3,
        fullname: "Сидорова Мария Ивановна",
        birth_year: 1922,
        death_year: 2005,
        settlement: "п. Марха",
        rank: "Старший сержант медицинской службы",
        awards: ["Медаль «За боевые заслуги»"],
        biography: "Санитарка на передовой. Эвакуировала раненых под огнём противника.",
        photo: null
    }
];

// ===== Данные погибших =====
const fallenData = [
    { name: "Алексеев Николай Степанович", years: "1923-1942", settlement: "с. Олёкминск" },
    { name: "Борисов Иван Михайлович", years: "1918-1943", settlement: "с. Тюкян" },
    { name: "Васильев Петр Алексеевич", years: "1921-1944", settlement: "п. Марха" },
    { name: "Григорьев Семён Дмитриевич", years: "1915-1941", settlement: "с. Олёкминск" },
    { name: "Дмитриев Андрей Васильевич", years: "1919-1943", settlement: "с. Тюкян" }
];

// ===== DOM загрузка =====
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    loadHeroes();
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
    return `
        <div class="hero-card" data-id="${veteran.id}">
            <div class="hero-card-image">
                ${veteran.photo ? `<img src="${veteran.photo}" alt="${veteran.fullname}">` : '🎖️'}
            </div>
            <div class="hero-card-content">
                <h3>${veteran.fullname}</h3>
                <p class="hero-card-years">${veteran.birth_year} — ${veteran.death_year || 'н.в.'}</p>
                <p>${veteran.settlement}</p>
                <div class="hero-card-awards">
                    ${veteran.awards.slice(0, 2).map(a => `<span class="award-badge">${a}</span>`).join('')}
                </div>
            </div>
        </div>
    `;
}

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

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Собираем данные
        const formData = new FormData(form);
        const data = {};
        formData.forEach((value, key) => {
            data[key] = value;
        });

        // Здесь будет отправка на сервер
        console.log('Данные формы:', data);

        // Показываем уведомление
        showNotification('Спасибо! Информация отправлена на проверку.');
        form.reset();
    });
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
