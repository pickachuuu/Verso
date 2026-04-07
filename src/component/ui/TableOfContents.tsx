'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusSignIcon,
  File01Icon,
  Delete01Icon,
  Calendar01Icon,
  Layers01Icon,
  ArrowRight01Icon,
  Search01Icon
} from 'hugeicons-react';
import { useMemo } from 'react';

export interface NotePage {
  id: string;
  note_id: string;
  title: string;
  content: string;
  page_order: number;
  created_at: string;
  updated_at: string;
}

export interface TableOfContentsProps {
  notebookTitle: string;
  pages: NotePage[];
  onPageClick: (pageIndex: number) => void;
  onAddPage: () => void;
  onDeletePage?: (pageId: string) => void;
  theme: 'light' | 'dark';
  /** When true, shows skeleton placeholders instead of the empty state */
  isLoading?: boolean;
  readOnly?: boolean;
  simpleMode?: boolean;
}

const formatDate = (dateString: string) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * TableOfContents - A premium, mobile-responsive table of contents component.
 * Features a bento-style grid on desktop and a clean vertical list on mobile.
 */
export default function TableOfContents({
  notebookTitle,
  pages,
  onPageClick,
  onAddPage,
  onDeletePage,
  theme,
  isLoading = false,
  readOnly = false,
  simpleMode = false,
}: TableOfContentsProps) {
  const isDark = theme === 'dark';

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col bg-surface p-6 sm:p-10">
        <div className="h-8 w-48 bg-background-muted rounded-full animate-pulse mb-10" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[4/3] rounded-[2rem] border-[3px] border-border/20 bg-background-muted/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-full flex flex-col bg-surface select-none ${isDark ? 'dark' : ''}`}>
      {/* Premium Header */}
      <header className="px-6 sm:px-10 py-8 sm:py-12 border-b-[4px] border-foreground bg-surface sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-foreground/40 text-[10px] font-black uppercase tracking-widest">
              <Calendar01Icon className="w-3.5 h-3.5" />
              Updated {pages.length > 0 ? formatDate(pages[0].updated_at) : 'recently'}
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-foreground tracking-tighter uppercase leading-[0.95] break-words">
            {notebookTitle || 'Untitled Notebook'}
          </h1>

          <div className="flex items-center justify-between mt-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-background-muted border border-border/40">
                <Layers01Icon className="w-4 h-4 text-primary" />
                <span className="text-[11px] font-black uppercase tracking-widest text-foreground">
                  {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
                </span>
              </div>
            </div>

            {!readOnly && (
              <button
                onClick={onAddPage}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-surface font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg overflow-hidden relative group"
              >
                <PlusSignIcon className="w-4 h-4" />
                <span>New Page</span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-6 sm:px-10 py-10 sm:py-16">
        <div className="max-w-6xl mx-auto">
          {pages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full py-32 flex flex-col items-center justify-center text-center border-[4px] border-dashed border-border/40 rounded-[3rem] bg-background-muted/20"
            >
              <div className="w-24 h-24 rounded-full bg-surface border-[4px] border-foreground flex items-center justify-center mb-8 shadow-[8px_8px_0_rgba(0,0,0,1)]">
                <File01Icon className="w-10 h-10 text-foreground" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-4">No content found</h3>
              <p className="text-[12px] font-bold text-foreground/40 uppercase tracking-widest leading-relaxed max-w-xs">
                This notebook is currently empty. {!readOnly && "Start by adding your first page using the button above."}
              </p>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            >
              <AnimatePresence>
                {pages.map((page, index) => (
                  <motion.div
                    key={page.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="group"
                  >
                    <div
                      onClick={() => onPageClick(index)}
                      className="relative h-full aspect-[4/3] sm:aspect-[3/4] p-8 sm:p-10 flex flex-col justify-between bg-surface border-[3px] sm:border-[4px] border-foreground rounded-[2.5rem] shadow-[8px_8px_0_rgba(0,0,0,1)] transition-all cursor-pointer hover:bg-primary/5 active:translate-x-1 active:translate-y-1 active:shadow-none"
                    >
                      {/* Paper Texture Overlay */}
                      {!simpleMode && (
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[2rem] bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]" />
                      )}

                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-8">
                          <span className="w-12 h-12 flex items-center justify-center rounded-2xl bg-foreground text-surface font-black text-sm shadow-md">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          {!readOnly && onDeletePage && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePage(page.id);
                              }}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-background-muted border border-border/40 text-foreground hover:bg-red-500 hover:text-white hover:border-red-600 transition-all opacity-100 lg:opacity-0 lg:group-hover:opacity-100"
                            >
                              <Delete01Icon className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <h3 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight line-clamp-3 leading-tight">
                          {page.title || 'Untitled Page'}
                        </h3>
                      </div>

                      <div className="relative z-10 flex items-center justify-between pt-6 border-t border-border/20">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-foreground uppercase tracking-widest opacity-40 mb-1">Last Edited</span>
                          <span className="text-[11px] font-black text-foreground uppercase tracking-widest">{formatDate(page.updated_at)}</span>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-background-muted border border-border/40 flex items-center justify-center group-hover:bg-foreground group-hover:text-surface transition-all">
                          <ArrowRight01Icon className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {!readOnly && (
                  <motion.div
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <button
                      onClick={onAddPage}
                      className="w-full h-full aspect-[4/3] sm:aspect-[3/4] flex flex-col items-center justify-center gap-6 bg-background-muted/40 border-[4px] border-dashed border-border/40 rounded-[2.5rem] hover:bg-background-muted hover:border-primary/40 transition-all group"
                    >
                      <div className="w-16 h-16 rounded-full bg-surface border-[4px] border-foreground flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-90 transition-all">
                        <PlusSignIcon className="w-8 h-8 text-foreground" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black text-foreground uppercase tracking-widest">New Page</span>
                        <span className="text-[11px] font-bold text-foreground/40 uppercase tracking-widest mt-1">Insert after {pages.length} pages</span>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Modern Footer Statistics */}
      <footer className="px-6 sm:px-10 py-12 border-t-[4px] border-foreground/10 bg-background-muted/20">
        <div className="max-w-6xl mx-auto flex flex-wrap gap-10 sm:gap-20">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">Knowledge Density</span>
            <div className="flex items-center gap-4">
              <div className="h-3 w-48 rounded-full bg-background-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min((pages.length / 10) * 100, 100)}%` }}
                  className="h-full bg-primary"
                />
              </div>
              <span className="text-[12px] font-black uppercase tracking-widest text-foreground">
                {Math.min((pages.length / 10) * 100, 100).toFixed(0)}%
              </span>
            </div>
          </div>

        </div>
      </footer>
    </div>
  );
}
