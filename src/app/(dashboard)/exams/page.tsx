'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClayCard, ClayBadge, ClayButton } from '@/component/ui/Clay';
import { useExamActions, ExamListItem } from '@/hook/useExamActions';
import { ExamGenerationResponse } from '@/lib/gemini';
import CreateExamModal from '@/component/features/modal/CreateExamModal';
import ConfirmDeleteModal from '@/component/features/modal/ConfirmDeleteModal';
import {
  TestTube01Icon,
  SparklesIcon,
  Clock01Icon,
  Target01Icon,
  Add01Icon,
  Delete01Icon,
  ArrowRight01Icon,
  Award01Icon,
  CheckmarkCircle01Icon,
  Cancel01Icon
} from 'hugeicons-react';
import { clsx } from 'clsx';

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
  const [exams, setExams] = useState<ExamListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    getUserExams,
    createExamSet,
    saveExamQuestions,
    deleteExam
  } = useExamActions();

  // Load exams on mount
  useEffect(() => {
    const loadExams = async () => {
      setIsLoading(true);
      try {
        const data = await getUserExams();
        setExams(data);
      } catch (error) {
        console.error('Error loading exams:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExams();
  }, [getUserExams]);

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

    setIsSaving(true);
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

      // Create the exam set
      const examId = await createExamSet(
        noteIds.length === 1 ? noteIds[0] : null,
        title,
        {
          difficulty: config.difficulty,
          timeLimitMinutes: config.timeLimitEnabled ? config.timeLimitMinutes : null,
          includeMultipleChoice: config.includeMultipleChoice,
          includeIdentification: config.includeIdentification,
          includeEssay: config.includeEssay,
        }
      );

      // Save the unique questions
      await saveExamQuestions(examId, uniqueQuestions);

      // Refresh the list
      const data = await getUserExams();
      setExams(data);

      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving exam:', error);
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, createExamSet, saveExamQuestions, getUserExams]);

  const handleDeleteClick = useCallback((exam: ExamListItem) => {
    setExamToDelete(exam);
    setIsDeleteModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(async () => {
    if (!examToDelete) return;

    setIsDeleting(true);
    try {
      await deleteExam(examToDelete.id);
      setExams(prev => prev.filter(e => e.id !== examToDelete.id));
      setIsDeleteModalOpen(false);
      setExamToDelete(null);
    } catch (error) {
      console.error('Error deleting exam:', error);
    } finally {
      setIsDeleting(false);
    }
  }, [examToDelete, deleteExam]);

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
                </div>
                <p className="text-foreground-muted">
                  Test your knowledge with AI-generated practice exams
                </p>
              </div>
            </div>

            {/* Create button */}
            <ClayButton
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              className="bg-secondary hover:bg-secondary/90"
            >
              <Add01Icon className="w-5 h-5 mr-2" />
              Create Exam
            </ClayButton>
          </div>
        </div>
      </ClayCard>

      {/* Exams List */}
      {isLoading ? (
        <ClayCard variant="elevated" padding="lg" className="rounded-3xl">
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin w-8 h-8 border-2 border-secondary border-t-transparent rounded-full" />
          </div>
        </ClayCard>
      ) : exams.length === 0 ? (
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

            <h3 className="text-2xl font-bold text-foreground mb-3">No Exams Yet</h3>
            <p className="text-foreground-muted mb-8 max-w-md mx-auto">
              Create your first practice exam from your notes. AI will generate questions to test your knowledge.
            </p>

            <ClayButton
              variant="primary"
              size="lg"
              onClick={() => setIsModalOpen(true)}
              className="bg-secondary hover:bg-secondary/90"
            >
              <SparklesIcon className="w-5 h-5 mr-2" />
              Create Your First Exam
            </ClayButton>

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
          </div>
        </ClayCard>
      ) : (
        <div className="grid gap-4">
          {exams.map((exam) => (
            <ClayCard
              key={exam.id}
              variant="elevated"
              padding="md"
              className="rounded-2xl hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Exam info */}
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/10">
                    <TestTube01Icon className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-lg">{exam.title}</h3>
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
                      onClick={() => handleDeleteClick(exam)}
                      className="text-red-500 hover:bg-red-50"
                    >
                      <Delete01Icon className="w-4 h-4" />
                    </ClayButton>
                    <ClayButton
                      variant="primary"
                      size="sm"
                      onClick={() => handleTakeExam(exam.id)}
                      className="bg-secondary hover:bg-secondary/90"
                    >
                      Take Exam
                      <ArrowRight01Icon className="w-4 h-4 ml-1" />
                    </ClayButton>
                  </div>
                </div>
              </div>
            </ClayCard>
          ))}
        </div>
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
