'use client';

import { ReactNode, useState, useEffect } from 'react';
import { Editor } from './RichTextEditor';
import NotebookPage from './NotebookPage';
import { NotePage } from './TableOfContents';
import ClayNotebookCover, { NotebookColorKey } from './ClayNotebookCover';
import { 
  ArrowLeft02Icon, 
  Menu01Icon, 
  Task01Icon,
  BookOpen01Icon,
  FlashIcon,
  Settings02Icon,
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  ListViewIcon,
  GoogleGeminiIcon,
  Loading03Icon,
  Add01Icon,
  Note01Icon,
  ArrowRight02Icon,
  Layout01Icon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  PencilEdit02Icon,
  Delete02Icon
} from 'hugeicons-react';
import { motion, AnimatePresence } from 'motion/react';

interface MobileEditorProps {
  note: {
    id: string;
    title: string;
    coverColor: NotebookColorKey;
    tags?: string[];
  };
  pages: NotePage[];
  currentPageIndex: number | null;
  currentView: 'cover' | 'toc' | 'page';
  editor: Editor | null;
  onAIAction?: (action: string) => void;
  aiLoading?: string | null;
  onNavigate: (view: 'cover' | 'toc' | 'page', index?: number) => void;
  onUpdatePage: (content: string) => void;
  onUpdateTitle: (title: string) => void;
  onUpdateCoverColor: (color: NotebookColorKey) => void;
  onAddPage: () => void;
  onBack: () => void;
  theme: 'light' | 'dark';
}

export default function MobileEditor({
  note,
  pages,
  currentPageIndex,
  currentView,
  editor,
  onAIAction,
  aiLoading,
  onNavigate,
  onUpdatePage,
  onUpdateTitle,
  onUpdateCoverColor,
  onAddPage,
  onBack,
  theme,
}: MobileEditorProps) {
  const [showNav, setShowNav] = useState(false);
  const activePage = currentPageIndex !== null ? pages[currentPageIndex] : null;

  // Optimized formatting commands
  const runFormat = (cmd: string) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (cmd === 'bold') chain.toggleBold().run();
    if (cmd === 'italic') chain.toggleItalic().run();
    if (cmd === 'underline') chain.toggleUnderline().run();
    if (cmd === 'list') chain.toggleBulletList().run();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col safe-area-inset overflow-hidden text-[13px]">
      {/* 🏛️ ULTRA-PREMIUM MOBILE HEADER */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4 bg-surface/90 backdrop-blur-xl border-b border-border/40 shadow-sm z-[100]">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-[1.25rem] bg-background-muted border border-border/20 text-foreground active:scale-95 transition-transform"
        >
          <ArrowLeft02Icon className="w-5 h-5" />
        </button>

        <div className="flex-1 px-4 min-w-0 flex flex-col items-center">
           <h1 className="text-[13px] font-black text-foreground uppercase tracking-widest truncate w-full text-center">
             {currentView === 'cover' ? 'SETTINGS' : note.title || 'UNTITLED NOTEBOOK'}
           </h1>
           {currentView === 'page' && (
             <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">
                 PAGE {currentPageIndex! + 1}
               </span>
               <span className="w-1 h-1 rounded-full bg-border" />
               <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-[0.2em]">
                 {pages.length} TOTAL
               </span>
             </div>
           )}
        </div>

        <button 
          onClick={() => setShowNav(true)}
          className="w-10 h-10 flex items-center justify-center rounded-[1.25rem] bg-foreground text-surface active:scale-95 transition-transform shadow-md"
        >
          <Menu01Icon className="w-5 h-5" />
        </button>
      </header>

      {/* 🎨 SECONDARY TOOLBAR - FORMATTING FOCUS */}
      <AnimatePresence>
        {currentView === 'page' && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="h-14 shrink-0 bg-background-muted/30 border-b border-border/40 flex items-center px-4 gap-2 overflow-x-auto scrollbar-hide z-[90]"
          >
             <ToolbarBtn icon={TextBoldIcon} active={editor?.isActive('bold')} onClick={() => runFormat('bold')} />
             <ToolbarBtn icon={TextItalicIcon} active={editor?.isActive('italic')} onClick={() => runFormat('italic')} />
             <ToolbarBtn icon={TextUnderlineIcon} active={editor?.isActive('underline')} onClick={() => runFormat('underline')} />
             <div className="w-px h-6 bg-border/40 mx-1 rounded-full" />
             <ToolbarBtn icon={ListViewIcon} active={editor?.isActive('bulletList')} onClick={() => runFormat('list')} />
             
             <div className="flex-1 min-w-4" />
             
             <button 
               onClick={() => onAIAction?.('continue_writing')}
               disabled={aiLoading === 'continue_writing'}
               className="h-10 px-5 rounded-full bg-primary text-white flex items-center gap-2 active:scale-95 transition-all shadow-md"
             >
               {aiLoading === 'continue_writing' ? (
                 <Loading03Icon className="w-4 h-4 animate-spin" />
               ) : (
                 <GoogleGeminiIcon className="w-4 h-4" />
               )}
               <span className="text-[11px] font-black uppercase tracking-widest">AI FILL</span>
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📜 MAIN CANVAS */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-[8rem]">
        <AnimatePresence mode="wait">
          {currentView === 'cover' ? (
            <motion.div 
              key="cover"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-12"
            >
              <div className="relative aspect-[3/4.2] max-w-[300px] mx-auto group">
                <div className="absolute inset-0 bg-foreground rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative h-full rounded-[2.5rem] overflow-hidden border-[6px] border-surface shadow-2xl shadow-foreground/10 transform rotate-1">
                  <ClayNotebookCover
                    mode="editor"
                    title={note.title}
                    onTitleChange={onUpdateTitle}
                    onOpen={() => onNavigate('toc')}
                    color={note.coverColor}
                    onColorChange={onUpdateCoverColor}
                    theme={theme}
                  />
                </div>
              </div>

              <div className="mt-14 grid grid-cols-2 gap-4">
                 <ActionBox 
                    icon={Task01Icon} 
                    title="INDEX" 
                    subtitle="BROWSE ALL"
                    className="bg-primary text-white shadow-xl" 
                    onClick={() => onNavigate('toc')}
                 />
                 <ActionBox 
                    icon={Add01Icon} 
                    title="NEW" 
                    subtitle="QUICK ADD"
                    className="bg-secondary text-white shadow-xl"
                    onClick={onAddPage}
                 />
              </div>
            </motion.div>
          ) : currentView === 'toc' ? (
            <motion.div 
              key="toc"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-6 pb-12"
            >
              {/* Mobile TOC Header */}
              <div className="mb-6 bg-background-muted p-8 rounded-[2.5rem] border border-surface shadow-sm text-center">
                <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">CONTENTS</h2>
                <h3 className="text-2xl font-black text-foreground tracking-tighter uppercase leading-tight">{note.title || 'UNTITLED NOTEBOOK'}</h3>
                <div className="flex items-center justify-center mt-4">
                  <span className="text-[10px] font-black text-foreground/50 uppercase tracking-[0.2em] bg-surface px-4 py-2 rounded-full shadow-sm">
                    {pages.length} PAGE{pages.length !== 1 ? 'S' : ''}
                  </span>
                </div>
              </div>

              {/* Page List */}
              {pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-border/60 rounded-[2.5rem]">
                  <div className="w-16 h-16 rounded-[1.25rem] bg-background-muted flex items-center justify-center mb-4">
                    <Note01Icon className="w-7 h-7 text-primary" />
                  </div>
                  <p className="text-[13px] font-black uppercase tracking-widest text-foreground">NO PAGES YET</p>
                  <p className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest mt-2">TAP BELOW TO CREATE YOUR FIRST PAGE</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pages.map((p, i) => (
                    <button 
                      key={p.id}
                      onClick={() => onNavigate('page', i)}
                      className="w-full flex items-center gap-5 p-4 rounded-[1.5rem] bg-surface border border-border/40 shadow-sm active:scale-[0.98] hover:bg-background-muted transition-all"
                    >
                      <span className="w-10 h-10 flex items-center justify-center rounded-[1rem] bg-background-muted text-primary text-[11px] font-black shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] font-black uppercase tracking-widest text-foreground truncate">{p.title || 'UNTITLED PAGE'}</p>
                      </div>
                      <div className="w-8 h-8 flex items-center justify-center rounded-full bg-foreground text-surface shrink-0">
                        <ArrowRight02Icon className="w-4 h-4" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Add Page */}
              <button 
                onClick={onAddPage}
                className="w-full mt-6 py-5 border-2 border-dashed border-foreground/20 rounded-[1.5rem] flex items-center justify-center gap-3 text-foreground font-black text-[11px] uppercase tracking-[0.2em] active:scale-[0.98] hover:bg-background-muted transition-all"
              >
                <Add01Icon className="w-5 h-5" />
                <span>NEW PAGE</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={`page-${currentPageIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-full p-4 md:p-6"
            >
              <div className="bg-surface rounded-[2rem] shadow-sm border border-border/40 overflow-hidden">
                <NotebookPage
                  content={activePage?.content || ''}
                  onChange={onUpdatePage}
                  theme={theme}
                  simpleMode={true}
                  autoFocus={true}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 🛸 DYNAMIC CONTEXT DOCK (BOTTOM) */}
      <div className="fixed bottom-6 left-0 right-0 z-50 px-4 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto h-[4.5rem] px-3 flex items-center bg-foreground rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.3)] backdrop-blur-3xl ring-2 ring-surface/10"
        >
          <div className="flex items-center gap-1.5 pr-4 border-r border-surface/10 mr-4">
            <NavBtn icon={PencilEdit02Icon} active={currentView === 'page'} onClick={() => onNavigate('page', currentPageIndex || 0)} />
            <NavBtn icon={Layout01Icon} active={currentView === 'toc'} onClick={() => onNavigate('toc')} />
          </div>

          <div className="flex items-center gap-3 px-2">
             <button 
               onClick={() => onNavigate('page', Math.max(0, (currentPageIndex || 0) - 1))}
               className="w-10 h-10 flex items-center justify-center rounded-full text-surface/40 hover:bg-surface/10 active:text-surface disabled:opacity-0 transition-all"
               disabled={pages.length < 2 || currentPageIndex === 0 || currentView !== 'page'}
             >
               <ArrowLeft02Icon className="w-5 h-5" />
             </button>

             <button 
               onClick={() => onAIAction?.('summarize_page')}
               disabled={aiLoading === 'summarize_page'}
               className="w-12 h-12 flex items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/20 active:scale-90 transition-transform"
             >
               {aiLoading === 'summarize_page' ? (
                 <Loading03Icon className="w-5 h-5 text-surface animate-spin" />
               ) : (
                 <GoogleGeminiIcon className="w-5 h-5 text-surface" />
               )}
             </button>

             <button 
               onClick={() => onNavigate('page', Math.min(pages.length - 1, (currentPageIndex || 0) + 1))}
               className="w-10 h-10 flex items-center justify-center rounded-full text-surface/40 hover:bg-surface/10 active:text-surface disabled:opacity-0 transition-all"
               disabled={pages.length < 2 || currentPageIndex === pages.length - 1 || currentView !== 'page'}
             >
               <ArrowRight02Icon className="w-5 h-5" />
             </button>
          </div>

          <button 
            onClick={onAddPage}
            className="ml-4 w-[3.5rem] h-[3.5rem] flex items-center justify-center rounded-full bg-surface text-foreground shadow-inner active:scale-95 transition-transform"
          >
            <Add01Icon className="w-6 h-6" />
          </button>
        </motion.div>
      </div>

      {/* 📗 NAVIGATION OVERLAY */}
      <AnimatePresence>
        {showNav && (
          <>
            <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
               onClick={() => setShowNav(false)}
               className="fixed inset-0 bg-foreground/60 backdrop-blur-sm z-[110]" 
            />
            <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-surface z-[120] flex flex-col rounded-l-[2.5rem] border-l-[6px] border-background-muted"
            >
               <div className="p-8 pb-6 border-b border-border/20">
                  <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">DIRECTORY</h2>
                  <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mt-2">{note.title}</p>
               </div>

               <div className="flex-1 overflow-y-auto p-6 space-y-3">
                  {pages.map((p, i) => (
                    <button 
                      key={p.id}
                      onClick={() => { onNavigate('page', i); setShowNav(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] transition-all border-2 ${
                        currentPageIndex === i 
                        ? 'bg-foreground text-surface border-foreground shadow-lg' 
                        : 'bg-background-muted border-transparent text-foreground hover:border-border'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                         <span className={`text-[10px] font-black w-8 h-8 rounded-[1rem] flex items-center justify-center shrink-0 ${currentPageIndex === i ? 'bg-surface/20 text-surface' : 'bg-surface text-primary'}`}>
                           {String(i + 1).padStart(2, '0')}
                         </span>
                         <span className="text-[12px] font-black truncate uppercase tracking-widest">{p.title || 'UNTITLED PAGE'}</span>
                      </div>
                      {currentPageIndex === i ? null : <ArrowRight02Icon className="w-4 h-4 opacity-40 shrink-0" />}
                    </button>
                  ))}
               </div>

               <div className="p-6 pt-0">
                  <div className="p-6 bg-background-muted rounded-[2rem] border-[3px] border-surface">
                     <div className="grid grid-cols-2 gap-4">
                        <SideTool icon={GoogleGeminiIcon} label="SUMMARY" onClick={() => onAIAction?.('summarize_page')} />
                        <SideTool icon={Note01Icon} label="OUTLINES" onClick={() => onAIAction?.('generate_outline')} />
                     </div>
                  </div>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// --------------------------------------------------------------------------
// Sub-components
// --------------------------------------------------------------------------

function ToolbarBtn({ icon: Icon, onClick, active }: { icon: any, onClick: () => void, active?: boolean }) {
  return (
    <button 
      onClick={onClick}
      className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-[1rem] transition-all active:scale-90 ${
        active 
        ? 'bg-foreground text-surface shadow-md' 
        : 'text-foreground hover:bg-surface'
      }`}
    >
      <Icon className="w-5 h-5" />
    </button>
  );
}

function NavBtn({ icon: Icon, active, onClick }: { icon: any, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-[3.25rem] h-[3.25rem] flex items-center justify-center rounded-full transition-all ${
        active ? 'bg-surface text-foreground shadow-lg scale-100' : 'text-surface/40 hover:text-surface scale-90 hover:scale-100'
      }`}
    >
      <Icon className="w-[1.4rem] h-[1.4rem]" />
    </button>
  );
}

function ActionBox({ icon: Icon, title, subtitle, className, onClick }: { icon: any, title: string, subtitle: string, className?: string, onClick: () => void }) {
  return (
    <button 
       onClick={onClick} 
       className={`flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] active:scale-95 transition-transform ${className}`}
    >
      <div className="w-12 h-12 rounded-[1.25rem] bg-white/20 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-[13px] font-black uppercase tracking-widest leading-tight">{title}</p>
        <p className="text-[9px] font-bold opacity-70 uppercase tracking-[0.2em] leading-tight mt-1">{subtitle}</p>
      </div>
    </button>
  );
}

function SideTool({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 aspect-square rounded-[1.5rem] bg-surface text-foreground shadow-sm active:scale-90 transition-transform border border-border/20 hover:border-border"
    >
      <Icon className="w-6 h-6 text-primary" />
      <span className="text-[10px] font-black uppercase tracking-widest">{label}</span>
    </button>
  );
}
