'use client';

import { useState, useRef, useEffect } from 'react';
import { Tag01Icon, Cancel01Icon, Add01Icon } from 'hugeicons-react';
import { motion, AnimatePresence } from 'motion/react';

interface TagsDropdownProps {
  tags: string[];
  onRemoveTag: (tag: string) => void;
  onAddTag: (tag: string) => void;
  showTagInput: boolean;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onTagInputKeyDown: (e: React.KeyboardEvent) => void;
  onTagInputBlur: () => void;
  onAddTagClick: () => void;
}

export default function TagsDropdown({
  tags,
  onRemoveTag,
  onAddTag,
  showTagInput,
  tagInput,
  onTagInputChange,
  onTagInputKeyDown,
  onTagInputBlur,
  onAddTagClick
}: TagsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background-muted/40 hover:bg-background-muted transition-all active:scale-95 group border border-border/10"
      >
        <Tag01Icon className="w-4 h-4 text-foreground-muted group-hover:text-foreground transition-colors" />
        <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted group-hover:text-foreground transition-colors">
          {tags.length} TAGS
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full right-0 mt-2 w-72 bg-surface/95 backdrop-blur-xl border border-border/40 rounded-3xl shadow-2xl p-4 z-[100]"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase tracking-[0.25em] text-foreground-muted/50">
                MANAGE TAGS
              </span>
              <span className="text-[10px] font-black bg-background-muted/40 px-2 py-0.5 rounded-lg text-foreground-muted">
                {tags.length}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl text-[10px] font-black bg-background-muted border border-border/20 text-foreground transition-all group/tag shadow-sm"
                >
                  {tag.toUpperCase()}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    className="p-1 rounded-lg hover:bg-red-500/10 hover:text-red-500 transition-all opacity-40 group-hover/tag:opacity-100"
                  >
                    <Cancel01Icon className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-[11px] font-bold text-foreground-muted/40 italic py-2">
                  No tags added yet.
                </span>
              )}
            </div>

            <div className="pt-4 border-t border-border/20">
              {showTagInput ? (
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => onTagInputChange(e.target.value)}
                  onKeyDown={onTagInputKeyDown}
                  onBlur={onTagInputBlur}
                  placeholder="NEW TAG..."
                  className="w-full px-4 py-3 rounded-2xl text-[11px] font-black bg-background-muted/50 border border-primary/40 focus:outline-none focus:ring-4 focus:ring-primary/10 text-foreground uppercase tracking-widest placeholder:text-foreground-muted/30"
                  autoFocus
                />
              ) : (
                <button
                  type="button"
                  onClick={onAddTagClick}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black border border-dashed border-border/40 text-foreground-muted/60 hover:text-foreground hover:border-border transition-all uppercase tracking-widest active:scale-[0.98]"
                >
                  <Add01Icon className="w-4 h-4" />
                  ADD TAG
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
