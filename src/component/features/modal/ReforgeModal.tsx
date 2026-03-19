'use client';

import { useState, useEffect, useCallback } from 'react';
import { GeminiFlashcard, GeminiResponse } from '@/lib/gemini';
import Modal from '@/component/ui/Modal';
import { ClayCard } from '@/component/ui/Clay';
import { SparklesIcon, Cancel01Icon, Tick01Icon } from 'hugeicons-react';
import { cn } from '@/lib/utils';

export interface ReforgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string;
  existingFlashcards: GeminiFlashcard[];
  onFlashcardsGenerated?: (geminiResponse: GeminiResponse, action: 'add_more' | 'regenerate') => void;
  saving?: boolean;
}

interface ReforgeSettings {
  action: 'regenerate' | 'add_more';
  minCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  customPrompt: string;
  previewMode: boolean;
}

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'all', label: 'All levels' },
];

const MAX_FLASHCARDS = 30;
const DEFAULT_SETTINGS: ReforgeSettings = {
  action: 'add_more',
  minCount: 3,
  difficulty: 'medium',
  customPrompt: '',
  previewMode: false,
};

export default function ReforgeModal({
  isOpen,
  onClose,
  noteContent,
  existingFlashcards,
  onFlashcardsGenerated,
  saving,
}: ReforgeModalProps) {
  const [settings, setSettings] = useState<ReforgeSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeminiFlashcard[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('flashcard-reforge-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.error('Failed to parse saved settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('flashcard-reforge-settings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = useCallback((key: keyof ReforgeSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setError(null);
    setSuccess(null);
  }, []);

  const validateInputs = useCallback((): boolean => {
    if (!noteContent.trim()) {
      setError('Note content is required');
      return false;
    }

    if (noteContent.trim().length < 10) {
      setError('Note content must be at least 10 characters long');
      return false;
    }

    if (settings.minCount < 1 || settings.minCount > MAX_FLASHCARDS) {
      setError(`Minimum count must be between 1 and ${MAX_FLASHCARDS}`);
      return false;
    }

    return true;
  }, [noteContent, settings]);

  const generateFlashcards = useCallback(async () => {
    if (!validateInputs()) return;

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const apiDifficulty = settings.difficulty === 'all' ? 'medium' : settings.difficulty;

      // Create context about existing flashcards to avoid duplicates
      const existingQuestions = existingFlashcards.map(fc => fc.question).join('\n');
      let context: string | undefined = settings.action === 'add_more'
        ? `Existing flashcards:\n${existingQuestions}\n\nPlease generate ${settings.minCount} new flashcards that are different from the existing ones. Focus on topics in the note that haven't been covered yet. Analyze the note content thoroughly to identify important concepts, facts, or relationships that are missing from the existing flashcards.`
        : undefined;

      // Add custom prompt if provided
      if (settings.customPrompt.trim()) {
        const customInstruction = `\n\nAdditional Instructions: ${settings.customPrompt}`;
        context = context ? context + customInstruction : customInstruction;
      }

      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent,
          count: settings.minCount,
          difficulty: apiDifficulty,
          context,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate flashcards');
      }

      const response: GeminiResponse = await res.json();

      setGeneratedFlashcards(response.flashcards);
      setSuccess(`Successfully generated ${response.flashcards.length} new flashcards!`);

      if (settings.previewMode) {
        setShowPreview(true);
      } else {
        // Auto-save if not in preview mode - only pass the new flashcards
        const finalResponse: GeminiResponse = {
          flashcards: response.flashcards, // Only the new flashcards
          total_tokens: response.total_tokens,
          cost_cents: response.cost_cents
        };
        onFlashcardsGenerated?.(finalResponse, settings.action);
        onClose();
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  }, [settings, noteContent, validateInputs, onFlashcardsGenerated, onClose, existingFlashcards]);

  const handleSaveFlashcards = useCallback(() => {
    // Only pass the newly generated flashcards, not the combined ones
    const finalResponse: GeminiResponse = {
      flashcards: generatedFlashcards, // Only the new flashcards
      total_tokens: 0,
      cost_cents: 0
    };

    onFlashcardsGenerated?.(finalResponse, settings.action);
    setShowPreview(false);
    onClose();
  }, [generatedFlashcards, onFlashcardsGenerated, onClose, settings.action]);

  const handleCancelPreview = useCallback(() => {
    setShowPreview(false);
    setGeneratedFlashcards([]);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <ClayCard variant="elevated" padding="none" className="w-full max-w-xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden rounded-[2.5rem] flex flex-col shadow-2xl">
          <div className="px-8 py-6 bg-background-muted/5 border-b border-border/40 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20 shrink-0">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black text-foreground tracking-tight truncate">Reforge Flashcards</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1 truncate">
                    {settings.action === 'regenerate'
                      ? 'Regenerate all flashcards from your note'
                      : `Add ${settings.minCount} more flashcards`}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 rounded-2xl hover:bg-surface-elevated transition-colors"
                disabled={isLoading}
              >
                <Cancel01Icon className="w-5 h-5 text-foreground-muted" />
              </button>
            </div>
          </div>

          <div className="px-8 py-6 overflow-y-auto space-y-6 flex-1 min-h-[300px]">
            {/* Action selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Action
              </label>
              <div className="flex space-x-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="action"
                    value="add_more"
                    checked={settings.action === 'add_more'}
                    onChange={(e) => handleSettingChange('action', e.target.value)}
                    className="w-4 h-4 text-accent border-border focus:ring-accent"
                    disabled={isLoading}
                  />
                  <span className="text-sm">Add More</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="action"
                    value="regenerate"
                    checked={settings.action === 'regenerate'}
                    onChange={(e) => handleSettingChange('action', e.target.value)}
                    className="w-4 h-4 text-accent border-border focus:ring-accent"
                    disabled={isLoading}
                  />
                  <span className="text-sm">Regenerate All</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-black text-foreground">
                Number of flashcards to {settings.action === 'regenerate' ? 'generate' : 'add'}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="1"
                  max={MAX_FLASHCARDS}
                  value={settings.minCount}
                  onChange={(e) => handleSettingChange('minCount', parseInt(e.target.value) || 1)}
                  className="flex-1 accent-primary"
                  disabled={isLoading}
                />
                <span className="w-12 text-center font-black text-primary text-xl">
                  {settings.minCount}
                </span>
              </div>
            </div>

            {/* Difficulty dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Difficulty level
              </label>
              <select
                value={settings.difficulty}
                onChange={(e) => handleSettingChange('difficulty', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              >
                {DIFFICULTY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom prompt input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Custom Instructions (Optional)
              </label>
              <textarea
                value={settings.customPrompt}
                onChange={(e) => handleSettingChange('customPrompt', e.target.value)}
                placeholder="e.g., Focus on key concepts, emphasize definitions, test practical applications, include examples..."
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                rows={3}
                disabled={isLoading}
              />
              <p className="text-xs text-foreground-muted">
                Add specific instructions to customize the focus of flashcards. Examples: "Focus on key concepts", "Emphasize definitions", "Test practical applications"
              </p>
            </div>

            {/* Preview mode toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="previewMode"
                checked={settings.previewMode}
                onChange={(e) => handleSettingChange('previewMode', e.target.checked)}
                className="w-4 h-4 text-accent border-border rounded focus:ring-accent"
                disabled={isLoading}
              />
              <label htmlFor="previewMode" className="text-sm font-medium">
                Show preview before saving
              </label>
            </div>

            {/* Error display */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Success display */}
            {success && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-600">{success}</p>
              </div>
            )}
          </div>

          <div className="px-8 py-6 bg-surface border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0">
            <button
              onClick={onClose}
              disabled={isLoading || saving}
              className="px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
            >
              Cancel
            </button>
            <button
              onClick={generateFlashcards}
              disabled={isLoading || saving}
              className="px-8 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating...
                </>
              ) : saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-4 h-4" />
                  {settings.action === 'regenerate' ? 'Regenerate All' : 'Add More'}
                </>
              )}
            </button>
          </div>
        </ClayCard>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={handleCancelPreview} nested>
        <div className="w-full max-w-2xl max-h-[90vh] bg-surface overflow-hidden rounded-[2.5rem] flex flex-col shadow-2xl ring-1 ring-border/40">
          <div className="px-8 py-6 bg-background-muted/5 border-b border-border/40 shrink-0">
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {settings.action === 'regenerate' ? 'Regenerated' : 'New'} Flashcards Preview
            </h2>
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1">Review your flashcards before saving</p>
          </div>

          <div className="px-8 py-6 overflow-y-auto space-y-4 flex-1">
            {generatedFlashcards.map((flashcard, index) => (
              <div key={index} className="p-5 border-2 border-border/60 rounded-[1.5rem] bg-background-muted/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">
                    Card {index + 1}
                  </span>
                  <span className={cn(
                    "text-[10px] uppercase font-black tracking-widest px-3 py-1 rounded-full",
                    flashcard.difficulty === 'easy' && "bg-green-100 text-green-800",
                    flashcard.difficulty === 'medium' && "bg-yellow-100 text-yellow-800",
                    flashcard.difficulty === 'hard' && "bg-red-100 text-red-800"
                  )}>
                    {flashcard.difficulty}
                  </span>
                </div>
                <div className="space-y-4">
                  <div>
                    <strong className="text-xs font-black uppercase tracking-widest text-foreground">Question</strong>
                    <p className="text-base font-medium mt-1 whitespace-pre-line text-foreground">{flashcard.question}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-surface border border-border/40">
                    <strong className="text-xs font-black uppercase tracking-widest text-foreground-muted">Answer</strong>
                    <p className="text-sm mt-1 text-foreground">{flashcard.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="px-8 py-6 bg-surface border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 shrink-0">
            <button
              onClick={handleCancelPreview}
              className="px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
            >
              <Cancel01Icon className="w-4 h-4" />
              Cancel Focus
            </button>
            <button
              onClick={handleSaveFlashcards}
              className="px-8 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
            >
              <Tick01Icon className="w-4 h-4" />
              Save Flashcards
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
}