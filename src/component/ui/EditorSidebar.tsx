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
  Settings02Icon,
  BookOpen01Icon,
  NoteIcon,
  FlashIcon,
  SummationCircleIcon,
} from 'hugeicons-react';
import { NotebookIcon } from '@/component/icons';
import { NotePage } from './TableOfContents';
import { NotebookColorKey } from './ClayNotebookCover';

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
    <div className={`flex flex-col h-full bg-surface border-r border-border shadow-sm overflow-hidden ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-border bg-background-muted hover:bg-border transition-all text-foreground-muted"
            title="Back to Library"
          >
            <ArrowLeft02Icon className="w-5 h-5" />
          </button>
          <Link
            href="/dashboard"
            className="p-2 rounded-xl border border-border bg-background-muted hover:bg-border transition-all text-foreground-muted"
            title="Dashboard"
          >
            <Home01Icon className="w-5 h-5" />
          </Link>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground-muted">
            <NotebookIcon className="w-3.5 h-3.5" />
            Notebook Title
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Untitled notebook"
            className="w-full text-lg font-bold bg-transparent border-none focus:outline-none placeholder:text-foreground-muted text-foreground"
          />
        </div>

        <div className="flex items-center justify-between text-xs font-semibold text-foreground-muted">
          {saveStatusIndicator}
        </div>
      </div>

      {/* Navigation / TOC */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted flex items-center gap-2">
              <Menu01Icon className="w-3.5 h-3.5" />
              Pages
            </h3>
            <span className="text-[10px] font-bold text-foreground-muted tabular-nums">
              {pages.length} total
            </span>
          </div>

          <div className="space-y-1.5">
            {pages.map((page, index) => {
              const isActive = currentPageIndex === index;
              return (
                <button
                  key={page.id}
                  onClick={() => onPageClick(index)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${isActive
                    ? 'bg-primary/5 border-primary/20 text-primary'
                    : 'bg-transparent border-transparent text-foreground-muted hover:bg-background-muted hover:text-foreground'
                  }`}
                >
                  <span className={`flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-black border transition-colors ${isActive ? 'bg-primary text-white border-primary' : 'bg-background-muted border-border text-foreground-muted'}`}>
                    {index + 1}
                  </span>
                  <span className="text-sm font-bold truncate leading-none">
                    {page.title || 'Untitled Page'}
                  </span>
                </button>
              );
            })}

            <button
              onClick={onAddPage}
              className="w-full flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-border text-foreground-muted hover:border-primary/40 hover:text-primary transition-all text-xs font-bold"
            >
              <Add01Icon className="w-4 h-4" />
              Add new page
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground-muted flex items-center gap-2">
            <Tag01Icon className="w-3.5 h-3.5" />
            Tags
          </h3>
          
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-full text-[10px] font-black bg-background-muted border border-border text-foreground-muted hover:text-foreground transition-colors group"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onRemoveTag(tag)}
                  className="p-0.5 rounded-full hover:bg-red-500/10 hover:text-red-500 transition-colors"
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
                className="min-w-[80px] px-2.5 py-1 rounded-full text-[10px] font-black bg-surface border border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/10 text-foreground"
                autoFocus
              />
            ) : (
              <button
                type="button"
                onClick={onAddTagClick}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-background-muted border border-border text-foreground-muted hover:bg-border hover:text-foreground transition-all"
              >
                <Add01Icon className="w-3 h-3" />
                Tag
              </button>
            )}
          </div>
        </div>
      </div>

      {/* AI Quick Stats or Help */}
      <div className="p-4 border-t border-border bg-background-muted/30">
        <div className="p-3 bg-white rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <SummationCircleIcon className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-wider text-foreground">Quick Stats</span>
          </div>
          <p className="text-[10px] font-medium text-foreground-muted leading-relaxed">
            This notebook has {pages.length} pages and {tags.length} tags. Use the AI Assist toolbar for summaries.
          </p>
        </div>
      </div>
    </div>
  );
}
