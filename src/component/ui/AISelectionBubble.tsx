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
} from 'hugeicons-react';

// ============================================
// Shared Rich Formatting Guide for AI
// ============================================
// This tells the AI exactly which HTML tags TipTap understands,
// so the AI can "use the toolbar" by outputting the right HTML.
export const TIPTAP_FORMATTING_GUIDE = `
You MUST return your response as rich HTML. You have access to the following formatting tools — use them liberally to make the output clear, scannable, and visually structured for a student's notebook:

STRUCTURE:
- <h2>...</h2> and <h3>...</h3> for section headings
- <p>...</p> for paragraphs
- <ul><li>...</li></ul> for bullet lists
- <ol><li>...</li></ol> for numbered lists
- <blockquote><p>...</p></blockquote> for callouts or quotes
- <hr> for horizontal dividers

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

RULES:
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
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

  if (apiKey) {
    // Use Gemini directly
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: `${systemPrompt}\n\nText:\n${selectedText}` }],
            },
          ],
          generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
        }),
      }
    );

    if (!response.ok) throw new Error(`Gemini API error: ${response.status}`);
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  // Fallback to Perplexity
  const perplexityKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
  if (!perplexityKey) throw new Error('No API key configured');

  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${perplexityKey}`,
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: selectedText },
      ],
      max_tokens: 2048,
    }),
  });

  if (!response.ok) throw new Error(`Perplexity API error: ${response.status}`);
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
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

  const handleAction = useCallback(
    async (action: AIAction) => {
      const { from, to } = editor.state.selection;
      const selectedText = editor.state.doc.textBetween(from, to, ' ');

      if (!selectedText.trim()) return;

      // Handle flashcards separately
      if (action === 'flashcards') {
        onGenerateFlashcards?.(selectedText);
        return;
      }

      const config = AI_ACTIONS[action];
      setLoading(action);
      setError(null);

      try {
        const result = await callGeminiAPI(config.systemPrompt, selectedText);

        if (!result.trim()) {
          setError('Empty response from AI');
          return;
        }

        // Strip markdown code fences if the AI wrapped it
        const cleanResult = result
          .replace(/^```html?\s*\n?/i, '')
          .replace(/\n?```\s*$/i, '')
          .trim();

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
        if (from === to) return false;
        // Don't show if selection is inside a code block
        if (ed.isActive('codeBlock')) return false;
        return true;
      }}
    >
      <div
        className="flex items-center gap-0.5 px-1.5 py-1 rounded-xl"
        style={{
          background: 'linear-gradient(160deg, rgba(28, 28, 42, 0.95) 0%, rgba(20, 20, 32, 0.98) 100%)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Gemini icon label */}
        <div className="flex items-center gap-1 px-1.5 py-1 opacity-60">
          <GoogleGeminiIcon className="w-3.5 h-3.5 text-blue-400" />
        </div>

        {/* Divider */}
        <div className="w-px h-5" style={{ background: 'rgba(255,255,255,0.1)' }} />

        {/* Action buttons */}
        {(Object.keys(AI_ACTIONS) as AIAction[]).map((action) => {
          const config = AI_ACTIONS[action];
          const isLoading = loading === action;
          const isDisabled = loading !== null;

          // Don't show flashcards button if no handler
          if (action === 'flashcards' && !onGenerateFlashcards) return null;

          return (
            <button
              key={action}
              onClick={() => handleAction(action)}
              disabled={isDisabled}
              title={config.label}
              className={`
                flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                disabled:opacity-40 disabled:cursor-not-allowed
                ${isLoading
                  ? 'bg-blue-600/30 text-blue-300'
                  : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {isLoading ? (
                <Loading03Icon className="w-3.5 h-3.5 animate-spin" />
              ) : (
                config.icon
              )}
              <span>{config.label}</span>
            </button>
          );
        })}

        {/* Error indicator */}
        {error && (
          <div className="px-2 py-1 text-[10px] text-red-400 font-medium">{error}</div>
        )}
      </div>
    </BubbleMenu>
  );
}
