/**
 * WalletRepository — порт (interface) для доступа к балансу кристаллов.
 *
 * Блок 5: UI/Zustand store не должны напрямую дёргать Supabase.
 * Вместо этого они вызывают application use-cases, которые зависят от порта,
 * а реальная реализация живёт в infrastructure слое.
 */
export interface WalletRepository {
  /**
   * Возвращает баланс кристаллов для текущего пользователя.
   *
   * Если пользователь не залогинен — возвращаем `null` (store остаётся на локальном состоянии).
   */
  getBalance(): Promise<number | null>;

  /**
   * Сохраняет баланс кристаллов для текущего пользователя.
   *
   * Если пользователь не залогинен — no-op (store остаётся на локальном состоянии).
   */
  setBalance(nextCrystals: number): Promise<void>;
}


