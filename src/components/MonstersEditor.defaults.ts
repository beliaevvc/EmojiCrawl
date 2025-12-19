import type { MonsterGroupConfig } from '../types/game';

// Default layout from user description:
// 2(2), 3(2), 4(2), 5(3), 6(2), 7(2), 8(2), 9(2), 10(3)
export const DEFAULT_MONSTER_GROUPS: MonsterGroupConfig[] = [
  { id: 'm2', value: 2, count: 2 },
  { id: 'm3', value: 3, count: 2 },
  { id: 'm4', value: 4, count: 2 },
  { id: 'm5', value: 5, count: 2 },
  { id: 'm6', value: 6, count: 2 },
  { id: 'm7', value: 7, count: 2 },
  { id: 'm8', value: 8, count: 2 },
  { id: 'm9', value: 9, count: 2 },
  { id: 'm10', value: 10, count: 3 },
];


