'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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
  SortingAZ01Icon,
  Calendar03Icon,
  MoreVerticalIcon,
} from 'hugeicons-react';
import { ExamIcon, ExamAddIcon } from '@/component/icons';

type SortOption = 'recent' | 'alphabetical' | 'oldest';
type DifficultyFilter = 'all' | 'easy' | 'medium' | 'hard' | 'mixed';

export default function ExamsPage() {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [examToDelete, setExamToDelete] = useState<ExamListItem | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: exams = [], isLoading } = useExams();
  const createExamMutation = useCreateExam();
  const deleteExamMutation = useDeleteExam();
  const togglePublicMutation = useToggleExamPublicStatus();

  const isSaving = createExamMutation.isPending;
  const isDeleting = deleteExamMutation.isPending;

  const processedExams = useMemo(() => {
    let filtered = [...exams];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((exam) => exam.title?.toLowerCase().includes(query));
    }
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter((exam) => exam.difficulty === difficultyFilter);
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
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    return filtered;
  }, [exams, searchQuery, difficultyFilter, sortBy]);

  const totalExams = exams.length;
  const totalQuestions = exams.reduce((sum, e) => sum + e.total_questions, 0);
  const sortLabel = sortBy === 'recent' ? 'Most recent' : sortBy === 'alphabetical' ? 'A–Z' : 'Oldest';
  const difficultyLabel = difficultyFilter === 'all' ? 'All' : difficultyFilter;
  const activeFilters = Number(difficultyFilter !== 'all');

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
    if (isSaving) return;
    try {
      const seenQuestions = new Set<string>();
      const uniqueQuestions = examResponse.questions.filter(q => {
        const key = `${q.question_type}:${q.question}`;
        if (seenQuestions.has(key)) return false;
        seenQuestions.add(key);
        return true;
      });
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
    <>
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">

        {/* Hero Header */}
        <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4">
          <div className="flex flex-col">
            <div className="flex items-center gap-3 mb-2 md:mb-3">
              <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
              <h1 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-foreground/50">TEST YOUR KNOWLEDGE</h1>
            </div>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-foreground leading-[0.85]">
              EXAMS
            </h2>
          </div>
          <div className="flex shrink-0 w-full md:w-auto pb-1 mt-2 md:mt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              className="group flex items-center justify-center gap-3 w-full sm:w-auto px-8 py-4 rounded-[2rem] bg-foreground text-surface hover:bg-foreground/90 transition-all font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95"
            >
              <ExamAddIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              CREATE EXAM
            </button>
          </div>
        </div>

        {/* Mobile Controls */}
        <div className="lg:hidden flex flex-col gap-4 w-full text-foreground relative z-20">
          <div className="flex w-full items-stretch gap-3 h-[3.5rem]">
            <div className="flex-1 bg-background-muted rounded-[2rem] flex items-center px-5 gap-3 min-w-0">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH EXAMS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
              />
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="w-[3.5rem] h-[3.5rem] shrink-0 bg-foreground text-surface rounded-[2rem] flex items-center justify-center active:scale-95 transition-transform relative"
            >
              <FilterIcon className="w-5 h-5" />
              {activeFilters > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-[#ff3b30] rounded-full border-2 border-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
            <span>SHOWING {processedExams.length} EXAM{processedExams.length !== 1 ? 'S' : ''}</span>
            <span>{difficultyLabel} / {sortLabel}</span>
          </div>
        </div>

        {/* Desktop Inline Toolbar */}
        <div className="hidden lg:flex flex-col gap-5 w-full relative z-20">
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 bg-background-muted rounded-[1.5rem] flex items-center px-5 gap-3 h-[3.25rem]">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH EXAMS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
              />
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <div className="bg-foreground text-surface px-5 h-[3.25rem] rounded-[1.5rem] flex items-center gap-2">
                <span className="text-[22px] font-black tracking-tighter leading-none">{processedExams.length}</span>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60">EXAMS</span>
              </div>
              <div className="bg-background-muted px-5 h-[3.25rem] rounded-[1.5rem] flex items-center gap-2">
                <span className="text-[22px] font-black tracking-tighter leading-none text-foreground">{totalQuestions}</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50">Q&apos;S</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">DIFFICULTY</span>
              {[
                { id: 'all', label: 'ALL' },
                { id: 'easy', label: 'EASY' },
                { id: 'medium', label: 'MEDIUM' },
                { id: 'hard', label: 'HARD' },
                { id: 'mixed', label: 'MIXED' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDifficultyFilter(opt.id as DifficultyFilter)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    difficultyFilter === opt.id ? 'bg-foreground text-surface shadow-md' : 'bg-background-muted text-foreground hover:bg-border/40'
                  }`}
                >{opt.label}</button>
              ))}
            </div>

            <div className="w-px h-6 bg-foreground/10 mx-1" />

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">SORT</span>
              {[
                { id: 'recent', label: 'RECENT' },
                { id: 'alphabetical', label: 'A–Z' },
                { id: 'oldest', label: 'OLDEST' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                    sortBy === opt.id ? 'bg-foreground text-surface shadow-md' : 'bg-background-muted text-foreground hover:bg-border/40'
                  }`}
                >{opt.label}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="w-full relative z-10">
          {isLoading ? (
            <ExamsSkeleton />
          ) : processedExams.length === 0 ? (
            <EmptyState
              hasFilters={searchQuery.trim() !== '' || difficultyFilter !== 'all'}
              onClearFilters={() => { setSearchQuery(''); setDifficultyFilter('all'); }}
              onCreateNew={() => setIsModalOpen(true)}
              totalExams={totalExams}
            />
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
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
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="REFINE SEARCH"
        description="FILTER YOUR EXAMS"
        footer={(
          <div className="flex gap-3 w-full p-2">
            <button onClick={() => { setDifficultyFilter('all'); setSortBy('recent'); }} className="flex-1 py-4 rounded-[2rem] bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[12px] active:scale-95 transition-all">RESET</button>
            <button onClick={() => setMobileFiltersOpen(false)} className="flex-[2] py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] shadow-[0_8px_30px_rgba(0,0,0,0.2)] active:scale-95 transition-all">APPLY FILTERS</button>
          </div>
        )}
      >
        <div className="space-y-10 pt-4 pb-6 px-1">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-5">DIFFICULTY</div>
            <div className="flex flex-col gap-3">
              {['all', 'easy', 'medium', 'hard', 'mixed'].map((id) => (
                <button key={id} onClick={() => setDifficultyFilter(id as DifficultyFilter)} className={`flex items-center gap-4 px-5 py-4 rounded-[2rem] transition-all shadow-sm ${difficultyFilter === id ? 'bg-foreground text-surface' : 'bg-background-muted text-foreground'}`}>
                  <span className="text-[12px] font-black uppercase tracking-widest">{id === 'all' ? 'ALL LEVELS' : id.toUpperCase()}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-5">SORT ORDER</div>
            <div className="flex flex-col gap-3">
              {[
                { id: 'recent', label: 'MOST RECENT', icon: <Clock01Icon className="w-5 h-5" /> },
                { id: 'alphabetical', label: 'ALPHABETICAL', icon: <SortingAZ01Icon className="w-5 h-5" /> },
                { id: 'oldest', label: 'OLDEST FIRST', icon: <Calendar03Icon className="w-5 h-5" /> },
              ].map((opt) => (
                <button key={opt.id} onClick={() => setSortBy(opt.id as SortOption)} className={`flex items-center gap-4 px-5 py-4 rounded-[2rem] transition-all shadow-sm ${sortBy === opt.id ? 'bg-foreground text-surface' : 'bg-background-muted text-foreground'}`}>
                  {opt.icon}
                  <span className="text-[12px] font-black uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </MobileBottomSheet>

      <CreateExamModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onExamGenerated={handleExamGenerated} saving={isSaving} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => { setIsDeleteModalOpen(false); setExamToDelete(null); }} onConfirm={handleConfirmDelete} title="DELETE EXAM" description={`Are you absolutely sure you want to delete "${examToDelete?.title}"? This will also delete all attempts and cannot be undone.`} itemName={examToDelete?.title || 'this exam'} itemType="note" loading={isDeleting} />
    </>
  );
}

// ============================================
// Components
// ============================================

function ExamsSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-background-muted rounded-[2rem] p-5 lg:p-6 flex items-start gap-4 lg:gap-5 animate-pulse relative"
        >
          <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1rem] flex-shrink-0 bg-foreground/10" />
          <div className="flex-1 min-w-0 flex flex-col justify-center pr-8 lg:pr-10 gap-2">
            <div className="h-4 lg:h-5 w-3/4 bg-foreground/5 rounded-full" />
            <div className="h-3 w-1/2 bg-foreground/5 rounded-full" />
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
              <div className="h-5 w-10 bg-foreground/5 rounded-[0.75rem]" />
              <div className="h-5 w-16 bg-foreground/5 rounded-[0.75rem]" />
              <div className="h-5 w-16 bg-foreground/5 rounded-[0.75rem]" />
            </div>
            <div className="flex items-center gap-3 w-full mt-1">
              <div className="flex-1 h-2 bg-foreground/5 rounded-full" />
              <div className="h-3 w-8 bg-foreground/5 rounded-full" />
            </div>
            <div className="h-2.5 w-24 bg-foreground/5 rounded-full" />
          </div>
          <div className="absolute top-4 right-4 lg:top-5 lg:right-5">
            <div className="w-10 h-10 bg-foreground/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasFilters, onClearFilters, onCreateNew, totalExams }: { hasFilters: boolean; onClearFilters: () => void; onCreateNew: () => void; totalExams: number; }) {
  return (
    <div className="w-full bg-background-muted rounded-[3rem] p-10 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
      <div className="w-40 h-40 mb-10 relative opacity-90 drop-shadow-xl saturate-50">
        <Image src="/brand/verso-empty-clean.svg" alt="Empty" fill className="object-contain" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">NO MATCHES</h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">TRY ADJUSTING YOUR FILTERS TO FIND WHAT YOU&apos;RE LOOKING FOR.</p>
          <button onClick={onClearFilters} className="px-10 py-4 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">CLEAR ALL FILTERS</button>
        </>
      ) : totalExams === 0 ? (
        <>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">BLANK SLATE</h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">CREATE YOUR FIRST EXAM FROM YOUR NOTES TO START TESTING YOUR KNOWLEDGE.</p>
          <button onClick={onCreateNew} className="group flex items-center justify-center gap-3 px-8 py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] shadow-lg active:scale-95 transition-all">
            <ExamAddIcon className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            CREATE FIRST EXAM
          </button>
        </>
      ) : (
        <>
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">NO RESULTS</h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold uppercase tracking-widest leading-relaxed">NO EXAMS MATCH YOUR CURRENT FILTERS.</p>
          <button onClick={onClearFilters} className="px-10 py-4 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">CLEAR FILTERS</button>
        </>
      )}
    </div>
  );
}

function ExamListItemComponent({ exam, onTakeExam, onDelete, onShare, shareLinkCopied }: { exam: ExamListItem; onTakeExam: () => void; onDelete: () => void; onShare: (e: React.MouseEvent) => void; shareLinkCopied: boolean; }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const scorePercent = exam.best_score ?? 0;
  const getDifficultyColor = () => {
    if (exam.difficulty === 'easy') return '#22c55e';
    if (exam.difficulty === 'medium') return '#f59e0b';
    if (exam.difficulty === 'hard') return '#ef4444';
    return '#6366f1';
  };

  const getDifficultyBadge = () => {
    if (exam.difficulty === 'easy') return { text: 'EASY', cls: 'bg-[#22c55e] text-white' };
    if (exam.difficulty === 'medium') return { text: 'MEDIUM', cls: 'bg-[#f59e0b] text-white' };
    if (exam.difficulty === 'hard') return { text: 'HARD', cls: 'bg-[#ef4444] text-white' };
    return { text: 'MIXED', cls: 'bg-[#6366f1] text-white' };
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

  const diffBadge = getDifficultyBadge();

  return (
    <div
      onClick={onTakeExam}
      className={`group relative w-full bg-background-muted rounded-[2rem] p-5 lg:p-6 flex items-start gap-4 lg:gap-5 cursor-pointer transition-all hover:bg-surface-elevated shadow-sm hover:shadow-xl hover:-translate-y-1 ${isMenuOpen ? 'z-50' : 'z-10'}`}
    >
      {/* Flat difficulty icon */}
      <div
        className="w-14 h-14 lg:w-16 lg:h-16 rounded-[1rem] flex-shrink-0 flex items-center justify-center shadow-inner relative overflow-hidden"
        style={{ background: getDifficultyColor() }}
      >
        <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
        <ExamIcon className="w-7 h-7 lg:w-8 lg:h-8 text-white relative z-10 drop-shadow-md" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col justify-center pr-8 lg:pr-10">
        <h3 className="text-[14px] lg:text-[16px] font-black uppercase tracking-widest text-foreground truncate max-w-[95%] leading-tight mb-2">
          {exam.title || 'UNTITLED EXAM'}
        </h3>

        {exam.notes && (
          <p className="text-[9px] lg:text-[10px] font-bold uppercase tracking-widest text-foreground/40 truncate mb-2">
            FROM {exam.notes.title}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-1.5 mb-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50">
            <Clock01Icon className="w-3.5 h-3.5 opacity-70" /> {formatDate(exam.created_at)}
          </span>
          <span className="inline-flex px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50">
            {exam.total_questions} Q
          </span>
          {exam.time_limit_minutes && (
            <span className="inline-flex px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50">
              {exam.time_limit_minutes} MIN
            </span>
          )}
          <span className={`inline-flex px-3 py-1.5 rounded-[0.75rem] text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none shadow-sm ${diffBadge.cls}`}>
            {diffBadge.text}
          </span>
          {exam.is_public && (
            <span className="inline-flex px-3 py-1.5 rounded-[0.75rem] bg-[#00c569] text-white text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none shadow-sm">PUBLIC</span>
          )}
        </div>

        {/* Score bar */}
        {exam.best_score !== null && (
          <div className="flex items-center gap-3 w-full">
            <div className="flex-1 bg-border/30 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${scorePercent}%`,
                  background: scorePercent >= 80 ? '#22c55e' : scorePercent >= 50 ? '#f59e0b' : '#ef4444',
                }}
              />
            </div>
            <span className="text-[10px] font-black text-foreground/60 shrink-0 w-8 text-right">{exam.best_score}%</span>
          </div>
        )}
        {exam.best_score === null && exam.attempt_count === 0 && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/30">NOT ATTEMPTED YET</p>
        )}
        {exam.attempt_count > 0 && (
          <p className="text-[9px] font-bold uppercase tracking-widest text-foreground/40 mt-1">{exam.attempt_count} ATTEMPT{exam.attempt_count !== 1 ? 'S' : ''}</p>
        )}
      </div>

      {/* 3-Dot Dropdown */}
      <div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className={`p-2.5 rounded-full transition-all shadow-sm ${isMenuOpen ? 'bg-foreground text-surface' : 'bg-surface/80 backdrop-blur-md text-foreground hover:bg-foreground hover:text-surface'}`}
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </button>
        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); }} />
            <div className="absolute top-full right-0 mt-2 w-[11rem] lg:w-[12rem] bg-surface rounded-[1.25rem] shadow-2xl p-2 flex flex-col gap-1.5 border-2 border-border/20 z-50 origin-top-right animate-in zoom-in-95 duration-100">
              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onTakeExam(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] bg-primary text-white hover:bg-[#1a4465] transition-all w-full text-left shadow-sm"
              >
                <ArrowRight01Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{exam.attempt_count > 0 ? 'RETAKE' : 'TAKE EXAM'}</span>
              </button>
              <button
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] transition-all w-full text-left ${shareLinkCopied ? 'bg-[#00c569] text-white' : 'hover:bg-background-muted text-foreground'}`}
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onShare(e); }}
              >
                <Share01Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{shareLinkCopied ? 'COPIED!' : 'SHARE LINK'}</span>
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setIsMenuOpen(false); onDelete(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] hover:bg-[#ff3b30]/10 hover:text-[#ff3b30] text-[#ff3b30] transition-all w-full text-left"
              >
                <Delete01Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">DELETE</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
