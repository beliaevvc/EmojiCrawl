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
    }
];

