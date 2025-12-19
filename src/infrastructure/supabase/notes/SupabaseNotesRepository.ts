/**
 * SupabaseNotesRepository — infrastructure адаптер для заметок.
 *
 * ### Что это
 * Реализация порта `NotesRepository` через Supabase (таблица `notes` + realtime).
 *
 * ### Зачем это нужно (Блок 5)
 * Мы убираем прямые вызовы `supabase.from('notes')...` и realtime‑каналы из Zustand store’а,
 * чтобы:
 * - store/UI оставались простыми,
 * - I/O был в одном месте,
 * - можно было заменить/замокать хранилище.
 *
 * ### Важный инвариант: realtime‑подписка
 * - Этот адаптер хранит ссылку на **конкретный** `RealtimeChannel` (только notes).
 * - При повторной подписке сначала корректно отписываемся и удаляем канал.
 *
 * Критично: мы НЕ используем `supabase.removeAllChannels()` — это может убить каналы других подсистем.
 */

import { supabase } from '@/lib/supabase';
import type { NoteRecord, NotesError, NotesRepository } from '@/features/notes/application';
import type { RealtimeChannel } from '@supabase/supabase-js';

function toNotesError(error: { message: string } | null | undefined): NotesError | null {
  if (!error) return null;
  return { message: error.message };
}

export class SupabaseNotesRepository implements NotesRepository {
  private channel: RealtimeChannel | null = null;

  async fetchAll(): Promise<{ notes: NoteRecord[]; error: NotesError | null }> {
    const { data, error } = await supabase.from('notes').select('*').order('created_at', { ascending: true });
    return { notes: (data as NoteRecord[]) ?? [], error: toNotesError(error) };
  }

  async create(params: {
    title: string;
    content: string;
    user_id: string;
    author_email: string;
  }): Promise<{ note: NoteRecord | null; error: NotesError | null }> {
    const { data, error } = await supabase.from('notes').insert([params]).select().single();
    return { note: (data as NoteRecord) ?? null, error: toNotesError(error) };
  }

  async update(params: { id: string; title?: string; content?: string }): Promise<{ error: NotesError | null }> {
    const { error } = await supabase
      .from('notes')
      .update({
        title: params.title,
        content: params.content,
      })
      .eq('id', params.id);
    return { error: toNotesError(error) };
  }

  async delete(params: { id: string }): Promise<{ error: NotesError | null }> {
    const { error } = await supabase.from('notes').delete().eq('id', params.id);
    return { error: toNotesError(error) };
  }

  subscribeToChanges(onAnyChange: () => void): () => void {
    // Защита от повторных подписок: сначала убираем старую.
    if (this.channel) {
      this.channel.unsubscribe();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.channel = supabase
      .channel('public:notes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, () => {
        onAnyChange();
      })
      .subscribe();

    return () => {
      if (!this.channel) return;
      this.channel.unsubscribe();
      supabase.removeChannel(this.channel);
      this.channel = null;
    };
  }
}


