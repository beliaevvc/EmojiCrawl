import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { SupabaseWalletRepository } from '@/infrastructure/supabase';
import { createWalletUseCases } from '@/features/wallet/application';

interface WalletState {
    crystals: number;
    addCrystals: (amount: number) => Promise<void>;
    spendCrystals: (amount: number) => Promise<boolean>;
    resetWallet: () => Promise<void>;
    fetchBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
            crystals: 0,
            
            fetchBalance: async () => {
                const repo = new SupabaseWalletRepository();
                const wallet = createWalletUseCases(repo);
                const balance = await wallet.fetchBalance();
                if (balance === null) return; // Используем локальный стейт если нет юзера
                set({ crystals: balance });
            },

            addCrystals: async (amount: number) => {
                const current = get().crystals;
                const newValue = current + amount;
                
                // Оптимистичное обновление UI
                set({ crystals: newValue });

                // Синхронизация с Supabase
                const repo = new SupabaseWalletRepository();
                const wallet = createWalletUseCases(repo);
                await wallet.persistBalance(newValue);
            },

            spendCrystals: async (amount: number) => {
                const current = get().crystals;
                if (current >= amount) {
                    const newValue = current - amount;
                    set({ crystals: newValue });

                    const repo = new SupabaseWalletRepository();
                    const wallet = createWalletUseCases(repo);
                    await wallet.persistBalance(newValue);
                    return true;
                }
                return false;
            },

            resetWallet: async () => {
                set({ crystals: 0 });
                const repo = new SupabaseWalletRepository();
                const wallet = createWalletUseCases(repo);
                await wallet.persistBalance(0);
            }
        }),
        {
            name: 'skazmor-wallet-storage',
            // Не сохраняем функции в localStorage, только данные
            partialize: (state) => ({ crystals: state.crystals }),
        }
    )
);
