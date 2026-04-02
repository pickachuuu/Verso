'use client';

import React, { useEffect } from 'react';
import { ClayCard } from '@/component/ui/Clay';
import {
  ArrowLeft01Icon,
  ViewIcon,
  RepeatIcon,
  Clock01Icon,
  CheckmarkCircle01Icon,
  SparklesIcon,
  Layout01Icon,
  Activity01Icon
} from 'hugeicons-react';
import { Flashcard } from '@/lib/database.types';
import { SimplifiedRating } from '@/hook/useFlashcardActions';
import { motion, AnimatePresence } from 'motion/react';

interface StudySessionViewProps {
  currentCard: Flashcard | null;
  currentIndex: number;
  totalCards: number;
  showAnswer: boolean;
  onShowAnswer: () => void;
  onReview: (rating: SimplifiedRating) => Promise<void>;
  isReviewing: boolean;
  lastReviewResult: { interval: string; wasSuccessful: boolean } | null;
  setTitle: string;
  onBack: () => void;
  progressPercent: number;
  liveAccuracyLabel: string;
  remainingCount: number;
}

export default function StudySessionView({
  currentCard,
  currentIndex,
  totalCards,
  showAnswer,
  onShowAnswer,
  onReview,
  isReviewing,
  lastReviewResult,
  setTitle,
  onBack,
  progressPercent,
  liveAccuracyLabel,
  remainingCount,
}: StudySessionViewProps) {
  const transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const };
  const surfaceColor = 'var(--surface)';
  const mutedWashColor = 'rgba(239, 230, 216, 0.4)'; // matches bg-background-muted/40 wash color
  const borderColor = 'rgba(217, 203, 185, 0.3)'; // matches border-border/30 shadow color

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBack();
      if (e.key === ' ' || e.key === 'Enter') {
        if (!showAnswer) {
          e.preventDefault();
          onShowAnswer();
        }
      }
      if (showAnswer && !isReviewing && !lastReviewResult) {
        if (e.key === '1') onReview('again');
        if (e.key === '2') onReview('hard');
        if (e.key === '3') onReview('good');
        if (e.key === '4') onReview('easy');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onBack, showAnswer, onShowAnswer, onReview, isReviewing, lastReviewResult]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!currentCard) return null;

  return (
    <div className="fixed inset-0 z-[1000] bg-white flex flex-col pt-safe pb-safe overflow-hidden select-none scrollbar-hide">

      {/* 🏷️ TOP PROGRESS BAR */}
      <div className="h-1.5 w-full bg-background-muted/30 overflow-hidden shrink-0">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          className="h-full bg-primary shadow-[0_0_10px_rgba(43,93,139,0.4)]"
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* 🏛️ HEADER */}
      <header className="shrink-0 px-6 py-4 flex items-center justify-between border-b border-border/20 bg-white z-[10]">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onBack}
            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-background-muted/30 border border-border/20 hover:bg-background-muted transition-all active:scale-90 group"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-foreground-muted group-hover:-translate-x-0.5 transition-transform" />
          </button>
          <div className="min-w-0">
            <h1 className="text-[11px] font-black text-foreground uppercase tracking-[0.2em] truncate opacity-80">{setTitle}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/10">
                {currentIndex + 1} / {totalCards}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 mr-4 border-r border-border/40 pr-6">
            <StatItem icon={Layout01Icon} label="REMAINING" value={remainingCount} />
            <StatItem icon={Activity01Icon} label="ACCURACY" value={liveAccuracyLabel} />
          </div>
          <div className="w-12 h-12 relative flex items-center justify-center shrink-0">
            <svg viewBox="0 0 48 48" className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-background-muted/30" />
              <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="4" className="text-primary transition-all duration-1000 drop-shadow-sm"
                strokeDasharray={126} strokeDashoffset={126 - (126 * progressPercent) / 100} strokeLinecap="round" />
            </svg>
            <span className="font-black text-[10px] text-primary relative z-10">{Math.round(progressPercent)}%</span>
          </div>
        </div>
      </header>

      {/* 💳 MAIN STAGE */}
      <main className="flex-1 px-4 py-4 md:py-8 flex flex-col min-h-0 bg-white relative overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 py-2 max-w-[90vw] mx-auto w-full">
            <motion.div 
              layout 
              className="w-full max-w-[min(100%,500px)] lg:max-w-3xl h-full max-h-[min(560px,75vh)] lg:max-h-[85vh] flex flex-col"
              transition={transition}
            >
              <ClayCard variant="elevated" padding="none" className="w-full h-full rounded-[3rem] border border-border/20 shadow-2xl flex flex-col overflow-hidden bg-surface will-change-transform">
                {/* QUESTION SECTION */}
                <motion.div 
                  layout
                  initial={false}
                  animate={{ 
                    backgroundColor: showAnswer ? mutedWashColor : surfaceColor,
                    borderBottomColor: showAnswer ? borderColor : 'transparent'
                  }}
                  transition={transition}
                  className={`flex flex-col p-10 lg:p-14 border-b ${showAnswer ? 'shrink-0' : 'flex-1'}`}
                >
                <div className="flex items-center gap-3 mb-6 shrink-0">
                  <div className="w-2 h-2 rounded-full bg-primary opacity-60 shadow-[0_0_8px_currentColor]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.3em] text-primary opacity-50">QUESTION</span>
                </div>
                <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto scrollbar-hide py-2 sm:py-4 min-h-0">
                  <h2 className="font-black text-foreground leading-snug text-xl sm:text-2xl lg:text-3xl whitespace-pre-line px-2">
                    {currentCard.question}
                  </h2>
                </div>
                </motion.div>

              {/* ANSWER SECTION */}
              <AnimatePresence>
                {showAnswer && (
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-1 flex flex-col min-h-0 bg-surface border-t border-border/5 overflow-hidden will-change-[transform,opacity]"
                    transition={transition}
                  >
                    <div className="flex-1 p-6 sm:p-10 lg:p-14 flex flex-col min-h-0">
                      <div className="flex items-center gap-3 mb-4 sm:mb-6 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-secondary opacity-60 shadow-[0_0_8px_currentColor]" />
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-secondary opacity-50">ANSWER</span>
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center text-center overflow-y-auto scrollbar-hide py-2 mb-2 min-h-0">
                        <p className="font-semibold text-foreground-muted leading-relaxed text-base sm:text-lg lg:text-xl whitespace-pre-line px-2">
                          {currentCard.answer}
                        </p>
                      </div>

                      {lastReviewResult && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          className={`mt-4 p-5 rounded-[2rem] flex items-center justify-center gap-3 text-[10px] font-black uppercase tracking-widest border transition-all ${lastReviewResult.wasSuccessful ? 'bg-green-500/10 border-green-500/20 text-green-700' : 'bg-red-500/10 border-red-500/20 text-red-600'
                            }`}
                        >
                          {lastReviewResult.wasSuccessful ? <CheckmarkCircle01Icon className="w-4 h-4" /> : <RepeatIcon className="w-4 h-4" />}
                          <span>{lastReviewResult.wasSuccessful ? 'Remembered' : 'Forgot'} • {lastReviewResult.interval}</span>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              </ClayCard>
            </motion.div>
          </div>
        <div className="h-6 flex items-center justify-center shrink-0">
          <p className="text-[10px] font-black text-foreground-muted/20 uppercase tracking-[0.5em]">
            {remainingCount} CARDS LEFT
          </p>
        </div>
      </main>

      {/* ⚡ ACTION BAR */}
      <footer className="shrink-0 px-4 py-4 bg-white border-t border-border/20 z-[10]">
        <div className="max-w-xl mx-auto">
          {!showAnswer ? (
            <motion.button
              whileTap={{ scale: 0.98 }} onClick={onShowAnswer}
              className="w-full h-[64px] sm:h-[72px] rounded-3xl bg-foreground text-surface font-black text-lg sm:text-xl hover:bg-foreground/90 transition-all flex items-center justify-center gap-3 active:scale-95 shadow-xl shadow-foreground/10"
            >
              <ViewIcon className="w-7 h-7" />
              <span>REVEAL ANSWER</span>
              <kbd className="hidden sm:inline-flex ml-2 px-3 py-1 bg-white/10 rounded-xl text-[10px] uppercase font-black tracking-widest text-white/50">Space</kbd>
            </motion.button>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:gap-4">
              <RatingAction onClick={() => onReview('again')} disabled={isReviewing || !!lastReviewResult} icon={<RepeatIcon className="w-5 h-5" />} label="Again" shortcut="1" color="red" />
              <RatingAction onClick={() => onReview('hard')} disabled={isReviewing || !!lastReviewResult} icon={<Clock01Icon className="w-5 h-5" />} label="Hard" shortcut="2" color="orange" />
              <RatingAction onClick={() => onReview('good')} disabled={isReviewing || !!lastReviewResult} icon={<CheckmarkCircle01Icon className="w-5 h-5" />} label="Good" shortcut="3" color="blue" />
              <RatingAction onClick={() => onReview('easy')} disabled={isReviewing || !!lastReviewResult} icon={<SparklesIcon className="w-5 h-5" />} label="Easy" shortcut="4" color="indigo" />
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════
//  HELPER COMPONENTS
// ════════════════════════════════════════════

function StatItem({ icon: Icon, label, value }: { icon: any, label: string, value: string | number }) {
  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center gap-1.5 opacity-40 mb-0.5">
        <Icon className="w-3 h-3" />
        <span className="text-[9px] font-black tracking-widest uppercase">{label}</span>
      </div>
      <span className="text-[14px] font-black text-foreground tabular-nums">{value}</span>
    </div>
  );
}

const RATING_THEMES = {
  red: { bg: 'bg-red-500 hover:bg-red-600', border: 'border-transparent', text: 'text-white', active: 'active:bg-red-700 active:scale-95' },
  orange: { bg: 'bg-orange-500 hover:bg-orange-600', border: 'border-transparent', text: 'text-white', active: 'active:bg-orange-700 active:scale-95' },
  blue: { bg: 'bg-blue-500 hover:bg-blue-600', border: 'border-transparent', text: 'text-white', active: 'active:bg-blue-700 active:scale-95' },
  indigo: { bg: 'bg-indigo-500 hover:bg-indigo-600', border: 'border-transparent', text: 'text-white', active: 'active:bg-indigo-700 active:scale-95' },
};

function RatingAction({ onClick, disabled, icon, label, shortcut, color }: { onClick: () => void, disabled: boolean, icon: React.ReactNode, label: string, shortcut: string, color: keyof typeof RATING_THEMES }) {
  const theme = RATING_THEMES[color];
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`flex flex-col items-center justify-center gap-1 p-2 h-20 sm:h-28 rounded-2xl sm:rounded-[2rem] border transition-all ${theme.bg} ${theme.border} ${theme.text} ${theme.active} shadow-lg active:scale-95 disabled:opacity-30 disabled:pointer-events-none group`}
    >
      <div className="p-1 transition-transform group-hover:scale-110">{icon}</div>
      <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-widest block">{label}</span>
      <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-current/10 rounded text-[8px] opacity-60">{shortcut}</kbd>
    </button>
  );
}
