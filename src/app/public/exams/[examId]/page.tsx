'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import Card from '@/component/ui/Card';
import Button from '@/component/ui/Button';
import SaveMaterialModal from '@/component/features/modal/SaveMaterialModal';
import { useCopyPublicExam, useSaveReference } from '@/hooks/useSavedMaterials';
import { ArrowLeft01Icon, Bookmark01Icon, PlayIcon } from 'hugeicons-react';

const supabase = createClient();

interface PublicExam {
  id: string;
  title: string;
  description: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  total_questions: number;
  time_limit_minutes: number | null;
  include_multiple_choice: boolean;
  include_identification: boolean;
  include_essay: boolean;
  updated_at: string;
  created_at: string;
}

interface PublicExamQuestion {
  id: string;
  question_type: 'multiple_choice' | 'identification' | 'essay';
  question: string;
  options: string[] | null;
  points: number;
  position: number;
}

const TYPE_LABELS: Record<PublicExamQuestion['question_type'], string> = {
  multiple_choice: 'Multiple Choice',
  identification: 'Identification',
  essay: 'Essay',
};

export default function PublicExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = params?.examId as string;

  const [exam, setExam] = useState<PublicExam | null>(null);
  const [questions, setQuestions] = useState<PublicExamQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [savingAction, setSavingAction] = useState<'reference' | 'copy' | null>(null);

  const saveReferenceMutation = useSaveReference();
  const copyExamMutation = useCopyPublicExam();

  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) return;
      setLoading(true);

      try {
        const { data: examData, error: examError } = await supabase
          .from('exam_sets')
          .select('id, title, description, difficulty, total_questions, time_limit_minutes, include_multiple_choice, include_identification, include_essay, updated_at, created_at')
          .eq('id', examId)
          .eq('is_public', true)
          .single();

        if (examError || !examData) {
          setError('Exam not found or not public');
          setLoading(false);
          return;
        }

        setExam(examData);

        const { data: questionsData, error: questionsError } = await supabase
          .from('exam_questions')
          .select('id, question_type, question, options, points, position')
          .eq('exam_id', examId)
          .order('position', { ascending: true });

        if (questionsError) {
          console.error('Error loading exam questions:', questionsError);
        }

        setQuestions(questionsData || []);
        setLoading(false);
      } catch (err) {
        setError('An error occurred while loading this exam');
        setLoading(false);
      }
    };

    fetchExam();
  }, [examId]);

  const updatedLabel = useMemo(() => {
    if (!exam) return '';
    const date = new Date(exam.updated_at || exam.created_at);
    return date.toLocaleDateString();
  }, [exam]);

  const handleSaveReference = async () => {
    if (!exam) return;
    setSavingAction('reference');
    try {
      await saveReferenceMutation.mutateAsync({ itemType: 'exam', itemId: exam.id });
      setIsSaveModalOpen(false);
    } catch (error) {
      console.error('Error saving exam reference:', error);
    } finally {
      setSavingAction(null);
    }
  };

  const handleSaveCopy = async () => {
    if (!exam) return;
    setSavingAction('copy');
    try {
      await copyExamMutation.mutateAsync(exam.id);
      setIsSaveModalOpen(false);
      router.push('/exams');
    } catch (error) {
      console.error('Error copying exam:', error);
    } finally {
      setSavingAction(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-foreground-muted">Loading exam...</p>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto px-4 py-8">
        <Card variant="elevated" className="text-center py-12">
          <p className="text-foreground-muted">{error || 'This exam is not available for public viewing.'}</p>
          <div className="mt-6 flex justify-center">
            <Link href="/community">
              <Button variant="outline">
                <ArrowLeft01Icon className="w-4 h-4 mr-2" />
                Back to Community
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link href="/community" className="flex items-center gap-2 text-foreground-muted hover:text-foreground transition-colors">
          <ArrowLeft01Icon className="w-4 h-4" />
          <span className="text-sm font-medium">Community</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsSaveModalOpen(true)}>
            <Bookmark01Icon className="w-4 h-4 mr-2" />
            Save
          </Button>
          <Link href={`/exam/${exam.id}`}>
            <Button size="sm">
              <PlayIcon className="w-4 h-4 mr-2" />
              Start Attempt
            </Button>
          </Link>
        </div>
      </div>

      <Card variant="elevated" className="space-y-3">
        <Card.Header>
          <h1 className="text-2xl font-bold text-foreground">{exam.title || 'Exam'}</h1>
          {exam.description && (
            <p className="text-sm text-foreground-muted">{exam.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-2 text-xs text-foreground-muted">
            <span>Updated {updatedLabel}</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span>{exam.total_questions} questions</span>
            <span className="h-1 w-1 rounded-full bg-border" />
            <span className="capitalize">{exam.difficulty}</span>
            {exam.time_limit_minutes && (
              <>
                <span className="h-1 w-1 rounded-full bg-border" />
                <span>{exam.time_limit_minutes} min</span>
              </>
            )}
          </div>
        </Card.Header>
      </Card>

      <Card variant="default" className="space-y-4">
        <Card.Header>
          <h2 className="text-lg font-semibold text-foreground">Preview questions</h2>
          <p className="text-sm text-foreground-muted">
            Answers are hidden in preview mode. Start an attempt to take the exam.
          </p>
        </Card.Header>
        <Card.Content>
          {questions.length === 0 ? (
            <p className="text-sm text-foreground-muted">No questions available for this exam.</p>
          ) : (
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={question.id} className="rounded-xl border border-border bg-surface px-4 py-3">
                  <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
                    <span>Question {index + 1}</span>
                    <span>{TYPE_LABELS[question.question_type]}</span>
                  </div>
                  <p className="text-sm text-foreground">{question.question}</p>
                  {question.options && question.options.length > 0 && (
                    <ul className="mt-3 space-y-1 text-sm text-foreground-muted list-disc list-inside">
                      {question.options.map((option, optionIndex) => (
                        <li key={`${question.id}-${optionIndex}`}>{option}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      <SaveMaterialModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        itemType="exam"
        title={exam.title || 'Exam'}
        onSaveReference={handleSaveReference}
        onSaveCopy={handleSaveCopy}
        savingAction={savingAction}
      />
    </div>
  );
}
