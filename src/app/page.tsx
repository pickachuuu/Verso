'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, Variants } from 'framer-motion';
import { ArrowRight01Icon, PencilEdit01Icon, Tag01Icon, Book01Icon, LeftToRightListNumberIcon, SparklesIcon, FlashIcon, Note01Icon, BookOpen01Icon, Clock01Icon, CheckmarkCircle02Icon, AiChat02Icon, Target01Icon, Download01Icon } from 'hugeicons-react';
import { FlashcardIcon, ExamIcon, NotebookIcon } from '@/component/icons';
import { createClient } from '@/utils/supabase/client';
import LandingNavbar from '@/component/Layout/navbar/LandingNavbar';
import { useUIStore } from '@/stores';
import { MultipleChoiceInput, IdentificationInput, EssayInput, StepperQuestion } from '@/component/ui/ExamQuestionStepper';





const fadeUp: Variants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const heroDoodles = [
  { icon: FlashIcon, top: '10%', left: '8%', rotate: -12, size: 'w-16 h-16 md:w-20 md:h-20', delay: 0 },
  { icon: BookOpen01Icon, top: '18%', right: '10%', rotate: 8, size: 'w-20 h-20 md:w-24 md:h-24', delay: 1.5 },
  { icon: PencilEdit01Icon, bottom: '30%', left: '12%', rotate: 15, size: 'w-14 h-14 md:w-16 md:h-16', delay: 3 },
  { icon: CheckmarkCircle02Icon, top: '50%', left: '5%', rotate: -5, size: 'w-12 h-12 md:w-14 md:h-14', delay: 4.5 },
  { icon: Note01Icon, bottom: '22%', right: '8%', rotate: -10, size: 'w-16 h-16 md:w-20 md:h-20', delay: 2 },
  { icon: AiChat02Icon, top: '8%', left: '45%', rotate: 6, size: 'w-14 h-14 md:w-16 md:h-16', delay: 5 },
  { icon: Clock01Icon, bottom: '12%', left: '25%', rotate: -8, size: 'w-16 h-16 md:w-20 md:h-20', delay: 3.5 },
  { icon: Target01Icon, top: '35%', right: '6%', rotate: 12, size: 'w-14 h-14 md:w-16 md:h-16', delay: 1 },
  { icon: FlashIcon, bottom: '40%', right: '12%', rotate: -15, size: 'w-12 h-12 md:w-14 md:h-14', delay: 6 },
  { icon: BookOpen01Icon, bottom: '55%', left: '3%', rotate: -18, size: 'w-16 h-16 md:w-20 md:h-20', delay: 4 },
  { icon: Note01Icon, top: '5%', right: '30%', rotate: 18, size: 'w-14 h-14 md:w-18 md:h-18', delay: 2.5 },
  { icon: Target01Icon, bottom: '8%', right: '30%', rotate: -22, size: 'w-14 h-14 md:w-16 md:h-16', delay: 5.5 },
  { icon: AiChat02Icon, top: '65%', left: '8%', rotate: 10, size: 'w-14 h-14 md:w-16 md:h-16', delay: 1.5 },
  { icon: CheckmarkCircle02Icon, top: '75%', right: '5%', rotate: -8, size: 'w-16 h-16 md:w-20 md:h-20', delay: 3 },
];

const mockQuestions: StepperQuestion[] = [
  {
    id: 'q1',
    question_type: 'multiple_choice',
    question: 'What organelle is responsible for producing ATP in eukaryotic cells?',
    options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Golgi apparatus'],
    points: 5,
    position: 1,
  },
  {
    id: 'q2',
    question_type: 'identification',
    question: 'The process by which plants convert light energy into chemical energy.',
    options: null,
    points: 10,
    position: 2,
  },
  {
    id: 'q3',
    question_type: 'essay',
    question: 'Explain the importance of the cell membrane in maintaining homeostasis.',
    options: null,
    points: 20,
    position: 3,
  }
];

function MockExamCard({ question }: { question: StepperQuestion }) {
  const [answer, setAnswer] = useState('');
  
  return (
    <div className="w-full h-full flex flex-col bg-surface overflow-hidden">
      {/* Top Part: Question */}
      <div className="p-6 md:p-8 bg-background-muted/5 border-b border-border/10 shrink-0">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary opacity-60 shadow-[0_0_8px_currentColor]" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-50">QUESTION {question.position}</span>
          </div>
        </div>
        <h3 className="text-xl md:text-2xl font-black text-foreground leading-tight tracking-tight">
          {question.question}
        </h3>
      </div>
      
      {/* Bottom Part: Answer Input Area */}
      <div className="flex-1 p-6 md:p-8 overflow-y-auto scrollbar-hide bg-surface">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-2 rounded-full bg-secondary opacity-60 shadow-[0_0_8px_currentColor]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary opacity-50">YOUR ANSWER</span>
        </div>
        
        <div className="flex-1 flex flex-col min-h-0">
          {question.question_type === 'multiple_choice' && (
            <MultipleChoiceInput 
              question={question} 
              value={answer} 
              onChange={setAnswer} 
              compact={true}
            />
          )}
          {question.question_type === 'identification' && (
            <IdentificationInput 
              value={answer} 
              onChange={setAnswer} 
              onSubmit={() => {}} 
            />
          )}
          {question.question_type === 'essay' && (
            <EssayInput 
              value={answer} 
              onChange={setAnswer} 
            />
          )}
        </div>
      </div>
    </div>
  );
}


export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { deferredPrompt, setDeferredPrompt, isPWAInstalled, setIsPWAInstalled } = useUIStore();
  const [activeExam, setActiveExam] = useState(0);

  useEffect(() => {
    // Check if the app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    setIsPWAInstalled(isStandalone);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveExam((prev) => (prev + 1) % 3);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(
      (result: { data: { session: { user: unknown } | null } }) => {
        setIsLoggedIn(!!result.data.session?.user);
      },
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-foreground selection:text-surface">
      <LandingNavbar />

      <main className="flex-1 w-full relative">

        {/* ===== STICKY HERO PARALLAX SECTION ===== */}
        <section className="sticky top-0 h-screen w-full flex flex-col justify-center items-center text-center overflow-hidden z-0">

          {/* Floating study doodles */}
          {heroDoodles.map(({ icon: Icon, size, rotate, delay, ...pos }, i) => (
            <div
              key={i}
              className="pointer-events-none absolute z-0"
              style={{
                ...pos,
                animation: `doodle-float 8s ease-in-out ${delay}s infinite`,
              }}
            >
              <div style={{ transform: `rotate(${rotate}deg)` }} className="text-foreground/[0.15]">
                <Icon className={size} strokeWidth={1.5} />
              </div>
            </div>
          ))}

          <div className="relative z-20 flex flex-col items-center w-full max-w-[1700px] px-4">
            <div className="w-full relative px-4 z-20 text-center flex flex-col items-center">
              <h1 className="text-[13vw] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] font-black tracking-tighter text-foreground uppercase leading-[0.85] drop-shadow-sm z-20 relative">
                MASTER YOUR <br /> MATERIAL.
              </h1>
            </div>
          </div>

          <div className="relative z-10 w-[60vw] sm:w-[40vw] md:w-[30vw] max-w-[350px] flex justify-center mt-8">
            <Image
              src="/brand/verso-happy-clean.png"
              alt="Verso Mascot"
              width={800}
              height={800}
              className="w-full h-auto drop-shadow-2xl"
              priority
            />
          </div>

        </section>

        {/* ===== SCROLLING BENTO CONTENT ===== */}
        <section className="relative z-10 bg-surface rounded-t-[3rem] md:rounded-t-[5rem] border-t-[8px] border-foreground shadow-[0_-30px_60px_rgba(0,0,0,0.15)] pb-20 pt-16 md:pt-24 px-4 sm:px-8">

          <div className="max-w-[1700px] mx-auto w-full flex flex-col gap-10">

            {/* Intro CTA within the scrolling section */}
            <div className="text-center mb-10">
              <p className="text-lg sm:text-xl md:text-3xl font-black uppercase tracking-[0.2em] text-foreground max-w-4xl mx-auto leading-relaxed">
                WRITE NOTES. GENERATE FLASHCARDS INSTANTLY. TEST YOURSELF WITH MOCK EXAMS. ALL IN ONE SEAMLESS FLOW.
              </p>
              <div className="mt-10 flex justify-center">
                <Link href={isLoggedIn ? '/dashboard' : '/auth'} className="outline-none">
                  <div className="group flex items-center justify-center gap-4 px-12 py-6 rounded-[2.5rem] bg-foreground text-surface shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                    <span className="font-black text-[16px] uppercase tracking-[0.2em] leading-none mt-1">
                      {isLoggedIn ? 'ENTER DASHBOARD' : 'START STUDYING'}
                    </span>
                    <ArrowRight01Icon className="w-6 h-6 shrink-0 group-hover:translate-x-2 transition-transform" />
                  </div>
                </Link>
              </div>
            </div>

            {/* BENTO DASHBOARD GRID */}
            <div className="grid grid-cols-12 gap-8 md:gap-10 relative">

              {/* NOTE WRITING - SPAN 8 */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="col-span-12 xl:col-span-8 flex flex-col group h-full"
              >
                <div className="h-full rounded-[3rem] bg-background border-[4px] border-border/60 relative overflow-hidden flex flex-col md:flex-row items-stretch shadow-sm hover:shadow-xl hover:border-foreground/30 transition-all duration-500">

                  {/* Text Side */}
                  <div className="flex-1 p-6 sm:p-10 md:p-14 flex flex-col justify-center relative z-10">
                    <div className="absolute top-[-10rem] left-[-10rem] w-[25rem] h-[25rem] bg-primary/5 blur-3xl rounded-full pointer-events-none" />

                    <div className="flex items-center gap-3 mb-6">
                      <NotebookIcon className="w-6 h-6 text-foreground" />
                      <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground-muted">NOTE WRITING</h3>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-[3.5rem] font-black uppercase tracking-widest text-foreground leading-[0.95] mb-8">
                      WRITE & <br /> ORGANIZE
                    </h2>

                    <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] text-foreground-muted leading-relaxed mb-10 max-w-sm">
                      Our smart editor tightens your wording and structures your ideas perfectly. Ideal for review.
                    </p>

                    <div className="flex flex-col gap-4 mt-auto">
                      <div className="flex items-center gap-3 border-b-[3px] border-foreground/10 pb-4">
                        <PencilEdit01Icon className="w-5 h-5 text-foreground" />
                        <span className="font-black text-[10px] md:text-[12px] uppercase tracking-widest text-foreground">STRUCTURE IDEAS INSTANTLY</span>
                      </div>
                      <div className="flex items-center gap-3 border-b-[3px] border-foreground/10 pb-4">
                        <SparklesIcon className="w-5 h-5 text-foreground" />
                        <span className="font-black text-[10px] md:text-[12px] uppercase tracking-widest text-foreground">AI REFINES YOUR GRAMMAR</span>
                      </div>
                    </div>
                  </div>

                  {/* Image Side */}
                  <div className="flex-1 min-h-[400px] bg-foreground/5 relative flex items-center justify-center p-8 border-t-[4px] md:border-t-0 md:border-l-[4px] border-border/60">
                    <Image
                      src="/brand/notes-preview.png"
                      alt="Notes Preview"
                      width={600}
                      height={500}
                      className="w-full max-w-[320px] rounded-[1.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-[4px] border-surface -rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 z-10"
                    />
                    <Image
                      src="/brand/verso-writing-notes-clean.svg"
                      alt="Writing Mascot"
                      width={200}
                      height={200}
                      className="absolute -top-12 -right-4 md:top-auto md:bottom-6 md:right-6 w-[110px] md:w-[160px] drop-shadow-2xl z-20 group-hover:-translate-y-2 md:group-hover:-translate-y-4 group-hover:rotate-6 transition-all duration-500"
                    />
                  </div>
                </div>
              </motion.div>

              {/* FLASHCARDS - SPAN 4 */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="col-span-12 md:col-span-6 xl:col-span-4 h-full"
              >
                <div className="h-full rounded-[3rem] bg-foreground text-surface p-6 sm:p-10 md:p-14 relative overflow-hidden flex flex-col shadow-2xl group hover:scale-[1.02] transition-transform duration-500 border-[4px] border-foreground">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-surface/5 blur-3xl rounded-full" />

                  <div className="flex items-center gap-3 mb-8 relative z-10">
                    <FlashcardIcon className="w-8 h-8 text-surface" />
                    <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-surface/60">ACTIVE RECALL</h3>
                  </div>

                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black uppercase tracking-widest text-surface leading-[0.95] mb-6 relative z-10">
                    SMART <br /> CARDS
                  </h2>

                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-surface/70 leading-relaxed mb-10 max-w-[200px] relative z-10">
                    TURN NOTES INTO FLASHCARDS WITH AI. MEMORIZE FASTER WITH SPACED REPETITION.
                  </p>

                  <div className="mt-auto relative z-10 w-full flex justify-center">
                    <div className="relative w-[110%] max-w-[300px]">
                      <Image
                        src="/brand/flashcard-session-preview.png"
                        alt="Flashcards App"
                        width={400}
                        height={300}
                        className="w-full rounded-[1.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.5)] border-[4px] border-surface/20 group-hover:-translate-y-8 transition-transform duration-700 ease-out"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* EXAMS - SPAN 12 */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="col-span-12 h-full mt-4 md:mt-0"
              >
                <div className="w-full rounded-[3rem] bg-background border-[4px] border-border/60 relative overflow-hidden flex flex-col xl:flex-row items-stretch shadow-sm group hover:border-foreground/30 transition-colors duration-500">

                  {/* Graphics / Cards Shuffle Side */}
                  <div className="xl:flex-1 relative min-h-[500px] bg-foreground/5 border-b-[4px] xl:border-b-0 xl:border-r-[4px] border-border/60 overflow-hidden">

                    <div className="absolute inset-0 w-full h-full">
                      {mockQuestions.map((question, i) => (
                        <motion.div
                          key={question.id}
                          initial={{ x: '100%', opacity: 0 }}
                          animate={{
                            x: activeExam === i ? '0%' : (activeExam > i ? '-100%' : '100%'),
                            opacity: activeExam === i ? 1 : 0,
                            zIndex: activeExam === i ? 30 : 10,
                          }}
                          transition={{
                            duration: 0.6,
                            ease: 'easeInOut',
                          }}
                          className="absolute inset-0 w-full h-full overflow-hidden"
                        >
                          <MockExamCard question={question} />
                        </motion.div>
                      ))}
                    </div>

                    {/* Mascot enlarged and positioned for better presence */}
                    <Image
                      src="/brand/verso-thinking-clean.svg"
                      alt="Thinking Mascot"
                      width={200}
                      height={200}
                      className="absolute z-40 top-4 left-4 md:top-auto md:bottom-8 md:left-8 w-[110px] md:w-[180px] drop-shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"
                    />
                  </div>

                  {/* Content Side */}
                  <div className="xl:flex-1 p-6 sm:p-10 md:p-16 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-6">
                      <ExamIcon className="w-6 h-6 text-foreground" />
                      <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground-muted">MOCK EXAMS</h3>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-6xl font-black uppercase tracking-widest text-foreground leading-[0.95] mb-8 relative">
                      AI GENERATED <br /> ASSESSMENTS
                    </h2>

                    <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] text-foreground-muted leading-relaxed mb-12 max-w-lg">
                      WALK INTO EXAM DAY FULLY PREPARED. AI CRAFTS REALISTIC PRACTICE EXAMS FROM YOUR NOTES WITH INSTANT FEEDBACK ON EVERYTHING.
                    </p>

                    <div className="flex flex-col gap-6">
                      {[
                        { title: 'MULTIPLE CHOICE', desc: 'Instant feedback on options', icon: LeftToRightListNumberIcon },
                        { title: 'IDENTIFICATION', desc: 'Master key definitions', icon: Tag01Icon },
                        { title: 'ESSAYS', desc: 'Long-form preparation', icon: PencilEdit01Icon },
                      ].map(item => (
                        <div key={item.title} className="flex gap-4 items-center">
                          <div className="p-3 bg-foreground rounded-[1.2rem] text-surface shrink-0 shadow-xl">
                            <item.icon className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-black text-[12px] md:text-[14px] uppercase tracking-widest text-foreground mb-0.5">{item.title}</p>
                            <p className="font-black text-[9px] uppercase tracking-[0.2em] text-foreground-muted">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </motion.div>

              {/* MOBILE READY - SPAN 12 */}
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={fadeUp}
                className="col-span-12 h-full mt-4"
              >
                <div className="w-full rounded-[3rem] bg-foreground text-surface border-[4px] border-foreground relative overflow-hidden flex flex-col md:flex-row items-stretch shadow-2xl group transition-all duration-500">
                  <div className="absolute inset-0 bg-primary/5 blur-[100px] pointer-events-none" />

                  {/* Content Side */}
                  <div className="flex-1 p-8 sm:p-12 md:p-16 flex flex-col justify-center relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <Target01Icon className="w-8 h-8 text-surface" />
                      <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-surface/60">STUDY ANYWHERE</h3>
                    </div>

                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-black uppercase tracking-tight text-surface leading-[0.95] mb-8">
                      VERSO <br /> IN YOUR POCKET
                    </h2>

                    <p className="text-[12px] md:text-[14px] font-black uppercase tracking-[0.2em] text-surface/70 leading-relaxed mb-10 max-w-md">
                      INSTALL VERSO AS A PWA. INSTANT SYNC. OFFLINE ACCESS. NO APP STORE BARRIERS. JUST PEAK PRODUCTIVITY IN THE PALM OF YOUR HAND.
                    </p>

                    {(deferredPrompt || isPWAInstalled) && (
                      <div className="mt-auto">
                        <button
                          onClick={handleInstallPWA}
                          disabled={isPWAInstalled}
                          className="w-full sm:w-fit group flex items-center justify-center gap-4 px-10 py-5 rounded-2xl bg-surface text-foreground shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-default"
                        >
                          <Download01Icon className="w-6 h-6 shrink-0" />
                          <span className="font-black text-[14px] uppercase tracking-[0.2em] leading-none mt-1">
                            {isPWAInstalled ? 'APP INSTALLED' : 'INSTALL NOW'}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mock Mobile Side */}
                  <div className="flex-1 min-h-[450px] relative flex items-center justify-center p-8 overflow-hidden bg-background/5">
                    <div className="relative">
                      {/* CSS Phone Frame */}
                      <div className="relative w-[280px] h-[560px] bg-foreground rounded-[3.5rem] border-[8px] border-foreground shadow-[0_40px_100px_rgba(0,0,0,0.5)] p-3 group-hover:-translate-y-4 transition-transform duration-700 ease-out">
                        {/* Blank Screen */}
                        <div className="w-full h-full bg-surface-elevated rounded-[2.5rem] overflow-hidden relative paper-texture">
                          {/* Notch */}
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-foreground rounded-b-2xl z-20" />

                          {/* Content Placeholder (Blank for now) */}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Image
                              src="/brand/verso-mark.png"
                              alt="Verso Icon"
                              width={100}
                              height={100}
                              className="w-24 h-24 opacity-10 grayscale"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Floating Mascot - Anchored to Phone Edge */}
                      <Image
                        src="/brand/verso-mobile.svg"
                        alt="Mobile Mascot"
                        width={200}
                        height={200}
                        className="absolute -bottom-8 -right-16 w-[160px] md:w-[220px] drop-shadow-2xl z-30 group-hover:-rotate-12 transition-all duration-500"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

            {/* ===== COMMUNITY CTA - SPAN 12 ===== */}
            <div className="mt-10 md:mt-16 w-full cursor-pointer group outline-none relative z-20">
              <Link href="/community" className="block w-full h-full">
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  variants={fadeUp}
                  className="w-full rounded-[3rem] md:rounded-[4rem] bg-background border-[8px] md:border-[12px] border-foreground p-6 sm:p-10 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-start lg:justify-between gap-10 sm:gap-12 shadow-[0_20px_0_1px_rgba(45,42,38,1)] active:shadow-[0_5px_0_rgba(45,42,38,1)] active:translate-y-[15px] transition-all duration-200"
                >
                  <div className="absolute right-[-10%] bottom-[-20%] w-[600px] h-[600px] bg-foreground/5 blur-[120px] rounded-full pointer-events-none" />

                  <div className="z-10 lg:flex-[1.2] text-center lg:text-left flex flex-col items-center lg:items-start">
                    <div className="p-5 bg-foreground text-surface rounded-[1.5rem] shadow-2xl w-fit mb-8 mx-auto lg:mx-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                      <Book01Icon className="w-10 h-10" />
                    </div>

                    <h2 className="text-2xl sm:text-4xl md:text-7xl lg:text-8xl font-black text-foreground uppercase tracking-widest leading-[0.9] mb-8">
                      GLOBAL <br /> LIBRARY
                    </h2>

                    <p className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground-muted max-w-md mx-auto lg:mx-0 leading-relaxed">
                      DON'T START FROM SCRATCH. EXPLORE THOUSANDS OF REMIXABLE DEcks AND EXAMS FROM STUDENTS WORLDWIDE.
                    </p>
                  </div>

                  <div className="lg:flex-[0.8] relative w-full max-w-[450px] h-[220px] sm:h-[300px] lg:h-[360px] z-10 flex items-center justify-center pointer-events-none">
                    <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                      <Image
                        src="https://pub-5d0fe94a3da5458ca88e4e79220a6798.r2.dev/Verso/Screenshot%202026-04-02%20163906.png"
                        alt="Library Preview"
                        width={600}
                        height={400}
                        className="absolute w-[110%] lg:w-[115%] max-w-none shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-[6px] border-foreground rounded-[2rem] rotate-3"
                      />
                      <Image
                        src="/brand/community.svg"
                        alt="Community Mascot"
                        width={200}
                        height={200}
                        className="absolute -top-12 -left-4 md:top-auto md:-bottom-10 md:-left-10 w-[110px] sm:w-[140px] md:w-[200px] drop-shadow-2xl z-20"
                      />
                    </div>
                  </div>

                  <div className="absolute top-6 right-6 lg:top-10 lg:right-10">
                    <ArrowRight01Icon className="w-8 h-8 lg:w-16 lg:h-16 text-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300" />
                  </div>
                </motion.div>
              </Link>
            </div>

          </div>
        </section>

      </main>

      {/* ===== BRUTALIST FOOTER ===== */}
      <footer className="w-full bg-foreground text-surface border-t-8 border-foreground-muted pt-16 pb-8 px-4 sm:px-8 mt-auto z-20 relative">
        <div className="max-w-[1700px] mx-auto flex flex-col md:flex-row items-center justify-between gap-10">

          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            <Link href="/" className="flex items-center gap-4 group mb-2">
              <div className="bg-surface p-3 rounded-full overflow-hidden">
                <Image
                  src="/brand/verso-mark.png"
                  alt="Verso logo"
                  width={40}
                  height={40}
                  className="w-10 h-10 group-hover:scale-110 transition-transform"
                />
              </div>
              <span className="text-4xl md:text-5xl font-black text-surface tracking-widest uppercase relative top-1">
                VERSo
              </span>
            </Link>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-surface/50">
              THE AI POWERED STUDY PLATFORM.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <Link href="/community" className="text-[12px] font-black tracking-widest uppercase text-surface/70 hover:text-surface hover:underline decoration-2 underline-offset-8 transition-all">COMMUNITY</Link>
            <Link href="/auth" className="text-[12px] font-black tracking-widest uppercase text-surface/70 hover:text-surface hover:underline decoration-2 underline-offset-8 transition-all">LOGIN</Link>
          </div>

        </div>

        <div className="max-w-[1700px] mx-auto mt-16 pt-8 border-t-[3px] border-surface/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black tracking-widest uppercase text-surface/40">
          <p>© {new Date().getFullYear()} VERSO APPLICATION.</p>
          <p>ALL RIGHTS RESERVED WORLDWIDE.</p>
        </div>
      </footer>
    </div>
  );
}
