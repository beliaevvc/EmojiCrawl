# Task: Implement Curses Feature (Проклятья)

## Status
- [ ] Planning
- [ ] Implementation
- [ ] Verification
- [ ] Documentation

## Complexity: Level 3 (Intermediate)
This task involves adding a new game mechanic that intersects with UI, State Management, and Game Logic.

## Context
The user wants to add "Curses" - a new mechanic where a persistent negative effect is chosen at the start of the game.
It requires a new slot on the board, a selection UI, and game logic modifications for specific curses (Fog, Full Moon).

## Requirements

### 1. New Types & Data
- Define `CurseType` ('fog', 'full_moon').
- Add `curse` field to `GameState` and `DeckConfig`.
- Create `src/data/curses.ts` with metadata.

### 2. Game Logic (`gameReducer.ts`)
- **Activation:** Action `ACTIVATE_CURSE` or via `START_GAME`.
- **Fog Logic:**
    - Add `isHidden` to `Card`.
    - At round start (4 cards), if Fog active: hide 2 random cards.
    - When 2 cards played (count <= 2): reveal all.
- **Full Moon Logic:**
    - In `applyKillAbilities`: if Full Moon active, heal other monsters by 1 HP.

### 3. UI Components
- **Curse Slot:** New interactive slot on `GameScreen`.
    - "+" button when empty and start of game.
    - Shows Curse Token when active.
- **CursePicker:** Modal/Popover to select curse.
- **CardComponent:** Support `isHidden` prop (render Card Back).

### 4. Deckbuilder
- Add Curse selection to `DeckbuilderScreen`.

## Implementation Plan

1.  **Define Types & Data**:
    - Modify `src/types/game.ts`.
    - Create `src/data/curses.ts`.

2.  **Update Card Logic**:
    - Update `CardComponent.tsx` to handle `isHidden`.
    - Update `Slot.tsx` if needed (interaction blocking).

3.  **Implement Game Logic**:
    - Update `gameReducer.ts` for Fog and Full Moon mechanics.
    - Update `GameState` initialization.

4.  **Create UI Components**:
    - `CursePicker.tsx`.
    - Add Slot to `GameScreen.tsx`.

5.  **Deckbuilder Integration**:
    - Update `DeckbuilderScreen.tsx`.

6.  **Verify & Test**:
    - Test Fog: Start game, check cards hidden, play 2, check reveal.
    - Test Full Moon: Kill monster, check others heal.
    - Test Deckbuilder: Custom run with curse.

