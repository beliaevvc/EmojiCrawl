import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Gem } from 'lucide-react';
import { createPortal } from 'react-dom';

export type CheatAddCoinsModalProps = {
  title?: string;
  defaultValue?: number;
  onConfirm: (amount: number) => void;
  onCancel: () => void;
};

export function CheatAddCoinsModal({ title = 'Добавить 💎', defaultValue = 10, onConfirm, onCancel }: CheatAddCoinsModalProps) {
  const [raw, setRaw] = useState<string>(String(defaultValue));

  // Фокус/выделение по открытию — чтобы можно было быстро ввести значение.
  const inputId = useMemo(() => `cheat-add-coins-${Math.random().toString(36).slice(2)}`, []);

  const parsed = useMemo(() => {
    const n = Math.trunc(Number(raw));
    if (!Number.isFinite(n)) return null;
    if (n === 0) return null;
    return n;
  }, [raw]);

  useEffect(() => {
    const el = document.getElementById(inputId) as HTMLInputElement | null;
    if (!el) return;
    el.focus();
    el.select();
  }, [inputId]);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        className="bg-stone-900 border border-stone-600 rounded-xl p-6 max-w-sm w-full shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

        <div className="mx-auto w-12 h-12 bg-emerald-900/20 rounded-full flex items-center justify-center mb-4 text-emerald-400">
          <Gem size={24} />
        </div>

        <h3 className="text-xl font-bold text-stone-200 mb-2 text-center">{title}</h3>
        <p className="text-stone-400 mb-4 text-sm leading-relaxed text-center">
          Введите число. Можно отрицательное (чтобы отнять). Ноль не применяем.
        </p>

        <div className="mb-5">
          <label htmlFor={inputId} className="block text-[10px] font-bold tracking-widest uppercase text-stone-500 mb-2">
            Количество 💎
          </label>
          <input
            id={inputId}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') onCancel();
              if (e.key === 'Enter' && parsed != null) onConfirm(parsed);
            }}
            inputMode="numeric"
            className={`
              w-full px-4 py-3 rounded-lg border bg-stone-800/80 text-stone-100 font-mono text-lg
              focus:outline-none focus:ring-2
              ${parsed == null ? 'border-rose-700/60 focus:ring-rose-500/40' : 'border-stone-700 focus:ring-emerald-500/30'}
            `}
            placeholder="10"
          />
          {parsed == null && <div className="mt-2 text-xs text-rose-300/80">Введите целое число ≠ 0.</div>}
        </div>

        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-stone-800 text-stone-300 rounded-lg border border-stone-700 hover:bg-stone-700 hover:border-stone-600 transition-colors text-xs font-bold tracking-widest uppercase"
          >
            Отмена
          </button>
          <button
            onClick={() => parsed != null && onConfirm(parsed)}
            disabled={parsed == null}
            className={`
              flex-1 px-4 py-2 rounded-lg border transition-colors text-xs font-bold tracking-widest uppercase
              ${
                parsed == null
                  ? 'bg-stone-800/60 text-stone-500 border-stone-700 cursor-not-allowed'
                  : 'bg-emerald-900/70 text-emerald-100 border-emerald-700 hover:bg-emerald-800 hover:border-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
              }
            `}
          >
            Добавить
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}


