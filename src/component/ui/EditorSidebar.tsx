'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import {
  ArrowLeft02Icon,
  Home01Icon,
  Menu01Icon,
  Add01Icon,
  Tag01Icon,
  Cancel01Icon,
  SummationCircleIcon,
} from 'hugeicons-react';
import { NotebookIcon } from '@/component/icons';
import { NotePage } from './TableOfContents';
import { motion } from 'motion/react';

interface EditorSidebarProps {
  noteId: string | null;
  title: string;
  onTitleChange: (title: string) => void;
  pages: NotePage[];
  currentPageIndex: number | null;
  onPageClick: (index: number) => void;
  onAddPage: () => void;
  tags: string[];
  onRemoveTag: (tag: string) => void;
  showTagInput: boolean;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagInputKeyDown: (e: React.KeyboardEvent) => void;
  onTagInputBlur: () => void;
  onAddTagClick: () => void;
  saveStatusIndicator: ReactNode;
  onBack: () => void;
  className?: string;
  isMobile?: boolean;
}

export default function EditorSidebar({
  noteId,
  title,
  onTitleChange,
  pages,
  currentPageIndex,
  onPageClick,
  onAddPage,
  tags,
  onRemoveTag,
  showTagInput,
  tagInput,
  onTagInputChange,
  onTagInputKeyDown,
  onTagInputBlur,
  onAddTagClick,
  saveStatusIndicator,
  onBack,
  className = '',
  isMobile = false,
}: EditorSidebarProps) {
  return (
    <div className={`flex flex-col h-full bg-surface/95 backdrop-blur-xl border-r border-border/40 overflow-hidden select-none transition-all duration-500 ${className}`}>
      {/* Sidebar Header */}
      <div className="p-6 border-b border-border/40 space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-background-muted/40 border border-border/20 hover:bg-background-muted transition-all active:scale-90 group"
            title="Back to Library"
          >
            <ArrowLeft02Icon className="w-5 h-5 text-foreground-muted group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <Link
            href="/dashboard"
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-background-muted/40 border border-border/20 hover:bg-background-muted transition-all active:scale-90 group"
            title="Dashboard"
          >
            <Home01Icon className="w-5 h-5 text-foreground-muted group-hover:scale-110 transition-transform" />
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-foreground-muted/40">
            <NotebookIcon className="w-3.5 h-3.5" />
            NOTEBOOK
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled notebook"
            className="w-full text-xl font-black bg-transparent border-none focus:outline-none placeholder:text-foreground-muted/30 text-foreground tracking-tight"
          />
        </div>

        <div className="flex items-center justify-between">
          {saveStatusIndicator}
        </div>
      </div>

      {/* Navigation / TOC */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 scrollbar-hide">
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground-muted/40 flex items-center gap-2">
              <Menu01Icon className="w-3.5 h-3.5" />
              PAGES
            </h3>
            <span className="text-[10px] font-black text-foreground-muted/40 tabular-nums uppercase border border-border/10 px-2 py-0.5 rounded-full bg-background-muted/20">
              {pages.length} PAGES
            </span>
          </div>

          <div className="space-y-1">
            {pages.map((page, index) => {
              const isActive = currentPageIndex === index;
              return (
                <button
                  key={page.id}
                  onClick={() => onPageClick(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all text-left group overflow-hidden relative ${isActive
                    ? 'bg-primary/5 text-primary'
                    : 'bg-transparent text-foreground-muted/70 hover:bg-background-muted/50 hover:text-foreground'
                  }`}
                >
                  {isActive && (
                    <motion.div 
                        layoutId="active-nav-indicator"
                        className="absolute left-0 w-1 h-6 bg-primary rounded-full" 
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`flex items-center justify-center w-7 h-7 rounded-xl text-[10px] font-black border transition-all ${isActive ? 'bg-primary text-white border-primary shadow-[0_4px_12px_rgba(43,93,139,0.3)]' : 'bg-background-muted/40 border-border/20 text-foreground-muted/40'}`}>
                    {index + 1}
                  </span>
                  <span className="text-[13px] font-bold truncate tracking-tight">
                    {page.title || 'Untitled Page'}
                  </span>
                </button>
              );
            })}

            <button
              onClick={onAddPage}
              className="w-full flex items-center justify-center gap-2 p-3 mt-2 rounded-2xl border border-dashed border-border/40 text-foreground-muted/50 hover:border-primary/40 hover:text-primary hover:bg-primary/[0.02] transition-all text-[11px] font-black uppercase tracking-wider"
            >
              <Add01Icon className="w-4 h-4" />
              NEW PAGE
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
           <div className="px-2">
            <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground-muted/40 flex items-center gap-2">
                <Tag01Icon className="w-3.5 h-3.5" />
                TAGS
            </h3>
           </div>
          
          <div className="flex flex-wrap gap-2 px-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-[10px] font-black bg-background-muted/40 border border-border/20 text-foreground-muted hover:text-foreground transition-all group"
              >
                {tag.toUpperCase()}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="p-1 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all opacity-40 group-hover:opacity-100"
                >
                  <Cancel01Icon className="w-3 h-3" />
                </button>
              </span>
            ))}
            
            {showTagInput ? (
              <input
                type="text"
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyDown={onTagInputKeyDown}
                onBlur={onTagInputBlur}
                placeholder="Tag name..."
                className="min-w-[100px] px-3 py-1.5 rounded-xl text-[10px] font-black bg-surface border border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 text-foreground uppercase"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={onAddTagClick}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black bg-background-muted/40 border border-border/20 text-foreground-muted/40 hover:bg-background-muted hover:text-foreground transition-all uppercase"
              >
                <Add01Icon className="w-3.5 h-3.5" />
                TAG
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Quick Stats or Help */}
      <div className="p-6 border-t border-border/40 bg-background-muted/20">
        <div className="p-4 bg-surface/40 backdrop-blur-sm rounded-3xl border border-border/20 shadow-sm transition-all hover:shadow-md group">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center transition-transform group-hover:rotate-12">
              <SummationCircleIcon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground">STAY ANALYTIC</span>
          </div>
          <p className="text-[10px] font-bold text-foreground-muted/60 leading-relaxed uppercase tracking-wide">
             {pages.length} PAGES • {tags.length} TAGS
             <br/>
             <span className="opacity-40 font-medium">Use AI for summaries & cards</span>
          </p>
        </div>
      </div>
    </div>
  );
}
