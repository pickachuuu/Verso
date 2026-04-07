'use client';

import { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import MobileBottomSheet from '@/component/ui/MobileBottomSheet';
import { NotebookColorKey, NOTEBOOK_COLORS } from '@/component/ui/ClayNotebookCover';
import CreateNoteButton from '@/component/features/CreateNoteButton';
import {
  Search01Icon,
  FilterIcon,
  SparklesIcon,
  Share01Icon,
  Clock01Icon,
  SortingAZ01Icon,
  Calendar03Icon,
  GlobeIcon,
  LockIcon,
  Delete01Icon,
  MoreVerticalIcon
} from 'hugeicons-react';
import { NotebookIcon } from '@/component/icons';
import GenerateStudyMaterialModal from '@/component/features/modal/GenerateStudyMaterialModal';
import ForgeFlashcardsModal from '@/component/features/modal/ForgeFlashcardsModal';
import CreateExamModal from '@/component/features/modal/CreateExamModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import { ExamGenerationResponse, GeminiResponse } from '@/lib/gemini';

// TanStack Query hooks
import { useUserNotes, useDeleteNote, useToggleNotePublicStatus, Note } from '@/hooks/useNotes';
import { useSaveGeneratedFlashcards } from '@/hooks/useFlashcards';
import { useCreateExam } from '@/hooks/useExams';

type SortOption = 'recent' | 'alphabetical' | 'oldest';

export default function LibraryPage() {
  const saveFlashcardsMutation = useSaveGeneratedFlashcards();
  const createExamMutation = useCreateExam();

  const { data: notes = [], isLoading, error, refetch } = useUserNotes();
  const deleteNoteMutation = useDeleteNote();
  const togglePublicMutation = useToggleNotePublicStatus();

  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedColor, setSelectedColor] = useState<NotebookColorKey | 'all'>('all');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isForgeModalOpen, setIsForgeModalOpen] = useState(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [shareLinkCopied, setShareLinkCopied] = useState<string | null>(null);

  const processedNotes = useMemo(() => {
    let filtered = [...notes];
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title?.toLowerCase().includes(query) ||
          note.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    if (selectedColor !== 'all') {
      filtered = filtered.filter((note) => (note.cover_color || 'royal') === selectedColor);
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
        filtered.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    }
    return filtered;
  }, [notes, searchQuery, selectedColor, sortBy]);

  const totalNotes = notes.length;
  const sortLabel = sortBy === 'recent' ? 'Most recent' : sortBy === 'alphabetical' ? 'A–Z' : 'Oldest';
  const colorLabel = selectedColor === 'all' ? 'All colors' : NOTEBOOK_COLORS[selectedColor].name;
  const activeFilters = Number(selectedColor !== 'all');

  const handleGenerateMaterials = (note: Note) => {
    setSelectedNote(note);
    setIsGenerateModalOpen(true);
  };

  const handleSelectMaterial = (type: 'flashcards' | 'exam') => {
    setIsGenerateModalOpen(false);
    if (type === 'flashcards') setIsForgeModalOpen(true);
    else setIsExamModalOpen(true);
  };

  const handleCopyShareLink = async (note: Note, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (!note.is_public) {
      try { await togglePublicMutation.mutateAsync({ noteId: note.id, isPublic: true }); }
      catch (error) { console.error(error); return; }
    }
    const shareUrl = `${window.location.origin}/public/notes/${note.id}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkCopied(note.id);
      setTimeout(() => setShareLinkCopied(null), 2000);
    } catch (error) { console.error(error); }
  };

  const handleDeleteNote = (note: Note) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedNote) return;
    try {
      await deleteNoteMutation.mutateAsync(selectedNote.id);
      setSaveSuccess('Notebook deleted successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveSuccess('Error deleting notebook.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedNote(null);
    }
  };

  const handleFlashcardsGenerated = async (geminiResponse: GeminiResponse, noteIds: string[], setTitle: string) => {
    setSaveSuccess(null);
    try {
      const difficulty = geminiResponse.flashcards[0]?.difficulty || 'medium';
      await saveFlashcardsMutation.mutateAsync({
        noteId: noteIds.length === 1 ? noteIds[0] : undefined,
        noteTitle: setTitle || selectedNote?.title || 'Untitled Note',
        difficulty, geminiResponse
      });
      setSaveSuccess(`Successfully saved ${geminiResponse.flashcards.length} flashcards!`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err) {
      setSaveSuccess('Error saving flashcards.');
      setTimeout(() => setSaveSuccess(null), 3000);
    } finally {
      setIsForgeModalOpen(false);
      setSelectedNote(null);
    }
  };

  const handleExamGenerated = useCallback(async (examResponse: ExamGenerationResponse, noteIds: string[], title: string, config: any) => {
    try {
      const seenQuestions = new Set<string>();
      const uniqueQuestions = examResponse.questions.filter((q) => {
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
      setSaveSuccess('Exam created successfully!');
      setTimeout(() => setSaveSuccess(null), 3000);
      setIsExamModalOpen(false);
      setSelectedNote(null);
    } catch (err) {
      setSaveSuccess('Error saving exam.');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  }, [createExamMutation]);

  if (error) {
    return (
      <div className="space-y-6 pt-12">
        <LibraryHeader totalNotes={0} />
        <div className="bg-foreground text-surface rounded-[3rem] p-12 text-center">
          <h3 className="text-4xl font-black uppercase tracking-tight mb-4">ERROR LOADING</h3>
          <p className="opacity-70 mb-8 max-w-md mx-auto text-lg leading-relaxed font-bold">
            There was an error loading your library.
          </p>
          <button onClick={() => refetch()} className="px-8 py-5 bg-surface text-foreground rounded-full font-black uppercase tracking-[0.2em] text-[13px] hover:bg-surface-elevated transition-all active:scale-95">
            RETRY NOW
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Container - Extra top padding to clear mobile dock perfectly */}
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 space-y-10 lg:space-y-14 px-2 md:px-0">
        
        {/* Massive Hero Header */}
        <LibraryHeader totalNotes={totalNotes} />

        {/* Global Toast */}
        {saveSuccess && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4">
            <div className={`px-8 py-5 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex items-center gap-4 ${
              saveSuccess.includes('Error') ? 'bg-[#ff3b30] text-white' : 'bg-foreground text-surface'
            }`}>
              <SparklesIcon className="w-6 h-6 flex-shrink-0" />
              <p className="text-[14px] font-black uppercase tracking-widest">{saveSuccess}</p>
            </div>
          </div>
        )}

        {/* ==============================================
            MOBILE CONTROLS (Visible on Mobile only)
        ============================================== */}
        <div className="lg:hidden flex flex-col gap-6 w-full text-foreground relative z-20">
          <div className="flex w-full items-stretch gap-3 h-[4rem]">
            <div className="flex-1 bg-background-muted rounded-[2rem] flex items-center px-6 gap-4 min-w-0">
              <Search01Icon className="w-6 h-6 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH NOTEBOOKS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[13px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
              />
            </div>
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="w-[4rem] h-[4rem] shrink-0 bg-foreground text-surface rounded-[2rem] flex items-center justify-center active:scale-95 transition-transform relative"
            >
              <FilterIcon className="w-6 h-6" />
              {activeFilters > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-[#ff3b30] rounded-full border-2 border-foreground" />}
            </button>
          </div>
          <div className="flex items-center justify-between px-2 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">
            <span>SHOWING {processedNotes.length} NOTEBOOK{processedNotes.length !== 1 ? 'S' : ''}</span>
            <span>{colorLabel} / {sortLabel}</span>
          </div>
        </div>

        {/* ==============================================
            DESKTOP INLINE TOOLBAR (Hidden on Mobile)
        ============================================== */}
        <div className="hidden lg:flex flex-col gap-5 w-full relative z-20">
          {/* Search + Count Row */}
          <div className="flex items-center gap-4 w-full">
            <div className="flex-1 bg-background-muted rounded-[1.5rem] flex items-center px-5 gap-3 h-[3.25rem]">
              <Search01Icon className="w-5 h-5 opacity-40 shrink-0" />
              <input
                type="text"
                placeholder="SEARCH NOTEBOOKS..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none focus:outline-none text-[12px] font-black uppercase tracking-widest text-foreground placeholder:text-foreground/30 min-w-0"
              />
            </div>
            <div className="shrink-0 bg-foreground text-surface px-5 h-[3.25rem] rounded-[1.5rem] flex items-center gap-2">
              <span className="text-[22px] font-black tracking-tighter leading-none">{processedNotes.length}</span>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-60">/ {totalNotes}</span>
            </div>
          </div>

          {/* Filters Row */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Color Chips */}
            <div className="flex items-center gap-2 mr-1">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/40 mr-1">COLOR</span>
              <button
                onClick={() => setSelectedColor('all')}
                className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                  selectedColor === 'all' ? 'bg-foreground text-surface shadow-md' : 'bg-background-muted text-foreground hover:bg-border/40'
                }`}
              >ALL</button>
              {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    selectedColor === color ? 'ring-[3px] ring-foreground/30 scale-110 shadow-md' : 'hover:scale-110'
                  }`}
                  style={{ background: NOTEBOOK_COLORS[color].primary }}
                  title={NOTEBOOK_COLORS[color].name}
                />
              ))}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-foreground/10 mx-1" />

            {/* Sort Chips */}
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

        {/* ==============================================
            CONTENT AREA
        ============================================== */}
        <div className="w-full relative z-10">
          {isLoading ? (
            <NotebooksSkeleton />
          ) : processedNotes.length === 0 ? (
            <EmptyState 
              hasFilters={searchQuery.trim() !== '' || selectedColor !== 'all'} 
              onClearFilters={() => { setSearchQuery(''); setSelectedColor('all'); }} 
            />
          ) : (
            <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {processedNotes.map((note) => (
                <NotebookListItem
                  key={note.id}
                  note={note}
                  onGenerate={() => handleGenerateMaterials(note)}
                  onDelete={() => handleDeleteNote(note)}
                  onShare={(e) => handleCopyShareLink(note, e)}
                  onToggleVisibility={() => togglePublicMutation.mutate({ noteId: note.id, isPublic: !note.is_public })}
                  shareLinkCopied={shareLinkCopied === note.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ==============================================
          MOBILE BOTTOM SHEET FILTERS
      ============================================== */}
      <MobileBottomSheet
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="REFINE SEARCH"
        description="FILTER YOUR KNOWLEDGE BASE"
        footer={(
          <div className="flex gap-2 w-full">
            <button
              onClick={() => { setSelectedColor('all'); setSortBy('recent'); }}
              className="flex-1 py-3 rounded-xl bg-background-muted text-foreground font-black uppercase tracking-[0.2em] text-[11px] hover:bg-border/40 active:scale-95 transition-all"
            >
              RESET
            </button>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-[2] py-3 rounded-xl bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[11px] shadow-sm active:scale-95 transition-all border border-foreground"
            >
              APPLY FILTERS
            </button>
          </div>
        )}
      >
        <div className="space-y-6 pt-2 pb-2 px-1">
          {/* Colors */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-3">NOTEBOOK COLOR</div>
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => setSelectedColor('all')}
                className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm ${
                  selectedColor === 'all' ? 'bg-foreground text-surface' : 'bg-background-muted text-foreground'
                }`}
              >
                ALL
              </button>
              {(Object.keys(NOTEBOOK_COLORS) as NotebookColorKey[]).map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-10 h-10 rounded-xl transition-all shadow-sm ${
                    selectedColor === color ? 'ring-2 ring-foreground/20 scale-110 shadow-md border-2 border-foreground' : 'border border-border/40'
                  }`}
                  style={{ background: NOTEBOOK_COLORS[color].primary }}
                  title={NOTEBOOK_COLORS[color].name}
                />
              ))}
            </div>
          </div>

          {/* Sort Menu */}
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/50 mb-3">SORT ORDER</div>
            <div className="flex flex-col gap-2">
              {[
                { id: 'recent', label: 'MOST RECENT', icon: <Clock01Icon className="w-5 h-5" /> },
                { id: 'alphabetical', label: 'ALPHABETICAL (A-Z)', icon: <SortingAZ01Icon className="w-5 h-5" /> },
                { id: 'oldest', label: 'OLDEST ARCHIVES', icon: <Calendar03Icon className="w-5 h-5" /> },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSortBy(opt.id as SortOption)}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all shadow-sm border ${
                    sortBy === opt.id ? 'bg-foreground text-surface border-foreground' : 'bg-background-muted text-foreground border-transparent hover:border-border/60'
                  }`}
                >
                  {opt.icon}
                  <span className="text-[11px] font-black uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </MobileBottomSheet>

      {/* ==============================================
          MODALS
      ============================================== */}
      <GenerateStudyMaterialModal isOpen={isGenerateModalOpen} onClose={() => { setIsGenerateModalOpen(false); setSelectedNote(null); }} onSelect={handleSelectMaterial} noteTitle={selectedNote?.title || 'Untitled Notebook'} />
      <ForgeFlashcardsModal isOpen={isForgeModalOpen} onClose={() => { setIsForgeModalOpen(false); setSelectedNote(null); }} onFlashcardsGenerated={handleFlashcardsGenerated} saving={saveFlashcardsMutation.isPending} initialSelectedNoteIds={selectedNote ? [selectedNote.id] : undefined} />
      <CreateExamModal isOpen={isExamModalOpen} onClose={() => { setIsExamModalOpen(false); setSelectedNote(null); }} onExamGenerated={handleExamGenerated} saving={createExamMutation.isPending} initialSelectedNoteIds={selectedNote ? [selectedNote.id] : undefined} />
      <ConfirmDeleteModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleConfirmDelete} title="DELETE NOTEBOOK" description="Are you absolutely sure you want to permanently delete this notebook? This action cannot be undone." itemName={selectedNote?.title || 'Untitled Notebook'} itemType="notebook" />
    </>
  );
}

// ============================================
// Components
// ============================================

function LibraryHeader({ totalNotes }: { totalNotes: number }) {
  return (
    <div className="w-full flex flex-col md:flex-row md:items-end justify-between gap-6 md:gap-8 pb-4">
      <div className="flex flex-col">
        <div className="flex items-center gap-3 mb-2 md:mb-3">
          <div className="w-3 h-3 rounded-full bg-primary flex-shrink-0" />
          <h1 className="text-[11px] md:text-[12px] font-black uppercase tracking-[0.3em] text-foreground/50">YOUR KNOWLEDGE BASE</h1>
        </div>
        <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase text-foreground leading-[0.85] break-words">
          LIBRARY
        </h2>
      </div>

      <div className="flex shrink-0 w-full md:w-auto pb-1 mt-4 md:mt-0">
        <div className="w-full md:w-auto">
          <CreateNoteButton />
        </div>
      </div>
    </div>
  );
}

function NotebooksSkeleton() {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="w-full bg-background-muted rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-6 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8 animate-pulse relative"
        >
          <div className="flex items-start gap-5 lg:gap-6 flex-1 min-w-0">
            <div className="w-20 h-28 lg:w-24 lg:h-32 rounded-[1rem] lg:rounded-[1.25rem] flex-shrink-0 bg-foreground/10" />
            <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
              <div className="h-4 lg:h-5 w-3/4 bg-foreground/5 rounded-full" />
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <div className="h-5 w-20 bg-foreground/5 rounded-[0.75rem]" />
                <div className="h-5 w-12 bg-foreground/5 rounded-[0.75rem]" />
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-2 pt-2 border-t-2 border-border/20">
                <div className="h-5 w-16 bg-foreground/5 rounded-[0.5rem]" />
                <div className="h-5 w-20 bg-foreground/5 rounded-[0.5rem]" />
              </div>
            </div>
          </div>
          <div className="absolute top-4 right-4 lg:top-5 lg:right-5">
            <div className="w-10 h-10 bg-foreground/5 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function NotebookListItem({
  note, onGenerate, onDelete, onShare, onToggleVisibility, shareLinkCopied,
}: {
  note: Note; onGenerate: () => void; onDelete: () => void; onShare: (e: React.MouseEvent) => void; onToggleVisibility: () => void; shareLinkCopied: boolean;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const color = (note.cover_color as NotebookColorKey) || 'royal';
  const colorTheme = NOTEBOOK_COLORS[color];

  const formatDate = (date: string) => {
    const d = new Date(date);
    const diff = Math.floor((new Date().getTime() - d.getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString();
  };

  const wordCount = (() => {
    if (!note.content) return 0;
    const txt = note.content.replace(/<[^>]*>/g, '').trim();
    return txt.length === 0 ? 0 : txt.split(/\s+/).filter(Boolean).length;
  })();

  return (
    <div className={`group relative w-full bg-background-muted rounded-[2rem] lg:rounded-[2.5rem] p-5 lg:p-6 flex flex-col xl:flex-row xl:items-center gap-5 xl:gap-8 transition-all hover:bg-surface-elevated shadow-sm hover:shadow-xl hover:-translate-y-1 ${isMenuOpen ? 'z-50' : 'z-10'}`}>
      {/* Clickable Overlay */}
      <Link href={`/editor/${note.slug || note.id}`} className="absolute inset-0 z-0 rounded-[2rem] lg:rounded-[2.5rem]" aria-label={`Open ${note.title}`} />

      {/* Notebook Core Detail (Cover + Info) */}
      <div className="relative z-10 flex items-start gap-5 lg:gap-6 flex-1 min-w-0 pointer-events-none">
        
        {/* Massive flat vertical cover block */}
        <div 
          className="w-20 h-28 lg:w-24 lg:h-32 rounded-[1rem] lg:rounded-[1.25rem] flex-shrink-0 flex items-center justify-center shadow-inner overflow-hidden relative"
          style={{ background: colorTheme.primary }}
        >
          {/* subtle pattern inside the cover */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay" style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '12px 12px' }} />
          <NotebookIcon className="w-10 h-10 lg:w-12 lg:h-12 opacity-90 text-white relative z-10 drop-shadow-md" />
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0 lg:pt-1 flex flex-col justify-center h-full pr-8 lg:pr-10">
          <h3 className="text-[14px] lg:text-[16px] font-black uppercase tracking-widest text-foreground truncate max-w-[95%] leading-tight mb-2">
            {note.title || 'UNTITLED NOTEBOOK'}
          </h3>
          
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50 backdrop-blur-sm">
              <Clock01Icon className="w-3.5 h-3.5 opacity-70" /> {formatDate(note.updated_at)}
            </span>
            {wordCount > 0 && (
              <span className="inline-flex px-3 py-1.5 rounded-[0.75rem] border-2 border-border/80 text-foreground-muted text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none bg-surface/50 backdrop-blur-sm">
                {wordCount} W
              </span>
            )}
            {note.is_public && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[0.75rem] bg-[#00c569] text-white text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none shadow-sm">
                <GlobeIcon className="w-3.5 h-3.5" /> PUBLIC
              </div>
            )}
          </div>
          
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-3 border-t-2 border-border/40 pt-2 lg:pt-3">
              {note.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-3 py-1.5 rounded-[0.5rem] bg-foreground text-surface text-[9px] lg:text-[10px] font-black uppercase tracking-[0.2em] leading-none whitespace-nowrap shadow-sm">
                  {tag.length > 15 ? tag.slice(0, 13) + '...' : tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="text-[10px] font-black uppercase tracking-widest text-foreground/50 ml-1">+{note.tags.length - 3} MORE</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3-Dot Dropdown Menu for Actions */}
      <div className="absolute top-4 right-4 lg:top-5 lg:right-5 z-20 pointer-events-auto">
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
          className={`p-2.5 rounded-full transition-all shadow-sm ${
            isMenuOpen ? 'bg-foreground text-surface' : 'bg-surface/80 backdrop-blur-md text-foreground hover:bg-foreground hover:text-surface'
          }`}
        >
          <MoreVerticalIcon className="w-5 h-5" />
        </button>

        {isMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); }} />
            <div className="absolute top-full right-0 mt-2 w-[11rem] lg:w-[12rem] bg-surface rounded-[1.25rem] shadow-2xl p-2 flex flex-col gap-1.5 border-2 border-border/20 z-50 origin-top-right animate-in zoom-in-95 duration-100">
              
              <button
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] transition-all w-full text-left ${
                  shareLinkCopied ? 'bg-[#00c569] text-white cursor-default shadow-sm' : 'hover:bg-background-muted text-foreground'
                }`}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onShare(e); }}
              >
                <Share01Icon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{shareLinkCopied ? 'COPIED!' : 'SHARE LINK'}</span>
              </button>

              <button
                className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] hover:bg-background-muted text-foreground transition-all w-full text-left"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onToggleVisibility(); }}
              >
                {note.is_public ? <GlobeIcon className="w-4 h-4 shrink-0" /> : <LockIcon className="w-4 h-4 shrink-0" />}
                <span className="text-[10px] font-bold uppercase tracking-widest">{note.is_public ? 'MAKE PRIVATE' : 'MAKE PUBLIC'}</span>
              </button>

              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onGenerate(); }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-[0.75rem] bg-primary text-white hover:bg-[#1a4465] transition-all w-full text-left shadow-sm"
              >
                <SparklesIcon className="w-4 h-4 shrink-0" />
                <span className="text-[10px] font-bold uppercase tracking-widest">GENERATE</span>
              </button>

              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMenuOpen(false); onDelete(); }}
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

function EmptyState({
  hasFilters, onClearFilters
}: {
  hasFilters: boolean; onClearFilters: () => void;
}) {
  return (
    <div className="w-full bg-background-muted rounded-[3.5rem] p-10 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
      <div className="w-48 h-48 mb-10 relative opacity-90 drop-shadow-xl saturate-50">
        <Image src="/brand/verso-empty-clean.svg" alt="Empty" fill className="object-contain" />
      </div>
      {hasFilters ? (
        <>
          <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-foreground mb-4">NO MATCHES</h3>
          <p className="opacity-60 mb-10 text-[15px] max-w-md font-bold leading-relaxed uppercase tracking-widest leading-relaxed">
            NOTHING FOUND FOR YOUR CURRENT SEARCH OR FORMAT FILTERS.
          </p>
          <button onClick={onClearFilters} className="px-10 py-5 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[13px] hover:scale-105 transition-all shadow-[0_12px_30px_rgba(0,0,0,0.15)]">
            CLEAR ALL FILTERS
          </button>
        </>
      ) : (
        <>
          <h3 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter text-foreground mb-4">BLANK SLATE</h3>
          <p className="opacity-60 mb-10 text-[15px] max-w-md font-bold leading-relaxed uppercase tracking-widest leading-relaxed">
            CREATE YOUR FIRST NOTEBOOK TO BEGIN STORING KNOWLEDGE.
          </p>
          <div className="w-full max-w-xs">
            <CreateNoteButton />
          </div>
        </>
      )}
    </div>
  );
}
