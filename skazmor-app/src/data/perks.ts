export interface PerkDefinition {
    id: string;
    name: string;
    description: string;
    isPassive?: boolean; // If true, active while alive. If false, on kill/event.
}

export const PERKS: PerkDefinition[] = [
    { id: 'commission', name: 'Комиссия', description: 'При убийстве: вы теряете 3 монеты.' },
    { id: 'forest_whisper', name: 'Шепот Леса', description: 'При убийстве: показывает верхнюю карту монет в колоде.' },
    { id: 'silence', name: 'Молчание', description: 'Пока жив: запрещает использовать способности', isPassive: true },
    { id: 'breach', name: 'Пролом', description: 'При убийстве: сбрасывает 1 предмет - Щит в вашем инвентаре в сброс' },
    { id: 'disarm', name: 'Обезоруживание', description: 'При убийстве: сбрасывает 1 предмет - Оружие в вашем инвентаре в сброс' },
    { id: 'blessing', name: 'Благословение', description: 'При убийстве: восстанавливает 2 Хп герою' },
    { id: 'stomp', name: 'Топот', description: 'При контакте с предметом Щит: полностью разрушает его' },
    { id: 'mirror', name: 'Зеркало', description: 'Хп монстра = самому сильному оружию в вашем инвентаре' },
    { id: 'stealth', name: 'Скрытность', description: 'Невозможно атаковать пока на столе есть любые другие живые монстры', isPassive: true },
    { id: 'graveyard', name: 'Кладбище', description: 'При убийстве: возвращает на стол случайного монстра из сброса' },
    { id: 'scream', name: 'Крик', description: 'Пока жив: нельзя продавать карты со стола', isPassive: true },
    { id: 'legacy', name: 'Наследие', description: 'При убийстве: все монстры на столе получают +1 Хп' },
    { id: 'escape', name: 'Бегство', description: 'Когда у монстра остается 3 или меньше Xп - он возращается в колоду' },
    { id: 'offering', name: 'Подношение', description: 'Использование кристалов лечит этого монстра на число равное номиналу кристала' },
    { id: 'ambush', name: 'Засада', description: 'При появлении: наносит 1 единицу урона герою' },
    { id: 'theft', name: 'Похищение', description: 'При убийстве: сбрасывает случайный предмет с вашего инвентаря в сброс' },
    { id: 'rot', name: 'Гниль', description: 'Пока жив: все зелья лечат героя на 2 Хп меньше', isPassive: true },
    { id: 'web', name: 'Паутина', description: 'Пока жив: рюкзак инвентаря заблокирован', isPassive: true },
    { id: 'bones', name: 'Кости', description: 'При убийстве: Кладет в колоду мертвую монету' },
    { id: 'beacon', name: 'Маяк', description: 'Пока жив: карты монстров появляются чаще (+5%)', isPassive: true },
    { id: 'parasite', name: 'Паразит', description: 'Пока жив: при убийстве героем других монстров получает +1 Хп', isPassive: true },
    { id: 'corrosion', name: 'Коррозия', description: 'При убийстве: случайный предмет в инвентаре героя, теряет 2 единицы показателя' },
    { id: 'exhaustion', name: 'Изнурение', description: 'Пока жив: Максимальный запас здоровья героя снижен на 1 Xп', isPassive: true },
    { id: 'junk', name: 'Хлам', description: 'При убийстве: добавляет в инвентарь героя мертвую монету' },
    { id: 'miss', name: 'Промах', description: 'При убийстве: Следующий удар героя наносит на 2 Урона меньше' },
    { id: 'scavenger', name: 'Трупоед', description: 'При появлении: получает +1 Хп к здоровью, за каждого монстра в сбросе' },
];




