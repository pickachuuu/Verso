'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { PolaroidImage } from './PolaroidImage';
import { TextStyle } from '@tiptap/extension-text-style';
import AISelectionBubble from './AISelectionBubble';
import { useEffect, useState, useImperativeHandle, forwardRef, useRef } from 'react';
import {
  TextBoldIcon,
  TextItalicIcon,
  TextUnderlineIcon,
  TextStrikethroughIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  ListViewIcon,
  LeftToRightListNumberIcon,
  QuoteDownIcon,
  SourceCodeIcon,
  TextAlignLeftIcon,
  TextAlignCenterIcon,
  TextAlignRightIcon,
  PaintBrush04Icon,
  ArrowTurnBackwardIcon,
  ArrowTurnForwardIcon,
  MinusSignIcon,
  Sun01Icon,
  Moon01Icon,
  Image01Icon,
  TextColorIcon,
  GoogleGeminiIcon,
  Loading03Icon,
  PencilEdit02Icon,
  NoteIcon,
  SummationCircleIcon,
  FlashIcon,
} from 'hugeicons-react';

// Preset colors for text and highlighting
const TEXT_COLORS = [
  { name: 'Default', color: null },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Amber', color: '#f59e0b' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Teal', color: '#14b8a6' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Indigo', color: '#6366f1' },
  { name: 'Purple', color: '#a855f7' },
  { name: 'Pink', color: '#ec4899' },
];

const HIGHLIGHT_COLORS = [
  { name: 'Yellow', color: '#fef08a' },
  { name: 'Green', color: '#bbf7d0' },
  { name: 'Blue', color: '#bfdbfe' },
  { name: 'Purple', color: '#e9d5ff' },
  { name: 'Pink', color: '#fbcfe8' },
  { name: 'Orange', color: '#fed7aa' },
];

// Export Editor type for external use
export type { Editor } from '@tiptap/react';

// ============================================
// Toolbar Button Component
// ============================================
interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title: string;
  vertical?: boolean;
  theme?: 'light' | 'dark';
}

function ToolbarButton({ onClick, isActive, disabled, children, title, vertical, theme }: ToolbarButtonProps) {
  if (vertical) {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title}
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center transition-all
          disabled:opacity-30 disabled:cursor-not-allowed
          ${isActive
            ? theme === 'dark'
              ? 'bg-blue-900/50 text-blue-300'
              : 'bg-blue-100 text-blue-600'
            : theme === 'dark'
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              : 'bg-white hover:bg-gray-50 text-gray-600 shadow-sm'
          }
        `}
      >
        {children}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        p-1 rounded-lg transition-all duration-200
        sm:p-1.5
        disabled:opacity-30 disabled:cursor-not-allowed
        ${isActive
          ? 'clay-button-secondary'
          : 'clay-button-ghost'
        }
      `}
    >
      {children}
    </button>
  );
}

// ============================================
// Toolbar Divider
// ============================================
function ToolbarDivider({ vertical }: { vertical?: boolean }) {
  if (vertical) {
    return <div className="w-full h-px bg-gray-200 my-1" />;
  }
  return <div className="w-px h-6 bg-border/50 mx-0.5" />;
}

// ============================================
// Vertical Editor Toolbar (for side panel)
// ============================================
interface VerticalEditorToolbarProps {
  editor: Editor | null;
  theme: 'light' | 'dark';
  onAIAction?: (action: string) => void;
  aiLoading?: string | null;
  compact?: boolean;
}

function VerticalToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  theme,
  compact,
  children
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  theme: 'light' | 'dark';
  compact?: boolean;
  children: React.ReactNode;
}) {
  const isDark = theme === 'dark';
  const sizeClass = compact ? 'h-8 rounded-lg' : 'h-9 rounded-xl';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-full ${sizeClass} flex items-center justify-center transition-all
        disabled:opacity-30 disabled:cursor-not-allowed
        ${isActive
          ? isDark
            ? 'bg-blue-700/60 text-blue-200'
            : 'bg-blue-500/20 text-blue-600'
          : isDark
            ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300'
            : 'bg-white/80 hover:bg-white text-gray-600'
        }
      `}
      style={{
        boxShadow: disabled ? 'none' : (isDark
          ? '0 2px 4px rgba(0,0,0,0.3)'
          : '0 2px 4px rgba(0,0,0,0.08)'),
      }}
    >
      {children}
    </button>
  );
}

function VerticalToolbarDivider({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <div
      className="w-full h-px"
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)'
          : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.1), transparent)'
      }}
    />
  );
}

export function VerticalEditorToolbar({ editor, theme, onAIAction, aiLoading, compact = false }: VerticalEditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);
  const [showTextColors, setShowTextColors] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);
  const isCompact = compact;

  // Whether the editor is available and ready for commands
  const canEdit = !!editor && !editor.isDestroyed;

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textColorRef.current && !textColorRef.current.contains(event.target as Node)) {
        setShowTextColors(false);
      }
      if (highlightColorRef.current && !highlightColorRef.current.contains(event.target as Node)) {
        setShowHighlightColors(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && canEdit) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        editor!.chain().focus().setPolaroidImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = () => {
    if (canEdit) fileInputRef.current?.click();
  };

  const handleTextColor = (color: string | null) => {
    if (!canEdit) return;
    if (color) {
      editor!.chain().focus().setColor(color).run();
    } else {
      editor!.chain().focus().unsetColor().run();
    }
    setShowTextColors(false);
  };

  const handleHighlightColor = (color: string) => {
    if (!canEdit) return;
    editor!.chain().focus().toggleHighlight({ color }).run();
    setShowHighlightColors(false);
  };

  const removeHighlight = () => {
    if (!canEdit) return;
    editor!.chain().focus().unsetHighlight().run();
    setShowHighlightColors(false);
  };

  const isDark = theme === 'dark';

  return (
    <div className={`flex flex-col ${isCompact ? 'gap-2' : 'gap-3'} ${!canEdit ? 'opacity-40 pointer-events-none' : ''}`}>
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Undo/Redo row */}
      <div className={`grid grid-cols-2 ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!canEdit || !(editor?.can().undo() ?? false)}
          title="Undo"
          theme={theme}
          compact={isCompact}
        >
          <ArrowTurnBackwardIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!canEdit || !(editor?.can().redo() ?? false)}
          title="Redo"
          theme={theme}
          compact={isCompact}
        >
          <ArrowTurnForwardIcon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Text Formatting - 3 columns */}
      <div className={`grid ${isCompact ? 'grid-cols-4 gap-1.5' : 'grid-cols-3 gap-2'}`}>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleBold().run()}
          isActive={canEdit && (editor?.isActive('bold') ?? false)}
          disabled={!canEdit}
          title="Bold"
          theme={theme}
          compact={isCompact}
        >
          <TextBoldIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          isActive={canEdit && (editor?.isActive('italic') ?? false)}
          disabled={!canEdit}
          title="Italic"
          theme={theme}
          compact={isCompact}
        >
          <TextItalicIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
          isActive={canEdit && (editor?.isActive('underline') ?? false)}
          disabled={!canEdit}
          title="Underline"
          theme={theme}
          compact={isCompact}
        >
          <TextUnderlineIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          isActive={canEdit && (editor?.isActive('strike') ?? false)}
          disabled={!canEdit}
          title="Strikethrough"
          theme={theme}
          compact={isCompact}
        >
          <TextStrikethroughIcon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Color Options */}
      <div className={isCompact ? 'grid grid-cols-2 gap-2' : 'space-y-2'}>
        {/* Text Color Picker */}
        <div className="relative" ref={textColorRef}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setShowTextColors(!showTextColors);
              setShowHighlightColors(false);
            }}
            disabled={!canEdit}
            title="Text Color"
            className={`
              w-full ${isCompact ? 'h-8' : 'h-9'} rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-medium
              disabled:opacity-30 disabled:cursor-not-allowed
              ${isDark
                ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200/80 shadow-sm'
              }
            `}
          >
            <TextColorIcon className="w-4 h-4" />
            <span>{isCompact ? 'Color' : 'Text Color'}</span>
            <div
              className="w-3 h-3 rounded-full border border-gray-400/50"
              style={{ backgroundColor: (canEdit && editor?.getAttributes('textStyle')?.color) || (isDark ? '#e5e7eb' : '#374151') }}
            />
          </button>

          {showTextColors && canEdit && (
            <div className={`
              absolute left-0 right-0 mt-2 p-2 rounded-xl z-50
              ${isDark
                ? 'bg-gray-800 border border-gray-700 shadow-xl'
                : 'bg-white border border-gray-200 shadow-xl'
              }
            `}>
              <div className="grid grid-cols-5 gap-1.5">
                {TEXT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleTextColor(c.color)}
                    title={c.name}
                    className={`
                      w-7 h-7 rounded-lg transition-all flex items-center justify-center
                      ${!c.color
                        ? isDark
                          ? 'bg-gray-700 hover:bg-gray-600 border border-gray-600'
                          : 'bg-gray-100 hover:bg-gray-200 border border-gray-300'
                        : 'hover:scale-110'
                      }
                    `}
                    style={c.color ? { backgroundColor: c.color } : undefined}
                  >
                    {!c.color && (
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>∅</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Highlight Color Picker */}
        <div className="relative" ref={highlightColorRef}>
          <button
            type="button"
            onClick={() => {
              if (!canEdit) return;
              setShowHighlightColors(!showHighlightColors);
              setShowTextColors(false);
            }}
            disabled={!canEdit}
            title="Highlight Color"
            className={`
              w-full ${isCompact ? 'h-8' : 'h-9'} rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-medium
              disabled:opacity-30 disabled:cursor-not-allowed
              ${canEdit && editor?.isActive('highlight')
                ? isDark
                  ? 'bg-blue-900/50 text-blue-300 border border-blue-700/50'
                  : 'bg-blue-100 text-blue-600 border border-blue-200'
                : isDark
                  ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50'
                  : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200/80 shadow-sm'
              }
            `}
          >
            <PaintBrush04Icon className="w-4 h-4" />
            <span>Highlight</span>
          </button>

          {showHighlightColors && canEdit && (
            <div className={`
              absolute left-0 right-0 mt-2 p-2 rounded-xl z-50
              ${isDark
                ? 'bg-gray-800 border border-gray-700 shadow-xl'
                : 'bg-white border border-gray-200 shadow-xl'
              }
            `}>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {HIGHLIGHT_COLORS.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => handleHighlightColor(c.color)}
                    title={c.name}
                    className="w-full h-7 rounded-lg transition-all hover:scale-105"
                    style={{ backgroundColor: c.color }}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={removeHighlight}
                className={`
                  w-full h-7 rounded-lg text-xs font-medium transition-all
                  ${isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }
                `}
              >
                Remove Highlight
              </button>
            </div>
          )}
        </div>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Headings - 3 columns */}
      <div className={`grid grid-cols-3 ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={canEdit && (editor?.isActive('heading', { level: 1 }) ?? false)}
          disabled={!canEdit}
          title="Heading 1"
          theme={theme}
          compact={isCompact}
        >
          <Heading01Icon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={canEdit && (editor?.isActive('heading', { level: 2 }) ?? false)}
          disabled={!canEdit}
          title="Heading 2"
          theme={theme}
          compact={isCompact}
        >
          <Heading02Icon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={canEdit && (editor?.isActive('heading', { level: 3 }) ?? false)}
          disabled={!canEdit}
          title="Heading 3"
          theme={theme}
          compact={isCompact}
        >
          <Heading03Icon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Lists & Blocks - 2 columns */}
      <div className={`grid ${isCompact ? 'grid-cols-3 gap-1.5' : 'grid-cols-2 gap-2'}`}>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          isActive={canEdit && (editor?.isActive('bulletList') ?? false)}
          disabled={!canEdit}
          title="Bullet List"
          theme={theme}
          compact={isCompact}
        >
          <ListViewIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          isActive={canEdit && (editor?.isActive('orderedList') ?? false)}
          disabled={!canEdit}
          title="Numbered List"
          theme={theme}
          compact={isCompact}
        >
          <LeftToRightListNumberIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          isActive={canEdit && (editor?.isActive('blockquote') ?? false)}
          disabled={!canEdit}
          title="Quote"
          theme={theme}
          compact={isCompact}
        >
          <QuoteDownIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          isActive={canEdit && (editor?.isActive('codeBlock') ?? false)}
          disabled={!canEdit}
          title="Code Block"
          theme={theme}
          compact={isCompact}
        >
          <SourceCodeIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={handleImageClick}
          isActive={canEdit && (editor?.isActive('polaroidImage') ?? false)}
          disabled={!canEdit}
          title="Insert Polaroid"
          theme={theme}
          compact={isCompact}
        >
          <Image01Icon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Text Alignment - 3 columns */}
      <div className={`grid grid-cols-3 ${isCompact ? 'gap-1.5' : 'gap-2'}`}>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign('left').run()}
          isActive={canEdit && (editor?.isActive({ textAlign: 'left' }) ?? false)}
          disabled={!canEdit}
          title="Align Left"
          theme={theme}
          compact={isCompact}
        >
          <TextAlignLeftIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign('center').run()}
          isActive={canEdit && (editor?.isActive({ textAlign: 'center' }) ?? false)}
          disabled={!canEdit}
          title="Align Center"
          theme={theme}
          compact={isCompact}
        >
          <TextAlignCenterIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor?.chain().focus().setTextAlign('right').run()}
          isActive={canEdit && (editor?.isActive({ textAlign: 'right' }) ?? false)}
          disabled={!canEdit}
          title="Align Right"
          theme={theme}
          compact={isCompact}
        >
          <TextAlignRightIcon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      {/* AI Section */}
      {onAIAction && (
        <>
          <VerticalToolbarDivider theme={theme} />

          {/* AI Header */}
          <div className="flex items-center gap-2 px-1">
            <GoogleGeminiIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-blue-400/70' : 'text-blue-500/70'}`}>
              AI Assist
            </span>
          </div>

          <div className={`grid ${isCompact ? 'grid-cols-2 gap-2' : 'grid-cols-1 gap-2'}`}>
            <button
              type="button"
              onClick={() => onAIAction('continue_writing')}
              disabled={!canEdit || aiLoading === 'continue_writing'}
              title="AI continues writing from cursor position"
              className={`
                w-full ${isCompact ? 'h-8 text-[11px]' : 'h-9 text-xs'} rounded-xl flex items-center justify-center gap-2 transition-all font-medium
                disabled:opacity-30 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-700/30'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'
                }
              `}
              style={{
                boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              {aiLoading === 'continue_writing' ? (
                <Loading03Icon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PencilEdit02Icon className="w-3.5 h-3.5" />
              )}
              <span>{isCompact ? 'Continue' : 'Continue Writing'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAIAction('generate_outline')}
              disabled={!canEdit || aiLoading === 'generate_outline'}
              title="Generate heading structure for this page"
              className={`
                w-full ${isCompact ? 'h-8 text-[11px]' : 'h-9 text-xs'} rounded-xl flex items-center justify-center gap-2 transition-all font-medium
                disabled:opacity-30 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-700/30'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'
                }
              `}
              style={{
                boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              {aiLoading === 'generate_outline' ? (
                <Loading03Icon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <NoteIcon className="w-3.5 h-3.5" />
              )}
              <span>Outline</span>
            </button>

            <button
              type="button"
              onClick={() => onAIAction('summarize_page')}
              disabled={!canEdit || aiLoading === 'summarize_page'}
              title="Summarize the entire page"
              className={`
                w-full ${isCompact ? 'h-8 text-[11px]' : 'h-9 text-xs'} rounded-xl flex items-center justify-center gap-2 transition-all font-medium
                disabled:opacity-30 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-blue-900/30 hover:bg-blue-800/40 text-blue-300 border border-blue-700/30'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700 border border-blue-200'
                }
              `}
              style={{
                boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              {aiLoading === 'summarize_page' ? (
                <Loading03Icon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <SummationCircleIcon className="w-3.5 h-3.5" />
              )}
              <span>{isCompact ? 'Summary' : 'Summarize'}</span>
            </button>

            <button
              type="button"
              onClick={() => onAIAction('generate_flashcards')}
              disabled={!canEdit || aiLoading === 'generate_flashcards'}
              title="Generate flashcards from page content"
              className={`
                w-full ${isCompact ? 'h-8 text-[11px]' : 'h-9 text-xs'} rounded-xl flex items-center justify-center gap-2 transition-all font-medium
                disabled:opacity-30 disabled:cursor-not-allowed
                ${isDark
                  ? 'bg-orange-900/30 hover:bg-orange-800/40 text-orange-300 border border-orange-700/30'
                  : 'bg-orange-100 hover:bg-orange-200 text-orange-700 border border-orange-200'
                }
              `}
              style={{
                boxShadow: isDark ? '0 2px 4px rgba(0,0,0,0.3)' : '0 2px 4px rgba(0,0,0,0.08)',
              }}
            >
              {aiLoading === 'generate_flashcards' ? (
                <Loading03Icon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FlashIcon className="w-3.5 h-3.5" />
              )}
              <span>{isCompact ? 'Cards' : 'Flashcards'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// Editor Toolbar
// ============================================
interface EditorToolbarProps {
  editor: Editor | null;
  fullscreen?: boolean;
  leadingSlot?: React.ReactNode;
}

export function EditorToolbar({ editor, fullscreen, leadingSlot }: EditorToolbarProps) {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Once mounted on client, get the theme
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      setTheme(systemTheme);
    }
  }, []);

  // Apply theme and persist
  useEffect(() => {
    if (!mounted) return;
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("theme", theme);

    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent("themechange", { detail: { theme } }));
  }, [theme, mounted]);

  // Listen for theme changes from other parts of the app
  useEffect(() => {
    if (!mounted) return;
    const handleThemeChange = () => {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
      }
    };

    // Listen for storage events (from other tabs/windows)
    window.addEventListener("storage", handleThemeChange);
    // Listen for custom theme change events
    window.addEventListener("themechange", handleThemeChange as EventListener);

    // Also check periodically for changes
    const interval = setInterval(() => {
      const stored = localStorage.getItem("theme");
      const isDark = document.documentElement.classList.contains("dark");
      if (stored === "light" && isDark) {
        setTheme("light");
      } else if (stored === "dark" && !isDark) {
        setTheme("dark");
      }
    }, 100);

    return () => {
      window.removeEventListener("storage", handleThemeChange);
      window.removeEventListener("themechange", handleThemeChange as EventListener);
      clearInterval(interval);
    };
  }, [mounted]);

  // Listen for system theme changes if user hasn't set a preference
  useEffect(() => {
    if (!mounted) return;
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return;

    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setTheme(media.matches ? "dark" : "light");
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mounted]);

  if (!editor) return null;

  return (
    <div className={`
      clay-toolbar
      flex flex-wrap items-center gap-0.5 px-3 py-2
      ${fullscreen ? 'justify-start' : 'justify-center'}
      gap-0 px-2 py-1.5 sm:gap-0.5 sm:px-3 sm:py-2
    `}>
      {leadingSlot && (
        <div className="mr-1 flex items-center">
          {leadingSlot}
        </div>
      )}
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <ArrowTurnBackwardIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <ArrowTurnForwardIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <TextBoldIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <TextItalicIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <TextUnderlineIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <TextStrikethroughIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <PaintBrush04Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading01Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading02Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading03Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <ListViewIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <LeftToRightListNumberIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <QuoteDownIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <SourceCodeIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <MinusSignIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <TextAlignLeftIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <TextAlignCenterIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <TextAlignRightIcon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Theme Toggle */}
      {mounted && (
        <ToolbarButton
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <Sun01Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          ) : (
            <Moon01Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          )}
        </ToolbarButton>
      )}
    </div>
  );
}

// ============================================
// Editor Ref Handle
// ============================================
export interface RichTextEditorHandle {
  getEditor: () => Editor | null;
}

// ============================================
// Main Rich Text Editor Component
// ============================================
interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  editorClassName?: string;
  autoFocus?: boolean;
  fullscreen?: boolean;
  hideToolbar?: boolean;
  readOnly?: boolean;
  onEditorReady?: (editor: Editor) => void;
  onGenerateFlashcards?: (text: string) => void;
}

export const RichTextEditor = forwardRef<RichTextEditorHandle, RichTextEditorProps>(function RichTextEditor({
  content,
  onChange,
  placeholder = 'Start writing...',
  className = '',
  editorClassName = '',
  autoFocus = false,
  fullscreen = false,
  hideToolbar = false,
  readOnly = false,
  onEditorReady,
  onGenerateFlashcards,
}, ref) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
      Underline,
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      PolaroidImage,
    ],
    content,
    immediatelyRender: false,
    autofocus: !readOnly && autoFocus ? 'end' : false,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: `tiptap-editor prose prose-sm sm:prose lg:prose-lg max-w-none focus:outline-none prose-headings:mt-6 prose-headings:mb-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 ${editorClassName}`,
      },
    },
    onUpdate: ({ editor }) => {
      if (readOnly) return;
      onChange(editor.getHTML());
    },
  });

  // Expose editor instance via ref
  useImperativeHandle(ref, () => ({
    getEditor: () => editor,
  }), [editor]);

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Update content when prop changes (e.g., loading a note)
  // Use queueMicrotask to defer setContent outside of React's lifecycle
  // This prevents the "flushSync was called from inside a lifecycle method" error
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      // Defer the setContent call to avoid flushSync conflicts with React
      queueMicrotask(() => {
        // Double-check editor still exists and content still differs
        if (editor && !editor.isDestroyed && content !== editor.getHTML()) {
          editor.commands.setContent(content, { emitUpdate: false });
        }
      });
    }
  }, [content, editor]);

  // Keyboard shortcut for underline (not included by default)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (readOnly) return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'u') {
        e.preventDefault();
        editor?.chain().focus().toggleUnderline().run();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor]);

  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");

  // Sync theme
  useEffect(() => {
    setMounted(true);
    const getTheme = (): "light" | "dark" => {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") {
        return stored;
      }
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    };

    setTheme(getTheme());

    const handleThemeChange = () => {
      const newTheme = getTheme();
      setTheme(newTheme);
    };

    const handleCustomThemeChange = (e: CustomEvent) => {
      const newTheme = (e.detail as { theme: string }).theme as "light" | "dark";
      if (newTheme === "light" || newTheme === "dark") {
        setTheme(newTheme);
      }
    };

    window.addEventListener("themechange", handleCustomThemeChange as EventListener);
    window.addEventListener("storage", handleThemeChange);

    const interval = setInterval(() => {
      const currentTheme = getTheme();
      const isDark = document.documentElement.classList.contains("dark");
      if ((currentTheme === "dark" && !isDark) || (currentTheme === "light" && isDark)) {
        handleThemeChange();
      }
    }, 100);

    return () => {
      window.removeEventListener("themechange", handleCustomThemeChange as EventListener);
      window.removeEventListener("storage", handleThemeChange);
      clearInterval(interval);
    };
  }, []);

  if (fullscreen) {
    const editorBg = theme === 'dark' ? '#1e1e2e' : '#fffef8';
    const textColor = theme === 'dark' ? '#e8eaed' : '#202124';
    const lineColor = theme === 'dark' ? 'rgba(157, 123, 224, 0.15)' : 'rgba(95, 108, 175, 0.12)';
    const marginColor = theme === 'dark' ? 'rgba(180, 100, 100, 0.2)' : 'rgba(220, 80, 80, 0.25)';

    return (
      <div className={`flex flex-col h-full ${className}`}>
        {/* Sticky Toolbar */}
        {!hideToolbar && <EditorToolbar editor={editor} fullscreen />}

        {/* Document Area - Notebook style */}
        <div
          className="flex-1 overflow-auto"
          style={{ backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f5f5f0' }}
        >
          <div
            className="max-w-4xl mx-auto my-8 rounded-lg shadow-lg relative overflow-hidden"
            style={{
              backgroundColor: editorBg,
              minHeight: 'calc(100vh - 200px)',
            }}
          >
            {/* Notebook lines */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 31px,
                  ${lineColor} 31px,
                  ${lineColor} 32px
                )`,
                backgroundSize: '100% 32px',
                backgroundPosition: '0 24px',
              }}
            />

            {/* Red margin line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 pointer-events-none"
              style={{
                left: '72px',
                background: `linear-gradient(180deg, transparent 0%, ${marginColor} 5%, ${marginColor} 95%, transparent 100%)`,
              }}
            />

            {/* Content area */}
            <div
              className="relative z-10 pl-24 pr-12 py-8"
              style={{
                color: textColor,
                lineHeight: '32px',
              }}
            >
              <EditorContent editor={editor} />
              {editor && !readOnly && (
                <AISelectionBubble
                  editor={editor}
                  onGenerateFlashcards={onGenerateFlashcards}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular (non-fullscreen) mode
  return (
    <div className={`rich-text-editor-container ${className}`}>
      {!hideToolbar && <EditorToolbar editor={editor} />}
      <div className="tiptap-editor-wrapper">
        <EditorContent editor={editor} />
        {editor && !readOnly && (
          <AISelectionBubble
            editor={editor}
            onGenerateFlashcards={onGenerateFlashcards}
          />
        )}
      </div>
    </div>
  );
})

export default RichTextEditor;
