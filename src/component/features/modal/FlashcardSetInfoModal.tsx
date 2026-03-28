'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/component/ui/Modal';
import { ClayCard } from '@/component/ui/Clay';
import { FlashcardIcon } from '@/component/icons';
import {
  ViewIcon,
  BookOpen01Icon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  SparklesIcon,
  AlertCircleIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import { FlashcardSet } from '@/lib/database.types';
import { useFlashcardActions } from '@/hook/useFlashcardActions';

interface SetStats {
  totalCards: number;
  newCount: number;
  learningCount: number;
  reviewCount: number;
  masteredCount: number;
  dueNowCount: number;
  masteryPercentage: number;
}

interface DifficultyBreakdown {
  easy: number;
  medium: number;
  hard: number;
}

export interface FlashcardSetInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  set: FlashcardSet | null;
}

export default function FlashcardSetInfoModal({
  isOpen,
  onClose,
  set,
}: FlashcardSetInfoModalProps) {
  const router = useRouter();
  const { getSetStudyStats, getFlashcardsBySet } = useFlashcardActions();

  const [stats, setStats] = useState<SetStats | null>(null);
  const [difficulty, setDifficulty] = useState<DifficultyBreakdown>({ easy: 0, medium: 0, hard: 0 });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !set) {
      setStats(null);
      setDifficulty({ easy: 0, medium: 0, hard: 0 });
      return;
    }

    const loadStats = async () => {
      setIsLoading(true);
      try {
        const [statsResult, cards] = await Promise.all([
          getSetStudyStats(set.id),
          getFlashcardsBySet(set.id),
        ]);

        if (statsResult) {
          setStats(statsResult);
        }

        // Calculate difficulty breakdown from cards
        const breakdown: DifficultyBreakdown = { easy: 0, medium: 0, hard: 0 };
        cards.forEach((card) => {
          if (card.difficulty_level === 1) breakdown.easy++;
          else if (card.difficulty_level === 3) breakdown.hard++;
          else breakdown.medium++;
        });
        setDifficulty(breakdown);
      } catch (error) {
        console.error('Error loading set stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStats();
  }, [isOpen, set, getSetStudyStats, getFlashcardsBySet]);

  if (!set) return null;

  const handleBrowse = () => {
    onClose();
    router.push(`/flashcards/${set.id}`);
  };

  const handleStudy = () => {
    onClose();
    router.push(`/flashcards/${set.id}/study`);
  };

  const masteryPercentage = stats?.masteryPercentage ?? 0;
  const dueNow = stats?.dueNowCount ?? 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="px-2 sm:px-6">
      <div className="w-full max-w-lg bg-surface border-[3px] border-foreground rounded-[2rem] shadow-2xl overflow-hidden flex flex-col relative paper-texture max-h-[85vh]">
        {/* Header */}
        <div className="relative px-5 sm:px-7 pt-7 sm:pt-9 pb-5 border-b-[3px] border-foreground/5 bg-background-muted/20">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all z-20"
          >
            <Cancel01Icon className="w-5 h-5" />
          </button>

          <div className="relative z-10 flex flex-col text-left">
            <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tighter leading-none mb-1">
              {set.title || 'Untitled Set'}
            </h2>
            {set.description && (
              <p className="text-[11px] font-bold text-foreground-muted truncate opacity-60">
                {set.description}
              </p>
            )}
          </div>
        </div>

        {/* Mastery progress bar */}
        <div className="px-5 sm:px-7 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-foreground-muted leading-none">MASTERY</span>
            <span className="text-[10px] sm:text-[11px] font-black text-primary uppercase tracking-widest bg-primary-muted px-2 py-0.5 rounded-full">{masteryPercentage}%</span>
          </div>
          <div className="h-2.5 rounded-full bg-background-muted overflow-hidden border-2 border-foreground/5 shadow-inner p-0.5">
            <div
              className="h-full rounded-full bg-foreground transition-all duration-1000 ease-out"
              style={{ width: `${masteryPercentage}%` }}
            />
          </div>
        </div>

        {/* Stats grid row */}
        <div className="px-5 sm:px-7 py-1">
          {isLoading ? (
            <div className="flex gap-1.5 text-[9px]">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex-1 h-12 rounded-lg bg-background-muted/40 animate-pulse" />
              ))}
            </div>
          ) : stats ? (
            <div className="flex gap-1.5">
              <StatBox label="NEW" value={stats.newCount} color="text-foreground" />
              <StatBox label="LEARN" value={stats.learningCount} color="text-foreground" />
              <StatBox label="REV" value={stats.reviewCount} color="text-foreground" />
              <StatBox label="MST" value={stats.masteredCount} color="text-foreground" />
            </div>
          ) : null}
        </div>

        {/* Difficulty breakdown */}
        <div className="px-5 sm:px-7 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <DifficultyPill label="EASY" count={difficulty.easy} variant="neutral" />
            <DifficultyPill label="MED" count={difficulty.medium} variant="neutral" />
            <DifficultyPill label="HARD" count={difficulty.hard} variant="neutral" />
          </div>
        </div>

        {/* Due cards highlight - Compressed */}
        {dueNow > 0 && (
          <div className="mx-6 sm:mx-8 mb-6 p-4 rounded-[1.25rem] bg-foreground text-surface flex items-center justify-between gap-4 shadow-lg hover:scale-[1.01] transition-transform">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-surface/10 flex items-center justify-center shrink-0">
                <AlertCircleIcon className="w-5 h-5 text-surface" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest leading-none">
                {dueNow} CARDS DUE NOW
              </p>
            </div>
            <BookOpen01Icon className="w-5 h-5 opacity-40 shrink-0" />
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6 sm:px-8 pb-8 flex sm:flex-row gap-3 mt-auto border-t-[3px] border-foreground/5 pt-6 bg-surface">
          <button
            onClick={handleBrowse}
            className="flex-1 flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl font-black tracking-widest text-[10px] uppercase border-[3px] border-foreground hover:bg-foreground hover:text-surface transition-all text-foreground active:scale-95"
          >
            <ViewIcon className="w-4 h-4" />
            BROWSE
          </button>
          <button
            onClick={handleStudy}
            className="flex-[1.5] flex items-center justify-center gap-2.5 px-4 py-4 rounded-xl font-black tracking-widest text-[10px] uppercase bg-foreground text-surface hover:bg-foreground/90 transition-all active:scale-95 shadow-lg"
          >
            <BookOpen01Icon className="w-4 h-4" />
            {dueNow > 0 ? `STUDY (${dueNow} DUE)` : 'START SESSION'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function StatBox({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div className="flex-1 py-4 px-2 rounded-xl flex flex-col items-center justify-center border-2 border-foreground/5 bg-background-muted/20 hover:border-foreground/20 transition-colors group">
      <p className={`text-xl font-black tracking-tighter mb-0.5 group-hover:scale-110 transition-transform ${color}`}>{value}</p>
      <p className="text-[7px] font-black tracking-widest uppercase text-foreground-muted/60 text-center leading-none">{label}</p>
    </div>
  );
}

function DifficultyPill({
  label,
  count,
  variant,
}: {
  label: string;
  count: number;
  variant: 'neutral';
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 border-foreground/10 bg-background-muted/20 font-black text-[9px] tracking-[0.2em] text-foreground-muted hover:scale-105 transition-transform cursor-default whitespace-nowrap">
      <span>{label}</span>
      <span className="opacity-50 text-[8px] ml-1">{count}</span>
    </div>
  );
}
