'use client';

import RichTextEditor, { Editor } from './RichTextEditor';

interface NotebookPageProps {
  content: string;
  onChange: (content: string) => void;
  theme: 'light' | 'dark';
  autoFocus?: boolean;
  onEditorReady?: (editor: Editor) => void;
  readOnly?: boolean;
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
}: NotebookPageProps) {
  const isDark = theme === 'dark';
  const editorBg = isDark ? '#1e1e2e' : '#fffef8';
  const lineColor = isDark ? 'rgba(157, 123, 224, 0.15)' : 'rgba(95, 108, 175, 0.12)';
  const marginColor = isDark ? 'rgba(180, 100, 100, 0.2)' : 'rgba(220, 80, 80, 0.25)';
  const handleChange = readOnly ? () => {} : onChange;

  return (
    <div
      className="w-full h-full rounded-lg relative overflow-hidden"
      style={{ backgroundColor: editorBg }}
    >
      {/* Notebook lines + red margin line — combined as background layers
          so both sides of the book use the same rendering technique */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: [
            `linear-gradient(180deg, transparent 0%, ${marginColor} 5%, ${marginColor} 95%, transparent 100%)`,
            `repeating-linear-gradient(0deg, transparent, transparent 31px, ${lineColor} 31px, ${lineColor} 32px)`,
          ].join(', '),
          backgroundSize: '2px 100%, 100% 32px',
          backgroundPosition: '71px 0, 0 23px',
          backgroundRepeat: 'no-repeat, repeat',
        }}
      />

      {/* Paper texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.02]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />

      {/* Editor */}
      <div className="relative h-full notebook-editor-wrapper">
        <RichTextEditor
          content={content}
          onChange={handleChange}
          placeholder="Start writing... Use Heading 1 (H1) for the page title"
          className="h-full"
          editorClassName="notebook-editor-content"
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
