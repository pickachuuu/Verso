'use client';

import { useState, useEffect, useCallback } from 'react';
import { createGeminiService, GeminiFlashcard, GeminiResponse } from '@/lib/gemini';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
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
      const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error('Perplexity API key not configured. Please set NEXT_PUBLIC_PERPLEXITY_API_KEY in your environment variables.');
      }

      const geminiService = createGeminiService(apiKey);

      const apiDifficulty = settings.difficulty === 'all' ? 'medium' : settings.difficulty;

      // Create context about existing flashcards to avoid duplicates
      const existingQuestions = existingFlashcards.map(fc => fc.question).join('\n');
      let context = settings.action === 'add_more'
        ? `Existing flashcards:\n${existingQuestions}\n\nPlease generate ${settings.minCount} new flashcards that are different from the existing ones. Focus on topics in the note that haven't been covered yet. Analyze the note content thoroughly to identify important concepts, facts, or relationships that are missing from the existing flashcards.`
        : undefined;

      // Add custom prompt if provided
      if (settings.customPrompt.trim()) {
        const customInstruction = `\n\nAdditional Instructions: ${settings.customPrompt}`;
        context = context ? context + customInstruction : customInstruction;
      }

      const response = await geminiService.generateFlashcards(
        noteContent,
        settings.minCount,
        apiDifficulty,
        context
      );

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

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <Card.Header>
            <Card.Title>Reforge Flashcards</Card.Title>
            <Card.Description>
              {settings.action === 'regenerate'
                ? 'Regenerate all flashcards from your note'
                : `Add ${settings.minCount} more flashcards to your existing ${existingFlashcards.length} cards`
              }
            </Card.Description>
          </Card.Header>

          <Card.Content className="space-y-4">
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

            {/* Minimum count input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Number of flashcards to {settings.action === 'regenerate' ? 'generate' : 'add'}
              </label>
              <input
                type="number"
                min="1"
                max={MAX_FLASHCARDS}
                value={settings.minCount}
                onChange={(e) => handleSettingChange('minCount', parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-border rounded-md bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-accent"
                disabled={isLoading}
              />
              <p className="text-xs text-foreground-muted">
                Maximum per generate: {MAX_FLASHCARDS} cards
              </p>
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
          </Card.Content>

          <Card.Footer className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isLoading || saving}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={generateFlashcards}
              disabled={isLoading || saving}
              className="flex-1"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </div>
              ) : saving ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                settings.action === 'regenerate' ? 'Regenerate All' : 'Add More'
              )}
            </Button>
          </Card.Footer>
        </Card>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={handleCancelPreview}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <Card.Header>
                <Card.Title>
                  {settings.action === 'regenerate' ? 'Regenerated' : 'New'} Flashcards Preview
                </Card.Title>
                <Card.Description>
                  Review your flashcards before saving
                </Card.Description>
              </Card.Header>

              <Card.Content className="space-y-4">
                <div className="space-y-3">
                  {generatedFlashcards.map((flashcard, index) => (
                    <div key={index} className="p-4 border border-border rounded-lg bg-background-muted">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground-muted">
                          Card {index + 1}
                        </span>
                        <span className={cn(
                          "text-xs px-2 py-1 rounded-full",
                          flashcard.difficulty === 'easy' && "bg-green-100 text-green-800",
                          flashcard.difficulty === 'medium' && "bg-yellow-100 text-yellow-800",
                          flashcard.difficulty === 'hard' && "bg-red-100 text-red-800"
                        )}>
                          {flashcard.difficulty}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div>
                          <strong className="text-sm">Question:</strong>
                          <p className="text-sm mt-1 whitespace-pre-line">{flashcard.question}</p>
                        </div>
                        <div>
                          <strong className="text-sm">Answer:</strong>
                          <p className="text-sm mt-1">{flashcard.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>

              <Card.Footer className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancelPreview}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveFlashcards}
                  className="flex-1"
                >
                  Save Flashcards
                </Button>
              </Card.Footer>
            </Card>
          </div>
        </>
      )}
    </>
  );
}