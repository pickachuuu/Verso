'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ClayCard, ClayBadge } from '@/component/ui/Clay';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { ExamGenerationResponse } from '@/lib/gemini';
import CreateExamModal from '@/component/features/modal/CreateExamModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import {
  useExams,
  useCreateExam,
  useDeleteExam,
  useToggleExamPublicStatus,
  ExamListItem
} from '@/hooks/useExams';
import {
  SparklesIcon,
  Clock01Icon,
  Target01Icon,
  Delete01Icon,
  Share01Icon,
  ArrowRight01Icon,
  Search01Icon,
  FilterIcon,
  GridViewIcon,
  Menu01Icon,
  SortingAZ01Icon,
  Calendar03Icon,
} from 'hugeicons-react';
import { ExamIcon, ExamAddIcon } from '@/component/icons';
import HeroActionButton from '@/component/ui/HeroActionButton';
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
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null);

  // Filter/Search state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [questionTypeFilter, setQuestionTypeFilter] = useState<QuestionTypeFilter>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // TanStack Query hooks
  const { data: exams = [], isLoading } = useExams();
  const createExamMutation = useCreateExam();
  const deleteExamMutation = useDeleteExam();
  const togglePublicMutation = useToggleExamPublicStatus();

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
  const totalQuestions = exams.reduce((sum, e) => sum + e.total_questions, 0);
  const sortLabel = sortBy === 'recent' ? 'Most recent' : sortBy === 'alphabetical' ? 'A–Z' : 'Oldest';
  const difficultyLabel = difficultyFilter === 'all' ? 'All' : difficultyFilter;
  const questionTypeLabel = questionTypeFilter === 'all' ? 'All types' : questionTypeFilter.toUpperCase();
  const activeFilters = Number(difficultyFilter !== 'all') + Number(questionTypeFilter !== 'all');

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

  const handleCopyShareLink = useCallback(async (exam: ExamListItem, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!exam.is_public) {
      try {
        await togglePublicMutation.mutateAsync({ examId: exam.id, isPublic: true });
      } catch (error) {
        console.error('Error making exam public:', error);
        return;
      }
    }

    const shareUrl = `${window.location.origin}/public/exams/${exam.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(exam.id);
      setTimeout(() => setShareLinkCopied(null), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  }, [togglePublicMutation]);

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
      <ExamsHeader
        totalExams={totalExams}
        totalQuestions={totalQuestions}
        onCreateNew={() => setIsModalOpen(true)}
      />

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-8 space-y-4">
          {/* Mobile controls */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-2xl bg-surface border border-border">
                <Search01Icon className="w-4 h-4 text-foreground-muted" />
                <input
                  type="text"
                  placeholder="Search exams..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none focus:outline-none text-sm text-foreground placeholder:text-foreground-muted"
                />
              </div>
              <button
                onClick={() => setMobileFiltersOpen(true)}
                className="shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground hover:bg-background-muted transition-colors"
              >
                <FilterIcon className="w-4 h-4 text-foreground-muted" />
                Filters
                {activeFilters > 0 && (
                  <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold bg-background-muted text-foreground">
                    {activeFilters}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-foreground-muted">
              <span>Showing {processedExams.length} exam{processedExams.length !== 1 ? 's' : ''}</span>
              <span>{difficultyLabel} · {questionTypeLabel}</span>
            </div>
          </div>

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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {processedExams.map((exam) => (
                    <ExamGridItem
                      key={exam.id}
                      exam={exam}
                      onTakeExam={() => handleTakeExam(exam.id)}
                      onDelete={() => handleDeleteClick(exam)}
                      onShare={(e) => handleCopyShareLink(exam, e)}
                      shareLinkCopied={shareLinkCopied === exam.id}
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
                      onShare={(e) => handleCopyShareLink(exam, e)}
                      shareLinkCopied={shareLinkCopied === exam.id}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="order-1 lg:order-2 lg:col-span-4 space-y-4 hidden lg:block">
          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="flex items-center gap-2">
              <Search01Icon className="w-5 h-5 text-foreground-muted" />
              <input
                type="text"
                placeholder="Search exams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-surface border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-foreground placeholder:text-foreground-muted"
              />
            </div>
          </ClayCard>

          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                  <FilterIcon className="w-4 h-4" />
                  Difficulty
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border flex-wrap">
                  <button
                    onClick={() => setDifficultyFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      difficultyFilter === 'all'
                        ? 'bg-surface text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setDifficultyFilter('easy')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      difficultyFilter === 'easy'
                        ? 'bg-background-muted text-emerald-700 border border-emerald-200 shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Easy
                  </button>
                  <button
                    onClick={() => setDifficultyFilter('medium')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      difficultyFilter === 'medium'
                        ? 'bg-background-muted text-amber-700 border border-amber-200 shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Medium
                  </button>
                  <button
                    onClick={() => setDifficultyFilter('hard')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      difficultyFilter === 'hard'
                        ? 'bg-background-muted text-red-700 border border-red-200 shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Hard
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                  <Target01Icon className="w-4 h-4" />
                  Question Types
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border flex-wrap">
                  <button
                    onClick={() => setQuestionTypeFilter('all')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      questionTypeFilter === 'all'
                        ? 'bg-surface text-foreground shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    All Types
                  </button>
                  <button
                    onClick={() => setQuestionTypeFilter('mc')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      questionTypeFilter === 'mc'
                        ? 'bg-background-muted text-blue-700 border border-blue-200 shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    MC
                  </button>
                  <button
                    onClick={() => setQuestionTypeFilter('id')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      questionTypeFilter === 'id'
                        ? 'bg-background-muted text-green-700 border border-green-200 shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    ID
                  </button>
                  <button
                    onClick={() => setQuestionTypeFilter('essay')}
                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      questionTypeFilter === 'essay'
                        ? 'bg-background-muted text-primary-dark border border-primary/20 shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                  >
                    Essay
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                  <SortingAZ01Icon className="w-4 h-4" />
                  Sort
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
                  <button
                    onClick={() => setSortBy('recent')}
                    className={`p-2 rounded-md transition-all ${
                      sortBy === 'recent'
                        ? 'bg-surface text-primary shadow-sm'
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
                        ? 'bg-surface text-primary shadow-sm'
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
                        ? 'bg-surface text-primary shadow-sm'
                        : 'text-foreground-muted hover:text-foreground'
                    }`}
                    title="Sort by oldest"
                  >
                    <Calendar03Icon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted mb-2">
                  <GridViewIcon className="w-4 h-4" />
                  View
                </div>
                <div className="flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === 'grid'
                        ? 'bg-surface text-primary shadow-sm'
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
                        ? 'bg-surface text-primary shadow-sm'
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

          <ClayCard variant="default" padding="md" className="rounded-2xl">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-muted">Exams</p>
                <p className="text-2xl font-bold text-foreground">{totalExams}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-foreground-muted">Questions</p>
                <p className="text-2xl font-bold text-foreground">{totalQuestions}</p>
              </div>
            </div>
            <div className="mt-3 text-xs text-foreground-muted">
              {difficultyLabel} · {questionTypeLabel} · {sortLabel}
            </div>
          </ClayCard>
        </div>
      </div>

      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filters"
        description="Refine your exams"
        footer={(
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setDifficultyFilter('all');
                setQuestionTypeFilter('all');
                setSortBy('recent');
              }}
              className="flex-1 px-3 py-2 rounded-xl border border-border bg-surface text-sm font-semibold text-foreground-muted hover:text-foreground hover:bg-background-muted transition-all"
            >
              Reset
            </button>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1 px-3 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              Done
            </button>
          </div>
        )}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <FilterIcon className="w-4 h-4" />
              Difficulty
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setDifficultyFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  difficultyFilter === 'all'
                    ? 'bg-background-muted text-foreground border border-border'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setDifficultyFilter('easy')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  difficultyFilter === 'easy'
                    ? 'bg-background-muted text-emerald-700 border border-emerald-200'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                Easy
              </button>
              <button
                onClick={() => setDifficultyFilter('medium')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  difficultyFilter === 'medium'
                    ? 'bg-background-muted text-amber-700 border border-amber-200'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                Medium
              </button>
              <button
                onClick={() => setDifficultyFilter('hard')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  difficultyFilter === 'hard'
                    ? 'bg-background-muted text-red-700 border border-red-200'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                Hard
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <Target01Icon className="w-4 h-4" />
              Question types
            </div>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setQuestionTypeFilter('all')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'all'
                    ? 'bg-background-muted text-foreground border border-border'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setQuestionTypeFilter('mc')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'mc'
                    ? 'bg-background-muted text-blue-700 border border-blue-200'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                MC
              </button>
              <button
                onClick={() => setQuestionTypeFilter('id')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'id'
                    ? 'bg-background-muted text-green-700 border border-green-200'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                ID
              </button>
              <button
                onClick={() => setQuestionTypeFilter('essay')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  questionTypeFilter === 'essay'
                    ? 'bg-background-muted text-primary-dark border border-primary/20'
                    : 'text-foreground-muted border border-transparent hover:text-foreground hover:border-border'
                }`}
              >
                Essay
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <SortingAZ01Icon className="w-4 h-4" />
              Sort
            </div>
            <div className="mt-2 flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
              <button
                onClick={() => setSortBy('recent')}
                className={`p-2 rounded-md transition-all ${
                  sortBy === 'recent'
                    ? 'bg-surface text-primary shadow-sm'
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
                    ? 'bg-surface text-primary shadow-sm'
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
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="Sort by oldest"
              >
                <Calendar03Icon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              <GridViewIcon className="w-4 h-4" />
              View
            </div>
            <div className="mt-2 flex items-center gap-1 p-1 rounded-lg bg-background-muted border border-border">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-surface text-primary shadow-sm'
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
                    ? 'bg-surface text-primary shadow-sm'
                    : 'text-foreground-muted hover:text-foreground'
                }`}
                title="List view"
              >
                <Menu01Icon className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-background-muted p-3 text-xs text-foreground-muted">
            <div className="flex items-center justify-between">
              <span>Exams</span>
              <span className="font-semibold text-foreground">{totalExams}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Questions</span>
              <span className="font-semibold text-foreground">{totalQuestions}</span>
            </div>
            <div className="mt-2 text-[11px]">{difficultyLabel} · {questionTypeLabel} · {sortLabel}</div>
          </div>
        </div>
      </MobileBottomSheet>

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

function ExamsHeader({
  totalExams,
  totalQuestions,
  onCreateNew,
}: {
  totalExams: number;
  totalQuestions: number;
  onCreateNew: () => void;
}) {
  return (
    <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Title area */}
        <div className="flex items-start gap-3">
          <ExamIcon className="w-12 h-12 text-primary shrink-0" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                Exams
              </h1>
              <ClayBadge variant="accent" className="text-xs px-2 py-1">
                <SparklesIcon className="w-3 h-3" />
                {totalExams} exams &middot; {totalQuestions} questions
              </ClayBadge>
            </div>
            <p className="text-foreground-muted">
              Test your knowledge with AI-generated practice exams
            </p>
          </div>
        </div>

        {/* CTA */}
        <HeroActionButton
          icon={<ExamAddIcon className="w-5 h-5" />}
          onClick={onCreateNew}
        >
          Create Exam
        </HeroActionButton>
      </div>
    </ClayCard>
  );
}

function ExamsSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <ClayCard key={i} variant="default" padding="none" className="rounded-2xl overflow-hidden animate-pulse">
            <div className="flex items-stretch">
              <div className="w-1 bg-background-muted" />
              <div className="flex items-center gap-4 p-3 pr-5 flex-1">
                <div className="w-12 h-14 bg-background-muted rounded-lg" />
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="h-4 w-2/3 bg-background-muted rounded" />
                  <div className="h-3 w-1/2 bg-background-muted/80 rounded" />
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-2.5 w-16 bg-background-muted/70 rounded" />
                    <div className="h-2.5 w-12 bg-background-muted/70 rounded" />
                    <div className="h-2.5 w-10 bg-background-muted/70 rounded" />
                  </div>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="h-8 w-8 bg-background-muted rounded-lg" />
                  <div className="h-8 w-16 bg-background-muted rounded-lg" />
                </div>
              </div>
            </div>
          </ClayCard>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <ClayCard key={i} variant="default" padding="none" className="rounded-2xl animate-pulse overflow-hidden">
          <div className="h-1 w-full bg-background-muted" />
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-14 bg-background-muted rounded-lg" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-background-muted rounded-md" />
                <div className="h-3 w-1/2 bg-background-muted/80 rounded" />
                <div className="flex items-center gap-2">
                  <div className="h-4 w-10 bg-background-muted/80 rounded-full" />
                  <div className="h-4 w-10 bg-background-muted/80 rounded-full" />
                  <div className="h-4 w-10 bg-background-muted/80 rounded-full" />
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-16 bg-background-muted/70 rounded" />
              <div className="h-3 w-12 bg-background-muted/70 rounded" />
              <div className="h-3 w-14 bg-background-muted/70 rounded" />
            </div>
            <div className="h-1.5 w-full bg-background-muted rounded-full" />
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
        <Image
          src="/brand/verso-thinking-clean.svg"
          alt="Verso mascot thinking"
          width={140}
          height={140}
          className="mx-auto mb-8 drop-shadow-sm"
        />

        {hasFilters ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">No matching exams</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Try adjusting your search or filters to find what you&apos;re looking for
            </p>
            <button
              onClick={onClearFilters}
              className="px-6 py-3 rounded-xl bg-surface text-foreground font-semibold border border-border hover:shadow-md transition-all"
            >
              Clear filters
            </button>
          </>
        ) : totalExams === 0 ? (
          <>
            <h3 className="text-2xl font-bold text-foreground mb-3">Start testing your knowledge</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Create your first practice exam from your notes to track your progress and study smarter
            </p>
            <HeroActionButton
              icon={<ExamAddIcon className="w-5 h-5" />}
              onClick={onCreateNew}
            >
              Create Your First Exam
            </HeroActionButton>

            {/* Feature preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mt-10">
              <div className="p-4 rounded-2xl bg-surface border border-border/50">
                <SparklesIcon className="w-5 h-5 text-primary mx-auto mb-2.5" />
                <h4 className="font-semibold text-foreground text-xs mb-1">AI-Generated</h4>
                <p className="text-[11px] text-foreground-muted">From your notes</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border/50">
                <Clock01Icon className="w-5 h-5 text-primary mx-auto mb-2.5" />
                <h4 className="font-semibold text-foreground text-xs mb-1">Timed Tests</h4>
                <p className="text-[11px] text-foreground-muted">Real exam conditions</p>
              </div>
              <div className="p-4 rounded-2xl bg-surface border border-border/50">
                <Target01Icon className="w-5 h-5 text-primary mx-auto mb-2.5" />
                <h4 className="font-semibold text-foreground text-xs mb-1">Track Progress</h4>
                <p className="text-[11px] text-foreground-muted">Improve over time</p>
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
              className="px-6 py-3 rounded-xl bg-surface text-foreground font-semibold border border-border hover:shadow-md transition-all"
            >
              Clear filters
            </button>
          </>
        )}
      </div>
    </ClayCard>
  );
}

// ── 3D Mini Exam Document ──
// A small skeuomorphic exam paper icon with a colored difficulty accent,
// matching the 3D mini notebook (library) and flashcard stack (flashcards).
function MiniExamDocument({ difficulty }: { difficulty: string }) {
  const accentColor =
    difficulty === 'easy' ? '#22c55e' :
    difficulty === 'medium' ? '#f59e0b' :
    difficulty === 'hard' ? '#ef4444' :
    '#6366f1'; // mixed

  const accentLight =
    difficulty === 'easy' ? '#4ade80' :
    difficulty === 'medium' ? '#fbbf24' :
    difficulty === 'hard' ? '#f87171' :
    '#818cf8';

  return (
    <div className="relative flex-shrink-0" style={{ width: 54, height: 62 }}>
      {/* Page stack shadow layers */}
      <div
        className="absolute rounded-[5px]"
        style={{ top: 3, left: 3, right: 0, bottom: 0, background: '#d8d5d0', boxShadow: '1px 1px 2px rgba(0,0,0,0.12)' }}
      />
      <div
        className="absolute rounded-[5px]"
        style={{ top: 2, left: 2, right: 1, bottom: 1, background: '#e5e2dd' }}
      />
      <div
        className="absolute rounded-[5px]"
        style={{ top: 1, left: 1, right: 2, bottom: 2, background: '#eeecea' }}
      />

      {/* Front page — exam paper */}
      <div
        className="absolute rounded-[5px] overflow-hidden"
        style={{
          top: 0,
          left: 0,
          right: 3,
          bottom: 3,
          background: 'linear-gradient(180deg, #f8f7f4 0%, #f0eeea 100%)',
          boxShadow: '2px 3px 6px rgba(0,0,0,0.12)',
        }}
      >
        {/* Colored accent strip at top */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: 5,
            background: `linear-gradient(90deg, ${accentColor}, ${accentLight})`,
          }}
        />
        {/* "Lines" to mimic text */}
        <div className="absolute" style={{ top: 12, left: 7, right: 7 }}>
          <div style={{ height: 2, background: '#d1cfc8', borderRadius: 1, marginBottom: 5 }} />
          <div style={{ height: 2, background: '#d1cfc8', borderRadius: 1, marginBottom: 5, width: '80%' }} />
          <div style={{ height: 2, background: '#d1cfc8', borderRadius: 1, marginBottom: 7, width: '60%' }} />
          {/* Checkbox-style rows */}
          <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: 1, border: `1px solid ${accentColor}`, flexShrink: 0 }} />
            <div style={{ height: 2, background: '#d1cfc8', borderRadius: 1, flex: 1 }} />
          </div>
          <div className="flex items-center gap-1.5" style={{ marginBottom: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: 1, border: `1px solid ${accentColor}`, flexShrink: 0 }} />
            <div style={{ height: 2, background: '#d1cfc8', borderRadius: 1, flex: 1, width: '70%' }} />
          </div>
          <div className="flex items-center gap-1.5">
            <div style={{ width: 4, height: 4, borderRadius: 1, border: `1px solid ${accentColor}`, flexShrink: 0 }} />
            <div style={{ height: 2, background: '#d1cfc8', borderRadius: 1, flex: 1, width: '85%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ExamGridItem({
  exam,
  onTakeExam,
  onDelete,
  onShare,
  shareLinkCopied
}: {
  exam: ExamListItem;
  onTakeExam: () => void;
  onDelete: () => void;
  onShare: (e: React.MouseEvent) => void;
  shareLinkCopied: boolean;
}) {
  const scoreColor = exam.best_score !== null
    ? exam.best_score >= 80 ? 'text-emerald-600' : exam.best_score >= 50 ? 'text-amber-600' : 'text-red-500'
    : '';

  const progress = exam.best_score ?? 0;

  // Encouraging message for scores
  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great job!';
    if (score >= 60) return 'Good effort!';
    if (score >= 40) return 'Keep practicing!';
    return 'Try again - you\'ll improve!';
  };

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
          'bg-primary/60': exam.difficulty === 'mixed',
        })} />

        {/* Card body */}
        <div className="p-5 flex-1 flex flex-col">
          {/* Header row with mini icon + title */}
          <div className="flex items-start gap-3 mb-3">
            <MiniExamDocument difficulty={exam.difficulty} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-[15px] text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                  {exam.title}
                </h3>
                {exam.is_public && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    Public
                  </span>
                )}
              </div>
              {/* Source note */}
              {exam.notes && (
                <p className="text-[10px] text-foreground-muted/70 truncate mt-0.5">
                  From: {exam.notes.title}
                </p>
              )}
              {/* Metadata tags */}
              <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                <span className={clsx(
                  'text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded',
                  {
                    'text-emerald-700 bg-emerald-50': exam.difficulty === 'easy',
                    'text-amber-700 bg-amber-50': exam.difficulty === 'medium',
                    'text-red-600 bg-red-50': exam.difficulty === 'hard',
                    'text-primary bg-primary/5': exam.difficulty === 'mixed',
                  }
                )}>
                  {exam.difficulty}
                </span>
                {exam.include_multiple_choice && (
                  <span className="text-[10px] font-medium text-foreground-muted bg-surface px-1.5 py-0.5 rounded">MC</span>
                )}
                {exam.include_identification && (
                  <span className="text-[10px] font-medium text-foreground-muted bg-surface px-1.5 py-0.5 rounded">ID</span>
                )}
                {exam.include_essay && (
                  <span className="text-[10px] font-medium text-foreground-muted bg-surface px-1.5 py-0.5 rounded">Essay</span>
                )}
              </div>
            </div>
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
                <span className="text-border-light">&middot;</span>
                <span>{exam.time_limit_minutes} min</span>
              </>
            )}
            <span className="text-border-light">&middot;</span>
            <span>{exam.attempt_count} {exam.attempt_count === 1 ? 'attempt' : 'attempts'}</span>
          </div>

          {/* Best score bar (if any) */}
          {exam.best_score !== null && (
            <div className="mt-3">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-surface rounded-full h-1.5 overflow-hidden">
                  <div
                    className={clsx('h-full rounded-full transition-all duration-500', {
                      'bg-emerald-400': exam.best_score >= 80,
                      'bg-amber-400': exam.best_score >= 50 && exam.best_score < 80,
                      'bg-red-400': exam.best_score < 50,
                    })}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className={clsx('text-xs font-bold', scoreColor)}>
                  {exam.best_score}%
                </span>
              </div>
              <p className={clsx('text-[10px] mt-1', {
                'text-emerald-600': exam.best_score >= 80,
                'text-amber-600': exam.best_score >= 50 && exam.best_score < 80,
                'text-red-500/80': exam.best_score < 50,
              })}>
                {getScoreMessage(exam.best_score)}
              </p>
            </div>
          )}

          {/* Footer: actions */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/80">
            <span className="text-[11px] text-foreground-muted">
              {exam.attempt_count > 0 ? `Best: ${exam.best_score ?? '—'}%` : 'Not attempted yet'}
            </span>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                className={`p-1.5 rounded-md transition-colors ${
                  shareLinkCopied
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-primary bg-primary/10 hover:bg-primary/20'
                }`}
                title={shareLinkCopied ? 'Copied!' : 'Share'}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(e);
                }}
              >
                <Share01Icon className="w-3.5 h-3.5" />
              </button>
              <button
                className="p-1.5 rounded-md text-foreground-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                title="Delete exam"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Delete01Icon className="w-3.5 h-3.5" />
              </button>
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-primary bg-primary/5 hover:bg-primary/10 transition-colors"
              >
                {exam.attempt_count > 0 ? 'Retake' : 'Take Exam'}
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
  onDelete,
  onShare,
  shareLinkCopied
}: {
  exam: ExamListItem;
  onTakeExam: () => void;
  onDelete: () => void;
  onShare: (e: React.MouseEvent) => void;
  shareLinkCopied: boolean;
}) {
  const scorePercent = exam.best_score ?? 0;

  // Difficulty accent color
  const difficultyAccent =
    exam.difficulty === 'easy' ? { from: '#4ade80', to: '#22c55e' } :
    exam.difficulty === 'medium' ? { from: '#fbbf24', to: '#f59e0b' } :
    exam.difficulty === 'hard' ? { from: '#f87171', to: '#ef4444' } :
    { from: '#818cf8', to: '#6366f1' };

  // Encouraging message for scores
  const getScoreMessage = (score: number) => {
    if (score >= 90) return 'Excellent!';
    if (score >= 80) return 'Great job!';
    if (score >= 60) return 'Good effort!';
    if (score >= 40) return 'Keep practicing!';
    return 'Try again - you\'ll improve!';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div onClick={onTakeExam} className="block group cursor-pointer">
      <ClayCard variant="default" padding="none" className="rounded-2xl overflow-hidden hover:shadow-lg transition-all">
        <div className="flex items-stretch">
          {/* Difficulty accent left border */}
          <div
            className="w-1 flex-shrink-0 rounded-l-2xl"
            style={{ background: `linear-gradient(180deg, ${difficultyAccent.from}, ${difficultyAccent.to})` }}
          />

          <div className="flex items-center gap-4 p-3 pr-5 flex-1 min-w-0">
            {/* 3D mini exam document */}
            <MiniExamDocument difficulty={exam.difficulty} />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                  {exam.title}
                </h3>
                <span className={clsx(
                  'text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0',
                  {
                    'text-emerald-700 bg-emerald-50': exam.difficulty === 'easy',
                    'text-amber-700 bg-amber-50': exam.difficulty === 'medium',
                    'text-red-600 bg-red-50': exam.difficulty === 'hard',
                    'text-primary bg-primary/5': exam.difficulty === 'mixed',
                  }
                )}>
                  {exam.difficulty}
                </span>
                {exam.is_public && (
                  <span className="text-[10px] font-medium uppercase tracking-wide text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                    Public
                  </span>
                )}
              </div>
              {/* Source note */}
              {exam.notes && (
                <p className="text-[11px] text-foreground-muted/70 truncate mt-0.5">
                  From: {exam.notes.title}
                </p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs text-foreground-muted flex items-center gap-1">
                  <Clock01Icon className="w-3 h-3" />
                  {formatDate(exam.created_at)}
                </span>
                <span className="text-xs text-foreground-muted">
                  <span className="font-medium text-foreground">{exam.total_questions}</span> questions
                </span>
                {exam.time_limit_minutes && (
                  <span className="text-xs text-foreground-muted">
                    {exam.time_limit_minutes} min
                  </span>
                )}
                <span className="text-xs text-foreground-muted">
                  {exam.attempt_count} {exam.attempt_count === 1 ? 'attempt' : 'attempts'}
                </span>
                {/* Best score with encouraging message */}
                {exam.best_score !== null && (
                  <div className="hidden sm:flex items-center gap-1.5">
                    <div className="w-20 bg-surface rounded-full h-1.5 overflow-hidden">
                      <div
                        className={clsx('h-full rounded-full transition-all duration-500', {
                          'bg-emerald-400': exam.best_score >= 80,
                          'bg-amber-400': exam.best_score >= 50 && exam.best_score < 80,
                          'bg-red-400': exam.best_score < 50,
                        })}
                        style={{ width: `${scorePercent}%` }}
                      />
                    </div>
                    <span className={clsx('text-[10px] font-bold', {
                      'text-emerald-600': exam.best_score >= 80,
                      'text-amber-600': exam.best_score >= 50 && exam.best_score < 80,
                      'text-red-500': exam.best_score < 50,
                    })}>
                      {exam.best_score}%
                    </span>
                    <span className="text-[10px] text-foreground-muted hidden lg:inline">
                      {getScoreMessage(exam.best_score)}
                    </span>
                  </div>
                )}
                {exam.best_score === null && exam.attempt_count === 0 && (
                  <span className="hidden sm:inline text-[10px] text-foreground-muted italic">Not attempted</span>
                )}
                {/* Question type badges */}
                <div className="hidden md:flex items-center gap-1">
                  {exam.include_multiple_choice && (
                    <span className="text-[10px] font-medium text-foreground-muted bg-surface px-1.5 py-0.5 rounded">MC</span>
                  )}
                  {exam.include_identification && (
                    <span className="text-[10px] font-medium text-foreground-muted bg-surface px-1.5 py-0.5 rounded">ID</span>
                  )}
                  {exam.include_essay && (
                    <span className="text-[10px] font-medium text-foreground-muted bg-surface px-1.5 py-0.5 rounded">Essay</span>
                  )}
                </div>
              </div>
            </div>

            {/* Actions - appear on hover */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
              <button
                className={`p-2 rounded-lg transition-colors ${
                  shareLinkCopied
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : 'bg-primary/10 text-primary hover:bg-primary/20'
                }`}
                title={shareLinkCopied ? 'Copied!' : 'Share'}
                onClick={(e) => {
                  e.stopPropagation();
                  onShare(e);
                }}
              >
                <Share01Icon className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors"
                title="Delete exam"
              >
                <Delete01Icon className="w-4 h-4" />
              </button>
              <span
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/15 transition-colors"
              >
                {exam.attempt_count > 0 ? 'Retake' : 'Take Exam'}
                <ArrowRight01Icon className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}
