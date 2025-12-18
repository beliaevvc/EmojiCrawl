import { CurseType } from '../types/game';

export interface CurseDef {
    id: CurseType;
    name: string;
    description: string;
    icon: string;
    color: string;
}

export const CURSES: CurseDef[] = [
    {
        id: 'fog',
        name: 'Туман',
        description: 'Две монеты скрыты, пока на столе не останется 2 карты.',
        icon: '☁️',
        color: 'text-stone-400'
    },
    {
        id: 'full_moon',
        name: 'Полнолуние',
        description: 'Смерть одного монстра исцеляет других (+1 HP).',
        icon: '🌕',
        color: 'text-amber-200'
    },
    {
        id: 'poison',
        name: 'Отравление',
        description: 'Все зелья лечат на 1 HP меньше.',
        icon: '🥦',
        color: 'text-lime-300'
    },
    {
        id: 'tempering',
        name: 'Закалка',
        description: 'Все оружия наносят на 1 урон больше.',
        icon: '🛠️',
        color: 'text-stone-200'
    },
    {
        id: 'greed',
        name: 'Жадность',
        description: 'Любая монета даёт дополнительно +2 💎 (бонус поверх номинала).',
        icon: '💰',
        color: 'text-amber-300'
    }
];

