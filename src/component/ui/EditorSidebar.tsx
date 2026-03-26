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
    <div className={`flex flex-col h-full bg-surface shadow-2xl overflow-hidden select-none transition-all duration-500 rounded-r-[2.5rem] border-r-4 border-y-4 border-l-0 border-surface ${className}`}>
      {/* Sidebar Header */}
      <div className="p-6 md:p-8 space-y-6 bg-surface shrink-0">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-background-muted text-foreground hover:bg-border/40 transition-all active:scale-95 shrink-0"
            title="Back"
          >
            <ArrowLeft02Icon className="w-6 h-6" />
          </button>
          
          <Link
            href="/dashboard"
            className="w-12 h-12 flex items-center justify-center rounded-[1.25rem] bg-background-muted text-foreground hover:bg-border/40 transition-all active:scale-95 shrink-0"
            title="Dashboard"
          >
            <Home01Icon className="w-6 h-6" />
          </Link>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-2 flex items-center gap-2">
            <NotebookIcon className="w-4 h-4 text-foreground/40" /> NOTEBOOK
          </span>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="UNTITLED NOTEBOOK"
            className="w-full text-2xl font-black bg-transparent border-none focus:outline-none placeholder:text-foreground/30 text-foreground tracking-tighter p-0 truncate uppercase"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          {saveStatusIndicator}
        </div>
      </div>

      {/* Navigation / TOC */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 space-y-8 scrollbar-hide pb-10">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 flex items-center gap-2">
              <Menu01Icon className="w-4 h-4" /> PAGES
            </h3>
            <span className="text-[10px] font-black text-foreground uppercase tracking-widest bg-background-muted px-3 py-1 rounded-full">
              {pages.length} PAGES
            </span>
          </div>

          <div className="space-y-2">
            {pages.map((page, index) => {
              const isActive = currentPageIndex === index;
              return (
                <button
                  key={page.id}
                  onClick={() => onPageClick(index)}
                  className={`w-full flex items-center gap-4 p-3 rounded-[1.25rem] transition-all text-left overflow-hidden ${isActive
                    ? 'bg-foreground text-surface shadow-md scale-100'
                    : 'bg-transparent text-foreground hover:bg-background-muted hover:scale-[1.02]'
                  }`}
                >
                  <span className={`flex items-center justify-center w-8 h-8 rounded-[1rem] text-[11px] font-black shrink-0 transition-colors ${isActive ? 'bg-surface/20 text-surface' : 'bg-background-muted text-foreground'}`}>
                    {index + 1}
                  </span>
                  <span className="text-[13px] font-black uppercase tracking-widest truncate flex-1">
                    {page.title || 'UNTITLED PAGE'}
                  </span>
                </button>
              );
            })}

            <button
              onClick={onAddPage}
              className="w-full flex items-center justify-center gap-2 p-4 mt-2 rounded-[1.25rem] border-2 border-dashed border-border/60 text-foreground hover:border-foreground transition-all text-[11px] font-black uppercase tracking-widest active:scale-95 bg-background-muted/30"
            >
              <Add01Icon className="w-4 h-4" /> NEW PAGE
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-4">
           <div>
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 flex items-center gap-2">
                <Tag01Icon className="w-4 h-4" /> TAGS
            </h3>
           </div>
          
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-2 pl-4 pr-3 py-2.5 rounded-[1rem] text-[11px] font-black uppercase tracking-widest bg-background-muted text-foreground shadow-sm group transition-all hover:bg-border/40"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="p-1 rounded-full hover:bg-foreground hover:text-surface transition-all opacity-60 group-hover:opacity-100"
                >
                  <Cancel01Icon className="w-3.5 h-3.5" />
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
                placeholder="TAG NAME..."
                className="min-w-[120px] px-4 py-2.5 rounded-[1rem] text-[11px] font-black bg-surface border-2 border-foreground focus:outline-none text-foreground uppercase tracking-widest"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={onAddTagClick}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[1rem] text-[11px] font-black bg-transparent border-2 border-dashed border-border/60 text-foreground hover:bg-background-muted hover:border-border transition-all uppercase tracking-widest active:scale-95"
              >
                <Add01Icon className="w-4 h-4" /> TAG
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Quick Stats */}
      <div className="p-6 md:p-8 shrink-0 bg-surface">
        <div className="p-5 bg-background-muted rounded-[1.5rem] transition-all hover:shadow-md border-[3px] border-surface">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-[1rem] bg-foreground text-surface flex items-center justify-center shadow-sm">
              <SummationCircleIcon className="w-4 h-4" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-[0.2em] text-foreground">STAY ANALYTIC</span>
          </div>
          <p className="text-[11px] font-bold text-foreground/60 uppercase tracking-widest leading-relaxed">
             {pages.length} PAGES / {tags.length} TAGS<br/>
             <span className="opacity-60">Use AI for summaries & cards</span>
          </p>
        </div>
      </div>
    </div>
  );
}
