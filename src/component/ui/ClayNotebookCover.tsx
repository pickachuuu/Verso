'use client';

import { useState, KeyboardEvent, ReactNode } from 'react';
import { motion } from 'motion/react';
import { Clock01Icon, GoogleGeminiIcon, Delete01Icon } from 'hugeicons-react';

// Predefined notebook color themes
export const NOTEBOOK_COLORS = {
  coral: {
    name: 'Coral',
    primary: '#F2C8A8',
    secondary: '#F6D7BF',
    accent: '#FBE9D8',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  ocean: {
    name: 'Ocean',
    primary: '#B7D3E6',
    secondary: '#CAE1F0',
    accent: '#E2F0F8',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  royal: {
    name: 'Royal',
    primary: '#B6C6E4',
    secondary: '#CFDBF0',
    accent: '#E7EEF9',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  sunset: {
    name: 'Sunset',
    primary: '#F2C3A0',
    secondary: '#F7D4B8',
    accent: '#FBE6D6',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  forest: {
    name: 'Forest',
    primary: '#CBE0B8',
    secondary: '#DCEACB',
    accent: '#ECF3E1',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  rose: {
    name: 'Rose',
    primary: '#EEC1D5',
    secondary: '#F4D5E4',
    accent: '#F9E7EF',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  slate: {
    name: 'Slate',
    primary: '#D1D9E2',
    secondary: '#E0E6EE',
    accent: '#EFF2F6',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
  },
  midnight: {
    name: 'Midnight',
    primary: '#C2CBD6',
    secondary: '#D3DAE3',
    accent: '#E6EBF2',
    text: '#2D2A26',
    shadow: 'rgba(60, 50, 40, 0.16)',
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
  readOnly?: boolean;
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
  readOnly = false,
}: EditorCoverInternalProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (readOnly) return;
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
      {/* Wrapper with page layers behind the cover */}
      <div style={{ position: 'relative', width: '100%', height: '100%', flex: 1, minHeight: 0 }}>
        {/* Stacked page layers — only visible on right + bottom behind the cover */}
        <div style={{
          position: 'absolute', top: 8, left: 8, right: 0, bottom: 0,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #d5d2cc, #c8c5bf)',
          boxShadow: '2px 2px 6px rgba(0,0,0,0.15)',
        }} />
        <div style={{
          position: 'absolute', top: 6, left: 6, right: 2, bottom: 2,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #dddad4, #d0cdc7)',
        }} />
        <div style={{
          position: 'absolute', top: 4, left: 4, right: 4, bottom: 4,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #e8e5e0, #dbd8d2)',
        }} />
        <div style={{
          position: 'absolute', top: 2, left: 2, right: 6, bottom: 6,
          borderRadius: 20,
          background: 'linear-gradient(135deg, #f0ede8, #e5e2dc)',
        }} />

        {/* Main cover body — sits on top, inset from right+bottom to reveal pages */}
        <div className="clay-notebook-cover__body" style={{ position: 'absolute', top: 0, left: 0, right: 8, bottom: 8, width: 'auto', height: 'auto' }}>
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

          {/* Header branding - engraved Verso */}
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
              <span className="clay-notebook-cover__brand-text">VERSO</span>
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
                  onChange={(e) => {
                    if (readOnly) return;
                    onTitleChange(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  onClick={(e) => e.stopPropagation()}
                  placeholder="Untitled Notebook"
                  className="clay-notebook-cover__input"
                  autoFocus={!readOnly}
                  readOnly={readOnly}
                />
              </div>

              {/* Color picker toggle */}
              {!readOnly && onColorChange && (
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
          <span className="clay-notebook-cover__card-brand">VERSO</span>
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
