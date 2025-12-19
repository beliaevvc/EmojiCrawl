// Compatibility Proxy
// This file is deprecated. New logic resides in @features/game/domain/reducer/gameReducer
// Imports are preserved for backward compatibility.

import { createGameReducer, createInitialState } from '@/features/game/domain/reducer/gameReducer';
import { GameAction } from '@/features/game/domain/model/types';

export { createGameReducer, createInitialState };
export type { GameAction };
