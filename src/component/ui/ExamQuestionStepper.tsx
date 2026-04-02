'use client';

import { useState, useCallback, useMemo, useEffect, useRef, forwardRef } from 'react';
import { clsx } from 'clsx';
import { ClayCard } from '@/component/ui/Clay';
import {
  ArrowLeft02Icon,
  ArrowRight02Icon,
  CheckmarkCircle01Icon,
  PencilEdit01Icon,
  TextIcon,
  Tick01Icon,
} from 'hugeicons-react';

// ============================================
// Types
// ============================================

export interface StepperQuestion {
  id: string;
  question_type: 'multiple_choice' | 'identification' | 'essay';
  question: string;
  options: string[] | null;
  points: number;
  position: number;
}

export interface ExamQuestionStepperProps {
  questions: StepperQuestion[];
  answers: Map<string, string>;
  onAnswerChange: (questionId: string, answer: string) => void;
  onSaveAnswer: (questionId: string, answer: string) => void;
  onSubmit: () => void;
  className?: string;
  isSubmitting?: boolean;
}

// ============================================
// Main Component
// ============================================

export default function ExamQuestionStepper({
  questions,
  answers,
  onAnswerChange,
  onSaveAnswer,
  onSubmit,
  className,
  isSubmitting,
}: ExamQuestionStepperProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);

  const answeredCount = useMemo(
    () => questions.filter((q) => answers.has(q.id) && answers.get(q.id)?.trim()).length,
    [questions, answers]
  );

  // Auto-focus input when navigating
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  // Save current answer before navigating away
  const saveCurrentAnswer = useCallback(() => {
    if (!currentQuestion) return;
    const answer = answers.get(currentQuestion.id);
    if (answer?.trim()) {
      onSaveAnswer(currentQuestion.id, answer);
    }
  }, [currentQuestion, answers, onSaveAnswer]);

  const goToNext = useCallback(() => {
    saveCurrentAnswer();
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
    }
  }, [currentIndex, totalQuestions, saveCurrentAnswer]);

  const goToPrev = useCallback(() => {
    saveCurrentAnswer();
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex, saveCurrentAnswer]);

  const goToQuestion = useCallback(
    (index: number) => {
      saveCurrentAnswer();
      setCurrentIndex(index);
    },
    [saveCurrentAnswer]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in an input/textarea
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        goToPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  if (!currentQuestion) return null;

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalQuestions - 1;
  const currentAnswer = answers.get(currentQuestion.id) || '';
  const isAnswered = currentAnswer.trim().length > 0;
  const progressPercent = totalQuestions > 0 ? ((currentIndex + 1) / totalQuestions) * 100 : 0;

  return (
    <div className={clsx('flex flex-col h-full overflow-hidden', className)}>
      {/* Progress bar */}
      <div className="shrink-0 w-full bg-background-muted rounded-full h-1.5 mb-2 sm:mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Question dots / mini nav (Optional depending on design) */}
      <div className="shrink-0 flex items-center justify-center gap-1.5 mb-2 sm:mb-6 flex-wrap opacity-50 hover:opacity-100 transition-opacity">
        {questions.map((q, idx) => {
          const qAnswered = answers.has(q.id) && answers.get(q.id)?.trim();
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q.id}
              onClick={() => goToQuestion(idx)}
              className={clsx(
                'w-6 h-6 rounded-full text-[10px] font-bold transition-all duration-200 flex items-center justify-center border-2',
                isCurrent
                  ? 'bg-foreground text-surface border-foreground scale-110 shadow-md'
                  : qAnswered
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-surface text-foreground-muted border-border'
              )}
              title={`Question ${idx + 1}${qAnswered ? ' (answered)' : ''}`}
            >
              {qAnswered && !isCurrent ? (
                <Tick01Icon className="w-3 h-3" />
              ) : (
                idx + 1
              )}
            </button>
          );
        })}
      </div>

      {/* Question card — wrapped in ClayCard for visual separation */}
      <ClayCard variant="elevated" padding="none" className="w-full flex-1 min-h-0 rounded-[2.5rem] sm:rounded-[3rem] border border-border/20 shadow-2xl flex flex-col overflow-hidden bg-surface transition-all duration-500">
        
        {/* Top Content Area: Question */}
        <div className={`transition-all duration-700 ease-[0.16,1,0.3,1] flex flex-col p-4 sm:p-6 lg:p-10 shrink-0 max-h-[30%] bg-background-muted/5 border-b border-border/10`}>
          <div className="flex items-center justify-between mb-2 sm:mb-4 lg:mb-6 shrink-0">
             <div className="flex items-center gap-3">
               <div className="w-2 h-2 rounded-full bg-primary opacity-60 shadow-[0_0_8px_currentColor]" />
               <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-primary opacity-50">QUESTION {currentIndex + 1}</span>
             </div>
             <div className="flex items-center gap-3">
                <span className="text-[10px] uppercase font-black tracking-widest text-foreground-muted px-3 py-1 bg-surface border border-border/40 rounded-xl">
                  {currentQuestion.points} PT{currentQuestion.points !== 1 ? 'S' : ''}
                </span>
             </div>
          </div>
          
          <div className="flex-1 flex text-left overflow-y-auto scrollbar-hide">
            <h2 className={clsx(
              "font-black text-foreground whitespace-pre-line leading-tight pb-2",
              currentQuestion.question.length < 60 ? "text-sm sm:text-3xl" :
              currentQuestion.question.length < 120 ? "text-xs sm:text-2xl" :
              currentQuestion.question.length < 200 ? "text-[10px] sm:text-xl" :
              "text-[9px] sm:text-lg"
            )}>
              {currentQuestion.question}
            </h2>
          </div>
        </div>

        {/* Answer area — takes remaining space, content scrolls inside */}
        <div className="flex-1 flex flex-col min-h-0 bg-surface overflow-hidden p-4 sm:p-6 lg:p-10 relative">
             <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-secondary opacity-60 shadow-[0_0_8px_currentColor]" />
                <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-[0.3em] text-secondary opacity-50">YOUR ANSWER</span>
             </div>

          <div className="flex-1 flex flex-col min-h-0 overflow-y-auto scrollbar-hide -mx-2 px-2 pb-4 pt-2">
            {currentQuestion.question_type === 'multiple_choice' && (
              <MultipleChoiceInput
                question={currentQuestion}
                value={currentAnswer}
                onChange={(answer) => onAnswerChange(currentQuestion.id, answer)}
              />
            )}
            {currentQuestion.question_type === 'identification' && (
              <IdentificationInput
                ref={inputRef as React.Ref<HTMLInputElement>}
                value={currentAnswer}
                onChange={(answer) => onAnswerChange(currentQuestion.id, answer)}
                onSubmit={goToNext}
              />
            )}
            {currentQuestion.question_type === 'essay' && (
              <EssayInput
                ref={inputRef as React.Ref<HTMLTextAreaElement>}
                value={currentAnswer}
                onChange={(answer) => onAnswerChange(currentQuestion.id, answer)}
              />
            )}
          </div>
        </div>
      </ClayCard>

      {/* ⚡ ACTION BAR (Fixed at bottom of stage) */}
      <footer className="shrink-0 mt-3 h-12 sm:h-20 w-full flex items-center justify-between gap-4 max-w-sm mx-auto">
        <button
          onClick={goToPrev}
          disabled={isFirst || isSubmitting}
          className={clsx(
            'flex-1 h-full rounded-[2.5rem] font-black text-sm sm:text-xl transition-all flex items-center justify-center gap-2 border-2',
            isFirst || isSubmitting
              ? 'border-border/40 text-foreground-muted/40 cursor-not-allowed bg-transparent'
              : 'border-border bg-surface text-foreground hover:bg-background-muted active:scale-95'
          )}
        >
          <ArrowLeft02Icon className="w-6 h-6" />
        </button>

        {isLast ? (
          <button
            onClick={() => {
              saveCurrentAnswer();
              onSubmit();
            }}
            disabled={isSubmitting}
            className="flex-[3] h-full rounded-[2.5rem] bg-foreground text-surface font-black text-sm sm:text-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            <span>SUBMIT EXAM</span>
            <CheckmarkCircle01Icon className="w-6 h-6" />
          </button>
        ) : (
          <button
            onClick={goToNext}
            disabled={isSubmitting}
            className="flex-[3] h-full rounded-[2.5rem] bg-foreground text-surface font-black text-sm sm:text-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <span>NEXT QUESTION</span>
            <ArrowRight02Icon className="w-6 h-6" />
          </button>
        )}
      </footer>
    </div>
  );
}



// ============================================
// Multiple Choice Input
// ============================================

export function MultipleChoiceInput({
  question,
  value,
  onChange,
  compact = false,
}: {
  question: StepperQuestion;
  value: string;
  onChange: (answer: string) => void;
  compact?: boolean;
}) {
  if (!question.options) return null;

  return (
    <div className={clsx("flex-1 flex flex-col min-h-0 pb-1", compact ? 'gap-1.5' : 'gap-2 sm:gap-3')}>
      {question.options.map((opt, idx) => {
        const letter = String.fromCharCode(65 + idx);
        const isSelected = value.toUpperCase() === letter;
        // Strip the "A) " prefix if present
        const optionText = opt.replace(/^[A-D]\)\s*/, '');

        return (
          <button
            key={idx}
            onClick={() => onChange(letter)}
            className={clsx(
              'w-full flex-1 flex items-center transition-all duration-200 group focus:outline-none focus:ring-4 focus:ring-primary/20 border-2 text-left',
              compact ? 'gap-3 p-2 sm:p-3 rounded-2xl min-h-[3rem]' : 'gap-2 sm:gap-4 p-2.5 sm:p-5 rounded-2xl sm:rounded-[1.5rem] min-h-0 sm:min-h-[4.5rem]',
              isSelected
                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10'
                : 'border-border bg-surface hover:border-foreground-muted/40 hover:bg-background-muted/50'
            )}
          >
            {/* Letter circle */}
            <span
              className={clsx(
                'rounded-full flex items-center justify-center font-black shrink-0 transition-all duration-200',
                compact ? 'w-8 h-8 text-[12px]' : 'w-6 h-6 sm:w-10 sm:h-10 text-[10px] sm:text-sm',
                isSelected
                  ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30'
                  : 'bg-background-muted text-foreground-muted border border-border group-hover:border-foreground-muted/30'
              )}
            >
              {letter}
            </span>

            {/* Option text */}
            <span
              className={clsx(
                'font-bold transition-colors leading-snug',
                compact ? 'text-sm md:text-base' : 'text-xs sm:text-base md:text-lg',
                isSelected ? 'text-foreground' : 'text-foreground-muted group-hover:text-foreground'
              )}
            >
              {optionText}
            </span>

            {/* Check indicator */}
            {isSelected && (
              <CheckmarkCircle01Icon className={clsx("text-primary ml-auto shrink-0 animate-in zoom-in duration-300", compact ? 'w-4 h-4' : 'w-6 h-6')} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// Identification Input
// ============================================

export const IdentificationInput = forwardRef<
  HTMLInputElement,
  {
    value: string;
    onChange: (answer: string) => void;
    onSubmit: () => void;
  }
>(function IdentificationInput({ value, onChange, onSubmit }, ref) {
  return (
    <div className="space-y-3 flex flex-col h-full p-2">
      <input
        ref={ref}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            onSubmit();
          }
        }}
        placeholder="Type your answer..."
        className="w-full px-4 py-3 sm:px-6 sm:py-5 rounded-2xl sm:rounded-[1.5rem] bg-surface border-2 border-border text-foreground placeholder:text-foreground-muted/40 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm sm:text-xl font-bold font-sans shadow-sm hover:border-foreground-muted/30"
      />
      <div className="flex justify-end">
        <p className="text-[10px] font-black tracking-widest uppercase text-foreground-muted/50">
          PRESS ENTER TO CONTINUE
        </p>
      </div>
    </div>
  );
});

// ============================================
// Essay Input
// ============================================

export const EssayInput = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (answer: string) => void;
  }
>(function EssayInput({ value, onChange }, ref) {

  return (
    <div className="flex flex-col h-full flex-1 space-y-3 p-2">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Write your comprehensive answer here..."
        className="flex-1 w-full px-4 py-3 sm:px-6 sm:py-5 rounded-2xl sm:rounded-[1.5rem] bg-surface border-2 border-border text-foreground placeholder:text-foreground-muted/40 focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all text-sm sm:text-lg font-medium shadow-sm hover:border-foreground-muted/30 resize-none"
      />
      <div className="flex items-center justify-between shrink-0">
        <p className="text-[10px] font-black tracking-widest uppercase text-foreground-muted/50">
          BE AS DETAILED AS POSSIBLE
        </p>
      </div>
    </div>
  );
});
