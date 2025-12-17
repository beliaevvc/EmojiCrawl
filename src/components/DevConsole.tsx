import React, { useEffect, useRef } from 'react';
import { useDevQuestStore } from '../stores/useDevQuestStore';
import { QUEST_ANOMALIES } from '../data/devQuest';
import { useAuthStore } from '../stores/useAuthStore';
import { motion, AnimatePresence } from 'framer-motion';

const DevConsole: React.FC = () => {
  const { 
    isConsoleOpen, 
    toggleConsole, 
    isQuestActive, 
    startQuest, 
    balance, 
    anomalies, 
    logs, 
    buyHint 
  } = useDevQuestStore();
  
  const { user } = useAuthStore();
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'auto' });
    }
    // Also scroll on open
    setTimeout(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, 100);
  }, [logs, isConsoleOpen]);

  if (!isConsoleOpen) return null;
  if (!user) return null;

  const foundCount = Object.values(anomalies).filter(a => a.isFound).length;
  const isWin = foundCount === QUEST_ANOMALIES.length;
  const totalPenalty = 200 - balance;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-10">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-stone-950/95 border border-stone-700 rounded-xl shadow-2xl overflow-hidden flex flex-col font-mono text-green-500 h-[85vh]"
      >
        
        {/* Terminal Header */}
        <div className="bg-stone-900 border-b border-stone-800 p-3 flex items-center gap-4 select-none flex-shrink-0">
          <div className="flex gap-2 group cursor-pointer" onClick={toggleConsole}>
             <div className="w-3 h-3 rounded-full bg-red-500/50 group-hover:bg-red-500 transition-colors"></div>
             <div className="w-3 h-3 rounded-full bg-yellow-500/50 group-hover:bg-yellow-500 transition-colors"></div>
             <div className="w-3 h-3 rounded-full bg-green-500/50 group-hover:bg-green-500 transition-colors"></div>
          </div>
          <div className="flex-1 text-center text-xs text-stone-500 font-bold tracking-widest uppercase">
             SKAZMOR DEV_LOG_QUEST v0.9
          </div>
          <div className="w-10"></div>
        </div>

        {/* Content Area */}
        <div className={`flex-1 p-6 scrollbar-thin scrollbar-thumb-stone-800 scrollbar-track-transparent ${!isQuestActive && !isWin ? 'overflow-hidden flex items-center justify-center' : 'overflow-auto'}`}>
          
          {/* Stats Header inside Content (Only when active or win) */}
          {(isQuestActive || isWin) && (
          <div className="flex justify-between items-end border-b border-stone-800 pb-4 mb-6 text-sm text-stone-400 font-bold tracking-wider">
            <div className="flex flex-col gap-1">
               <span className={isQuestActive ? "text-green-500" : "text-stone-600"}>
                 STATUS: {isWin ? 'RESTORED' : (isQuestActive ? 'MONITORING' : 'LOCKED')}
               </span>
               {isQuestActive && <span>FOUND: <span className="text-white">{foundCount}</span>/{QUEST_ANOMALIES.length}</span>}
            </div>
            {isQuestActive && (
                <div className="text-right">
                    <span className="text-xs opacity-50 block">BUDGET</span>
                    <span className="text-xl text-white">${balance.toFixed(2)}</span>
                </div>
            )}
          </div>
          )}

          {!isQuestActive && !isWin && (
             <div className="flex flex-col items-center justify-center text-center space-y-8 w-full">
                <div className="space-y-4 max-w-lg">
                    <p className="text-stone-500 text-xs">SYSTEM_BOOT... OK</p>
                    <p className="text-stone-500 text-xs">CONNECTING TO QA_MODULE... ESTABLISHED</p>
                    <p className="text-green-500 text-lg animate-pulse">{'>'} ВНИМАНИЕ: ПРОТОКОЛ "BOUNTY_HUNT" ОБНАРУЖЕН.</p>
                    
                    <div className="bg-stone-900/50 p-6 rounded-lg border border-stone-800 text-left text-sm space-y-4 text-stone-300 font-mono leading-relaxed">
                       <div className="text-green-500 font-bold border-b border-stone-800 pb-2 mb-2">
                           INCOMING_MESSAGE_FROM: <span className="text-white">AI_CORE</span>
                       </div>
                       
                       <p>
                         "Слушай внимательно. В этом коде спрятано <span className="text-white font-bold">{QUEST_ANOMALIES.length} аномалий</span> (пасхалок). 
                         Твоя задача — найти их все и восстановить систему."
                       </p>
                       
                       <p>
                         На кону реальный бюджет: <span className="text-green-400 font-bold text-lg">$200.00</span>.
                       </p>
                       
                       <div className="bg-black/40 p-3 rounded border border-stone-800 text-xs space-y-2">
                           <p><span className="text-yellow-500 font-bold">ПРАВИЛА:</span></p>
                           <ul className="list-disc pl-4 space-y-1 text-stone-400">
                               <li>После запуска протокола появятся <span className="text-stone-300">магазин подсказок</span>.</li>
                               <li>Каждая подсказка <span className="text-red-400">стоит денег</span>.</li>
                               <li>Стоимость вычитается из твоего итогового приза.</li>
                           </ul>
                       </div>

                       <p className="italic text-green-500/80 border-l-2 border-green-500/30 pl-3">
                         "Чем меньше ты тратишь на мои подсказки, тем богаче уйдешь. Включай мозги."
                       </p>
                    </div>
                </div>

                 <button 
                   onClick={startQuest}
                   className="group relative px-8 py-3 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/30 rounded transition-all overflow-hidden"
                 >
                   <span className="relative z-10 font-bold tracking-widest">[ {'>'} ЗАПУСТИТЬ ПРОТОКОЛ {'<'} ]</span>
                   <div className="absolute inset-0 bg-green-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                 </button>
             </div>
          )}

          {isWin && (
             <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
                <div className="bg-stone-900/50 border border-green-500/30 p-8 rounded-xl max-w-xl w-full">
                  <p className="text-3xl font-bold mb-2 text-white">SYSTEM RESTORED</p>
                  <p className="text-green-500 mb-8 tracking-widest text-sm">ADMIN ACCESS GRANTED</p>
                  
                  <div className="space-y-2 mb-8 text-stone-400">
                      <p>Поздравляю.</p>
                      <p>Твой вайб прошел проверку.</p>
                  </div>
                  
                  <div className="bg-black/40 rounded p-4 mb-8 font-mono text-sm border border-stone-800">
                    <div className="flex justify-between mb-1">
                      <span className="text-stone-500">Начальный банк:</span>
                      <span className="text-stone-300">$200.00</span>
                    </div>
                    <div className="flex justify-between mb-2 pb-2 border-b border-stone-800">
                      <span className="text-red-900">Штрафы:</span>
                      <span className="text-red-500">-${totalPenalty.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold">
                      <span className="text-green-600">К ВЫПЛАТЕ:</span>
                      <span className="text-green-400">${balance.toFixed(2)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-stone-600 mb-8 font-mono">
                    Сделай скриншот. Код: "Я починил матрицу, гони монету".
                  </p>

                  <button 
                   onClick={toggleConsole}
                   className="text-stone-500 hover:text-white transition-colors text-sm uppercase tracking-widest"
                  >
                   [ {'>'} ЗАКРЫТЬ КОНСОЛЬ {'<'} ]
                  </button>
                </div>
             </div>
          )}

          {isQuestActive && !isWin && (
            <div className="grid gap-4">
               {QUEST_ANOMALIES.map((anomaly, index) => {
                  const state = anomalies[anomaly.id];
                  const isFound = state?.isFound;
                  
                  return (
                    <div 
                        key={anomaly.id} 
                        className={`
                            relative p-4 rounded border transition-all duration-300
                            ${isFound 
                                ? 'bg-green-950/10 border-green-500/30' 
                                : 'bg-stone-900/30 border-stone-800 hover:border-stone-700'}
                        `}
                    >
                      {isFound && (
                          <div className="absolute inset-0 bg-green-500/5 pointer-events-none animate-pulse"></div>
                      )}
                      
                      <div className="flex items-start justify-between gap-4 relative z-10">
                         <div className="flex items-center gap-3">
                             <span className={`font-mono text-lg ${isFound ? 'text-green-500' : 'text-stone-600'}`}>
                                 {String(index + 1).padStart(2, '0')}
                             </span>
                             <div className="flex flex-col">
                                 <span className={`font-bold tracking-wide ${isFound ? 'text-white' : 'text-stone-400'}`}>
                                     {anomaly.title}
                                 </span>
                                 {isFound && <span className="text-[10px] text-green-500 uppercase tracking-wider">Восстановлено</span>}
                             </div>
                         </div>

                         {isFound ? (
                             <div className="text-green-500/50 font-mono text-sm">
                                 {'>'}{'>'} OK
                             </div>
                         ) : (
                             <div className="flex gap-2">
                                <HintButton 
                                    label="HINT" 
                                    cost={5} 
                                    purchased={state.hintsBought >= 1} 
                                    onClick={() => buyHint(anomaly.id, 1, 5)} 
                                />
                                <HintButton 
                                    label="LOGIC" 
                                    cost={10} 
                                    purchased={state.hintsBought >= 2} 
                                    onClick={() => buyHint(anomaly.id, 2, 10)} 
                                />
                                <HintButton 
                                    label="MANUAL" 
                                    cost={25} 
                                    purchased={state.hintsBought >= 3} 
                                    onClick={() => buyHint(anomaly.id, 3, 25)} 
                                    danger
                                />
                             </div>
                         )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Footer: System Log */}
        {(isQuestActive || isWin) && (
        <div className="h-64 bg-black/80 border-t border-stone-800 p-4 font-mono text-xs md:text-sm overflow-hidden flex flex-col">
           <div className="text-stone-600 mb-2 text-[10px] uppercase tracking-widest flex justify-between">
               <span>System Log</span>
               <span className="animate-pulse bg-green-500/20 text-green-500 px-1 rounded">LIVE</span>
           </div>
           <div className="flex-1 overflow-auto scrollbar-none space-y-1">
             {logs.map(log => (
               <div key={log.id} className={`${
                 log.type === 'error' ? 'text-red-400' : 
                 log.type === 'success' ? 'text-green-400' :
                 log.type === 'hint' ? 'text-yellow-400 italic pl-4 border-l border-yellow-500/30' :
                 log.type === 'system' ? 'text-stone-500' : 'text-stone-300'
               }`}>
                 <span className="opacity-30 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], {hour12: false})}]</span>
                 {log.type === 'success' && <span className="text-green-500 mr-2">✓</span>}
                 {log.type === 'error' && <span className="text-red-500 mr-2">✗</span>}
                 {log.message}
               </div>
             ))}
             <div ref={logsEndRef} />
             <div className="text-green-500 animate-pulse mt-1">_</div>
           </div>
        </div>
        )}
      </motion.div>
    </div>
  );
};

const HintButton = ({ label, cost, purchased, onClick, danger = false }: { label: string, cost: number, purchased: boolean, onClick: () => void, danger?: boolean }) => (
    <button 
        onClick={onClick}
        disabled={purchased}
        className={`
            px-2 py-1 text-[10px] border rounded transition-all
            ${purchased 
                ? 'opacity-20 border-transparent text-stone-500 cursor-default' 
                : danger 
                    ? 'border-red-900/30 text-red-400 hover:bg-red-900/20 hover:border-red-500/50' 
                    : 'border-green-900/30 text-green-400 hover:bg-green-900/20 hover:border-green-500/50'
            }
        `}
    >
        {purchased ? 'PURCHASED' : `[ ${label} $${cost} ]`}
    </button>
);

export default DevConsole;
