'use client';

import { useState, useEffect, useCallback } from 'react';
import { createGeminiService, GeminiFlashcard, GeminiResponse } from '@/lib/gemini';
import Button from '@/component/ui/Button';
import Card from '@/component/ui/Card';
import Modal from '@/component/ui/Modal';
import { cn } from '@/lib/utils';

export interface GenerateFlashCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteContent: string;
  onFlashcardsGenerated?: (geminiResponse: GeminiResponse) => void;
  saving?: boolean;
}

interface GenerationSettings {
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
const DEFAULT_SETTINGS: GenerationSettings = {
  minCount: 5,
  difficulty: 'medium',
  customPrompt: '',
  previewMode: false,
};

export default function GenerateFlashCardModal({
  isOpen,
  onClose,
  noteContent,
  onFlashcardsGenerated,
  saving,
}: GenerateFlashCardModalProps) {
  const [settings, setSettings] = useState<GenerationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeminiFlashcard[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('flashcard-generation-settings');
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
    localStorage.setItem('flashcard-generation-settings', JSON.stringify(settings));
  }, [settings]);

  const handleSettingChange = useCallback((key: keyof GenerationSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setError(null); // Clear any previous errors
    setSuccess(null); // Clear any previous success messages
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

      // Add custom prompt if provided
      let context = undefined;
      if (settings.customPrompt.trim()) {
        context = `Additional Instructions: ${settings.customPrompt}`;
      }

      const response = await geminiService.generateFlashcards(
        noteContent,
        settings.minCount,
        apiDifficulty,
        context
      );

      setGeneratedFlashcards(response.flashcards);
      setSuccess(`Successfully generated ${response.flashcards.length} flashcards!`);

      if (settings.previewMode) {
        setShowPreview(true);
      } else {
        // Auto-save if not in preview mode
        onFlashcardsGenerated?.(response);
        onClose();
      }
    } catch (error) {
      console.error('Failed to generate flashcards:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate flashcards');
    } finally {
      setIsLoading(false);
    }
  }, [settings, noteContent, validateInputs, onFlashcardsGenerated, onClose]);

  const handleSaveFlashcards = useCallback(() => {
    // Create a GeminiResponse object from the generated flashcards
    const geminiResponse: GeminiResponse = {
      flashcards: generatedFlashcards,
      total_tokens: 0, // We don't have this info in preview mode
      cost_cents: 0
    };

    onFlashcardsGenerated?.(geminiResponse);
    setShowPreview(false);
    onClose();
  }, [generatedFlashcards, onFlashcardsGenerated, onClose]);

  const handleCancelPreview = useCallback(() => {
    setShowPreview(false);
    setGeneratedFlashcards([]);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
        <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
          <Card.Header>
            <Card.Title>Generate Flashcards from Note</Card.Title>
            <Card.Description>
              Configure your flashcard generation preferences
            </Card.Description>
          </Card.Header>

          <Card.Content className="space-y-4">
            {/* Minimum count input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Minimum number of flashcards
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
                'Generate Flashcards'
              )}
            </Button>
          </Card.Footer>
        </Card>

      {/* Preview Modal */}
      <Modal isOpen={showPreview} onClose={handleCancelPreview} nested>
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <Card.Header>
                <Card.Title>Generated Flashcards Preview</Card.Title>
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
      </Modal>
    </Modal>
  );
}
