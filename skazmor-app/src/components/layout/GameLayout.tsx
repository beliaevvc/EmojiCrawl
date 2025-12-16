import React from 'react';

interface GameLayoutProps {
  children: React.ReactNode;
}

export function GameLayout({ children }: GameLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden relative selection:bg-rose-500/30">
        {/* Background Ambient Effects could go here */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900/50 to-slate-950 pointer-events-none" />
        
        <main className="relative z-10 h-screen flex flex-col">
            {children}
        </main>
    </div>
  );
}




