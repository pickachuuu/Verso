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
        <ClayCard variant="elevated" padding="none" className="rounded-3xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 pt-6 pb-5">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-bl from-primary/15 via-primary/5 to-transparent rounded-full blur-3xl" />
            </div>

            <div className="relative z-10">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-0 right-0 p-1.5 rounded-lg text-foreground-muted hover:text-foreground hover:bg-surface-elevated/80 transition-all"
              >
                <Cancel01Icon className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-muted to-primary-muted/60 shadow-lg shadow-primary/10 flex-shrink-0">
                  <FlashcardIcon className="w-7 h-7 text-primary" />
                </div>
                <div className="min-w-0 flex-1 pr-6">
                  <h2 className="text-xl font-bold text-foreground truncate">
                    {set.title || 'Untitled Set'}
                  </h2>
                  {set.description && (
                    <p className="text-sm text-foreground-muted mt-1 line-clamp-2">
                      {set.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Mastery progress bar */}
          <div className="px-6 pb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-medium text-foreground-muted">Mastery</span>
              <span className="text-xs font-bold text-primary-light">{masteryPercentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-surface-elevated overflow-hidden border border-border/20">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-primary-light transition-all duration-500"
                style={{ width: `${masteryPercentage}%` }}
              />
            </div>
          </div>

          {/* Stats grid */}
          <div className="px-6 pb-4">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 rounded-xl bg-surface-elevated/60 animate-pulse" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-4 gap-2">
                <StatBox
                  label="New"
                  value={stats.newCount}
                  color="text-blue-400"
                  bgColor="bg-blue-500/10"
                  borderColor="border-blue-500/15"
                />
                <StatBox
                  label="Learning"
                  value={stats.learningCount}
                  color="text-orange-400"
                  bgColor="bg-orange-500/10"
                  borderColor="border-orange-500/15"
                />
                <StatBox
                  label="Review"
                  value={stats.reviewCount}
                  color="text-purple-400"
                  bgColor="bg-purple-500/10"
                  borderColor="border-purple-500/15"
                />
                <StatBox
                  label="Mastered"
                  value={stats.masteredCount}
                  color="text-emerald-400"
                  bgColor="bg-emerald-500/10"
                  borderColor="border-emerald-500/15"
                />
              </div>
            ) : null}
          </div>

          {/* Difficulty breakdown */}
          <div className="px-6 pb-4">
            <p className="text-xs font-medium text-foreground-muted mb-2">Difficulty</p>
            <div className="flex items-center gap-3">
              <DifficultyPill label="Easy" count={difficulty.easy} color="bg-emerald-500" />
              <DifficultyPill label="Medium" count={difficulty.medium} color="bg-amber-500" />
              <DifficultyPill label="Hard" count={difficulty.hard} color="bg-red-500" />
            </div>
          </div>

          {/* Due cards highlight */}
          {dueNow > 0 && (
            <div className="mx-6 mb-4 p-3 rounded-xl bg-primary/10 border border-primary/15 flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-primary/20">
                <AlertCircleIcon className="w-4 h-4 text-primary-light" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">
                  {dueNow} card{dueNow !== 1 ? 's' : ''} due for review
                </p>
                <p className="text-xs text-foreground-muted">Start a study session to keep up</p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              onClick={handleBrowse}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm border border-border/60 bg-surface-elevated/50 hover:bg-surface-elevated text-foreground transition-all"
            >
              <ViewIcon className="w-4 h-4" />
              Browse Cards
            </button>
            <button
              onClick={handleStudy}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm bg-primary text-white hover:bg-primary-dark transition-all shadow-lg shadow-primary/20"
            >
              <BookOpen01Icon className="w-4 h-4" />
              {dueNow > 0 ? `Study (${dueNow} due)` : 'Study'}
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
    <div className={`p-3 rounded-xl text-center border ${bgColor} ${borderColor}`}>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
      <p className="text-[10px] text-foreground-muted mt-0.5">{label}</p>
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
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-xs text-foreground-muted">
        {label}: <span className="font-semibold text-foreground">{count}</span>
      </span>
    </div>
  );
}
