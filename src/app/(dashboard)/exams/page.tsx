'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard, ClayBadge, ClayButton } from '@/component/ui/Clay';
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
  TestTube01Icon,
  SparklesIcon,
  Clock01Icon,
  Target01Icon,
  Add01Icon,
  Delete01Icon,
  ArrowRight01Icon,
  Award01Icon,
  Search01Icon,
  FilterIcon,
  GridViewIcon,
  Menu01Icon,
  SortingAZ01Icon,
  Calendar03Icon
} from 'hugeicons-react';
import HeroActionButton from '@/component/ui/HeroActionButton';
import { clsx } from 'clsx';

type ViewMode = 'grid' | 'list';
type SortOption = 'recent' | 'alphabetical' | 'oldest';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard' | 'mixed';
type QuestionTypeFilter = 'all' | 'mc' | 'id' | 'essay';

// Difficulty badge colors
const difficultyColors = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700',
  mixed: 'bg-purple-100 text-purple-700',
};

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
  const totalAttempts = exams.reduce((sum, exam) => sum + exam.attempt_count, 0);
  const averageBestScore = exams.filter(e => e.best_score !== null).length > 0
    ? Math.round(exams.filter(e => e.best_score !== null).reduce((sum, e) => sum + (e.best_score || 0), 0) / exams.filter(e => e.best_score !== null).length)
    : null;

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
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-bl from-secondary/10 via-secondary/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-gradient-to-tr from-tertiary/8 via-tertiary/4 to-transparent rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title area */}
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary-muted to-secondary-muted/60 shadow-lg shadow-secondary/10">
                <TestTube01Icon className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                    Exams
                  </h1>
                  <ClayBadge variant="secondary" className="text-xs px-2 py-1">
                    <SparklesIcon className="w-3 h-3" />
                    {totalExams} exams
                  </ClayBadge>
                </div>
                <p className="text-foreground-muted">
                  Test your knowledge with AI-generated practice exams
                </p>
              </div>
            </div>

            {/* Stats and CTA */}
            <div className="flex items-center gap-4">
              {/* Quick stats */}
              <div className="hidden sm:flex items-center gap-3">
                <div className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm">
                  <p className="text-xs text-foreground-muted font-medium">Total attempts</p>
                  <p className="text-lg font-bold text-foreground">{totalAttempts}</p>
                </div>
                {averageBestScore !== null && (
                  <div className="px-4 py-2 rounded-xl bg-white/60 backdrop-blur-sm border border-white/80 shadow-sm">
                    <p className="text-xs text-foreground-muted font-medium">Avg best score</p>
                    <p className="text-lg font-bold text-green-600">{averageBestScore}%</p>
                  </div>
                )}
              </div>

              <HeroActionButton
                theme="secondary"
                icon={<Add01Icon className="w-5 h-5" />}
                onClick={() => setIsModalOpen(true)}
              >
                Create Exam
              </HeroActionButton>
            </div>
          </div>
        </div>
      </ClayCard>

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
              className="w-full pl-12 pr-4 py-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100/50 border border-gray-200/80 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
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
                    ? 'bg-purple-100 text-purple-700 shadow-sm'
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
                    ? 'bg-white text-secondary shadow-sm'
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
                    ? 'bg-white text-secondary shadow-sm'
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
                    ? 'bg-white text-secondary shadow-sm'
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
                    ? 'bg-white text-secondary shadow-sm'
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
                    ? 'bg-white text-secondary shadow-sm'
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
        message={`Are you sure you want to delete "${examToDelete?.title}"? This will also delete all attempts and cannot be undone.`}
        isDeleting={isDeleting}
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
          <div key={i} className="h-24 rounded-2xl bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
          <div className="p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div className="h-6 w-2/3 bg-gray-200 rounded-lg" />
              <div className="h-8 w-8 bg-gray-200 rounded-lg" />
            </div>
            <div className="flex gap-2">
              <div className="h-5 w-16 bg-gray-200 rounded" />
              <div className="h-5 w-20 bg-gray-200 rounded" />
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-20 bg-gray-200 rounded" />
              <div className="h-8 w-24 bg-gray-200 rounded-lg" />
            </div>
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
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="text-center py-16">
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-secondary/5 rounded-3xl rotate-6" />
          <div className="absolute inset-0 bg-gradient-to-br from-tertiary/20 to-tertiary/5 rounded-3xl -rotate-6" />
          <div className="relative w-full h-full rounded-3xl bg-gradient-to-br from-secondary-muted to-secondary-muted/60 flex items-center justify-center shadow-lg">
            <TestTube01Icon className="w-16 h-16 text-secondary" />
          </div>
        </div>

        {hasFilters ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matching exams</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-foreground font-semibold border border-gray-200/80 hover:shadow-md transition-all"
            >
              Clear filters
            </button>
          </>
        ) : totalExams === 0 ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No Exams Yet</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Create your first practice exam from your notes. AI will generate questions to test your knowledge.
            </p>

            <HeroActionButton
              theme="secondary"
              icon={<SparklesIcon className="w-5 h-5" />}
              onClick={onCreateNew}
            >
              Create Your First Exam
            </HeroActionButton>

            {/* Feature preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-12">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-muted to-primary-muted/60 flex items-center justify-center mx-auto mb-3">
                  <SparklesIcon className="w-5 h-5 text-primary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">AI-Generated</h4>
                <p className="text-xs text-foreground-muted">Questions created from your notes</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary-muted to-secondary-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Clock01Icon className="w-5 h-5 text-secondary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Timed Tests</h4>
                <p className="text-xs text-foreground-muted">Practice under real exam conditions</p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/80">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-tertiary-muted to-tertiary-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Target01Icon className="w-5 h-5 text-tertiary" />
                </div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Track Progress</h4>
                <p className="text-xs text-foreground-muted">See your improvement over time</p>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No results found</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              No exams match your current filters
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-gray-100 to-gray-50 text-foreground font-semibold border border-gray-200/80 hover:shadow-md transition-all"
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
  return (
    <ClayCard
      variant="default"
      padding="none"
      className="rounded-2xl overflow-hidden h-full flex flex-col hover:shadow-lg transition-all group"
    >
      {/* Card Header */}
      <div className="p-5 flex-1">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground group-hover:text-secondary transition-colors truncate">
              {exam.title}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                difficultyColors[exam.difficulty]
              )}>
                {exam.difficulty}
              </span>
              <span className="text-sm text-foreground-muted">
                {exam.total_questions} questions
              </span>
              {exam.time_limit_minutes && (
                <span className="text-sm text-foreground-muted flex items-center gap-1">
                  <Clock01Icon className="w-3 h-3" />
                  {exam.time_limit_minutes} min
                </span>
              )}
            </div>
          </div>
          <div className="p-2 rounded-xl bg-secondary/10 shrink-0">
            <TestTube01Icon className="w-5 h-5 text-secondary" />
          </div>
        </div>

        {/* Question types */}
        <div className="flex gap-1 mb-4">
          {exam.include_multiple_choice && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-medium">MC</span>
          )}
          {exam.include_identification && (
            <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs font-medium">ID</span>
          )}
          {exam.include_essay && (
            <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs font-medium">Essay</span>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4">
          {exam.best_score !== null && (
            <div className="flex items-center gap-1 text-yellow-700">
              <Award01Icon className="w-4 h-4" />
              <span className="text-sm font-semibold">{exam.best_score}%</span>
            </div>
          )}
          <span className="text-sm text-foreground-muted">
            {exam.attempt_count} {exam.attempt_count === 1 ? 'attempt' : 'attempts'}
          </span>
        </div>
      </div>

      {/* Card Footer */}
      <div className="px-5 py-4 bg-gray-50 flex items-center justify-between gap-3 border-t border-gray-100">
        <button
          onClick={onDelete}
          className="p-2 rounded-lg bg-red-50 hover:bg-red-500 text-red-500 hover:text-white transition-all duration-200"
          title="Delete exam"
        >
          <Delete01Icon className="w-4 h-4" />
        </button>

        <ClayButton
          variant="primary"
          size="sm"
          onClick={onTakeExam}
          className="bg-secondary hover:bg-secondary/90"
        >
          Take Exam
          <ArrowRight01Icon className="w-4 h-4 ml-1" />
        </ClayButton>
      </div>
    </ClayCard>
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
  return (
    <ClayCard
      variant="default"
      padding="none"
      className="rounded-2xl overflow-hidden hover:shadow-lg transition-shadow group"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
        {/* Exam info */}
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10 shrink-0">
            <TestTube01Icon className="w-6 h-6 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-lg group-hover:text-secondary transition-colors">{exam.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className={clsx(
                'px-2 py-0.5 rounded-full text-xs font-medium capitalize',
                difficultyColors[exam.difficulty]
              )}>
                {exam.difficulty}
              </span>
              <span className="text-sm text-foreground-muted">
                {exam.total_questions} questions
              </span>
              {exam.time_limit_minutes && (
                <span className="text-sm text-foreground-muted flex items-center gap-1">
                  <Clock01Icon className="w-3 h-3" />
                  {exam.time_limit_minutes} min
                </span>
              )}
            </div>
            {/* Question types */}
            <div className="flex gap-1 mt-2">
              {exam.include_multiple_choice && (
                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs">MC</span>
              )}
              {exam.include_identification && (
                <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded text-xs">ID</span>
              )}
              {exam.include_essay && (
                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 rounded text-xs">Essay</span>
              )}
            </div>
          </div>
        </div>

        {/* Stats and actions */}
        <div className="flex items-center gap-4">
          {/* Best score */}
          {exam.best_score !== null && (
            <div className="text-center px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border border-yellow-200/50">
              <div className="flex items-center gap-1 text-yellow-700">
                <Award01Icon className="w-4 h-4" />
                <span className="font-bold">{exam.best_score}%</span>
              </div>
              <span className="text-xs text-yellow-600">Best Score</span>
            </div>
          )}

          {/* Attempt count */}
          <div className="text-center px-3">
            <span className="text-lg font-semibold text-foreground">{exam.attempt_count}</span>
            <span className="text-xs text-foreground-muted block">
              {exam.attempt_count === 1 ? 'Attempt' : 'Attempts'}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <ClayButton
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="text-red-500 hover:bg-red-50"
            >
              <Delete01Icon className="w-4 h-4" />
            </ClayButton>
            <ClayButton
              variant="primary"
              size="sm"
              onClick={onTakeExam}
              className="bg-secondary hover:bg-secondary/90"
            >
              Take Exam
              <ArrowRight01Icon className="w-4 h-4 ml-1" />
            </ClayButton>
          </div>
        </div>
      </div>
    </ClayCard>
  );
}
