/**
 * Wallet use-cases (Application Layer).
 *
 * Важно: use-cases не знают про Supabase — только про `WalletRepository` порт.
 * UI/store может выбрать реализацию и передать её сюда (composition root на раннем этапе).
 */
import type { WalletRepository } from './ports/WalletRepository';

export function createWalletUseCases(repo: WalletRepository) {
  return {
    fetchBalance: async (): Promise<number | null> => {
      return await repo.getBalance();
    },

    persistBalance: async (nextCrystals: number): Promise<void> => {
      await repo.setBalance(nextCrystals);
    },
  };
}


