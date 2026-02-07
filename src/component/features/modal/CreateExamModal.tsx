'use client';

import { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useUserNotes, Note } from '@/hooks/useNotes';
import { createGeminiService, ExamGenerationResponse, ExamGenerationConfig } from '@/lib/gemini';
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
  Clock01Icon,
  MultiplicationSignIcon
} from 'hugeicons-react';
import { NotebookIcon, ExamIcon } from '@/component/icons';
import { clsx } from 'clsx';

// ============================================
// Types
// ============================================

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExamGenerated: (
    examResponse: ExamGenerationResponse,
    noteIds: string[],
    title: string,
    config: ExamFormConfig
  ) => void;
  saving?: boolean;
}

interface ExamFormConfig {
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  timeLimitEnabled: boolean;
  timeLimitMinutes: number;
  includeMultipleChoice: boolean;
  includeIdentification: boolean;
  includeEssay: boolean;
  multipleChoiceCount: number;
  identificationCount: number;
  essayCount: number;
  customInstructions: string;
}

interface FormData {
  selectedNotes: string[];
  examTitle: string;
  config: ExamFormConfig;
}

type Step = 1 | 2 | 3;

const STEPS = [
  { number: 1, title: 'Select Notes', icon: NotebookIcon },
  { number: 2, title: 'Configure', icon: Settings02Icon },
  { number: 3, title: 'Generate', icon: SparklesIcon },
];

const DIFFICULTY_OPTIONS = [
  { value: 'easy', label: 'Easy', description: 'Basic facts and recall' },
  { value: 'medium', label: 'Medium', description: 'Application of concepts' },
  { value: 'hard', label: 'Hard', description: 'Advanced analysis' },
  { value: 'mixed', label: 'Mixed', description: 'All difficulty levels' },
];

const DEFAULT_CONFIG: ExamFormConfig = {
  difficulty: 'medium',
  timeLimitEnabled: false,
  timeLimitMinutes: 30,
  includeMultipleChoice: true,
  includeIdentification: true,
  includeEssay: false,
  multipleChoiceCount: 5,
  identificationCount: 5,
  essayCount: 2,
  customInstructions: '',
};

const DEFAULT_VALUES: FormData = {
  selectedNotes: [],
  examTitle: '',
  config: DEFAULT_CONFIG,
};

// ============================================
// Subcomponents
// ============================================

function StepIndicator({ currentStep, steps }: { currentStep: Step; steps: typeof STEPS }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((step, index) => {
        const isCompleted = currentStep > step.number;
        const isCurrent = currentStep === step.number;
        const Icon = step.icon;

        return (
          <div key={step.number} className="flex items-center">
            <div
              className={clsx(
                'flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300',
                isCurrent && 'clay-step-active',
                isCompleted && 'clay-step-completed',
                !isCurrent && !isCompleted && 'clay-step-inactive'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-300',
                  isCurrent && 'bg-secondary text-white',
                  isCompleted && 'bg-green-500 text-white',
                  !isCurrent && !isCompleted && 'bg-border text-foreground-muted'
                )}
              >
                {isCompleted ? (
                  <Tick01Icon className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
              </div>
              <span
                className={clsx(
                  'text-sm font-medium hidden sm:block',
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
                  'w-8 h-0.5 mx-1 rounded-full transition-all duration-300',
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
  return (
    <button
      type="button"
      onClick={onToggle}
      className={clsx(
        'w-full text-left p-4 rounded-2xl transition-all duration-200 border-2',
        isSelected
          ? 'clay-note-selected border-secondary bg-secondary/5'
          : 'clay-note-unselected border-transparent hover:border-border'
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={clsx(
            'w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-all duration-200',
            isSelected ? 'bg-secondary text-white' : 'bg-surface text-foreground-muted'
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
    </button>
  );
}

function QuestionTypeToggle({
  label,
  description,
  enabled,
  onToggle,
  count,
  onCountChange,
  minCount = 1,
  maxCount = 20,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  count: number;
  onCountChange: (value: number) => void;
  minCount?: number;
  maxCount?: number;
}) {
  return (
    <div className={clsx(
      'p-4 rounded-xl border-2 transition-all duration-200',
      enabled ? 'border-secondary bg-secondary/5' : 'border-border'
    )}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onToggle}
            className={clsx(
              'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
              enabled ? 'bg-secondary text-white' : 'bg-border'
            )}
          >
            {enabled && <Tick01Icon className="w-4 h-4" />}
          </button>
          <div>
            <span className="font-medium text-foreground">{label}</span>
            <p className="text-xs text-foreground-muted">{description}</p>
          </div>
        </div>
      </div>

      {enabled && (
        <div className="mt-3 flex items-center gap-3">
          <span className="text-sm text-foreground-muted">Count:</span>
          <input
            type="range"
            min={minCount}
            max={maxCount}
            value={count}
            onChange={(e) => onCountChange(parseInt(e.target.value))}
            className="flex-1 accent-secondary"
          />
          <span className="w-8 text-center font-semibold text-secondary">{count}</span>
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Component
// ============================================

export default function CreateExamModal({
  isOpen,
  onClose,
  onExamGenerated,
  saving,
}: CreateExamModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedExam, setGeneratedExam] = useState<ExamGenerationResponse | null>(null);

  const { data: notes = [], isLoading: notesLoading } = useUserNotes();

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
  const examTitle = watch('examTitle');
  const config = watch('config');

  // Calculate total questions
  const totalQuestions =
    (config.includeMultipleChoice ? config.multipleChoiceCount : 0) +
    (config.includeIdentification ? config.identificationCount : 0) +
    (config.includeEssay ? config.essayCount : 0);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      reset(DEFAULT_VALUES);
      setCurrentStep(1);
      setError(null);
      setGeneratedExam(null);
    }
  }, [isOpen, reset]);

  // Auto-generate title from selected notes
  useEffect(() => {
    if (selectedNotes.length > 0 && !examTitle) {
      const selectedNoteObjects = notes.filter((n) => selectedNotes.includes(n.id));
      if (selectedNoteObjects.length === 1) {
        setValue('examTitle', `${selectedNoteObjects[0].title || 'Untitled'} Exam`);
      } else if (selectedNoteObjects.length > 1) {
        setValue('examTitle', `Combined Exam (${selectedNoteObjects.length} notes)`);
      }
    }
  }, [selectedNotes, notes, setValue, examTitle]);

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
    if (currentStep === 2 && totalQuestions === 0) {
      setError('Please select at least one question type');
      return;
    }
    setError(null);
    setCurrentStep((prev) => Math.min(prev + 1, 3) as Step);
  }, [currentStep, selectedNotes, totalQuestions]);

  const handleBack = useCallback(() => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1) as Step);
  }, []);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const apiKey = process.env.NEXT_PUBLIC_PERPLEXITY_API_KEY;
      if (!apiKey) {
        throw new Error('Perplexity API key not configured');
      }

      // Combine content from all selected notes
      const selectedNoteObjects = notes.filter((n) => selectedNotes.includes(n.id));
      const combinedContent = selectedNoteObjects
        .map((note) => `# ${note.title || 'Untitled'}\n\n${note.content}`)
        .join('\n\n---\n\n');

      const geminiService = createGeminiService(apiKey);

      const generationConfig: ExamGenerationConfig = {
        multipleChoiceCount: config.includeMultipleChoice ? config.multipleChoiceCount : 0,
        identificationCount: config.includeIdentification ? config.identificationCount : 0,
        essayCount: config.includeEssay ? config.essayCount : 0,
        difficulty: config.difficulty,
        customInstructions: config.customInstructions || undefined,
      };

      const response = await geminiService.generateExamQuestions(combinedContent, generationConfig);
      setGeneratedExam(response);
    } catch (err) {
      console.error('Error generating exam:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate exam');
    } finally {
      setIsGenerating(false);
    }
  }, [notes, selectedNotes, config]);

  const handleConfirm = useCallback(() => {
    if (generatedExam) {
      onExamGenerated(generatedExam, selectedNotes, examTitle || 'Untitled Exam', config);
      onClose();
    }
  }, [generatedExam, selectedNotes, examTitle, config, onExamGenerated, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="clay-modal w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl flex flex-col">
          {/* Header */}
          <div className="clay-modal-header px-6 py-5 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-secondary to-secondary-light flex items-center justify-center">
                  <ExamIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Create Exam</h2>
                  <p className="text-sm text-foreground-muted">Generate an exam from your notes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-surface transition-colors"
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">
                    Select notes to create exam from
                  </h3>
                  <ClayBadge variant="accent" className="text-xs">
                    {selectedNotes.length} selected
                  </ClayBadge>
                </div>

                {notesLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full" />
                  </div>
                ) : notes.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center mx-auto mb-4">
                      <NotebookIcon className="w-8 h-8 text-foreground-muted" />
                    </div>
                    <p className="text-foreground-muted">No notes found. Create some notes first!</p>
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {notes.map((note) => (
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
                {/* Exam Title */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Exam Title
                  </label>
                  <Controller
                    name="examTitle"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="Enter a title for your exam"
                        className="clay-input w-full px-4 py-3 rounded-xl"
                      />
                    )}
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Difficulty Level
                  </label>
                  <Controller
                    name="config.difficulty"
                    control={control}
                    render={({ field }) => (
                      <div className="grid grid-cols-2 gap-2">
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            className={clsx(
                              'p-3 rounded-xl text-left transition-all duration-200 border-2',
                              field.value === option.value
                                ? 'clay-option-selected border-secondary bg-secondary/5'
                                : 'clay-option-unselected border-transparent hover:border-border'
                            )}
                          >
                            <div className="font-medium text-sm">{option.label}</div>
                            <div className="text-xs text-foreground-muted">{option.description}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  />
                </div>

                {/* Question Types */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-foreground">
                    Question Types
                  </label>
                  <div className="space-y-3">
                    <QuestionTypeToggle
                      label="Multiple Choice"
                      description="Select the correct answer from options"
                      enabled={config.includeMultipleChoice}
                      onToggle={() => setValue('config.includeMultipleChoice', !config.includeMultipleChoice)}
                      count={config.multipleChoiceCount}
                      onCountChange={(v) => setValue('config.multipleChoiceCount', v)}
                      maxCount={20}
                    />
                    <QuestionTypeToggle
                      label="Identification"
                      description="Short answer or fill-in-the-blank"
                      enabled={config.includeIdentification}
                      onToggle={() => setValue('config.includeIdentification', !config.includeIdentification)}
                      count={config.identificationCount}
                      onCountChange={(v) => setValue('config.identificationCount', v)}
                      maxCount={20}
                    />
                    <QuestionTypeToggle
                      label="Essay"
                      description="Open-ended analysis questions (AI graded)"
                      enabled={config.includeEssay}
                      onToggle={() => setValue('config.includeEssay', !config.includeEssay)}
                      count={config.essayCount}
                      onCountChange={(v) => setValue('config.essayCount', v)}
                      maxCount={5}
                    />
                  </div>
                  <p className="text-sm text-foreground-muted">
                    Total: <span className="font-semibold text-secondary">{totalQuestions}</span> questions
                  </p>
                </div>

                {/* Time Limit */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setValue('config.timeLimitEnabled', !config.timeLimitEnabled)}
                      className={clsx(
                        'w-6 h-6 rounded-lg flex items-center justify-center transition-all',
                        config.timeLimitEnabled ? 'bg-secondary text-white' : 'bg-border'
                      )}
                    >
                      {config.timeLimitEnabled && <Tick01Icon className="w-4 h-4" />}
                    </button>
                    <div className="flex items-center gap-2">
                      <Clock01Icon className="w-4 h-4 text-foreground-muted" />
                      <span className="text-sm font-medium text-foreground">Time Limit</span>
                    </div>
                  </div>

                  {config.timeLimitEnabled && (
                    <div className="flex items-center gap-3 ml-9">
                      <Controller
                        name="config.timeLimitMinutes"
                        control={control}
                        render={({ field }) => (
                          <input
                            {...field}
                            type="number"
                            min={5}
                            max={180}
                            className="clay-input w-20 px-3 py-2 rounded-lg text-center"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 30)}
                          />
                        )}
                      />
                      <span className="text-sm text-foreground-muted">minutes</span>
                    </div>
                  )}
                </div>

                {/* Custom Instructions */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Custom Instructions (Optional)
                  </label>
                  <Controller
                    name="config.customInstructions"
                    control={control}
                    render={({ field }) => (
                      <textarea
                        {...field}
                        placeholder="e.g., Focus on chapter 3 concepts, include application-based questions..."
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
                      <span className="text-foreground-muted">Difficulty:</span>
                      <span className="ml-2 font-medium capitalize">{config.difficulty}</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Questions:</span>
                      <span className="ml-2 font-medium">{totalQuestions} total</span>
                    </div>
                    <div>
                      <span className="text-foreground-muted">Time:</span>
                      <span className="ml-2 font-medium">
                        {config.timeLimitEnabled ? `${config.timeLimitMinutes} min` : 'No limit'}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border text-sm">
                    <span className="text-foreground-muted">Breakdown:</span>
                    <div className="flex gap-3 mt-1">
                      {config.includeMultipleChoice && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs">
                          {config.multipleChoiceCount} Multiple Choice
                        </span>
                      )}
                      {config.includeIdentification && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-lg text-xs">
                          {config.identificationCount} Identification
                        </span>
                      )}
                      {config.includeEssay && (
                        <span className="px-2 py-1 bg-primary-muted text-primary-dark rounded-lg text-xs">
                          {config.essayCount} Essay
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Generate Button or Results */}
                {!generatedExam && !isGenerating && (
                  <div className="text-center py-8">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-secondary/20 to-secondary-light/20 flex items-center justify-center mx-auto mb-4">
                      <ExamIcon className="w-10 h-10 text-secondary" />
                    </div>
                    <p className="text-foreground-muted mb-6">
                      Ready to generate your exam? Click the button below to start!
                    </p>
                    <ClayButton
                      variant="primary"
                      size="lg"
                      onClick={handleGenerate}
                      className="px-8 bg-secondary hover:bg-secondary/90"
                    >
                      <SparklesIcon className="w-5 h-5 mr-2" />
                      Generate Exam
                    </ClayButton>
                  </div>
                )}

                {/* Loading State */}
                {isGenerating && (
                  <div className="text-center py-12">
                    <div className="relative w-20 h-20 mx-auto mb-4">
                      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-secondary to-secondary-light animate-pulse" />
                      <div className="absolute inset-2 rounded-2xl bg-surface-elevated flex items-center justify-center">
                        <div className="w-8 h-8 border-3 border-secondary border-t-transparent rounded-full animate-spin" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground mb-1">Generating Exam...</h4>
                    <p className="text-sm text-foreground-muted">
                      AI is analyzing your notes and creating questions
                    </p>
                  </div>
                )}

                {/* Success State */}
                {generatedExam && (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <CheckmarkCircle01Icon className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="font-semibold text-foreground mb-1">
                        {generatedExam.questions.length} Questions Generated!
                      </h4>
                      <p className="text-sm text-foreground-muted">
                        Click confirm to save your exam
                      </p>
                    </div>

                    {/* Preview Questions by Type */}
                    <div className="max-h-64 overflow-y-auto space-y-4">
                      {/* Multiple Choice Preview */}
                      {generatedExam.questions.filter(q => q.question_type === 'multiple_choice').length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            Multiple Choice
                          </h5>
                          {generatedExam.questions
                            .filter(q => q.question_type === 'multiple_choice')
                            .slice(0, 2)
                            .map((q, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-blue-50 border border-blue-100 mb-2">
                                <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Identification Preview */}
                      {generatedExam.questions.filter(q => q.question_type === 'identification').length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-green-700 mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Identification
                          </h5>
                          {generatedExam.questions
                            .filter(q => q.question_type === 'identification')
                            .slice(0, 2)
                            .map((q, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-green-50 border border-green-100 mb-2">
                                <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* Essay Preview */}
                      {generatedExam.questions.filter(q => q.question_type === 'essay').length > 0 && (
                        <div>
                          <h5 className="text-sm font-medium text-primary-dark mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary"></span>
                            Essay
                          </h5>
                          {generatedExam.questions
                            .filter(q => q.question_type === 'essay')
                            .slice(0, 1)
                            .map((q, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-primary-muted/50 border border-primary/15 mb-2">
                                <p className="text-sm text-foreground line-clamp-2">{q.question}</p>
                              </div>
                            ))}
                        </div>
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
          <div className="clay-modal-footer px-6 py-4 border-t border-border flex items-center justify-between shrink-0">
            <div>
              {currentStep > 1 && (
                <ClayButton
                  variant="ghost"
                  onClick={handleBack}
                  disabled={isGenerating || saving}
                >
                  <ArrowLeft01Icon className="w-4 h-4 mr-2" />
                  Back
                </ClayButton>
              )}
            </div>

            <div className="flex gap-2">
              <ClayButton variant="secondary" onClick={onClose} disabled={isGenerating || saving}>
                Cancel
              </ClayButton>

              {currentStep < 3 && (
                <ClayButton
                  variant="primary"
                  onClick={handleNext}
                  disabled={
                    (currentStep === 1 && selectedNotes.length === 0) ||
                    (currentStep === 2 && totalQuestions === 0)
                  }
                  className="bg-secondary hover:bg-secondary/90"
                >
                  Continue
                  <ArrowRight01Icon className="w-4 h-4 ml-2" />
                </ClayButton>
              )}

              {currentStep === 3 && generatedExam && (
                <ClayButton
                  variant="primary"
                  onClick={handleConfirm}
                  disabled={saving}
                  className="bg-secondary hover:bg-secondary/90"
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
                </ClayButton>
              )}
            </div>
          </div>
        </div>
    </Modal>
  );
}
