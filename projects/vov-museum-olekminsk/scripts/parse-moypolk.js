#!/usr/bin/env node

/**
 * Парсер ветеранов с moypolk.ru/olekminsk
 * Собирает ФИО и ссылки на подробные страницы
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs').promises;

const BASE_URL = 'https://www.moypolk.ru';
const CITY_URL = '/olekminsk';

async function parseVeterans() {
    console.log('🔍 Парсим ветеранов Олёкминска...');
    
    try {
        // Загружаем страницу
        const response = await axios.get(BASE_URL + CITY_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 30000
        });
        
        const $ = cheerio.load(response.data);
        const veterans = [];
        
        // Ищем списки ветеранов (на основе структуры сайта)
        // Обычно данные в таблицах или списках
        
        // Пробуем разные селекторы
        const selectors = [
            '.veteran-item',
            '.soldier-item', 
            '.person-item',
            'tr', // табличные данные
            '.list-group-item',
            '.card'
        ];
        
        for (const selector of selectors) {
            $(selector).each((i, elem) => {
                const $elem = $(elem);
                
                // Ищем ФИО
                const name = $elem.find('.name, .fio, h3, h4, .title, td:first-child').text().trim();
                const link = $elem.find('a').attr('href');
                
                if (name && name.length > 5) {
                    veterans.push({
                        name: name.replace(/\s+/g, ' '),
                        link: link ? (link.startsWith('http') ? link : BASE_URL + link) : null,
                        source: 'moypolk.ru/olekminsk'
                    });
                }
            });
        }
        
        // Если не нашли через селекторы, ищем текст напрямую
        if (veterans.length === 0) {
            // Ищем паттерны типа "Фамилия Имя Отчество"
            const text = $('body').text();
            const namePattern = /([А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+)/g;
            const matches = text.match(namePattern);
            
            if (matches) {
                matches.forEach(name => {
                    if (name.length > 10 && !veterans.find(v => v.name === name)) {
                        veterans.push({
                            name: name,
                            link: null,
                            source: 'moypolk.ru/olekminsk'
                        });
                    }
                });
            }
        }
        
        console.log(`✅ Найдено ${veterans.length} ветеранов`);
        
        // Сохраняем
        const output = {
            city: 'Олёкминск',
            source: BASE_URL + CITY_URL,
            parsed_at: new Date().toISOString(),
            count: veterans.length,
            veterans: veterans
        };
        
        await fs.writeFile(
            'veterans_olekminsk.json',
            JSON.stringify(output, null, 2),
            'utf8'
        );
        
        console.log('💾 Данные сохранены в veterans_olekminsk.json');
        
        // Показываем первые 10
        console.log('\n📋 Первые 10 ветеранов:');
        veterans.slice(0, 10).forEach((v, i) => {
            console.log(`${i + 1}. ${v.name}`);
        });
        
        return veterans;
        
    } catch (error) {
        console.error('❌ Ошибка:', error.message);
        return [];
    }
}

// Запуск
parseVeterans();
