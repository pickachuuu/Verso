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
      <div className="w-full max-w-7xl mx-auto pt-8 md:pt-4 pb-20 px-2 md:px-0">
        <div className="w-full bg-background-muted rounded-[3rem] p-12 lg:p-20 text-center flex flex-col items-center border-[6px] border-surface">
          <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-foreground mb-4">
            EXAM NOT FOUND
          </h3>
          <p className="opacity-60 mb-10 text-[13px] max-w-md font-bold leading-relaxed uppercase tracking-widest leading-relaxed">
            {error || 'THIS EXAM IS NOT AVAILABLE FOR PUBLIC VIEWING.'}
          </p>
          <Link href="/community" className="px-10 py-5 rounded-full bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[13px] hover:scale-105 transition-all shadow-lg flex items-center gap-3">
            <ArrowLeft01Icon className="w-5 h-5" />
            BACK TO COMMUNITY
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[90rem] mx-auto pt-8 md:pt-4 pb-20 px-4 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
        
        {/* Left Sticky Pane */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-6 lg:sticky lg:top-8 h-fit z-20">
          
          {/* Hero Header */}
          <div className="w-full flex flex-col gap-5">
            <div className="flex items-center gap-3">
              <Link href="/community" className="px-4 py-2 rounded-full border-2 border-border/60 hover:bg-background-muted transition-all hidden sm:flex items-center gap-2">
                <ArrowLeft01Icon className="w-3.5 h-3.5" />
              </Link>
              <div className="w-3 h-3 rounded-full bg-warning flex-shrink-0" />
              <h1 className="text-[11px] font-black uppercase tracking-[0.3em] text-foreground/50">COMMUNITY EXAM</h1>
            </div>
            <h2 className="text-4xl lg:text-5xl xl:text-6xl font-black tracking-tighter text-foreground leading-[0.85] break-words uppercase">
              {exam.title || 'UNTITLED EXAM'}
            </h2>
            
            <div className="flex flex-col gap-3 mt-4">
              <div className="flex items-center justify-between px-5 py-4 rounded-[1.5rem] bg-background-muted border border-border/40">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">QUESTIONS</span>
                <span className="text-[12px] font-black uppercase tracking-widest text-foreground">{exam.total_questions}</span>
              </div>
              <div className="flex items-center justify-between px-5 py-4 rounded-[1.5rem] bg-background-muted border border-border/40">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">DIFFICULTY</span>
                <span className="text-[12px] font-black uppercase tracking-widest text-foreground">{exam.difficulty}</span>
              </div>
              {exam.time_limit_minutes && (
                <div className="flex items-center justify-between px-5 py-4 rounded-[1.5rem] bg-background-muted border border-border/40">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/50">TIME LIMIT</span>
                  <span className="text-[12px] font-black uppercase tracking-widest text-foreground">{exam.time_limit_minutes} MIN</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-3 mt-2">
              <button onClick={() => setIsSaveModalOpen(true)} className="w-full flex justify-center items-center gap-3 px-6 py-4 rounded-[2rem] bg-background-muted hover:bg-border/40 text-foreground font-black uppercase tracking-[0.2em] text-[11px] active:scale-95 transition-all">
                <Bookmark01Icon className="w-4 h-4" />
                SAVE EXAM
              </button>
              <Link href={`/exam/${exam.id}`} className="w-full flex justify-center items-center gap-3 px-6 py-4 rounded-[2rem] bg-foreground text-surface font-black uppercase tracking-[0.2em] text-[11px] hover:bg-foreground/90 active:scale-95 transition-all shadow-lg">
                <PlayIcon className="w-4 h-4 fill-current" />
                START ATTEMPT
              </Link>
            </div>
          </div>

          {exam.description && (
            <div className="w-full bg-background-muted rounded-[2rem] p-6">
              <p className="text-[13px] font-bold text-foreground/80 leading-relaxed">{exam.description}</p>
            </div>
          )}
        </div>

        {/* Right Scrolling Pane */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col min-h-[70vh] z-10 w-full lg:pt-8">

      <div className="w-full bg-background-muted rounded-[3rem] p-6 lg:p-10">
        <div className="mb-8">
          <h2 className="text-2xl lg:text-3xl font-black tracking-tighter uppercase text-foreground">PREVIEW QUESTIONS</h2>
          <p className="text-[11px] font-black tracking-widest uppercase text-foreground/40 mt-1">
            ANSWERS ARE HIDDEN IN PREVIEW MODE. START AN ATTEMPT TO TAKE THE EXAM.
          </p>
        </div>

        {questions.length === 0 ? (
          <div className="w-full text-center py-10">
            <p className="text-[13px] font-black uppercase tracking-widest text-foreground/50">NO QUESTIONS AVAILABLE FOR THIS EXAM.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="rounded-[1.5rem] bg-surface p-5 lg:p-6 shadow-sm">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-foreground/40 mb-3 pb-3 border-b border-border/30">
                  <span>QUESTION {index + 1}</span>
                  <span className="bg-background-muted px-3 py-1.5 rounded-full text-foreground/60">{TYPE_LABELS[question.question_type]}</span>
                </div>
                <p className="text-[14px] lg:text-[15px] font-bold text-foreground leading-relaxed">
                  {question.question}
                </p>
                {question.options && question.options.length > 0 && (
                  <div className="mt-5 space-y-2 pl-4 border-l-2 border-border/40">
                    {question.options.map((option, optionIndex) => (
                      <div key={`${question.id}-${optionIndex}`} className="flex items-start gap-3">
                        <span className="w-4 h-4 shrink-0 rounded-full border-2 border-border/60 mt-[2px]" />
                        <span className="text-[13px] font-medium text-foreground/80 leading-relaxed">{option}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

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
      </div>
    </div>
  );
}
