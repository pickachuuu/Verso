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
    <div className="fixed inset-0 z-[100] bg-[#FFFAF0] flex flex-col safe-area-inset overflow-hidden text-[13px]">
      {/* 🏛️ ULTRA-PREMIUM MOBILE HEADER */}
      <header className="h-14 shrink-0 flex items-center justify-between px-3 bg-white border-b border-[#E6D5C3] shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-[100]">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#FFFAF0] border border-[#E6D5C3] text-[#4A443D] active:scale-90 transition-transform shadow-sm"
        >
          <ArrowLeft02Icon className="w-5 h-5" />
        </button>

        <div className="flex-1 px-4 min-w-0 flex flex-col items-center">
           <h1 className="text-[12px] font-black text-[#2D2A26] uppercase tracking-tighter truncate w-full text-center">
             {currentView === 'cover' ? 'Settings' : note.title}
           </h1>
           {currentView === 'page' && (
             <div className="flex items-center gap-1.5 mt-0.5">
               <span className="text-[9px] font-black text-[#C77B4B] uppercase tracking-[0.2em]">
                 Page {currentPageIndex! + 1}
               </span>
               <span className="w-1 h-1 rounded-full bg-[#E6D5C3]" />
               <span className="text-[9px] font-bold text-[#4A443D]/40 uppercase tracking-[0.1em]">
                 {pages.length} Total
               </span>
             </div>
           )}
        </div>

        <button 
          onClick={() => setShowNav(true)}
          className="w-10 h-10 flex items-center justify-center rounded-2xl bg-[#2D2A26] text-white active:scale-90 transition-transform shadow-lg shadow-[#2D2A26]/20"
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
            className="h-12 shrink-0 bg-[#FCF8F3] border-b border-[#E6D5C3] flex items-center px-2 gap-1 overflow-x-auto scrollbar-hide z-[90]"
          >
             <ToolbarBtn icon={TextBoldIcon} active={editor?.isActive('bold')} onClick={() => runFormat('bold')} />
             <ToolbarBtn icon={TextItalicIcon} active={editor?.isActive('italic')} onClick={() => runFormat('italic')} />
             <ToolbarBtn icon={TextUnderlineIcon} active={editor?.isActive('underline')} onClick={() => runFormat('underline')} />
             <div className="w-px h-6 bg-[#E6D5C3] mx-1" />
             <ToolbarBtn icon={ListViewIcon} active={editor?.isActive('bulletList')} onClick={() => runFormat('list')} />
             
             <div className="flex-1 min-w-4" />
             
             <button 
               onClick={() => onAIAction?.('continue_writing')}
               disabled={aiLoading === 'continue_writing'}
               className="h-9 px-4 rounded-xl bg-gradient-to-r from-[#2B5D8B] to-[#3B7DAC] text-white flex items-center gap-2 active:scale-95 transition-all shadow-md shadow-[#2B5D8B]/20"
             >
               {aiLoading === 'continue_writing' ? (
                 <Loading03Icon className="w-4 h-4 animate-spin" />
               ) : (
                 <GoogleGeminiIcon className="w-4 h-4" />
               )}
               <span className="text-[10px] font-black uppercase tracking-wider">AI Fill</span>
             </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 📜 MAIN CANVAS */}
      <main className="flex-1 overflow-y-auto scrollbar-hide pb-32">
        <AnimatePresence mode="wait">
          {currentView === 'cover' ? (
            <motion.div 
              key="cover"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-6 py-10"
            >
              <div className="relative aspect-[3/4.2] max-w-[280px] mx-auto group">
                <div className="absolute inset-0 bg-[#2D2A26] rounded-[2.5rem] blur-2xl opacity-10 group-hover:opacity-20 transition-opacity" />
                <div className="relative h-full rounded-[2.5rem] overflow-hidden border-8 border-white shadow-2xl shadow-stone-800/20 transform -rotate-1">
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

              <div className="mt-12 grid grid-cols-2 gap-4">
                 <ActionBox 
                    icon={Task01Icon} 
                    title="Index" 
                    subtitle="Browse all"
                    className="bg-[#2B5D8B] text-white" 
                    onClick={() => onNavigate('toc')}
                 />
                 <ActionBox 
                    icon={Add01Icon} 
                    title="New" 
                    subtitle="Quick add"
                    className="bg-[#C77B4B] text-white"
                    onClick={onAddPage}
                 />
              </div>
            </motion.div>
          ) : currentView === 'toc' ? (
            <motion.div 
              key="toc"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 pb-8"
            >
              {/* Mobile TOC Header */}
              <div className="mb-5">
                <h2 className="text-[11px] font-black text-[#C77B4B] uppercase tracking-[0.2em] mb-1">Contents</h2>
                <h3 className="text-[18px] font-black text-[#2D2A26] tracking-tight leading-tight truncate">{note.title || 'Untitled Notebook'}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-[#4A443D]/50 uppercase tracking-wider">
                    {pages.length} {pages.length === 1 ? 'page' : 'pages'}
                  </span>
                </div>
              </div>

              {/* Page List */}
              {pages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-[#F5EADF] border border-[#E6D5C3] flex items-center justify-center mb-4">
                    <Note01Icon className="w-7 h-7 text-[#C77B4B]" />
                  </div>
                  <p className="text-[13px] font-bold text-[#4A443D]">No pages yet</p>
                  <p className="text-[11px] text-[#4A443D]/50 mt-1">Tap below to create your first page</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pages.map((p, i) => (
                    <button 
                      key={p.id}
                      onClick={() => onNavigate('page', i)}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white border border-[#E6D5C3] shadow-sm active:scale-[0.98] active:bg-[#FCF8F3] transition-all"
                    >
                      <span className="w-8 h-8 flex items-center justify-center rounded-xl bg-[#F5EADF] text-[#C77B4B] text-[11px] font-black shrink-0">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-[13px] font-bold text-[#2D2A26] truncate">{p.title || 'Untitled Page'}</p>
                      </div>
                      <ArrowRight02Icon className="w-4 h-4 text-[#D9CBB9] shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {/* Add Page */}
              <button 
                onClick={onAddPage}
                className="w-full mt-4 py-4 border-2 border-dashed border-[#E6D5C3] rounded-2xl flex items-center justify-center gap-2 text-[#C77B4B] font-black text-[11px] uppercase tracking-widest active:scale-[0.98] active:bg-[#FCF8F3] transition-all"
              >
                <Add01Icon className="w-4 h-4" />
                <span>New Page</span>
              </button>
            </motion.div>
          ) : (
            <motion.div 
              key={`page-${currentPageIndex}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="min-h-full p-4"
            >
              <div className="mobile-editor-wrapper">
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
      <div className="fixed bottom-8 left-0 right-0 z-50 px-6 flex justify-center pointer-events-none">
        <motion.div 
          initial={{ y: 60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="pointer-events-auto h-16 px-2 flex items-center bg-[#2D2A26] rounded-full border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.6)] backdrop-blur-3xl ring-1 ring-white/10"
        >
          <div className="flex items-center gap-1 pr-3 border-r border-white/10 mr-3">
            <NavBtn icon={PencilEdit02Icon} active={currentView === 'page'} onClick={() => onNavigate('page', currentPageIndex || 0)} />
            <NavBtn icon={Layout01Icon} active={currentView === 'toc'} onClick={() => onNavigate('toc')} />
          </div>

          <div className="flex items-center gap-4 px-2">
             <button 
               onClick={() => onNavigate('page', Math.max(0, (currentPageIndex || 0) - 1))}
               className="p-1.5 text-white/40 active:text-white disabled:opacity-5"
               disabled={pages.length < 2 || currentPageIndex === 0}
             >
               <ArrowLeft02Icon className="w-5 h-5" />
             </button>

             <button 
               onClick={() => onAIAction?.('summarize_page')}
               disabled={aiLoading === 'summarize_page'}
               className="w-11 h-11 flex items-center justify-center rounded-full bg-gradient-to-br from-[#2B5D8B] to-[#3B7DAC] border border-white/20 shadow-xl active:scale-90 transition-transform"
             >
               {aiLoading === 'summarize_page' ? (
                 <Loading03Icon className="w-5 h-5 text-white animate-spin" />
               ) : (
                 <GoogleGeminiIcon className="w-5 h-5 text-white" />
               )}
             </button>

             <button 
               onClick={() => onNavigate('page', Math.min(pages.length - 1, (currentPageIndex || 0) + 1))}
               className="p-1.5 text-white/40 active:text-white disabled:opacity-5"
               disabled={pages.length < 2 || currentPageIndex === pages.length - 1}
             >
               <ArrowRight02Icon className="w-5 h-5" />
             </button>
          </div>

          <button 
            onClick={onAddPage}
            className="ml-3 w-10 h-10 flex items-center justify-center rounded-full bg-[#FFFAF0] text-[#2D2A26] border border-[#E6D5C3] shadow-inner active:scale-90 transition-transform"
          >
            <Add01Icon className="w-5 h-5" />
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
               className="fixed inset-0 bg-[#2D2A26]/80 backdrop-blur-md z-[110]" 
            />
            <motion.div 
               initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
               transition={{ type: 'spring', damping: 25, stiffness: 200 }}
               className="fixed inset-y-0 right-0 w-[85%] max-w-sm bg-white z-[120] flex flex-col"
            >
               <div className="p-8 border-b border-[#E6D5C3]">
                  <h2 className="text-xl font-black text-[#2D2A26] uppercase tracking-tighter">Directory</h2>
                  <p className="text-[10px] font-bold text-[#C77B4B] uppercase tracking-[0.2em] mt-1">{note.title}</p>
               </div>

               <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {pages.map((p, i) => (
                    <button 
                      key={p.id}
                      onClick={() => { onNavigate('page', i); setShowNav(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all border ${
                        currentPageIndex === i 
                        ? 'bg-[#2B5D8B] text-white border-[#2B5D8B] shadow-lg shadow-[#2B5D8B]/20' 
                        : 'bg-[#FFFAF0] border-[#E6D5C3] text-[#4A443D] active:bg-[#F5EADF]'
                      }`}
                    >
                      <div className="flex items-center gap-4 min-w-0">
                         <span className={`text-[10px] font-black ${currentPageIndex === i ? 'text-white/50' : 'text-[#D9CBB9]'}`}>
                           {String(i + 1).padStart(2, '0')}
                         </span>
                         <span className="text-[14px] font-bold truncate uppercase tracking-tight">{p.title || 'Untitled Page'}</span>
                      </div>
                      <ArrowRight02Icon className="w-4 h-4 opacity-30" />
                    </button>
                  ))}
               </div>

               <div className="p-4 pt-0">
                  <div className="p-5 bg-[#F5EADF] rounded-[2rem] border border-[#E6D5C3]">
                     <div className="grid grid-cols-2 gap-3">
                        <SideTool icon={GoogleGeminiIcon} label="Summary" onClick={() => onAIAction?.('summarize_page')} />
                        <SideTool icon={Note01Icon} label="Outlines" onClick={() => onAIAction?.('generate_outline')} />
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
      className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all active:scale-90 ${
        active 
        ? 'bg-[#2B5D8B] text-white shadow-md' 
        : 'text-[#4A443D] hover:bg-[#E6D5C3]/40'
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
      className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
        active ? 'bg-white text-[#2B5D8B] scale-110 shadow-lg' : 'text-white/40 hover:text-white'
      }`}
    >
      <Icon className="w-6 h-6" />
    </button>
  );
}

function ActionBox({ icon: Icon, title, subtitle, className, onClick }: { icon: any, title: string, subtitle: string, className?: string, onClick: () => void }) {
  return (
    <button 
       onClick={onClick} 
       className={`flex flex-col items-center gap-2 p-6 rounded-[2.5rem] shadow-xl active:scale-95 transition-transform ${className}`}
    >
      <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <div className="text-center">
        <p className="text-[12px] font-black uppercase tracking-widest">{title}</p>
        <p className="text-[9px] font-bold opacity-60 uppercase tracking-tight">{subtitle}</p>
      </div>
    </button>
  );
}

function SideTool({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-2 aspect-square rounded-2xl bg-white border border-[#E6D5C3] text-[#2D2A26] shadow-sm active:scale-90 transition-transform"
    >
      <Icon className="w-5 h-5 text-[#2B5D8B]" />
      <span className="text-[9px] font-black uppercase tracking-wider">{label}</span>
    </button>
  );
}
