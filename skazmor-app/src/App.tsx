import { useState } from 'react';
import { useEditorStore } from './stores/useEditorStore';
import { Dashboard } from './components/editor/Dashboard';
import { CategorySelect } from './components/editor/CategorySelect';
import type { Category } from './types';
import { SimpleCategoryEditor } from './components/editor/SimpleCategoryEditor';
import { MonsterCategoryEditor } from './components/editor/MonsterCategoryEditor';
import { SkillEditor } from './components/editor/SkillEditor';
import { GameBoard } from './components/game/GameBoard';

type View = 'DASHBOARD' | 'CATEGORY_SELECT' | 'CATEGORY_EDITOR' | 'GAME';

function App() {
  const [view, setView] = useState<View>('DASHBOARD');
  const { selectTemplate, createTemplate } = useEditorStore();
  
  // Local state for active category selection since it's UI state mostly
  const [selectedCategory, setSelectedCategory] = useState<Category | 'ability' | null>(null);

  const handleSelectTemplate = (id: string) => {
    selectTemplate(id);
    setView('CATEGORY_SELECT');
  };

  const handleCreateTemplate = () => {
    createTemplate('New Template');
    // Automagically selects it in store
    setView('CATEGORY_SELECT');
  };

  const handleSelectCategory = (cat: Category | 'ability') => {
    setSelectedCategory(cat);
    setView('CATEGORY_EDITOR');
  };

  return (
    <div className="bg-slate-950 min-h-screen text-slate-100 font-sans selection:bg-rose-500/30">
      {view === 'DASHBOARD' && (
        <Dashboard 
          onSelectTemplate={handleSelectTemplate} 
          onCreateTemplate={handleCreateTemplate}
        />
      )}

      {view === 'CATEGORY_SELECT' && (
        <CategorySelect 
          onBack={() => setView('DASHBOARD')}
          onSelectCategory={(cat) => handleSelectCategory(cat as any)}
          onPlay={() => setView('GAME')}
        />
      )}

      {view === 'CATEGORY_EDITOR' && selectedCategory && (
         selectedCategory === 'ability' ? (
             <SkillEditor onBack={() => setView('CATEGORY_SELECT')} />
         ) : selectedCategory === 'monster' ? (
             <MonsterCategoryEditor 
                onBack={() => setView('CATEGORY_SELECT')}
             />
        ) : (
            <SimpleCategoryEditor 
                category={selectedCategory as Category}
                onBack={() => setView('CATEGORY_SELECT')}
            />
        )
      )}

      {view === 'GAME' && (
        <GameBoard onExit={() => setView('CATEGORY_SELECT')} />
      )}
    </div>
  );
}

export default App;
