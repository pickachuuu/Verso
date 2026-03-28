'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SparklesIcon, ArrowRight01Icon, PencilEdit01Icon, Tag01Icon, Book01Icon, LeftToRightListNumberIcon } from 'hugeicons-react';
import { FlashcardIcon, ExamIcon, NotebookIcon } from '@/component/icons';
import { createClient } from '@/utils/supabase/client';
import LandingNavbar from '@/component/Layout/navbar/LandingNavbar';

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 20 } },
};

export default function LandingPage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(
      (result: { data: { session: { user: unknown } | null } }) => {
        setIsLoggedIn(!!result.data.session?.user);
      },
    );
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-foreground selection:text-surface overflow-x-hidden">
      <LandingNavbar />

      <main className="flex-1 pt-24 pb-20 px-4 sm:px-8 max-w-[1700px] mx-auto w-full flex flex-col gap-10">

        {/* ===== HERO SECTION ===== */}
        <section className="relative min-h-[75vh] md:min-h-[85vh] flex flex-col justify-center items-center text-center">

          <motion.div
            className="relative z-10 flex flex-col items-center w-full max-w-6xl"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} className="mb-6 md:mb-10 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 border-foreground/10 bg-surface/50">
              <SparklesIcon className="w-4 h-4 text-secondary" />
              <span className="text-[10px] md:text-[12px] font-black uppercase tracking-[0.3em] text-foreground">
                Verso 2.0 Is Live
              </span>
            </motion.div>

            <motion.div variants={fadeUp} className="w-full relative">
              <h1 className="text-[12vw] sm:text-[8rem] lg:text-[11rem] font-black tracking-tighter text-foreground uppercase leading-[0.85] w-full mix-blend-multiply drop-shadow-sm">
                LEARN
                <br />
                FASTER.
              </h1>
            </motion.div>

            <motion.p variants={fadeUp} className="mt-8 md:mt-12 text-sm md:text-base font-black uppercase tracking-[0.2em] text-foreground-muted max-w-2xl px-4 leading-relaxed">
              WRITE NOTES. GENERATE FLASHCARDS INSTANTLY. TEST YOURSELF WITH MOCK EXAMS. ALL IN ONE SEAMLESS FLOW.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-12 md:mt-16 flex flex-col sm:flex-row items-center gap-6">
              <Link href={isLoggedIn ? '/dashboard' : '/auth'} className="w-full sm:w-auto outline-none">
                <div className="group flex items-center justify-center gap-4 px-10 py-6 rounded-[2rem] bg-foreground text-surface shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                  <span className="font-black text-[14px] md:text-[16px] uppercase tracking-[0.2em] leading-none mt-1">
                    {isLoggedIn ? 'ENTER DASHBOARD' : 'START STUDYING'}
                  </span>
                  <ArrowRight01Icon className="w-6 h-6 shrink-0 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            </motion.div>
          </motion.div>

          {/* Epic Mascot Centerpiece beneath the hero */}
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
            className="absolute bottom-[-5%] left-1/2 -translate-x-1/2 pointer-events-none -z-10 w-[80%] max-w-[600px]"
          >
            <div className="absolute inset-0 bg-secondary/10 blur-[100px] rounded-full" />
            <Image
              src="/brand/verso-happy-clean.png"
              alt="Verso Mascot"
              width={800}
              height={800}
              className="w-full h-auto drop-shadow-2xl opacity-90 mix-blend-multiply"
              priority
            />
          </motion.div>
        </section>

        {/* ===== BENTO DASHBOARD GRID ===== */}
        <section className="grid grid-cols-12 gap-8 md:gap-10 mt-20 relative z-20">

          {/* NOTE WRITING - SPAN 8 */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="col-span-12 xl:col-span-8 flex flex-col group h-full"
          >
            <div className="h-full rounded-[3rem] bg-surface border-2 border-border/40 relative overflow-hidden flex flex-col md:flex-row items-stretch shadow-sm hover:shadow-xl transition-shadow duration-500">

              {/* Text Side */}
              <div className="flex-1 p-10 md:p-14 flex flex-col justify-center relative z-10">
                <div className="absolute top-[-10rem] left-[-10rem] w-[25rem] h-[25rem] bg-primary/5 blur-3xl rounded-full pointer-events-none" />

                <div className="flex items-center gap-3 mb-6">
                  <NotebookIcon className="w-6 h-6 text-foreground" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground-muted">NOTE WRITING</h3>
                </div>

                <h2 className="text-4xl md:text-[3.5rem] font-black uppercase tracking-widest text-foreground leading-[0.95] mb-8">
                  WRITE & <br /> ORGANIZE
                </h2>

                <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] text-foreground-muted leading-relaxed mb-10 max-w-sm">
                  Our smart editor tightens your wording and structures your ideas perfectly. Ideal for review.
                </p>

                <div className="flex flex-col gap-4 mt-auto">
                  <div className="flex items-center gap-3 border-b-2 border-foreground/5 pb-4">
                    <PencilEdit01Icon className="w-5 h-5 text-foreground" />
                    <span className="font-black text-[10px] md:text-[12px] uppercase tracking-widest text-foreground">STRUCTURE IDEAS INSTANTLY</span>
                  </div>
                  <div className="flex items-center gap-3 border-b-2 border-foreground/5 pb-4">
                    <SparklesIcon className="w-5 h-5 text-foreground" />
                    <span className="font-black text-[10px] md:text-[12px] uppercase tracking-widest text-foreground">AI REFINES YOUR GRAMMAR</span>
                  </div>
                </div>
              </div>

              {/* Image Side */}
              <div className="flex-1 min-h-[400px] bg-foreground/5 relative flex items-center justify-center p-8 border-t-2 md:border-t-0 md:border-l-2 border-border/40">
                <Image
                  src="/brand/notes-preview.png"
                  alt="Notes Preview"
                  width={600}
                  height={500}
                  className="w-full max-w-[320px] rounded-[1.5rem] shadow-2xl border-4 border-surface -rotate-3 group-hover:rotate-0 group-hover:scale-105 transition-all duration-500 z-10"
                />
                <Image
                  src="/brand/verso-writing-notes-clean.svg"
                  alt="Writing Mascot"
                  width={200}
                  height={200}
                  className="absolute bottom-6 right-6 w-[160px] drop-shadow-xl z-20 group-hover:-translate-y-4 group-hover:rotate-6 transition-transform duration-500"
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
            <div className="h-full rounded-[3rem] bg-foreground text-surface p-10 md:p-14 relative overflow-hidden flex flex-col shadow-2xl group hover:scale-[1.01] transition-transform duration-500">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-surface/5 blur-3xl rounded-full" />

              <div className="flex items-center gap-3 mb-8 relative z-10">
                <FlashcardIcon className="w-8 h-8 text-surface" />
                <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-surface/60">ACTIVE RECALL</h3>
              </div>

              <h2 className="text-4xl md:text-5xl font-black uppercase tracking-widest text-surface leading-[0.95] mb-6 relative z-10">
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
                    className="w-full rounded-[1.5rem] shadow-[0_-15px_40px_rgba(0,0,0,0.3)] border-[3px] border-surface/20 group-hover:-translate-y-8 transition-transform duration-700 ease-out"
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
            <div className="w-full rounded-[3rem] bg-surface border-2 border-border/40 relative overflow-hidden flex flex-col xl:flex-row items-stretch shadow-sm group">

              {/* Graphics / Cards Shuffle Side */}
              <div className="xl:flex-1 relative min-h-[450px] p-8 bg-background-muted/50 border-b-2 xl:border-b-0 xl:border-r-2 border-border/40 flex items-center justify-center overflow-hidden">
                {/* Enormous Watermark */}
                <ExamIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35rem] h-[35rem] text-foreground/[0.03] pointer-events-none group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000" />

                <div className="relative w-full max-w-[500px] aspect-[4/3] flex items-center justify-center">
                  {['/brand/exam-preview-1.png', '/brand/exam-preview-2.png', '/brand/exam-preview-3.png'].map((src, i) => (
                    <div
                      key={src}
                      className={`absolute w-[85%] rounded-[1.5rem] shadow-2xl border-[3px] border-surface transition-all duration-1000 origin-center bg-surface overflow-hidden ${i === 0 ? '-rotate-6 -translate-x-6 group-hover:-rotate-[10deg] group-hover:-translate-x-12 group-hover:-translate-y-4' :
                        i === 1 ? 'rotate-6 translate-x-6 group-hover:rotate-[8deg] group-hover:translate-x-12 group-hover:translate-y-4 z-10' :
                          'z-20 group-hover:scale-105 group-hover:-translate-y-2'
                        }`}
                    >
                      <Image src={src} alt="Exam UI" width={600} height={400} className="w-full h-auto object-cover opacity-90" />
                    </div>
                  ))}
                  <Image
                    src="/brand/verso-thinking-clean.svg"
                    alt="Thinking Mascot"
                    width={200}
                    height={200}
                    className="absolute z-30 top-1/2 right-[10%] -translate-y-1/2 w-[160px] md:w-[220px] drop-shadow-[0_20px_40px_rgba(0,0,0,0.25)] group-hover:scale-110 transition-transform duration-700"
                  />
                </div>
              </div>

              {/* Content Side */}
              <div className="xl:flex-1 p-10 md:p-16 flex flex-col justify-center">
                <div className="flex items-center gap-3 mb-6">
                  <ExamIcon className="w-6 h-6 text-foreground" />
                  <h3 className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground-muted">MOCK EXAMS</h3>
                </div>

                <h2 className="text-4xl md:text-6xl font-black uppercase tracking-widest text-foreground leading-[0.95] mb-8 relative">
                  AI GENERATED <br /> ASSESSMENTS
                </h2>

                <p className="text-[11px] md:text-[13px] font-black uppercase tracking-[0.2em] text-foreground-muted leading-relaxed mb-12 max-w-lg">
                  WALK INTO EXAM DAY FULLY PREPARED. AI CRAFTS REALISTIC PRACTICE EXAMS FROM YOUR NOTES WITH INSTANT FEEDBACK ON EVERYTHING.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    { title: 'MULTIPLE CHOICE', desc: 'Instant feedback on options', icon: LeftToRightListNumberIcon },
                    { title: 'IDENTIFICATION', desc: 'Master key definitions', icon: Tag01Icon },
                    { title: 'ESSAYS', desc: 'Long-form preparation', icon: PencilEdit01Icon },
                  ].map(item => (
                    <div key={item.title} className="flex gap-4 items-start">
                      <div className="p-3 bg-foreground rounded-[1rem] text-surface shrink-0 shadow-lg mt-1">
                        <item.icon className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-black text-[12px] md:text-[14px] uppercase tracking-widest text-foreground mb-1 mt-1">{item.title}</p>
                        <p className="font-black text-[9px] uppercase tracking-[0.2em] text-foreground-muted">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </motion.div>

        </section>

        {/* ===== COMMUNITY CTA - SPAN 12 ===== */}
        <section className="mt-10 md:mt-16 w-full cursor-pointer group outline-none relative z-20">
          <Link href="/community" className="block w-full h-full">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              variants={fadeUp}
              className="w-full rounded-[3rem] bg-surface border-[6px] border-foreground p-10 md:p-16 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-12 shadow-[0_20px_0_rgba(45,42,38,1)] active:shadow-[0_5px_0_rgba(45,42,38,1)] active:translate-y-[15px] transition-all duration-200"
            >
              <div className="absolute right-[-10%] bottom-[-20%] w-[600px] h-[600px] bg-foreground/5 blur-[120px] rounded-full pointer-events-none" />

              <div className="z-10 flex-1 text-center lg:text-left flex flex-col items-center lg:items-start">
                <div className="p-4 bg-foreground text-surface rounded-[1.2rem] shadow-xl w-fit mb-8 mx-auto lg:mx-0 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                  <Book01Icon className="w-8 h-8" />
                </div>

                <h2 className="text-4xl sm:text-5xl md:text-7xl font-black text-foreground uppercase tracking-widest leading-[0.9] mb-8">
                  GLOBAL <br /> LIBRARY
                </h2>

                <p className="text-[12px] font-black uppercase tracking-[0.3em] text-foreground-muted max-w-md mx-auto lg:mx-0 leading-relaxed">
                  DON'T START FROM SCRATCH. EXPLORE THOUSANDS OF REMIXABLE DEcks AND EXAMS FROM STUDENTS WORLDWIDE.
                </p>
              </div>

              <div className="flex-1 relative w-full max-w-[500px] h-[300px] lg:h-[400px] z-10 flex items-center justify-center pointer-events-none">
                <div className="relative w-full h-full flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/brand/community-preview.png"
                    alt="Library Preview"
                    width={600}
                    height={400}
                    className="absolute w-[110%] md:w-[130%] max-w-none shadow-[0_30px_60px_rgba(0,0,0,0.3)] border-[4px] border-foreground rounded-[2rem] rotate-3"
                  />
                  <Image
                    src="/brand/community.svg"
                    alt="Community Mascot"
                    width={200}
                    height={200}
                    className="absolute -bottom-10 -left-10 md:-left-20 w-[140px] md:w-[200px] drop-shadow-2xl z-20"
                  />
                </div>
              </div>

              {/* Decorative huge arrow indicator */}
              <div className="absolute top-10 right-10">
                <ArrowRight01Icon className="w-16 h-16 text-foreground opacity-20 group-hover:opacity-100 group-hover:translate-x-4 transition-all duration-300" />
              </div>
            </motion.div>
          </Link>
        </section>

      </main>

      {/* ===== BRUTALIST FOOTER ===== */}
      <footer className="w-full bg-foreground text-surface border-t-8 border-foreground-muted pt-16 pb-8 px-4 sm:px-8 mt-auto z-10 relative">
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
              THE PAPER-FIRST STUDY PLATFORM.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 md:gap-12">
            <Link href="/community" className="text-[12px] font-black tracking-widest uppercase text-surface/70 hover:text-surface hover:underline decoration-2 underline-offset-8 transition-all">COMMUNITY</Link>
            <Link href="/auth" className="text-[12px] font-black tracking-widest uppercase text-surface/70 hover:text-surface hover:underline decoration-2 underline-offset-8 transition-all">LOGIN</Link>
          </div>

        </div>

        <div className="max-w-[1700px] mx-auto mt-16 pt-8 border-t-2 border-surface/10 flex flex-col md:flex-row justify-between items-center gap-4 text-[9px] font-black tracking-widest uppercase text-surface/40">
          <p>© {new Date().getFullYear()} VERSO APPLICATION.</p>
          <p>ALL RIGHTS RESERVED WORLDWIDE.</p>
        </div>
      </footer>
    </div>
  );
}
