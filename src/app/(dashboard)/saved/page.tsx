'use client';

import Link from 'next/link';
import { ClayCard } from '@/component/ui/Clay';
import { Bookmark01Icon } from 'hugeicons-react';
import { NotebookIcon, FlashcardIcon, ExamIcon } from '@/component/icons';

export default function SavedMaterialsPage() {
  return (
    <div className="space-y-6">
      <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="p-4 rounded-2xl bg-background-muted border border-border">
              <Bookmark01Icon className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">Saved Materials</h1>
              <p className="text-foreground-muted mt-1">
                Quick access to your pinned notes, flashcards, and exams.
              </p>
            </div>
          </div>
        </div>
      </ClayCard>

      <ClayCard variant="default" padding="lg" className="rounded-3xl">
        <div className="text-center py-10">
          <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-background-muted border border-border flex items-center justify-center">
            <Bookmark01Icon className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">No saved materials yet</h2>
          <p className="text-sm text-foreground-muted mb-6 max-w-md mx-auto">
            Save items from your Library, Flashcards, or Exams to pin them here for quick access.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/library" className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all flex items-center gap-2">
              <NotebookIcon className="w-4 h-4" />
              Go to Library
            </Link>
            <Link href="/flashcards" className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all flex items-center gap-2">
              <FlashcardIcon className="w-4 h-4" />
              Go to Flashcards
            </Link>
            <Link href="/exams" className="px-4 py-2 rounded-xl bg-surface border border-border text-sm font-semibold text-foreground hover:shadow-md transition-all flex items-center gap-2">
              <ExamIcon className="w-4 h-4" />
              Go to Exams
            </Link>
          </div>
        </div>
      </ClayCard>
    </div>
  );
}
