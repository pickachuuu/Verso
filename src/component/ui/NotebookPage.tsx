'use client';

import RichTextEditor, { Editor } from './RichTextEditor';

interface NotebookPageProps {
  content: string;
  onChange: (content: string) => void;
  theme: 'light' | 'dark';
  autoFocus?: boolean;
  onEditorReady?: (editor: Editor) => void;
  readOnly?: boolean;
  simpleMode?: boolean;
}

/**
 * NotebookPage - Individual page with the lined notebook paper style
 * Toolbar is handled externally by the parent
 */
export default function NotebookPage({
  content,
  onChange,
  theme,
  autoFocus = true,
  onEditorReady,
  readOnly = false,
  simpleMode = false,
}: NotebookPageProps) {
  const isDark = theme === 'dark';
  const editorBg = isDark ? '#1e1e2e' : '#fffef8';
  const lineColor = isDark ? 'rgba(157, 123, 224, 0.15)' : 'rgba(95, 108, 175, 0.12)';
  const marginColor = isDark ? 'rgba(180, 100, 100, 0.2)' : 'rgba(220, 80, 80, 0.25)';
  const handleChange = readOnly ? () => {} : onChange;

  return (
    <div
      className="w-full h-full relative overflow-hidden bg-surface"
    >
      {/* Subtle paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Very subtle border for the "sheet" effect in larger views if needed, 
          but usually we want it to feel like the whole surface is the page */}

      {/* Editor */}
      <div className="relative h-full notebook-editor-wrapper">
        <RichTextEditor
          content={content}
          onChange={handleChange}
          placeholder="Start writing... Use Heading 1 (H1) for the page title"
          className="h-full"
          editorClassName={`notebook-editor-content ${simpleMode ? 'pb-32 sm:pb-0' : ''}`}
          autoFocus={readOnly ? false : autoFocus}
          fullscreen={false}
          hideToolbar={true}
          onEditorReady={onEditorReady}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
