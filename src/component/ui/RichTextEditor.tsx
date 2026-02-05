'use client';

import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Color } from '@tiptap/extension-color';
import { ResizableImage } from './ResizableImage';
import { TextStyle } from '@tiptap/extension-text-style';
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
              ? 'bg-indigo-900/50 text-indigo-300'
              : 'bg-indigo-100 text-indigo-600'
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
        p-1.5 rounded-xl transition-all duration-200
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
    return <div className="w-full h-px bg-gray-200 dark:bg-gray-700 my-1" />;
  }
  return <div className="w-px h-6 bg-border/50 mx-0.5" />;
}

// ============================================
// Vertical Editor Toolbar (for side panel)
// ============================================
interface VerticalEditorToolbarProps {
  editor: Editor | null;
  theme: 'light' | 'dark';
}

function VerticalToolbarButton({
  onClick,
  isActive,
  disabled,
  title,
  theme,
  children
}: {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  title: string;
  theme: 'light' | 'dark';
  children: React.ReactNode;
}) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        w-full h-9 rounded-xl flex items-center justify-center transition-all
        disabled:opacity-30 disabled:cursor-not-allowed
        ${isActive
          ? isDark
            ? 'bg-indigo-700/60 text-indigo-200'
            : 'bg-indigo-500/20 text-indigo-600'
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

export function VerticalEditorToolbar({ editor, theme }: VerticalEditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textColorRef = useRef<HTMLDivElement>(null);
  const highlightColorRef = useRef<HTMLDivElement>(null);
  const [showTextColors, setShowTextColors] = useState(false);
  const [showHighlightColors, setShowHighlightColors] = useState(false);

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
    if (file && editor) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        editor.chain().focus().setResizableImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleTextColor = (color: string | null) => {
    if (color) {
      editor?.chain().focus().setColor(color).run();
    } else {
      editor?.chain().focus().unsetColor().run();
    }
    setShowTextColors(false);
  };

  const handleHighlightColor = (color: string) => {
    editor?.chain().focus().toggleHighlight({ color }).run();
    setShowHighlightColors(false);
  };

  const removeHighlight = () => {
    editor?.chain().focus().unsetHighlight().run();
    setShowHighlightColors(false);
  };

  if (!editor) return null;

  const isDark = theme === 'dark';

  return (
    <div className="flex flex-col gap-3">
      {/* Hidden file input for image upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageUpload}
        accept="image/*"
        className="hidden"
      />

      {/* Undo/Redo row */}
      <div className="grid grid-cols-2 gap-2">
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
          theme={theme}
        >
          <ArrowTurnBackwardIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
          theme={theme}
        >
          <ArrowTurnForwardIcon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Text Formatting - 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
          theme={theme}
        >
          <TextBoldIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
          theme={theme}
        >
          <TextItalicIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
          theme={theme}
        >
          <TextUnderlineIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
          theme={theme}
        >
          <TextStrikethroughIcon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Color Options */}
      <div className="space-y-2">
        {/* Text Color Picker */}
        <div className="relative" ref={textColorRef}>
          <button
            type="button"
            onClick={() => {
              setShowTextColors(!showTextColors);
              setShowHighlightColors(false);
            }}
            title="Text Color"
            className={`
              w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-medium
              ${isDark
                ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50'
                : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200/80 shadow-sm'
              }
            `}
          >
            <TextColorIcon className="w-4 h-4" />
            <span>Text Color</span>
            <div
              className="w-3 h-3 rounded-full border border-gray-400/50"
              style={{ backgroundColor: editor.getAttributes('textStyle').color || (isDark ? '#e5e7eb' : '#374151') }}
            />
          </button>

          {showTextColors && (
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
              setShowHighlightColors(!showHighlightColors);
              setShowTextColors(false);
            }}
            title="Highlight Color"
            className={`
              w-full h-9 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-medium
              ${editor.isActive('highlight')
                ? isDark
                  ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-700/50'
                  : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                : isDark
                  ? 'bg-gray-800/80 hover:bg-gray-700/80 text-gray-300 border border-gray-700/50'
                  : 'bg-white hover:bg-gray-50 text-gray-600 border border-gray-200/80 shadow-sm'
              }
            `}
          >
            <PaintBrush04Icon className="w-4 h-4" />
            <span>Highlight</span>
          </button>

          {showHighlightColors && (
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
      <div className="grid grid-cols-3 gap-2">
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive('heading', { level: 1 })}
          title="Heading 1"
          theme={theme}
        >
          <Heading01Icon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive('heading', { level: 2 })}
          title="Heading 2"
          theme={theme}
        >
          <Heading02Icon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive('heading', { level: 3 })}
          title="Heading 3"
          theme={theme}
        >
          <Heading03Icon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Lists & Blocks - 2 columns */}
      <div className="grid grid-cols-2 gap-2">
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive('bulletList')}
          title="Bullet List"
          theme={theme}
        >
          <ListViewIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive('orderedList')}
          title="Numbered List"
          theme={theme}
        >
          <LeftToRightListNumberIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive('blockquote')}
          title="Quote"
          theme={theme}
        >
          <QuoteDownIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          isActive={editor.isActive('codeBlock')}
          title="Code Block"
          theme={theme}
        >
          <SourceCodeIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={handleImageClick}
          isActive={editor.isActive('resizableImage')}
          title="Insert Image"
          theme={theme}
        >
          <Image01Icon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>

      <VerticalToolbarDivider theme={theme} />

      {/* Text Alignment - 3 columns */}
      <div className="grid grid-cols-3 gap-2">
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          isActive={editor.isActive({ textAlign: 'left' })}
          title="Align Left"
          theme={theme}
        >
          <TextAlignLeftIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          isActive={editor.isActive({ textAlign: 'center' })}
          title="Align Center"
          theme={theme}
        >
          <TextAlignCenterIcon className="w-4 h-4" />
        </VerticalToolbarButton>
        <VerticalToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          isActive={editor.isActive({ textAlign: 'right' })}
          title="Align Right"
          theme={theme}
        >
          <TextAlignRightIcon className="w-4 h-4" />
        </VerticalToolbarButton>
      </div>
    </div>
  );
}

// ============================================
// Editor Toolbar
// ============================================
interface EditorToolbarProps {
  editor: Editor | null;
  fullscreen?: boolean;
}

function EditorToolbar({ editor, fullscreen }: EditorToolbarProps) {
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
    `}>
      {/* Undo/Redo */}
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo (Ctrl+Z)"
      >
        <ArrowTurnBackwardIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo (Ctrl+Y)"
      >
        <ArrowTurnForwardIcon className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold (Ctrl+B)"
      >
        <TextBoldIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic (Ctrl+I)"
      >
        <TextItalicIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive('underline')}
        title="Underline (Ctrl+U)"
      >
        <TextUnderlineIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <TextStrikethroughIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        isActive={editor.isActive('highlight')}
        title="Highlight"
      >
        <PaintBrush04Icon className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading01Icon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading02Icon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading03Icon className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <ListViewIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Numbered List"
      >
        <LeftToRightListNumberIcon className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Quote"
      >
        <QuoteDownIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive('codeBlock')}
        title="Code Block"
      >
        <SourceCodeIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <MinusSignIcon className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        isActive={editor.isActive({ textAlign: 'left' })}
        title="Align Left"
      >
        <TextAlignLeftIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        isActive={editor.isActive({ textAlign: 'center' })}
        title="Align Center"
      >
        <TextAlignCenterIcon className="w-5 h-5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        isActive={editor.isActive({ textAlign: 'right' })}
        title="Align Right"
      >
        <TextAlignRightIcon className="w-5 h-5" />
      </ToolbarButton>

      <ToolbarDivider />

      {/* Theme Toggle */}
      {mounted && (
        <ToolbarButton
          onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === "light" ? (
            <Sun01Icon className="w-5 h-5" />
          ) : (
            <Moon01Icon className="w-5 h-5" />
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
  onEditorReady?: (editor: Editor) => void;
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
  onEditorReady,
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
      ResizableImage,
    ],
    content,
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    editorProps: {
      attributes: {
        class: `tiptap-editor prose prose-sm sm:prose lg:prose-lg dark:prose-invert max-w-none focus:outline-none prose-headings:mt-6 prose-headings:mb-3 prose-p:my-2 prose-ul:my-2 prose-ol:my-2 prose-li:my-0 ${editorClassName}`,
      },
    },
    onUpdate: ({ editor }) => {
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

            {/* Hole punches */}
            <div className="absolute left-4 top-0 bottom-0 w-4 pointer-events-none">
              {[80, 200, 320, 440, 560, 680].map((top) => (
                <div
                  key={top}
                  className="absolute rounded-full"
                  style={{
                    top: `${top}px`,
                    left: '4px',
                    width: '16px',
                    height: '16px',
                    backgroundColor: theme === 'dark' ? '#1a1a2e' : '#f5f5f0',
                    boxShadow: `inset 2px 2px 4px ${theme === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.1)'}`,
                  }}
                />
              ))}
            </div>

            {/* Content area */}
            <div
              className="relative z-10 pl-24 pr-12 py-8"
              style={{
                color: textColor,
                lineHeight: '32px',
              }}
            >
              <EditorContent editor={editor} />
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
      </div>
    </div>
  );
})

export default RichTextEditor;
