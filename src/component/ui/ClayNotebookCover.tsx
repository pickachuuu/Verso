'use client';

import { useState, KeyboardEvent, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Clock01Icon, GoogleGeminiIcon, Delete01Icon } from 'hugeicons-react';

// Predefined notebook color themes
export const NOTEBOOK_COLORS = {
  coral: {
    name: 'Coral',
    primary: '#FF6B6B',
    secondary: '#FF8E8E',
    accent: '#FFB4B4',
    text: '#FFFFFF',
    shadow: 'rgba(255, 107, 107, 0.4)',
  },
  ocean: {
    name: 'Ocean',
    primary: '#1A2CA3',
    secondary: '#3B50C9',
    accent: '#7B8FE0',
    text: '#FFFFFF',
    shadow: 'rgba(26, 44, 163, 0.4)',
  },
  royal: {
    name: 'Royal',
    primary: '#2845D6',
    secondary: '#5B7BF0',
    accent: '#93AAFF',
    text: '#FFFFFF',
    shadow: 'rgba(40, 69, 214, 0.4)',
  },
  sunset: {
    name: 'Sunset',
    primary: '#F68048',
    secondary: '#F9A07A',
    accent: '#FCC4A8',
    text: '#FFFFFF',
    shadow: 'rgba(246, 128, 72, 0.4)',
  },
  forest: {
    name: 'Forest',
    primary: '#10B981',
    secondary: '#34D399',
    accent: '#6EE7B7',
    text: '#FFFFFF',
    shadow: 'rgba(16, 185, 129, 0.4)',
  },
  rose: {
    name: 'Rose',
    primary: '#EC4899',
    secondary: '#F472B6',
    accent: '#F9A8D4',
    text: '#FFFFFF',
    shadow: 'rgba(236, 72, 153, 0.4)',
  },
  slate: {
    name: 'Slate',
    primary: '#64748B',
    secondary: '#94A3B8',
    accent: '#CBD5E1',
    text: '#FFFFFF',
    shadow: 'rgba(100, 116, 139, 0.4)',
  },
  midnight: {
    name: 'Midnight',
    primary: '#1E293B',
    secondary: '#334155',
    accent: '#475569',
    text: '#FFFFFF',
    shadow: 'rgba(30, 41, 59, 0.5)',
  },
} as const;

export type NotebookColorKey = keyof typeof NOTEBOOK_COLORS;

interface ClayNotebookCoverBaseProps {
  color?: NotebookColorKey;
  theme?: 'light' | 'dark';
}

// Editor mode props - for creating/editing notebooks
interface ClayNotebookCoverEditorProps extends ClayNotebookCoverBaseProps {
  mode: 'editor';
  title: string;
  onTitleChange: (title: string) => void;
  onOpen: () => void;
  onColorChange?: (color: NotebookColorKey) => void;
}

// Card mode props - for displaying notebooks in a grid
interface ClayNotebookCoverCardProps extends ClayNotebookCoverBaseProps {
  mode: 'card';
  title: string;
  tags?: string[];
  updatedAt?: string;
  onGenerateFlashcards?: () => void;
  onDelete?: () => void;
}

type ClayNotebookCoverProps = ClayNotebookCoverEditorProps | ClayNotebookCoverCardProps;

/**
 * ClayNotebookCover - A claymorphic notebook cover component.
 * Features soft shadows, puffy appearance, and customizable colors.
 * Can be used in editor mode (with input) or card mode (display only).
 */
export default function ClayNotebookCover(props: ClayNotebookCoverProps) {
  const { color = 'royal', theme = 'light' } = props;
  const colorTheme = NOTEBOOK_COLORS[color];

  if (props.mode === 'editor') {
    return <EditorCover {...props} colorTheme={colorTheme} />;
  }

  return <CardCover {...props} colorTheme={colorTheme} />;
}

// ============================================
// Editor Cover Component
// ============================================
interface EditorCoverInternalProps extends ClayNotebookCoverEditorProps {
  colorTheme: typeof NOTEBOOK_COLORS[NotebookColorKey];
}

function EditorCover({
  title,
  onTitleChange,
  onOpen,
  onColorChange,
  color = 'royal',
  colorTheme,
  theme = 'light',
}: EditorCoverInternalProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      onOpen();
    }
  };

  const handleOpenClick = () => {
    if (title.trim()) {
      onOpen();
    }
  };

  return (
    <div
      className="clay-notebook-cover clay-notebook-cover--editor"
      style={{
        '--clay-primary': colorTheme.primary,
        '--clay-secondary': colorTheme.secondary,
        '--clay-accent': colorTheme.accent,
        '--clay-text': colorTheme.text,
        '--clay-shadow': colorTheme.shadow,
      } as React.CSSProperties}
    >
      {/* 3D perspective wrapper */}
      <div className="clay-notebook-cover__3d-wrapper">
        {/* Page edges on right side */}
        <div className="clay-notebook-cover__edge-stack">
          <div className="clay-notebook-cover__edge clay-notebook-cover__edge--1" />
          <div className="clay-notebook-cover__edge clay-notebook-cover__edge--2" />
          <div className="clay-notebook-cover__edge clay-notebook-cover__edge--3" />
          <div className="clay-notebook-cover__edge clay-notebook-cover__edge--4" />
        </div>

        {/* Bottom edge for thickness */}
        <div className="clay-notebook-cover__bottom-edge" />

        {/* Main cover body */}
        <div className="clay-notebook-cover__body">
          {/* Glossy highlight overlay */}
          <div className="clay-notebook-cover__gloss" />

          {/* Decorative binding/spine */}
          <div className="clay-notebook-cover__spine">
            <div className="clay-notebook-cover__spine-line" />
            <div className="clay-notebook-cover__spine-line" />
            <div className="clay-notebook-cover__spine-line" />
          </div>

          {/* Decorative binding holes */}
          <div className="clay-notebook-cover__binding">
            <div className="clay-notebook-cover__hole" />
            <div className="clay-notebook-cover__hole" />
            <div className="clay-notebook-cover__hole" />
          </div>

          {/* Header branding - engraved Memoforge */}
          <div className="clay-notebook-cover__header">
            <div className="clay-notebook-cover__brand">
              {/* Decorative emblem */}
              <div className="clay-notebook-cover__emblem">
                <svg viewBox="0 0 40 40" fill="none" className="clay-notebook-cover__emblem-icon">
                  <path
                    d="M20 4L4 12v16l16 8 16-8V12L20 4z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    fill="none"
                  />
                  <path
                    d="M20 12v16M12 16l8 4 8-4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                  <circle cx="20" cy="12" r="2" fill="currentColor" />
                </svg>
              </div>
              <span className="clay-notebook-cover__brand-text">MEMOFORGE</span>
              <div className="clay-notebook-cover__brand-tagline">Knowledge Crafted</div>
            </div>
          </div>

          {/* Content area */}
          <div className="clay-notebook-cover__content">
            <motion.div
              className="clay-notebook-cover__inner"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {/* Decorative corner flourishes */}
              <div className="clay-notebook-cover__flourish clay-notebook-cover__flourish--tl" />
              <div className="clay-notebook-cover__flourish clay-notebook-cover__flourish--tr" />
              <div className="clay-notebook-cover__flourish clay-notebook-cover__flourish--bl" />
              <div className="clay-notebook-cover__flourish clay-notebook-cover__flourish--br" />

              {/* Title input area */}
              <div
                className={`clay-notebook-cover__label ${
                  isFocused ? 'clay-notebook-cover__label--focused' : ''
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="clay-notebook-cover__label-header">NOTEBOOK TITLE</div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Untitled Notebook"
                  className="clay-notebook-cover__input"
                  autoFocus
                />
              </div>

              {/* Color picker toggle */}
              {onColorChange && (
                <div className="clay-notebook-cover__color-picker-container">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowColorPicker(!showColorPicker);
                    }}
                    className="clay-notebook-cover__color-toggle"
                    title="Change cover color"
                  >
                    <div
                      className="clay-notebook-cover__color-preview"
                      style={{ background: colorTheme.primary }}
                    />
                    <span>Change Color</span>
                  </button>

                  {showColorPicker && (
                    <motion.div
                      className="clay-notebook-cover__color-palette"
                      initial={{ opacity: 0, scale: 0.9, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).map((colorKey) => (
                        <button
                          key={colorKey}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onColorChange(colorKey);
                            setShowColorPicker(false);
                          }}
                          className={`clay-notebook-cover__color-option ${
                            colorKey === color ? 'clay-notebook-cover__color-option--active' : ''
                          }`}
                          style={{ background: NOTEBOOK_COLORS[colorKey].primary }}
                          title={NOTEBOOK_COLORS[colorKey].name}
                        />
                      ))}
                    </motion.div>
                  )}
                </div>
              )}

              {/* Open button */}
              <motion.button
                onClick={handleOpenClick}
                disabled={!title.trim()}
                className={`clay-notebook-cover__button ${
                  title.trim() ? 'clay-notebook-cover__button--active' : ''
                }`}
                whileHover={title.trim() ? { y: -2, scale: 1.02 } : {}}
                whileTap={title.trim() ? { scale: 0.98 } : {}}
              >
                {title.trim() ? (
                  <>
                    <span>Open Notebook</span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </>
                ) : (
                  <span>Enter a title to begin</span>
                )}
              </motion.button>
            </motion.div>
          </div>

          {/* Footer with decorative line */}
          <div className="clay-notebook-cover__footer">
            <div className="clay-notebook-cover__footer-ornament" />
          </div>
        </div>
      </div>

      {/* Ambient shadow below notebook */}
      <div className="clay-notebook-cover__ambient-shadow" />
    </div>
  );
}

// ============================================
// Card Cover Component
// ============================================
interface CardCoverInternalProps extends ClayNotebookCoverCardProps {
  colorTheme: typeof NOTEBOOK_COLORS[NotebookColorKey];
}

function CardCover({
  title,
  tags = [],
  updatedAt,
  onGenerateFlashcards,
  onDelete,
  colorTheme,
}: CardCoverInternalProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div
      className="clay-notebook-cover clay-notebook-cover--card group"
      style={{
        '--clay-primary': colorTheme.primary,
        '--clay-secondary': colorTheme.secondary,
        '--clay-accent': colorTheme.accent,
        '--clay-text': colorTheme.text,
        '--clay-shadow': colorTheme.shadow,
      } as React.CSSProperties}
      whileHover={{
        y: -8,
        scale: 1.02,
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      {/* Shadow layer */}
      <div className="clay-notebook-cover__shadow" />

      {/* Page stack effect */}
      <div className="clay-notebook-cover__pages">
        <div className="clay-notebook-cover__page clay-notebook-cover__page--1" />
        <div className="clay-notebook-cover__page clay-notebook-cover__page--2" />
        <div className="clay-notebook-cover__page clay-notebook-cover__page--3" />
      </div>

      {/* Main cover body */}
      <div className="clay-notebook-cover__body clay-notebook-cover__body--card">
        {/* Decorative binding holes */}
        <div className="clay-notebook-cover__binding clay-notebook-cover__binding--card">
          <div className="clay-notebook-cover__hole clay-notebook-cover__hole--small" />
          <div className="clay-notebook-cover__hole clay-notebook-cover__hole--small" />
          <div className="clay-notebook-cover__hole clay-notebook-cover__hole--small" />
        </div>

        {/* Card header with brand */}
        <div className="clay-notebook-cover__card-header">
          <div className="clay-notebook-cover__card-emblem">
            <svg viewBox="0 0 40 40" fill="none">
              <path
                d="M20 4L4 12v16l16 8 16-8V12L20 4z"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M20 12v16M12 16l8 4 8-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <span className="clay-notebook-cover__card-brand">MEMOFORGE</span>
        </div>

        {/* Content */}
        <div className="clay-notebook-cover__card-content">
          {/* Title */}
          <div className="clay-notebook-cover__card-label">
            <h3 className="clay-notebook-cover__card-title">
              {title || 'Untitled Notebook'}
            </h3>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="clay-notebook-cover__tags">
              {tags.slice(0, 2).map((tag) => (
                <span key={tag} className="clay-notebook-cover__tag">
                  {tag}
                </span>
              ))}
              {tags.length > 2 && (
                <span className="clay-notebook-cover__tag-more">+{tags.length - 2}</span>
              )}
            </div>
          )}
        </div>

        {/* Footer with date and ornament */}
        <div className="clay-notebook-cover__card-footer">
          <div className="clay-notebook-cover__card-ornament" />
          <div className="clay-notebook-cover__date">
            <Clock01Icon className="w-3.5 h-3.5" />
            <span>{formatDate(updatedAt)}</span>
          </div>
        </div>

        {/* Hover overlay with actions */}
        <div className="clay-notebook-cover__overlay">
          <div className="clay-notebook-cover__actions">
            {onGenerateFlashcards && (
              <button
                className="clay-notebook-cover__action clay-notebook-cover__action--primary"
                title="Generate flashcards"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onGenerateFlashcards();
                }}
              >
                <GoogleGeminiIcon className="w-5 h-5" />
                <span>Flashcards</span>
              </button>
            )}
            {onDelete && (
              <button
                className="clay-notebook-cover__action clay-notebook-cover__action--danger"
                title="Delete notebook"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  onDelete();
                }}
              >
                <Delete01Icon className="w-5 h-5" />
              </button>
            )}
          </div>
          <span className="clay-notebook-cover__open-hint">Click to open</span>
        </div>
      </div>
    </motion.div>
  );
}

// Export color picker component for use elsewhere
export function NotebookColorPicker({
  value,
  onChange,
  className,
}: {
  value: NotebookColorKey;
  onChange: (color: NotebookColorKey) => void;
  className?: string;
}) {
  return (
    <div className={`clay-notebook-color-picker ${className || ''}`}>
      {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).map((colorKey) => (
        <button
          key={colorKey}
          type="button"
          onClick={() => onChange(colorKey)}
          className={`clay-notebook-color-picker__option ${
            colorKey === value ? 'clay-notebook-color-picker__option--active' : ''
          }`}
          style={{ background: NOTEBOOK_COLORS[colorKey].primary }}
          title={NOTEBOOK_COLORS[colorKey].name}
        />
      ))}
    </div>
  );
}
