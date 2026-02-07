'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard } from '@/component/ui/Clay';
import { ExamGenerationResponse } from '@/lib/gemini';
import CreateExamModal from '@/component/features/modal/CreateExamModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import {
  useExams,
  useCreateExam,
  useDeleteExam,
  ExamListItem
} from '@/hooks/useExams';
import {
  SparklesIcon,
  Clock01Icon,
  Target01Icon,
  Add01Icon,
  Delete01Icon,
  ArrowRight01Icon,
  Search01Icon,
  FilterIcon,
  GridViewIcon,
  Menu01Icon,
  SortingAZ01Icon,
  Calendar03Icon
} from 'hugeicons-react';
import { ExamIcon, ExamAddIcon } from '@/component/icons';
import HeroActionButton from '@/component/ui/HeroActionButton';
import ExamStats from '@/component/features/ExamStats';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'alphabetical' | 'oldest';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard' | 'mixed';
type QuestionTypeFilter = 'all' | 'mc' | 'id' | 'essay';

export default function ExamsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ExamListItem | null>(null);

  // Filter/Search state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilter>('all');

  // TanStack Query hooks
  const { data: exams = [], isLoading } = useExams();
  const createExamMutation = useCreateExam();
  const deleteExamMutation = useDeleteExam();

  const isSaving = createExamMutation.isPending;
  const isDeleting = deleteExamMutation.isPending;

  // Filter and sort exams
  const processedExams = useMemo(() => {
    let filtered = [...exams];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (exam) => exam.title?.toLowerCase().includes(query)
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.difficulty === difficultyFilter);
    }

    // Question type filter
    if (questionTypeFilter !== 'all') {
      filtered = filtered.filter((exam) => {
        switch (questionTypeFilter) {
          case 'mc': return exam.include_multiple_choice;
          case 'id': return exam.include_identification;
          case 'essay': return exam.include_essay;
          default: return true;
        }
      });
    }

    // Sort
    switch (sortBy) {
      case 'alphabetical':
        filtered.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    return filtered;
  }, [exams, searchQuery, difficultyFilter, questionTypeFilter, sortBy]);

  // Stats
  const totalExams = exams.length;

  const handleExamGenerated = useCallback(async (
    examResponse: ExamGenerationResponse,
    noteIds: string[],
    title: string,
    config: {
      difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
      timeLimitEnabled: boolean;
      timeLimitMinutes: number;
      includeMultipleChoice: boolean;
      includeIdentification: boolean;
      includeEssay: boolean;
    }
  ) => {
    // Prevent double-click/multiple calls
    if (isSaving) {
      console.warn('[ExamPage] Ignoring duplicate save call - already saving');
      return;
    }

    try {
      // Deduplicate questions by content (in case AI returned duplicates)
      const seenQuestions = new Set<string>();
      const uniqueQuestions = examResponse.questions.filter(q => {
        const key = `${q.question_type}:${q.question}`;
        if (seenQuestions.has(key)) {
          console.warn('[ExamPage] Removing duplicate question:', q.question.slice(0, 50));
          return false;
        }
        seenQuestions.add(key);
        return true;
      });

      console.log(`[ExamPage] Saving ${uniqueQuestions.length} unique questions (was ${examResponse.questions.length})`);

      // Create the exam set with questions using mutation
      await createExamMutation.mutateAsync({
        noteId: noteIds.length === 1 ? noteIds[0] : null,
        title,
        config: {
          difficulty: config.difficulty,
          timeLimitMinutes: config.timeLimitEnabled ? config.timeLimitMinutes : null,
          includeMultipleChoice: config.includeMultipleChoice,
          includeIdentification: config.includeIdentification,
          includeEssay: config.includeEssay,
        },
        questions: uniqueQuestions,
      });

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving exam:', error);
    }
  }, [isSaving, createExamMutation]);

  const handleDeleteClick = useCallback((exam: ExamListItem) => {
    setExamToDelete(exam);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!examToDelete) return;

    try {
      await deleteExamMutation.mutateAsync(examToDelete.id);
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (error) {
      console.error('Error deleting exam:', error);
    }
  }, [examToDelete, deleteExamMutation]);

  const handleTakeExam = useCallback((examId: string) => {
    router.push(`/exam/${examId}`);
  }, [router]);

  return (
    <div className="space-y-6">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-accent/8 border border-accent/10">
            <ExamIcon className="w-5 h-5 text-accent" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Exams
              </h1>
              <span className="text-xs font-medium text-foreground-muted bg-gray-100 px-2 py-0.5 rounded-md">
                {totalExams} exams
              </span>
            </div>
            <p className="text-sm text-foreground-muted/70 mt-0.5">
              Test your knowledge with AI-generated practice exams
            </p>
          </div>
        </div>

        <HeroActionButton
          icon={<ExamAddIcon className="w-5 h-5" />}
          onClick={() => setIsModalOpen(true)}
        >
          Create Exam
        </HeroActionButton>
      </div>

      {/* Performance Overview */}
      <ExamStats />

      {/* Search and Filters */}
      <ClayCard variant="default" padding="md" className="rounded-2xl">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground-muted" />
            <input
              type="text"
              placeholder="Search exams by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/80 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Difficulty Filter */}
            <div className="flex items-center gap-2">
              <FilterIcon className="w-4 h-4 text-foreground-muted" />
              <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
                <button
                  onClick={() => setDifficultyFilter('all')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    difficultyFilter === 'all'
                      ? 'bg-white text-foreground shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setDifficultyFilter('easy')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    difficultyFilter === 'easy'
                      ? 'bg-green-100 text-green-700 shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  Easy
                </button>
                <button
                  onClick={() => setDifficultyFilter('medium')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    difficultyFilter === 'medium'
                      ? 'bg-yellow-100 text-yellow-700 shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  Medium
                </button>
                <button
                  onClick={() => setDifficultyFilter('hard')}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    difficultyFilter === 'hard'
                      ? 'bg-red-100 text-red-700 shadow-sm'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  Hard
                </button>
              </div>
            </div>

            {/* Question Type Filter */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
              <button
                onClick={() => setQuestionTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'all'
                    ? 'bg-white text-foreground shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                All Types
              </button>
              <button
                onClick={() => setQuestionTypeFilter('mc')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'mc'
                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                MC
              </button>
              <button
                onClick={() => setQuestionTypeFilter('id')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'id'
                    ? 'bg-green-100 text-green-700 shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setQuestionTypeFilter('essay')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'essay'
                    ? 'bg-primary-muted text-primary-dark shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
              >
                Essay
              </button>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
              <button
                onClick={() => setSortBy('recent')}
                className={`p-2 rounded-md transition-all ${
                    sortBy === 'recent'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort by recent"
              >
                <Clock01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy('alphabetical')}
                className={`p-2 rounded-md transition-all ${
                    sortBy === 'alphabetical'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort alphabetically"
              >
                <SortingAZ01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSortBy('oldest')}
                className={`p-2 rounded-md transition-all ${
                    sortBy === 'oldest'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort by oldest"
              >
                <Calendar03Icon className="w-4 h-4" />
              </button>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-100/70 border border-gray-200/50">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Grid view"
              >
                <GridViewIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-accent shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="List view"
              >
                <Menu01Icon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </ClayCard>

      {/* Content */}
      {isLoading ? (
        <ExamsSkeleton viewMode={viewMode} />
      ) : processedExams.length === 0 ? (
        <EmptyState
          hasFilters={searchQuery.trim() !== '' || difficultyFilter !== 'all' || questionTypeFilter !== 'all'}
          onClearFilters={() => {
            setSearchQuery('');
            setDifficultyFilter('all');
            setQuestionTypeFilter('all');
          }}
          onCreateNew={() => setIsModalOpen(true)}
          totalExams={totalExams}
        />
      ) : (
        <>
          {/* Results count */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-foreground-muted">
              Showing <span className="font-semibold text-foreground">{processedExams.length}</span> exam{processedExams.length !== 1 ? 's' : ''}
              {(searchQuery || difficultyFilter !== 'all' || questionTypeFilter !== 'all') && (
                <span> matching your filters</span>
              )}
            </p>
          </div>

          {/* Exams Grid/List */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {processedExams.map((exam) => (
                <ExamGridItem
                  key={exam.id}
                  exam={exam}
                  onTakeExam={() => handleTakeExam(exam.id)}
                  onDelete={() => handleDeleteClick(exam)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {processedExams.map((exam) => (
                <ExamListItemComponent
                  key={exam.id}
                  exam={exam}
                  onTakeExam={() => handleTakeExam(exam.id)}
                  onDelete={() => handleDeleteClick(exam)}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Create Exam Modal */}
      <CreateExamModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onExamGenerated={handleExamGenerated}
        saving={isSaving}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setExamToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Exam"
        description={`Are you sure you want to delete "${examToDelete?.title}"? This will also delete all attempts and cannot be undone.`}
        itemName={examToDelete?.title || 'this exam'}
        itemType="note"
        loading={isDeleting}
      />
    </div>
  );
}

// ============================================
// Sub-components
// ============================================

function ExamsSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-[68px] rounded-xl bg-gray-100/60 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
          <div className="h-1 w-full bg-gray-100" />
          <div className="p-5 space-y-4">
            <div className="h-5 w-3/4 bg-gray-100 rounded-md" />
            <div className="flex gap-2">
              <div className="h-4 w-12 bg-gray-100/60 rounded" />
              <div className="h-4 w-8 bg-gray-100/60 rounded" />
            </div>
            <div className="space-y-2 pt-2">
              <div className="h-3 w-40 bg-gray-100/60 rounded" />
              <div className="h-1.5 w-full bg-gray-100 rounded-full" />
            </div>
            <div className="h-3 w-16 bg-gray-50 rounded pt-2" />
          </div>
        </ClayCard>
      ))}
    </div>
  );
}

function EmptyState({
  hasFilters,
  onClearFilters,
  onCreateNew,
  totalExams
}: {
  hasFilters: boolean;
  onClearFilters: () => void;
  onCreateNew: () => void;
  totalExams: number;
}) {
  return (
    <ClayCard variant="default" padding="lg" className="rounded-2xl">
      <div className="text-center py-12">
        <div className="w-14 h-14 rounded-2xl bg-accent/8 border border-accent/10 flex items-center justify-center mx-auto mb-6">
          <ExamIcon className="w-7 h-7 text-accent" />
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">No matching exams</h3>
            <p className="text-sm text-foreground-muted mb-6 max-w-sm mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-lg bg-white text-sm text-foreground font-medium border border-gray-200 hover:shadow-sm transition-all"
            >
              Clear filters
            </button>
          </>
        ) : totalExams === 0 ? (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">No exams yet</h3>
            <p className="text-sm text-foreground-muted mb-6 max-w-sm mx-auto">
              Create your first practice exam from your notes
            </p>

            <HeroActionButton
              icon={<ExamAddIcon className="w-5 h-5" />}
              onClick={onCreateNew}
            >
              Create Your First Exam
            </HeroActionButton>

            {/* Feature preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto mt-10">
              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <SparklesIcon className="w-4 h-4 text-accent mx-auto mb-2" />
                <h4 className="font-medium text-foreground text-xs mb-0.5">AI-Generated</h4>
                <p className="text-[11px] text-foreground-muted/60">From your notes</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <Clock01Icon className="w-4 h-4 text-accent mx-auto mb-2" />
                <h4 className="font-medium text-foreground text-xs mb-0.5">Timed Tests</h4>
                <p className="text-[11px] text-foreground-muted/60">Real exam conditions</p>
              </div>
              <div className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                <Target01Icon className="w-4 h-4 text-accent mx-auto mb-2" />
                <h4 className="font-medium text-foreground text-xs mb-0.5">Track Progress</h4>
                <p className="text-[11px] text-foreground-muted/60">Improve over time</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold text-foreground mb-2">No results found</h3>
            <p className="text-sm text-foreground-muted mb-6 max-w-sm mx-auto">
              No exams match your current filters
            </p>
            <button
              onClick={onClearFilters}
              className="px-4 py-2 rounded-lg bg-white text-sm text-foreground font-medium border border-gray-200 hover:shadow-sm transition-all"
            >
              Clear filters
            </button>
          </>
        )}
      </div>
    </ClayCard>
  );
}

function ExamGridItem({
  exam,
  onTakeExam,
  onDelete
}: {
  exam: ExamListItem;
  onTakeExam: () => void;
  onDelete: () => void;
}) {
  const scoreColor = exam.best_score !== null
    ? exam.best_score >= 80 ? 'text-emerald-600' : exam.best_score >= 50 ? 'text-amber-600' : 'text-red-500'
    : '';

  return (
    <div className="group cursor-pointer" onClick={onTakeExam}>
      <ClayCard
        variant="default"
        padding="none"
        className="rounded-2xl overflow-hidden h-full flex flex-col transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
      >
        {/* Thin difficulty accent bar at top */}
        <div className={clsx('h-1 w-full', {
          'bg-emerald-400': exam.difficulty === 'easy',
          'bg-amber-400': exam.difficulty === 'medium',
          'bg-red-400': exam.difficulty === 'hard',
          'bg-accent/60': exam.difficulty === 'mixed',
        })} />

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Title */}
          <h3 className="font-semibold text-[15px] text-foreground group-hover:text-accent transition-colors line-clamp-2 leading-snug mb-1.5">
            {exam.title}
          </h3>

          {/* Metadata row */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <span className={clsx(
              'text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded',
              {
                'text-emerald-700 bg-emerald-50': exam.difficulty === 'easy',
                'text-amber-700 bg-amber-50': exam.difficulty === 'medium',
                'text-red-600 bg-red-50': exam.difficulty === 'hard',
                'text-accent bg-accent/5': exam.difficulty === 'mixed',
              }
            )}>
              {exam.difficulty}
            </span>
            {exam.include_multiple_choice && (
              <span className="text-[10px] font-medium text-foreground-muted/60 bg-gray-50 px-1.5 py-0.5 rounded">MC</span>
            )}
            {exam.include_identification && (
              <span className="text-[10px] font-medium text-foreground-muted/60 bg-gray-50 px-1.5 py-0.5 rounded">ID</span>
            )}
            {exam.include_essay && (
              <span className="text-[10px] font-medium text-foreground-muted/60 bg-gray-50 px-1.5 py-0.5 rounded">Essay</span>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Stats row */}
          <div className="flex items-center gap-3 text-xs text-foreground-muted">
            <span>
              <span className="font-medium text-foreground">{exam.total_questions}</span> questions
            </span>
            {exam.time_limit_minutes && (
              <>
                <span className="text-gray-300">&middot;</span>
                <span>{exam.time_limit_minutes} min</span>
              </>
            )}
            <span className="text-gray-300">&middot;</span>
            <span>{exam.attempt_count} {exam.attempt_count === 1 ? 'attempt' : 'attempts'}</span>
          </div>

          {/* Best score bar (if any) */}
          {exam.best_score !== null && (
            <div className="flex items-center gap-2 mt-3">
              <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className={clsx('h-full rounded-full transition-all duration-500', {
                    'bg-emerald-400': exam.best_score >= 80,
                    'bg-amber-400': exam.best_score >= 50 && exam.best_score < 80,
                    'bg-red-400': exam.best_score < 50,
                  })}
                  style={{ width: `${exam.best_score}%` }}
                />
              </div>
              <span className={clsx('text-xs font-medium', scoreColor)}>
                {exam.best_score}%
              </span>
            </div>
          )}

          {/* Footer: actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100/80">
            <span className="text-[11px] text-foreground-muted/60">
              {exam.attempt_count > 0 ? `Best: ${exam.best_score ?? '—'}%` : 'Not attempted'}
            </span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                className="p-1.5 rounded-md text-foreground-muted/50 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Delete exam"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Delete01Icon className="w-3.5 h-3.5" />
              </button>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 transition-colors"
              >
                Take Exam
                <ArrowRight01Icon className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}

function ExamListItemComponent({
  exam,
  onTakeExam,
  onDelete
}: {
  exam: ExamListItem;
  onTakeExam: () => void;
  onDelete: () => void;
}) {
  const scorePercent = exam.best_score ?? 0;
  const scoreColor = exam.best_score !== null
    ? exam.best_score >= 80 ? 'text-emerald-400' : exam.best_score >= 50 ? 'text-amber-400' : 'text-red-400'
    : 'text-gray-200';

  return (
    <div onClick={onTakeExam} className="cursor-pointer">
      <ClayCard variant="default" padding="none" className="rounded-xl overflow-hidden group transition-all duration-200 hover:shadow-md">
        <div className="flex items-center gap-4 px-5 py-4">
          {/* Score ring */}
          <div className="relative w-10 h-10 flex-shrink-0">
            <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="text-gray-100"
              />
              <circle
                cx="18" cy="18" r="15"
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={`${scorePercent * 0.942} 100`}
                className={scoreColor}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold text-foreground-muted">
              {exam.best_score !== null ? `${exam.best_score}%` : '—'}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-sm text-foreground truncate group-hover:text-accent transition-colors">
                {exam.title}
              </h3>
              <span className={clsx(
                'text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0',
                {
                  'text-emerald-700 bg-emerald-50': exam.difficulty === 'easy',
                  'text-amber-700 bg-amber-50': exam.difficulty === 'medium',
                  'text-red-600 bg-red-50': exam.difficulty === 'hard',
                  'text-accent bg-accent/5': exam.difficulty === 'mixed',
                }
              )}>
                {exam.difficulty}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-foreground-muted/60">
              <span>{exam.total_questions} questions</span>
              {exam.time_limit_minutes && (
                <>
                  <span>&middot;</span>
                  <span>{exam.time_limit_minutes} min</span>
                </>
              )}
              <span>&middot;</span>
              <span>{exam.attempt_count} {exam.attempt_count === 1 ? 'attempt' : 'attempts'}</span>
              {exam.include_multiple_choice && (
                <>
                  <span>&middot;</span>
                  <span>MC</span>
                </>
              )}
              {exam.include_identification && <span>ID</span>}
              {exam.include_essay && <span>Essay</span>}
            </div>
          </div>

          {/* Actions - appear on hover */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 rounded-md text-foreground-muted/40 hover:text-red-500 hover:bg-red-50 transition-colors"
              title="Delete exam"
            >
              <Delete01Icon className="w-3.5 h-3.5" />
            </button>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-accent bg-accent/5 hover:bg-accent/10 transition-colors"
            >
              Take Exam
              <ArrowRight01Icon className="w-3 h-3" />
            </span>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}
