export interface SkillDefinition {
    id: string;
    name: string;
    description: string;
    cost?: number; // Mana/Gold cost if any
}

export const SKILLS: SkillDefinition[] = [
    { id: 'split', name: 'Расщепление', description: 'Разделяет одного выбранного монстра на два - вдвое меньших по ХП (округляя вниз)' },
    { id: 'barrier', name: 'Барьер', description: 'Блокирует эффект выбраного монстра' },
    { id: 'wardrobe', name: 'Гардероб', description: 'Меняет мощность двух предметов местами' },
    { id: 'dealer', name: 'Скупщик', description: 'Удваивает стоимость продажи одной карты на столе.' },
    { id: 'volley', name: 'Залп', description: 'Наносит 1 урон всем монстрам на текущем столе' },
    { id: 'trophy', name: 'Трофей', description: 'Следующий убитый монстр дает 2 Кристала' },
    { id: 'insight', name: 'Прозрение', description: 'Показывает 3 верхние монеты колоды' },
    { id: 'diversion', name: 'Отвод', description: 'Следующий удар монстра по герою наносит урон случайному монстру на столе' },
    { id: 'echo', name: 'Эхо', description: 'Дублирует следующую монету предмета в инвентарь' },
    { id: 'snack', name: 'Закуска', description: 'Следуещее избыточное лечение превращается в монеты (1 HP = 1 монета)' },
    { id: 'swap', name: 'Замена', description: 'Обменять местами значения двух монстров на столе.' },
    { id: 'anvil', name: 'Наковальня', description: '+2 к урону выбранному оружию' },
    { id: 'wind', name: 'Ветер', description: 'Возращает выбранную монету монстра в колоду' },
    { id: 'escape', name: 'Побег', description: 'Возращает текущий стол обратно в колоду' },
    { id: 'potionify', name: 'Зельефикация', description: 'Превращает выбранный предмет в хилку, равную его значению' },
    { id: 'bloodsucker', name: 'Кровосос', description: 'Лечит Хп, равное кол-ву Хп выбранного монстра' },
    { id: 'sacrifice', name: 'Жертва', description: 'Наносит выбранному монстру урон равный недостающему Хп героя' },
    { id: 'armor', name: 'Доспехи', description: 'Полностью блокирует слудующий урон по герою' },
    { id: 'archive', name: 'Архив', description: 'Возращает случайный предмет из сброса в рюкзак' },
    { id: 'scout', name: 'Разведка', description: 'Показывает верхние 2 монеты колоды. Одну сбрось, вторую верни.' },
    { id: 'cut', name: 'Порез', description: 'Наносит 4 урона монстру, но вы теряете 2 HP.' },
];










