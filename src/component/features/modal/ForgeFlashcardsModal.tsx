'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useUserNotes, Note, fetchNotePagesContent } from '@/hooks/useNotes';
import { GeminiResponse } from '@/lib/gemini';
import { ClayCard, ClayButton, ClayBadge } from '@/component/ui/Clay';
import Modal from '@/component/ui/Modal';
import {
  Cancel01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Tick01Icon,
  SparklesIcon,
  Settings02Icon,
  File01Icon,
  CheckmarkCircle01Icon,
  Loading01Icon,
  Search01Icon,
  Clock01Icon,
  SortingAZ01Icon,
  Calendar03Icon,
  Task01Icon,
} from 'hugeicons-react';
import { NotebookIcon } from '@/component/icons';
import { NOTEBOOK_COLORS, NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import { clsx } from 'clsx';

// ============================================
// Types
// ============================================

interface ForgeFlashcardsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlashcardsGenerated: (
    geminiResponse: GeminiResponse,
    noteIds: string[],
    setTitle: string
  ) => void;
  saving?: boolean;
  initialSelectedNoteIds?: string[];
}

interface FormData {
  selectedNotes: string[];
  flashcardCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'all';
  customPrompt: string;
  setTitle: string;
}

type Step = 1 | 2 | 3;

const STEPS = [
  { number: 1, title: 'Select Notes', icon: NotebookIcon },
  { number: 2, title: 'Configure', icon: Settings02Icon },
  { number: 3, title: 'Generate', icon: SparklesIcon },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', description: 'Basic facts and definitions' },
  { value: 'medium', label: 'Medium', description: 'Application of concepts' },
  { value: 'hard', label: 'Hard', description: 'Advanced analysis' },
  { value: 'all', label: 'Mixed', description: 'All difficulty levels' },
];

const DEFAULT_VALUES: FormData = {
  selectedNotes: [],
  flashcardCount: 10,
  difficulty: 'medium',
  customPrompt: '',
  setTitle: '',
};

// ============================================
// Subcomponents
// ============================================

function StepIndicator({ currentStep, steps }: { currentStep: Step; steps: typeof STEPS }) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 mb-6 sm:mb-8 overflow-x-auto scrollbar-hide py-1">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const Icon = step.icon;

        return (
          <div key={step.number} className="flex items-center shrink-0">
            <div
              className={clsx(
                'flex items-center gap-2 px-3 sm:px-4 py-2 rounded-2xl transition-all duration-300',
                isCurrent && 'clay-step-active',
                isCompleted && 'clay-step-completed',
                !isCurrent && !isCompleted && 'clay-step-inactive'
              )}
            >
              <div
                className={clsx(
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm',
                  isCurrent && 'bg-accent text-white',
                  isCompleted && 'bg-green-500 text-white',
                  !isCurrent && !isCompleted && 'bg-border text-foreground-muted'
                )}
              >
                {isCompleted ? (
                  <Tick01Icon className="w-3.5 h-3.5" />
                ) : (
                  <Icon className="w-3.5 h-3.5" />
                )}
              </div>
              <span
                className={clsx(
                  'text-[11px] sm:text-sm font-black uppercase tracking-widest',
                  isCurrent && 'text-foreground',
                  isCompleted && 'text-green-600',
                  !isCurrent && !isCompleted && 'text-foreground-muted'
                )}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  'w-4 sm:w-8 h-0.5 mx-0.5 sm:mx-1 rounded-full transition-all duration-300',
                  currentStep > step.number ? 'bg-green-500' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function NoteCard({
  note,
  isSelected,
  onToggle,
}: {
  note: Note;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const colorKey = (note.cover_color || 'royal') as NotebookColorKey;
  const color = NOTEBOOK_COLORS[colorKey] ?? NOTEBOOK_COLORS.royal;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'w-full text-left rounded-2xl transition-all duration-200 border-2 overflow-hidden',
        isSelected
          ? 'clay-note-selected border-accent bg-accent/5'
          : 'clay-note-unselected border-transparent hover:border-border'
      )}
    >
      <div className="flex items-stretch">
        {/* Color strip */}
        <div
          className="w-1.5 shrink-0 rounded-l-xl"
          style={{ background: color.primary }}
        />
        <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 flex-1 min-w-0">
          <div
            className={clsx(
              'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
              isSelected ? 'bg-accent text-white' : 'bg-surface text-foreground-muted'
            )}
          >
            {isSelected ? (
              <Tick01Icon className="w-4 h-4" />
            ) : (
              <File01Icon className="w-3 h-3" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground truncate">
              {note.title || 'Untitled Note'}
            </h4>
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {note.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="text-xs px-2 py-0.5 rounded-full bg-surface text-foreground-muted"
                  >
                    {tag}
                  </span>
                ))}
                {note.tags.length > 3 && (
                  <span className="text-xs text-foreground-muted">+{note.tags.length - 3}</span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

// ============================================
// Main Component
// ============================================

export default function ForgeFlashcardsModal({
  isOpen,
  onClose,
  onFlashcardsGenerated,
  saving,
  initialSelectedNoteIds,
}: ForgeFlashcardsModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedFlashcards, setGeneratedFlashcards] = useState<GeminiResponse | null>(null);

  const { data: notes = [], isLoading: notesLoading } = useUserNotes();

  // Note filter/sort state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<NotebookColorKey | 'all'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'oldest'>('recent');

  const filteredNotes = useMemo(() => {
    let filtered = [...notes];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (n) => n.title?.toLowerCase().includes(q) || n.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (selectedColor !== 'all') {
      filtered = filtered.filter((n) => (n.cover_color || 'royal') === selectedColor);
    }
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return filtered;
  }, [notes, searchQuery, selectedColor, sortBy]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: DEFAULT_VALUES,
  });

  const selectedNotes = watch('selectedNotes');
  const flashcardCount = watch('flashcardCount');
  const difficulty = watch('difficulty');
  const setTitle = watch('setTitle');

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset({
        ...DEFAULT_VALUES,
        selectedNotes: initialSelectedNoteIds ?? [],
      });
      setCurrentStep(1);
      setError(null);
      setGeneratedFlashcards(null);
      setSearchQuery('');
      setSelectedColor('all');
      setSortBy('recent');
    }
  }, [isOpen, reset, initialSelectedNoteIds]);

  // Auto-generate title from selected notes
  useEffect(() => {
    if (selectedNotes.length > 0 && !setTitle) {
      const selectedNoteObjects = notes.filter((n) => selectedNotes.includes(n.id));
      if (selectedNoteObjects.length === 1) {
        setValue('setTitle', selectedNoteObjects[0].title || 'Untitled Flashcards');
      } else if (selectedNoteObjects.length > 1) {
        setValue('setTitle', `Combined Notes (${selectedNoteObjects.length})`);
      }
    }
  }, [selectedNotes, notes, setValue, setTitle]);

  const toggleNoteSelection = useCallback(
    (noteId: string) => {
      const current = selectedNotes;
      if (current.includes(noteId)) {
        setValue(
          'selectedNotes',
          current.filter((id) => id !== noteId)
        );
      } else {
        setValue('selectedNotes', [...current, noteId]);
      }
    },
    [selectedNotes, setValue]
  );

  const handleNext = useCallback(() => {
    if (currentStep === 1 && selectedNotes.length === 0) {
      setError('Please select at least one note');
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 3) as Step);
  }, [currentStep, selectedNotes]);

  const handleBack = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      // Combine content from all selected notes (using note_pages content)
      const selectedNoteObjects = notes.filter((n) => selectedNotes.includes(n.id));
      const pagesContentMap = await fetchNotePagesContent(selectedNoteObjects.map((n) => n.id));

      const combinedContent = selectedNoteObjects
        .map((note) => {
          // Prefer note_pages content; fall back to legacy note.content
          const pageContent = pagesContentMap.get(note.id);
          const content = pageContent || note.content || '';
          return `# ${note.title || 'Untitled'}\n\n${content}`;
        })
        .join('\n\n---\n\n');

      const apiDifficulty = difficulty === 'all' ? 'medium' : difficulty;

      const res = await fetch('/api/ai/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteContent: combinedContent,
          count: flashcardCount,
          difficulty: apiDifficulty,
          context: watch('customPrompt') ? `Additional Instructions: ${watch('customPrompt')}` : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to generate flashcards');
      }

      const response: GeminiResponse = await res.json();
      setGeneratedFlashcards(response);
    } catch (err) {
      console.error('Error generating flashcards:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate flashcards');
    } finally {
      setIsGenerating(false);
    }
  }, [notes, selectedNotes, flashcardCount, difficulty, watch]);

  const handleConfirm = useCallback(() => {
    if (generatedFlashcards) {
      onFlashcardsGenerated(generatedFlashcards, selectedNotes, setTitle || 'Untitled Flashcards');
      onClose();
    }
  }, [generatedFlashcards, selectedNotes, setTitle, onFlashcardsGenerated, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] bg-surface border-[3px] border-foreground rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative paper-texture">
        {/* Header */}
        <div className="px-8 py-6 bg-background-muted/20 border-b-[3px] border-foreground/5 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-[1rem] bg-gradient-to-br from-primary to-primary-dark flex items-center justify-center shadow-lg shadow-primary/20 border border-primary/20 shrink-0">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="text-2xl font-black text-foreground tracking-tight truncate">Create Flashcards</h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mt-1 truncate">Create flashcards from your notes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 rounded-2xl hover:bg-surface-elevated transition-colors"
            >
              <Cancel01Icon className="w-5 h-5 text-foreground-muted" />
            </button>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="px-6 pt-6">
          <StepIndicator currentStep={currentStep} steps={STEPS} />
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1 min-h-0">
          {/* Step 1: Select Notes */}
          {currentStep === 1 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  Select notes to create flashcards from
                </h3>
                <ClayBadge variant="accent" className="text-xs">
                  {selectedNotes.length} selected
                </ClayBadge>
              </div>

              {/* Compact filter bar */}
              {notes.length > 0 && !notesLoading && (
                <div className="space-y-2">
                  {/* Search */}
                  <div className="relative">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                    <input
                      type="text"
                      placeholder="Search notes..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-border bg-surface text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-all shadow-sm"
                    />
                  </div>
                  {/* Color filter + Sort */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1 flex-wrap">
                      <button
                        onClick={() => setSelectedColor('all')}
                        className={clsx(
                          'px-2 py-1 rounded-md text-xs font-medium transition-all border',
                          selectedColor === 'all'
                            ? 'bg-background-muted text-foreground border-border'
                            : 'text-foreground-muted border-transparent hover:text-foreground hover:border-border'
                        )}
                      >
                        All
                      </button>
                      {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).map((color) => (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={clsx(
                            'w-5 h-5 rounded-md transition-all border',
                            selectedColor === color
                              ? 'border-pencil/60 ring-1.5 ring-offset-1 ring-foreground/20 scale-110'
                              : 'border-transparent hover:scale-110'
                          )}
                          style={{ background: NOTEBOOK_COLORS[color].primary }}
                          title={NOTEBOOK_COLORS[color].name}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-background-muted border border-border shrink-0">
                      {([
                        { key: 'recent' as const, icon: Clock01Icon, title: 'Recent' },
                        { key: 'alphabetical' as const, icon: SortingAZ01Icon, title: 'A–Z' },
                        { key: 'oldest' as const, icon: Calendar03Icon, title: 'Oldest' },
                      ]).map(({ key, icon: Icon, title }) => (
                        <button
                          key={key}
                          onClick={() => setSortBy(key)}
                          title={title}
                          className={clsx(
                            'p-1.5 rounded-md transition-all',
                            sortBy === key
                              ? 'bg-background text-foreground shadow-sm'
                              : 'text-foreground-muted hover:text-foreground'
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {notesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" />
                </div>
              ) : notes.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                    <NotebookIcon className="w-8 h-8 text-foreground-muted" />
                  </div>
                  <p className="text-foreground-muted">No notes found. Create some notes first!</p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-foreground-muted">No notes match your filters.</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {filteredNotes.map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isSelected={selectedNotes.includes(note.id)}
                      onToggle={() => toggleNoteSelection(note.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Configure */}
          {currentStep === 2 && (
            <div className="space-y-6">
              {/* Set Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Flashcard Set Title
                </label>
                <Controller
                  name="setTitle"
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      type="text"
                      placeholder="Enter a title for your flashcard set"
                      className="clay-input w-full px-4 py-3 rounded-xl"
                    />
                  )}
                />
              </div>

              {/* Flashcard Count */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Number of Flashcards
                </label>
                <div className="flex items-center gap-4">
                  <Controller
                    name="flashcardCount"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="range"
                        min="5"
                        max="30"
                        className="flex-1 accent-accent"
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    )}
                  />
                  <span className="w-12 text-center font-semibold text-accent">
                    {flashcardCount}
                  </span>
                </div>
              </div>

              {/* Difficulty */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">
                  Difficulty Level
                </label>
                <Controller
                  name="difficulty"
                  control={control}
                  render={({ field }) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => field.onChange(option.value)}
                          className={clsx(
                            'p-4 rounded-2xl text-left transition-all duration-200 border-2 flex items-start gap-3',
                            field.value === option.value
                              ? 'clay-option-selected border-accent bg-accent/5 shadow-xl shadow-accent/5'
                              : 'clay-option-unselected border-transparent hover:border-border bg-background-muted/30'
                          )}
                        >
                          <div className={clsx(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-border/40 transition-all shadow-sm",
                            field.value === option.value ? 'bg-accent text-white' : 'bg-white text-foreground-muted'
                          )}>
                            {option.value === 'easy' && <Clock01Icon className="w-5 h-5" />}
                            {option.value === 'medium' && <SparklesIcon className="w-5 h-5" />}
                            {option.value === 'hard' && <Task01Icon className="w-5 h-5" />}
                            {option.value === 'all' && <Settings02Icon className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <div className="font-black text-sm uppercase tracking-tight">{option.label}</div>
                            <div className="text-[11px] text-foreground-muted leading-relaxed mt-0.5">{option.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                />
              </div>

              {/* Custom Prompt */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Custom Instructions (Optional)
                </label>
                <Controller
                  name="customPrompt"
                  control={control}
                  render={({ field }) => (
                    <textarea
                      {...field}
                      placeholder="e.g., Make them multiple choice, focus on key definitions..."
                      className="clay-input w-full px-4 py-3 rounded-xl resize-none"
                      rows={3}
                    />
                  )}
                />
              </div>
            </div>
          )}

          {/* Step 3: Generate & Preview */}
          {currentStep === 3 && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="clay-summary p-4 rounded-2xl space-y-3">
                <h4 className="font-semibold text-foreground">Generation Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-foreground-muted">Notes:</span>
                    <span className="ml-2 font-medium">{selectedNotes.length} selected</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Count:</span>
                    <span className="ml-2 font-medium">{flashcardCount} cards</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Difficulty:</span>
                    <span className="ml-2 font-medium capitalize">{difficulty}</span>
                  </div>
                  <div>
                    <span className="text-foreground-muted">Title:</span>
                    <span className="ml-2 font-medium truncate">{setTitle || 'Untitled'}</span>
                  </div>
                </div>
              </div>

              {/* Generate Button or Results */}
              {!generatedFlashcards && !isGenerating && (
                <div className="text-center py-8">
                  <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary-dark/20 flex items-center justify-center mx-auto mb-4">
                    <SparklesIcon className="w-10 h-10 text-accent" />
                  </div>
                  <p className="text-foreground-muted mb-6">
                    Ready to forge your flashcards? Click the button below to start!
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="px-8 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase bg-primary text-white hover:bg-primary-dark transition-all shadow-sm flex items-center justify-center gap-2 mx-auto"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    Generate Flashcards
                  </button>
                </div>
              )}

              {/* Loading State */}
              {isGenerating && (
                <div className="text-center py-12">
                  <div className="relative w-20 h-20 mx-auto mb-4">
                    <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-primary to-primary-dark animate-pulse" />
                    <div className="absolute inset-2 rounded-2xl bg-surface-elevated flex items-center justify-center">
                      <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
                    </div>
                  </div>
                  <h4 className="font-semibold text-foreground mb-1">Forging Flashcards...</h4>
                  <p className="text-sm text-foreground-muted">
                    AI is analyzing your notes and creating flashcards
                  </p>
                </div>
              )}

              {/* Success State */}
              {generatedFlashcards && (
                <div className="space-y-4">
                  <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                      <CheckmarkCircle01Icon className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">
                      {generatedFlashcards.flashcards.length} Flashcards Generated!
                    </h4>
                    <p className="text-sm text-foreground-muted">
                      Click confirm to save them to your collection
                    </p>
                  </div>

                  {/* Preview Cards */}
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {generatedFlashcards.flashcards.slice(0, 5).map((card, index) => (
                      <div
                        key={index}
                        className="p-3 rounded-xl bg-surface border border-border"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full">
                            #{index + 1}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground line-clamp-2">
                              {card.question}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {generatedFlashcards.flashcards.length > 5 && (
                      <p className="text-center text-sm text-foreground-muted">
                        +{generatedFlashcards.flashcards.length - 5} more flashcards
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-surface border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          <div className="flex justify-start order-2 sm:order-1">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isGenerating || saving}
                className="w-full sm:w-auto px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
              >
                <ArrowLeft01Icon className="w-4 h-4" />
                Back
              </button>
            )}
          </div>

          <div className="flex gap-3 order-1 sm:order-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating || saving}
              className="flex-[1] sm:flex-none px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase border-2 border-border/60 hover:bg-background-muted transition-all disabled:opacity-50 text-foreground flex items-center justify-center gap-2"
            >
              Cancel
            </button>

            {currentStep < 3 && (
              <button
                type="button"
                onClick={handleNext}
                disabled={currentStep === 1 && selectedNotes.length === 0}
                className="flex-[2] sm:flex-none px-8 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                Continue
                <ArrowRight01Icon className="w-4 h-4" />
              </button>
            )}

            {currentStep === 3 && generatedFlashcards && (
              <button
                type="button"
                onClick={handleConfirm}
                disabled={saving}
                className="flex-[2] sm:flex-none px-8 py-4 rounded-[2rem] font-black tracking-widest text-[11px] uppercase bg-primary text-white hover:bg-primary-dark transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Tick01Icon className="w-4 h-4 mr-2" />
                    Confirm & Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
