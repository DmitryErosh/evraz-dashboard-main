// ============================================================
//  🚀 ЕВРАЗ Dashboard — Единая логика приложения
//  Версия: 2.0
//  Дата: 28.06.2026
// ============================================================

// ============================================================
//   1. КОНФИГУРАЦИЯ
// ============================================================
const CONFIG = {
    // Ключи localStorage
    STORAGE_KEYS: {
        WORKS: 'evraz_raboty_drobilki',
        POLOMKI_DROB: 'evraz_polomki_drobienie',
        POLOMKI_SEPAR: 'evraz_polomki_separatsiya',
        BARABANY: 'barabany_data',
        BELTS: 'evraz_conveyor_belts',
        NODES: 'evraz_hours_dof',
        PPR: 'evraz_elektriki_ppr',
        ZAYAVKI: 'evraz_elektriki_zayavki',
        EVENTS: 'evraz_global_events',
    },
    
    // Названия разделов
    SECTIONS: {
        drobienie: 'Дробление',
        separatsiya: 'Сепарация',
        elektriki: 'Электрики',
        tehsluzhba: 'Технологическая служба'
    }
};

// ============================================================
//   2. РАБОТА С ХРАНИЛИЩЕМ (ЕДИНЫЙ API)
// ============================================================
const DB = {
    // Получить все данные
    get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch {
            return [];
        }
    },
    
    // Сохранить данные
    set(key, data) {
        localStorage.setItem(key, JSON.stringify(data));
    },
    
    // Добавить запись
    add(key, item) {
        const data = this.get(key);
        data.push(item);
        this.set(key, data);
        return item;
    },
    
    // Обновить запись
    update(key, id, updates) {
        const data = this.get(key);
        const index = data.findIndex(item => item.id === id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updates };
            this.set(key, data);
            return data[index];
        }
        return null;
    },
    
    // Удалить запись
    remove(key, id) {
        const data = this.get(key);
        const filtered = data.filter(item => item.id !== id);
        this.set(key, filtered);
        return filtered;
    },
    
    // Очистить все данные
    clear(key) {
        this.set(key, []);
    }
};

// ============================================================
//   3. СИСТЕМА УВЕДОМЛЕНИЙ
// ============================================================
const Notify = {
    show(text, type = 'info') {
        // Удаляем старую ноту
        const old = document.querySelector('.notification-global');
        if (old) old.remove();
        
        const el = document.createElement('div');
        el.className = `notification-global notification ${type}`;
        el.textContent = text;
        document.body.appendChild(el);
        
        // Показываем
        setTimeout(() => el.classList.add('show'), 10);
        
        // Скрываем через 4 секунды
        clearTimeout(el._timeout);
        el._timeout = setTimeout(() => {
            el.classList.remove('show');
            setTimeout(() => el.remove(), 400);
        }, 4000);
    },
    
    success(text) { this.show(text, 'success'); },
    error(text) { this.show(text, 'error'); },
    warning(text) { this.show(text, 'warning'); },
    info(text) { this.show(text, 'info'); }
};

// ============================================================
//   4. СИСТЕМА СОБЫТИЙ (ГЛОБАЛЬНАЯ ЛЕНТА)
// ============================================================
const Events = {
    // Добавить событие
    add(eventData) {
        const events = DB.get(CONFIG.STORAGE_KEYS.EVENTS);
        const event = {
            id: `evt_${Date.now()}`,
            ...eventData,
            datetime: new Date().toISOString()
        };
        events.unshift(event);
        
        // Ограничиваем до 100 событий
        if (events.length > 100) {
            DB.set(CONFIG.STORAGE_KEYS.EVENTS, events.slice(0, 100));
        } else {
            DB.set(CONFIG.STORAGE_KEYS.EVENTS, events);
        }
        
        // Отправляем в другие вкладки
        this._broadcast(event);
        
        return event;
    },
    
    // Получить все события
    getAll() {
        return DB.get(CONFIG.STORAGE_KEYS.EVENTS);
    },
    
    // Получить последние N событий
    getRecent(limit = 20) {
        return this.getAll().slice(0, limit);
    },
    
    // Очистить ленту
    clear() {
        DB.clear(CONFIG.STORAGE_KEYS.EVENTS);
    },
    
    // Broadcast для синхронизации между вкладками
    _broadcast(event) {
        try {
            const channel = new BroadcastChannel('evraz_dashboard');
            channel.postMessage({ type: 'NEW_EVENT', event });
            channel.close();
        } catch (e) {
            // BroadcastChannel может не поддерживаться
        }
    },
    
    // Слушать события из других вкладок
    listen(callback) {
        try {
            const channel = new BroadcastChannel('evraz_dashboard');
            channel.onmessage = (msg) => {
                if (msg.data.type === 'NEW_EVENT') {
                    callback(msg.data.event);
                }
            };
            return channel;
        } catch (e) {
            return null;
        }
    }
};

// ============================================================
//   5. ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================================
function getCurrentDateTime() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;
}

function getCurrentDate() {
    const now = new Date();
    return now.toLocaleDateString('ru-RU');
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const d = new Date(dateStr);
        if (!isNaN(d)) {
            return d.toLocaleDateString('ru-RU');
        }
    } catch (e) {}
    return dateStr;
}

function generateId() {
    return Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
//   6. ХЛЕБНЫЕ КРОШКИ
// ============================================================
function renderBreadcrumb(items) {
    const container = document.getElementById('breadcrumbContainer');
    if (!container) return;
    
    if (!items || items.length === 0) {
        container.innerHTML = '';
        return;
    }
    
    let html = '<div class="breadcrumb">';
    items.forEach((item, index) => {
        const isLast = index === items.length - 1;
        if (item.url) {
            html += `<a href="${item.url}">${item.label}</a>`;
        } else {
            html += `<span class="${isLast ? 'current' : ''}">${item.label}</span>`;
        }
        if (!isLast) {
            html += `<span class="separator">→</span>`;
        }
    });
    html += '</div>';
    container.innerHTML = html;
}

// ============================================================
//   7. ДЕМО-ДАННЫЕ
// ============================================================
function loadDemoData() {
    // Проверяем, есть ли уже данные
    const hasData = DB.get(CONFIG.STORAGE_KEYS.WORKS).length > 0;
    if (hasData) return;
    
    console.log('📦 Загрузка демо-данных...');
    
    // ===== Работы по дробилкам =====
    const works = [
        { id: generateId(), title: 'Замена броней КМДТ', equipment: 'Дробилка КМДТ-2200', status: 'Выполнено', priority: 'высокий', description: 'Замена изношенных броней', startDate: '2026-06-20', endDate: '2026-06-21', team: 'Иванов И.И., Петров П.П.', createdAt: new Date().toISOString() },
        { id: generateId(), title: 'Ремонт грохота', equipment: 'Грохот ГИС-32', status: 'В работе', priority: 'средний', description: 'Ремонт корпуса грохота', startDate: '2026-06-25', endDate: '', team: 'Сидоров С.С.', createdAt: new Date().toISOString() },
        { id: generateId(), title: 'Замена сит', equipment: 'Грохот ГИЛ-52', status: 'Ожидает', priority: 'низкий', description: 'Замена изношенных сит', startDate: '2026-06-28', endDate: '', team: 'Козлов К.К.', createdAt: new Date().toISOString() },
        { id: generateId(), title: 'Диагностика подшипников', equipment: 'Дробилка КСД-2200', status: 'В работе', priority: 'средний', description: 'Проверка состояния подшипников', startDate: '2026-06-26', endDate: '', team: 'Смирнов А.А.', createdAt: new Date().toISOString() },
        { id: generateId(), title: 'Плановое ТО', equipment: 'Дробилка КМД-2200', status: 'Ожидает', priority: 'низкий', description: 'Плановое техническое обслуживание', startDate: '2026-06-30', endDate: '', team: 'Иванов И.И.', createdAt: new Date().toISOString() }
    ];
    DB.set(CONFIG.STORAGE_KEYS.WORKS, works);
    
    // ===== Поломки дробления =====
    const polomkiDrob = [
        { id: generateId(), equipment: 'Грохот ГИС-32', type: 'механическая', description: 'Трещина в корпусе грохота', date: '2026-06-25', status: 'В работе', cause: 'Износ металла', actions: 'Сварка корпуса', responsible: 'Сидоров С.С.', estimatedHours: '8', actualHours: '4', createdAt: new Date().toISOString() },
        { id: generateId(), equipment: 'Дробилка КМДТ-2200', type: 'механическая', description: 'Износ дробящих плит', date: '2026-06-24', status: 'Зафиксирована', cause: 'Истекший ресурс', actions: 'Замена плит', responsible: 'Иванов И.И.', estimatedHours: '12', actualHours: '0', createdAt: new Date().toISOString() }
    ];
    DB.set(CONFIG.STORAGE_KEYS.POLOMKI_DROB, polomkiDrob);
    
    // ===== Поломки сепарации =====
    const polomkiSepar = [
        { id: generateId(), equipment: 'Сепаратор №6', type: 'механическая', description: 'Износ подшипника на верхнем барабане', date: '2026-06-26', status: 'В работе', cause: 'Износ', actions: 'Замена подшипника', responsible: 'Петров П.П.', estimatedHours: '6', actualHours: '2', createdAt: new Date().toISOString() },
        { id: generateId(), equipment: 'Сепаратор №10', type: 'электрическая', description: 'Сбой в работе привода', date: '2026-06-25', status: 'В работе', cause: 'Перегрузка', actions: 'Диагностика привода', responsible: 'Смирнов А.А.', estimatedHours: '4', actualHours: '1', createdAt: new Date().toISOString() },
        { id: generateId(), equipment: 'Конвейер №4', type: 'механическая', description: 'Протечка масла в редукторе', date: '2026-06-24', status: 'Ожидает', cause: 'Износ сальников', actions: 'Замена сальников', responsible: 'Козлов К.К.', estimatedHours: '3', actualHours: '0', createdAt: new Date().toISOString() }
    ];
    DB.set(CONFIG.STORAGE_KEYS.POLOMKI_SEPAR, polomkiSepar);
    
    // ===== Барабаны =====
    const barabany = [
        { id: generateId(), separator_num: '1', top_drum: '1-1', top_date: '2026-05-01', bottom_drum: '2-7', bottom_date: '2026-04-15' },
        { id: generateId(), separator_num: '2', top_drum: '1-2', top_date: '2026-06-01', bottom_drum: '2-2', bottom_date: '2026-05-20' },
        { id: generateId(), separator_num: '3', top_drum: '1-3', top_date: '2026-04-10', bottom_drum: '2-3', bottom_date: '2026-03-01' },
        { id: generateId(), separator_num: '4', top_drum: '1-4', top_date: '2026-06-15', bottom_drum: '2-4', bottom_date: '2026-06-01' },
        { id: generateId(), separator_num: '5', top_drum: '1-5', top_date: '2026-05-20', bottom_drum: '2-5', bottom_date: '2026-04-10' },
        { id: generateId(), separator_num: '6', top_drum: '1-6', top_date: '2026-06-20', bottom_drum: '2-6', bottom_date: '2026-05-01' },
        { id: generateId(), separator_num: '7', top_drum: '1-7', top_date: '2026-05-10', bottom_drum: '2-7', bottom_date: '2026-04-01' },
        { id: generateId(), separator_num: '8', top_drum: '1-8', top_date: '2026-06-10', bottom_drum: '2-8', bottom_date: '2026-05-15' }
    ];
    DB.set(CONFIG.STORAGE_KEYS.BARABANY, barabany);
    
    // ===== Конвейерные ленты =====
    const belts = [
        { id: generateId(), number: 'КЛ-1', name: 'Конвейер подачи руды', type: 'резинотканевая', width: '1200', length: '150', install: '2025-11-01', condition: 'хорошее', wear: '45', notes: 'Соединение в норме' },
        { id: generateId(), number: 'КЛ-2', name: 'Конвейер №2', type: 'резинотканевая', width: '1400', length: '200', install: '2025-12-15', condition: 'отличное', wear: '20', notes: 'Новая лента' },
        { id: generateId(), number: 'КЛ-3', name: 'Конвейер №3', type: 'резинотканевая', width: '1600', length: '47', install: '2026-01-10', condition: 'хорошее', wear: '30', notes: '' },
        { id: generateId(), number: 'КЛ-4', name: 'Конвейер №4', type: 'резинотканевая', width: '1600', length: '47', install: '2026-02-20', condition: 'удовлетворительное', wear: '70', notes: 'Требует контроля' },
        { id: generateId(), number: 'КЛ-5', name: 'Конвейер №5', type: 'резинотканевая', width: '1600', length: '47', install: '2025-10-05', condition: 'хорошее', wear: '50', notes: '' },
        { id: generateId(), number: 'КЛ-7', name: 'Конвейер №7', type: 'резинотканевая', width: '1400', length: '110', install: '2025-09-01', condition: 'отличное', wear: '15', notes: '' },
        { id: generateId(), number: 'КЛ-8', name: 'Конвейер №8', type: 'резинотканевая', width: '1400', length: '106', install: '2025-11-20', condition: 'хорошее', wear: '35', notes: '' },
        { id: generateId(), number: 'КЛ-10', name: 'Конвейер №10', type: 'резинотканевая', width: '1200', length: '80', install: '2026-03-01', condition: 'отличное', wear: '10', notes: '' }
    ];
    DB.set(CONFIG.STORAGE_KEYS.BELTS, belts);
    
    // ===== Узлы дробилок =====
    const nodes = [
        { id: generateId(), name: 'Эксцентриковый узел КМДТ', equipment: 'Дробилка КМДТ-2200', serial: 'EX-2200-001', install: '2025-09-01', resource: '8000', actual: '6200', status: 'эксплуатируется', material: 'Сталь 40ХН2МА', weight: '450', notes: 'Требуется контроль люфта' },
        { id: generateId(), name: 'Броня неподвижная', equipment: 'Дробилка КСД-2200', serial: 'BR-2200-001', install: '2025-10-15', resource: '5000', actual: '3800', status: 'эксплуатируется', material: 'Сталь 110Г13Л', weight: '320', notes: 'Износ 60%' },
        { id: generateId(), name: 'Броня подвижная', equipment: 'Дробилка КСД-2200', serial: 'BR-2200-002', install: '2025-10-15', resource: '5000', actual: '3800', status: 'эксплуатируется', material: 'Сталь 110Г13Л', weight: '280', notes: 'Износ 55%' },
        { id: generateId(), name: 'Эксцентриковый узел КМД', equipment: 'Дробилка КМД-2200', serial: 'EX-2200-002', install: '2025-11-01', resource: '8000', actual: '2500', status: 'эксплуатируется', material: 'Сталь 40ХН2МА', weight: '420', notes: 'В норме' },
        { id: generateId(), name: 'Броня неподвижная КМД-3', equipment: 'Дробилка КМД-3', serial: 'BR-KMD-001', install: '2025-12-01', resource: '4000', actual: '2560', status: 'требует замены', material: 'Сталь 110Г13Л', weight: '350', notes: 'Критический износ!' }
    ];
    DB.set(CONFIG.STORAGE_KEYS.NODES, nodes);
    
    // ===== ППР электриков =====
    const ppr = [
        { id: generateId(), title: 'ППР двигателя МП-1', equipment: 'Двигатель 250 кВт', type: 'капитальный', date: '2026-07-15', status: 'планируется', team: 'Смирнов А.А., Козлов В.В.', tasks: 'Замена подшипников, Проверка изоляции, Контроль вибрации', materials: 'Подшипники 6308 - 2 шт, Смазка - 5 кг' },
        { id: generateId(), title: 'ТО трансформатора ТМ-2500', equipment: 'Трансформатор ТМ-2500', type: 'текущий', date: '2026-06-25', status: 'выполнен', team: 'Смирнов А.А.', tasks: 'Проверка масла, Замер сопротивления', materials: 'Масло трансформаторное - 50 л' },
        { id: generateId(), title: 'Ремонт РЩ-3', equipment: 'Распределительный щит РЩ-3', type: 'средний', date: '2026-06-30', status: 'в работе', team: 'Козлов В.В., Петров П.П.', tasks: 'Замена контактов, Проверка автоматов', materials: 'Контакты - 6 шт' },
        { id: generateId(), title: 'ППР двигателя дробилки №3', equipment: 'Двигатель дробилки №3', type: 'капитальный', date: '2026-07-01', status: 'планируется', team: 'Смирнов А.А.', tasks: 'Полная диагностика, Замена подшипников', materials: 'Подшипники 6310 - 4 шт' },
        { id: generateId(), title: 'ТО частотного преобразователя', equipment: 'Частотный преобразователь', type: 'текущий', date: '2026-06-20', status: 'выполнен', team: 'Козлов В.В.', tasks: 'Проверка настроек, Чистка', materials: '' }
    ];
    DB.set(CONFIG.STORAGE_KEYS.PPR, ppr);
    
    // ===== Заявки электриков =====
    const zayavki = [
        { id: generateId(), number: 'ЗЭ-2026-001', title: 'Неисправность освещения', description: 'Отсутствует освещение на участке дробления', location: 'Участок дробления, пост №3', priority: 'высокий', status: 'в работе', assigned: 'Смирнов А.А.', materials: 'Лампы ДРЛ - 4 шт, Кабель 3x2.5 - 20 м', createdAt: new Date().toISOString() },
        { id: generateId(), number: 'ЗЭ-2026-002', title: 'Перегрев двигателя ДСП №4', description: 'Двигатель ДСП №4 перегревается', location: 'Главный корпус', priority: 'высокий', status: 'новая', assigned: '', materials: '', createdAt: new Date().toISOString() },
        { id: generateId(), number: 'ЗЭ-2026-003', title: 'Трансформатор ТМ-2500 шумит', description: 'Повышенный шум, возможен дефект обмоток', location: 'Трансформаторная', priority: 'средний', status: 'в работе', assigned: 'Козлов В.В.', materials: '', createdAt: new Date().toISOString() },
        { id: generateId(), number: 'ЗЭ-2026-004', title: 'Искрение на контактах РЩ-3', description: 'Искрение на контактах распредщита', location: 'РЩ-3', priority: 'средний', status: 'новая', assigned: '', materials: 'Контакты - 3 шт', createdAt: new Date().toISOString() }
    ];
    DB.set(CONFIG.STORAGE_KEYS.ZAYAVKI, zayavki);
    
    // ===== Глобальные события =====
    const events = [
        { id: generateId(), type: 'работа', action: 'создание', page: 'Дробление', title: 'Добавлена работа "Замена броней КМДТ"', description: 'Замена изношенных броней', user: 'Иванов И.И.', datetime: new Date(Date.now() - 3600000 * 2).toISOString(), important: false },
        { id: generateId(), type: 'поломка', action: 'создание', page: 'Дробление', title: 'Зафиксирована поломка грохота ГИС-32', description: 'Трещина в корпусе', user: 'Сидоров С.С.', datetime: new Date(Date.now() - 3600000 * 5).toISOString(), important: true },
        { id: generateId(), type: 'работа', action: 'завершение', page: 'Дробление', title: 'Выполнена работа "Замена сит"', description: 'Замена изношенных сит на грохоте ГИЛ-52', user: 'Козлов К.К.', datetime: new Date(Date.now() - 3600000 * 24).toISOString(), important: false },
        { id: generateId(), type: 'замена', action: 'создание', page: 'Сепарация', title: 'Замена барабана на сепараторе №7', description: 'Установлен новый барабан 2-7', user: 'Петров П.П.', datetime: new Date(Date.now() - 3600000 * 48).toISOString(), important: false },
        { id: generateId(), type: 'поломка', action: 'обновление', page: 'Сепарация', title: 'Изменён статус поломки сепаратора №6', description: 'В работе → В ожидании', user: 'Петров П.П.', datetime: new Date(Date.now() - 3600000 * 72).toISOString(), important: false }
    ];
    DB.set(CONFIG.STORAGE_KEYS.EVENTS, events);
    
    console.log('✅ Демо-данные загружены!');
}

// ============================================================
//   8. ЗАПУСК ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================================
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем демо-данные
    loadDemoData();
    
    // Добавляем глобальную ноту для уведомлений
    const style = document.createElement('style');
    style.textContent = `
        .notification-global {
            position: fixed;
            bottom: 24px;
            right: 24px;
            padding: 16px 24px;
            border-radius: 16px;
            background: #1a1a2e;
            border: 1px solid #262c36;
            box-shadow: 0 8px 40px rgba(0,0,0,0.6);
            border-left: 4px solid #f5a623;
            transform: translateX(120%);
            transition: transform 0.4s ease;
            max-width: 420px;
            z-index: 2000;
            font-weight: 500;
            color: #eef2f6;
        }
        .notification-global.show {
            transform: translateX(0);
        }
        .notification-global.success {
            border-left-color: #4caf50;
        }
        .notification-global.error {
            border-left-color: #ef5350;
        }
        .notification-global.warning {
            border-left-color: #ffca28;
        }
        .notification-global.info {
            border-left-color: #64b5f6;
        }
    `;
    document.head.appendChild(style);
    
    console.log('🚀 ЕВРАЗ Dashboard загружен!');
    console.log(`📊 Данные: ${Object.keys(CONFIG.STORAGE_KEYS).length} ключей в localStorage`);
});