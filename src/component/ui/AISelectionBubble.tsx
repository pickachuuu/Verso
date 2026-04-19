'use client';

import { BubbleMenu } from '@tiptap/react/menus';
import { Editor } from '@tiptap/react';
import { useState, useCallback } from 'react';
import {
  GoogleGeminiIcon,
  Loading03Icon,
  BookOpen01Icon,
  TextWrapIcon,
  SummationCircleIcon,
  StarIcon,
  CheckmarkCircle03Icon,
  FlashIcon,
  Copy01Icon,
} from 'hugeicons-react';

// ============================================
// Shared Rich Formatting Guide for AI
// ============================================
// This tells the AI exactly which HTML tags TipTap understands,
// so the AI can "use the toolbar" by outputting the right HTML.
export const TIPTAP_FORMATTING_GUIDE = `
You MUST return your response as rich HTML. You have access to the following formatting tools — use them to make the output clear, scannable, and visually structured for a student's notebook:

STRUCTURE:
- <h2>...</h2> and <h3>...</h3> for section headings
- <p>...</p> for paragraphs
- <ul><li>...</li></ul> for bullet lists
- <ol><li>...</li></ol> for numbered lists
- <blockquote><p>...</p></blockquote> for callouts or quotes
- <hr> for horizontal dividers (use VERY sparingly — at most once)

TEXT FORMATTING:
- <strong>...</strong> for bold (key terms, definitions)
- <em>...</em> for italic (emphasis, examples)
- <u>...</u> for underline (important points)
- <s>...</s> for strikethrough

HIGHLIGHTS (use colored backgrounds to visually categorize):
- <mark data-color="#fef08a" style="background-color: #fef08a">...</mark> — Yellow highlight (key definitions)
- <mark data-color="#bbf7d0" style="background-color: #bbf7d0">...</mark> — Green highlight (examples, correct info)
- <mark data-color="#bfdbfe" style="background-color: #bfdbfe">...</mark> — Blue highlight (concepts, theories)
- <mark data-color="#e9d5ff" style="background-color: #e9d5ff">...</mark> — Purple highlight (formulas, rules)
- <mark data-color="#fbcfe8" style="background-color: #fbcfe8">...</mark> — Pink highlight (warnings, exceptions)
- <mark data-color="#fed7aa" style="background-color: #fed7aa">...</mark> — Orange highlight (tips, mnemonics)

TEXT COLORS (use sparingly for emphasis):
- <span style="color: #ef4444">...</span> — Red text (critical warnings)
- <span style="color: #22c55e">...</span> — Green text (positive, correct)
- <span style="color: #3b82f6">...</span> — Blue text (references, links)
- <span style="color: #a855f7">...</span> — Purple text (technical terms)

CODE:
- <code>...</code> for inline code
- <pre><code>...</code></pre> for code blocks

CRITICAL SPACE-SAVING RULES (YOU MUST FOLLOW THESE):
- NEVER output empty paragraphs like <p></p> or <p><br></p> or <p>&nbsp;</p>.
- NEVER add blank lines or spacing between elements — go directly from one element to the next.
- NEVER use multiple <hr> tags. Use at most ONE <hr> in the entire response, and only when absolutely necessary.
- NEVER use <br> tags for spacing. Each paragraph must contain actual content.
- Keep paragraphs SHORT and DENSE — prefer bullet lists over long paragraphs.
- Combine related points into single list items instead of spreading them across many items.
- Use FEWER headings — only use <h2> for major sections, <h3> sparingly. Not every point needs its own heading.
- When using lists, keep them tight with no extra wrapper elements or spacing.
- Aim for MAXIMUM information density — the content goes into a notebook with limited page space.
- Return ONLY valid HTML, no markdown, no wrapping code blocks, no backticks.
- Use formatting purposefully — highlight key terms, bold definitions, use lists for steps.
- Make content look like a well-formatted notebook page a student would be proud of.
`.trim();

// ============================================
// AI Action Types & Config
// ============================================
type AIAction = 'explain' | 'expand' | 'summarize' | 'simplify' | 'fix_grammar' | 'flashcards';

interface AIActionConfig {
  label: string;
  icon: React.ReactNode;
  systemPrompt: string;
  mode: 'insert_below' | 'replace' | 'flashcards';
}

const AI_ACTIONS: Record<AIAction, AIActionConfig> = {
  explain: {
    label: 'Explain',
    icon: <BookOpen01Icon className="w-3.5 h-3.5" />,
    systemPrompt:
      `You are a helpful tutor. Explain the following text clearly and concisely so a student can understand it. Use simple language and provide examples if helpful.\n\n${TIPTAP_FORMATTING_GUIDE}`,
    mode: 'insert_below',
  },
  expand: {
    label: 'Expand',
    icon: <TextWrapIcon className="w-3.5 h-3.5" />,
    systemPrompt:
      `You are a study assistant. Expand on the following text with more detail, examples, and context. Make it comprehensive for studying.\n\n${TIPTAP_FORMATTING_GUIDE}`,
    mode: 'insert_below',
  },
  summarize: {
    label: 'Summarize',
    icon: <SummationCircleIcon className="w-3.5 h-3.5" />,
    systemPrompt:
      `You are a study assistant. Summarize the following text into a brief, clear summary. Keep the key points and main ideas. Use bullet points and highlights for scannability.\n\n${TIPTAP_FORMATTING_GUIDE}`,
    mode: 'insert_below',
  },
  simplify: {
    label: 'Simplify',
    icon: <StarIcon className="w-3.5 h-3.5" />,
    systemPrompt:
      `You are a study assistant. Rewrite the following text in simpler, easier-to-understand language. Keep all the key information but use shorter sentences and simpler words.\n\n${TIPTAP_FORMATTING_GUIDE}`,
    mode: 'insert_below',
  },
  fix_grammar: {
    label: 'Fix Grammar',
    icon: <CheckmarkCircle03Icon className="w-3.5 h-3.5" />,
    systemPrompt:
      `You are an expert editor. Fix all grammar, spelling, and punctuation errors in the following text. Maintain the original meaning, tone, and any existing HTML formatting. Return the corrected text as HTML.\n\n${TIPTAP_FORMATTING_GUIDE}`,
    mode: 'replace',
  },
  flashcards: {
    label: 'Flashcards',
    icon: <FlashIcon className="w-3.5 h-3.5" />,
    systemPrompt: '',
    mode: 'flashcards',
  },
};

// ============================================
// Gemini API call (reuses existing pattern)
// ============================================
async function callGeminiAPI(systemPrompt: string, selectedText: string): Promise<string> {
  const res = await fetch('/api/ai/editor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemPrompt,
      userContent: `Text:\n${selectedText}`,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'AI request failed' }));
    throw new Error(err.error || `AI error: ${res.status}`);
  }

  const data = await res.json();
  return data?.text || '';
}

// ============================================
// AI Selection Bubble Component
// ============================================
interface AISelectionBubbleProps {
  editor: Editor;
  onGenerateFlashcards?: (text: string) => void;
}

export default function AISelectionBubble({ editor, onGenerateFlashcards }: AISelectionBubbleProps) {
  const [loading, setLoading] = useState<AIAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAIOptions, setShowAIOptions] = useState(false);

  const handleAction = useCallback(
    async (action: AIAction) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');

      if (!selectedText.trim()) return;

      // Handle flashcards separately
      if (action === 'flashcards') {
        setShowAIOptions(false);
        onGenerateFlashcards?.(selectedText);
        return;
      }

      const config = AI_ACTIONS[action];
      setShowAIOptions(false);
      setLoading(action);
      setError(null);

      try {
        const result = await callGeminiAPI(config.systemPrompt, selectedText);

        if (!result.trim()) {
          setError('Empty response from AI');
          return;
        }

        // Strip markdown code fences and clean up excessive spacing
        let cleanResult = result
          .replace(/^```html?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

        // Strip empty paragraphs
        cleanResult = cleanResult.replace(/<p>\s*(<br\s*\/?>|\&nbsp;)?\s*<\/p>/gi, '');
        // Strip standalone <br> tags between block elements
        cleanResult = cleanResult.replace(/(<\/(?:p|h[1-6]|ul|ol|li|blockquote|pre|hr|div)>)\s*(?:<br\s*\/?\s*>\s*)+\s*(<(?:p|h[1-6]|ul|ol|li|blockquote|pre|hr|div)[\s>])/gi, '$1$2');
        // Collapse multiple consecutive <hr>
        cleanResult = cleanResult.replace(/(<hr\s*\/?\s*>\s*){2,}/gi, '<hr>');
        // Collapse extra whitespace between tags
        cleanResult = cleanResult.replace(/>\s{2,}</g, '><');
        cleanResult = cleanResult.trim();

        if (config.mode === 'replace') {
          // Replace selected text with AI-formatted HTML
          editor.chain().focus().deleteSelection().insertContent(cleanResult).run();
        } else {
          // Insert below selection — add a divider and label heading
          const endPos = to;
          const htmlBlock = `<hr><h3><span style="color: #3b82f6">AI ${config.label}</span></h3>${cleanResult}`;
          editor.chain().focus().setTextSelection(endPos).insertContent(htmlBlock).run();
        }
      } catch (err) {
        console.error('AI action error:', err);
        setError('AI request failed');
      } finally {
        setLoading(null);
      }
    },
    [editor, onGenerateFlashcards]
  );

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: 'top',
      }}
      shouldShow={({ editor: ed }: { editor: Editor }) => {
        // Only show when there's a text selection (not empty)
        const { from, to } = ed.state.selection;
        if (from === to) {
          return false;
        }
        // Don't show if selection is inside a code block
        if (ed.isActive('codeBlock')) return false;
        return true;
      }}
    >
      <div className="relative flex flex-col items-center">
        <div
          className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl"
          style={{
            background: 'linear-gradient(160deg, rgba(28, 28, 42, 0.95) 0%, rgba(20, 20, 32, 0.98) 100%)',
            backdropFilter: 'blur(16px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Basic Actions */}
          <button
            onClick={() => editor.chain().focus().selectAll().run()}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-gray-300 hover:bg-white/10 hover:text-white shrink-0"
          >
            <span>Select All</span>
          </button>

          <button
            onClick={() => {
              const { from, to } = editor.state.selection;
              const text = editor.state.doc.textBetween(from, to, ' ');
              navigator.clipboard.writeText(text);
            }}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-gray-300 hover:bg-white/10 hover:text-white shrink-0"
          >
            <Copy01Icon className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>

          <div className="w-px h-5 mx-1 shrink-0" style={{ background: 'rgba(255,255,255,0.1)' }} />

          {/* AI Assist Toggle */}
          <button
            onClick={() => !loading && setShowAIOptions(!showAIOptions)}
            disabled={loading !== null}
            className={`
              flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0
              ${showAIOptions || loading ? 'bg-white/10 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}
              disabled:opacity-70 disabled:cursor-wait
            `}
          >
            {loading ? (
              <Loading03Icon className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            ) : (
              <GoogleGeminiIcon className="w-3.5 h-3.5 text-blue-400" />
            )}
            <span>{loading ? 'AI Thinking...' : 'AI Assist'}</span>
          </button>

          {/* Error indicator inline if present */}
          {error && (
            <div className="ml-1 px-2 py-1 text-[10px] text-red-400 font-medium bg-red-500/10 rounded-lg">Error</div>
          )}
        </div>

        {/* AI Actions Dropdown */}
        {showAIOptions && (
          <div
            className="absolute top-full mt-2 w-48 flex flex-col gap-0.5 p-1.5 rounded-xl z-[999] origin-top animate-in zoom-in-95 duration-100"
            style={{
              background: 'linear-gradient(160deg, rgba(28, 28, 42, 0.95) 0%, rgba(20, 20, 32, 0.98) 100%)',
              backdropFilter: 'blur(16px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            {(Object.keys(AI_ACTIONS) as AIAction[]).map((action) => {
              const config = AI_ACTIONS[action];

              if (action === 'flashcards' && !onGenerateFlashcards) return null;

              return (
                <button
                  key={action}
                  onClick={() => handleAction(action)}
                  className="flex items-center gap-2.5 px-3 py-2 w-full rounded-lg text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white transition-all text-left"
                >
                  <span className="opacity-70 text-blue-400">{config.icon}</span>
                  <span>{config.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </BubbleMenu>
  );
}
