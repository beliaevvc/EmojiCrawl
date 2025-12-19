/**
 * SupabaseWalletRepository — infrastructure адаптер для кошелька.
 *
 * Блок 5: сюда переносим I/O (Supabase), чтобы UI/stores его не содержали.
 */
import { supabase } from '@/lib/supabase';
import type { WalletRepository } from '@/features/wallet/application';

export class SupabaseWalletRepository implements WalletRepository {
  async getBalance(): Promise<number | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await supabase.from('wallets').select('crystals').eq('user_id', user.id).single();

    if (error || !data) return null;
    return Number(data.crystals);
  }

  async setBalance(nextCrystals: number): Promise<void> {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    // Используем upsert, чтобы кошелёк создавался автоматически для новых пользователей.
    await supabase.from('wallets').upsert({ user_id: user.id, crystals: nextCrystals });
  }
}


