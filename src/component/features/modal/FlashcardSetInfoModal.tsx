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
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="w-full max-w-lg">
        <ClayCard variant="elevated" padding="none" className="rounded-[2.5rem] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="relative px-8 pt-8 pb-6 bg-background-muted/5 border-b border-border/40">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-16 -right-16 w-64 h-64 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute -top-2 -right-2 p-3 rounded-2xl text-foreground-muted hover:text-foreground hover:bg-surface-elevated/80 transition-all font-black"
              >
                <Cancel01Icon className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-5">
                <div className="p-4 rounded-[1.5rem] bg-gradient-to-br from-primary-muted to-primary-muted/60 shadow-[0_4px_20px_rgba(43,93,139,0.2)] flex-shrink-0 border border-primary/20">
                  <FlashcardIcon className="w-8 h-8 text-primary" />
                </div>
                <div className="min-w-0 flex-1 pr-10">
                  <h2 className="text-2xl font-black text-foreground tracking-tight line-clamp-2 leading-tight">
                    {set.title || 'Untitled Set'}
                  </h2>
                  {set.description && (
                    <p className="text-sm font-medium text-foreground-muted mt-2 line-clamp-2 leading-snug">
                      {set.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mastery progress bar */}
          <div className="px-8 py-6 pb-2">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-foreground-muted">MASTERY</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary-light">{masteryPercentage}%</span>
            </div>
            <div className="h-3 rounded-full bg-surface-elevated overflow-hidden border border-border/40">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-700 shadow-[0_0_10px_rgba(43,93,139,0.5)]"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="px-8 py-4">
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-20 rounded-[1.5rem] bg-surface-elevated/60 animate-pulse border-2 border-border/40" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  label="NEW"
                  value={stats.newCount}
                  color="text-blue-500"
                  bgColor="bg-blue-500/5"
                  borderColor="border-blue-500/20"
                />
                <StatBox
                  label="LEARNING"
                  value={stats.learningCount}
                  color="text-orange-500"
                  bgColor="bg-orange-500/5"
                  borderColor="border-orange-500/20"
                />
                <StatBox
                  label="REVIEW"
                  value={stats.reviewCount}
                  color="text-purple-500"
                  bgColor="bg-purple-500/5"
                  borderColor="border-purple-500/20"
                />
                <StatBox
                  label="MASTERED"
                  value={stats.masteredCount}
                  color="text-emerald-500"
                  bgColor="bg-emerald-500/5"
                  borderColor="border-emerald-500/20"
                />
              </div>
            ) : null}
          </div>

          {/* Difficulty breakdown */}
          <div className="px-8 pb-6">
            <p className="text-[10px] font-black uppercase tracking-widest text-foreground-muted mb-3">DIFFICULTY</p>
            <div className="flex flex-wrap items-center gap-3">
              <DifficultyPill label="EASY" count={difficulty.easy} color="text-emerald-600 bg-emerald-500/10 border-emerald-500/20" />
              <DifficultyPill label="MEDIUM" count={difficulty.medium} color="text-amber-600 bg-amber-500/10 border-amber-500/20" />
              <DifficultyPill label="HARD" count={difficulty.hard} color="text-red-600 bg-red-500/10 border-red-500/20" />
            </div>
          </div>

          {/* Due cards highlight */}
          {dueNow > 0 && (
            <div className="mx-8 mb-6 p-4 rounded-[1.5rem] bg-primary/10 border-2 border-primary/20 flex items-center gap-4">
              <div className="p-2 sm:p-3 rounded-xl bg-primary/20 shrink-0">
                <AlertCircleIcon className="w-5 h-5 text-primary-light" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-black text-foreground tracking-tight leading-snug">
                  {dueNow} CARD{dueNow !== 1 ? 'S' : ''} DUE FOR REVIEW
                </p>
                <p className="text-[11px] font-bold text-foreground-muted truncate uppercase tracking-wider mt-0.5">Start a study session to keep up</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-8 pb-8 flex flex-col sm:flex-row gap-4 border-t border-border/40 pt-6">
            <button
              onClick={handleBrowse}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase border-2 border-border/60 hover:bg-background-muted transition-all text-foreground order-2 sm:order-1 active:scale-[0.98]"
            >
              <ViewIcon className="w-4 h-4" />
              Browse Cards
            </button>
            <button
              onClick={handleStudy}
              className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 rounded-[2rem] font-black tracking-widest text-[11px] sm:text-xs uppercase border-2 border-transparent bg-primary text-white hover:bg-primary-dark transition-all order-1 sm:order-2 active:scale-[0.98]"
            >
              <BookOpen01Icon className="w-4 h-4" />
              {dueNow > 0 ? `STUDY (${dueNow} DUE)` : 'STUDY SESSION'}
            </button>
          </div>
        </ClayCard>
      </div>
    </Modal>
  );
}

function StatBox({
  label,
  value,
  color,
  bgColor,
  borderColor,
}: {
  label: string;
  value: number;
  color: string;
  bgColor: string;
  borderColor: string;
}) {
  return (
    <div className={`p-4 rounded-[1.5rem] flex flex-col items-center justify-center border-2 ${bgColor} ${borderColor}`}>
      <p className={`text-2xl font-black tracking-tight ${color}`}>{value}</p>
      <p className="text-[9px] font-black tracking-widest uppercase text-foreground-muted mt-1 opacity-70">{label}</p>
    </div>
  );
}

function DifficultyPill({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${color}`}>
      <span className="text-[10px] font-black tracking-wider">
        {label} <span className="opacity-60 ml-1 font-bold">{count}</span>
      </span>
    </div>
  );
}
