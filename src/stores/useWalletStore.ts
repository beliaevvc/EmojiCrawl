import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';

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
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return; // Используем локальный стейт если нет юзера

                const { data, error } = await supabase
                    .from('wallets')
                    .select('crystals')
                    .eq('user_id', user.id)
                    .single();

                if (!error && data) {
                    set({ crystals: Number(data.crystals) });
                }
            },

            addCrystals: async (amount: number) => {
                const current = get().crystals;
                const newValue = current + amount;
                
                // Оптимистичное обновление UI
                set({ crystals: newValue });

                // Синхронизация с Supabase
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('wallets')
                        .upsert({ user_id: user.id, crystals: newValue });
                }
            },

            spendCrystals: async (amount: number) => {
                const current = get().crystals;
                if (current >= amount) {
                    const newValue = current - amount;
                    set({ crystals: newValue });

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase
                            .from('wallets')
                            .update({ crystals: newValue })
                            .eq('user_id', user.id);
                    }
                    return true;
                }
                return false;
            },

            resetWallet: async () => {
                set({ crystals: 0 });
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase
                        .from('wallets')
                        .update({ crystals: 0 })
                        .eq('user_id', user.id);
                }
            }
        }),
        {
            name: 'skazmor-wallet-storage',
            // Не сохраняем функции в localStorage, только данные
            partialize: (state) => ({ crystals: state.crystals }),
        }
    )
);
