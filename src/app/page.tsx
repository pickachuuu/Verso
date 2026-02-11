'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ClayButton } from '@/component/ui/Clay';
import { motion } from 'framer-motion';
import { PencilEdit01Icon, TextIcon, CheckmarkCircle01Icon, FireIcon, LeftToRightListNumberIcon, Tag01Icon } from 'hugeicons-react';
import { NotebookIcon, FlashcardIcon, ExamIcon } from '@/component/icons';

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0 },
};

const fadeRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0 },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <Image
                src="/brand/verso-mark.png"
                alt="Verso logo"
                width={40}
                height={40}
                className="w-10 h-10 shrink-0 group-hover:scale-105 transition-transform"
                priority
              />
              <span className="text-xl font-bold text-foreground group-hover:text-accent transition-colors">
                Verso
              </span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/auth">
                <ClayButton variant="ghost" size="sm">Sign In</ClayButton>
              </Link>
              <Link href="/auth">
                <ClayButton variant="primary" size="sm">Get Started</ClayButton>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* ===== HERO ===== */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -left-32 h-[420px] w-[420px] rounded-full bg-accent/20 blur-[100px]" />
            <div className="absolute -bottom-40 -right-20 h-[480px] w-[480px] rounded-full bg-primary/20 blur-[120px]" />
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-[300px] w-[600px] rounded-full bg-accent/8 blur-[80px]" />
            <div className="absolute top-0 right-1/4 h-[200px] w-[200px] rounded-full bg-primary/10 blur-[60px]" />
          </div>

          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center">
              <motion.div
                className="space-y-6"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                <motion.h1
                  className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.05]"
                  variants={fadeUp}
                  transition={{ duration: 0.6 }}
                >
                  Study smarter with <span className="text-accent">Verso</span>
                </motion.h1>

                <motion.p
                  className="max-w-xl text-base sm:text-lg text-foreground-muted leading-relaxed"
                  variants={fadeUp}
                  transition={{ duration: 0.6 }}
                >
                  Draft notes, generate flashcards, and practice with mock exams in one flow.
                </motion.p>

                <motion.div
                  className="flex flex-wrap items-center gap-3 pt-2"
                  variants={fadeUp}
                  transition={{ duration: 0.6 }}
                >
                  <Link href="/auth">
                    <ClayButton variant="primary" size="lg">Start Studying</ClayButton>
                  </Link>
                </motion.div>
              </motion.div>

              <motion.div
                className="relative min-h-[360px] md:min-h-[440px] flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
              >
                <div className="pointer-events-none absolute inset-0">
                  <div className="absolute top-10 left-10 h-24 w-24 rounded-full bg-accent/10 blur-2xl animate-pulse [animation-duration:4s]" />
                  <div className="absolute bottom-16 right-8 h-20 w-20 rounded-full bg-primary/12 blur-2xl animate-pulse [animation-duration:5s] [animation-delay:1s]" />
                  <div className="absolute top-1/3 right-1/4 h-16 w-16 rounded-full bg-accent/8 blur-xl animate-pulse [animation-duration:6s] [animation-delay:2s]" />
                </div>
                <Image
                  src="/brand/verso-happy-clean.png"
                  alt="Verso mascot"
                  width={520}
                  height={520}
                  className="relative z-10 w-[280px] sm:w-[360px] md:w-[420px] lg:w-[460px] h-auto animate-bounce [animation-duration:1.4s]"
                  priority
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== NOTE WRITING ===== */}
        <section className="relative border-t border-border/60 bg-background overflow-x-clip">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-10 h-52 w-52 rounded-full bg-accent/8 blur-3xl" />
            <div className="absolute -bottom-20 right-8 h-60 w-60 rounded-full bg-primary/8 blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div
                className="flex justify-center lg:justify-start"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeLeft}
                transition={{ duration: 0.6 }}
              >
                <Image
                  src="/brand/earth-science-preview.png"
                  alt="Earth science notes preview"
                  width={991}
                  height={768}
                  className="w-full max-w-[520px] xl:max-w-[560px] h-auto rounded-2xl border border-border/70 ring-1 ring-black/5 shadow-[0_30px_65px_-24px_rgba(15,23,42,0.48)] drop-shadow-[0_16px_22px_rgba(0,0,0,0.2)]"
                />
              </motion.div>

              <motion.div
                className="relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
              >
                <Image
                  src="/brand/verso-writing-notes-clean.svg"
                  alt="Verso writing notes mascot"
                  width={265}
                  height={265}
                  className="pointer-events-none absolute -top-[4.75rem] -right-8 sm:-top-[5.75rem] sm:-right-10 lg:-top-[6.75rem] lg:-right-12 z-0 w-[180px] sm:w-[220px] lg:w-[265px] h-auto -rotate-6 opacity-95 drop-shadow-[0_18px_28px_rgba(0,0,0,0.24)]"
                />
                <motion.div className="relative mb-4 pr-24 sm:pr-32 lg:pr-40" variants={fadeUp} transition={{ duration: 0.5 }}>
                  <h2 className="relative z-10 max-w-xl text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight">
                    AI-Assisted <span className="text-accent">Note Writing</span>
                  </h2>
                </motion.div>

                <motion.p
                  className="relative z-10 max-w-lg text-base sm:text-lg text-foreground-muted leading-relaxed"
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                >
                  Write naturally while AI helps structure ideas, tighten wording, and prepare
                  your notes for review-ready studying.
                </motion.p>

                <motion.div
                  className="relative z-10 mt-6 space-y-4"
                  variants={staggerContainer}
                >
                  {[
                    { icon: PencilEdit01Icon, title: 'Structure ideas', desc: 'Turn rough thoughts into clear, organized study notes.' },
                    { icon: TextIcon, title: 'Refine wording', desc: 'Rephrase sections instantly for clarity, tone, and grammar.' },
                    { icon: CheckmarkCircle01Icon, title: 'Exam-ready', desc: 'Keep everything polished without breaking your writing flow.' },
                  ].map((item) => (
                    <motion.div key={item.title} className="flex items-start gap-3" variants={staggerItem} transition={{ duration: 0.4 }}>
                      <item.icon className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-foreground-muted leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== FLASHCARDS ===== */}
        <section className="relative border-t border-border/60 bg-background-muted/60 overflow-x-clip">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-24 left-10 h-52 w-52 rounded-full bg-accent/12 blur-3xl" />
            <div className="absolute -bottom-20 right-8 h-60 w-60 rounded-full bg-primary/12 blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
              <motion.div
                className="relative"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
              >
                <div className="relative mb-4 pr-24 sm:pr-32 lg:pr-40">
                  <Image
                    src="/brand/verso-flashcards-clean.svg"
                    alt="Verso flashcards mascot"
                    width={265}
                    height={265}
                    className="pointer-events-none absolute -top-[4.75rem] -right-8 sm:-top-[5.75rem] sm:-right-10 lg:-top-[6.75rem] lg:-right-12 z-30 w-[180px] sm:w-[220px] lg:w-[265px] h-auto opacity-100 drop-shadow-[0_18px_28px_rgba(0,0,0,0.24)] [transform:scaleX(-1)]"
                  />
                  <motion.h2
                    className="relative z-10 max-w-xl text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight"
                    variants={fadeUp}
                    transition={{ duration: 0.5 }}
                  >
                    AI-Powered <span className="text-accent">Flashcards</span>
                  </motion.h2>
                </div>

                <motion.p
                  className="relative z-10 max-w-lg text-base sm:text-lg text-foreground-muted leading-relaxed"
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                >
                  Turn your notes into smart flashcards with AI in seconds, then study them with
                  active recall for stronger long-term memory.
                </motion.p>

                <motion.div
                  className="relative z-10 mt-6"
                  variants={staggerContainer}
                >
                  {[
                    { step: 1, icon: NotebookIcon, label: 'Pick your notes', desc: 'Select any notebook — AI reads your content and extracts key concepts.' },
                    { step: 2, icon: FlashcardIcon, label: 'Generate cards', desc: 'Instantly create Q&A flashcards, then flip through and test yourself.' },
                    { step: 3, icon: FireIcon, label: 'Master it', desc: 'Keep practicing with spaced repetition until it sticks for good.' },
                  ].map((item, i) => (
                    <motion.div key={item.step} className="flex items-start gap-4" variants={staggerItem} transition={{ duration: 0.4 }}>
                      <div className="flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-accent text-accent flex items-center justify-center text-sm font-bold shrink-0">
                          {item.step}
                        </div>
                        {i < 2 && <div className="w-px h-8 bg-border" />}
                      </div>
                      <div className="pb-4">
                        <div className="flex items-center gap-2 mb-0.5">
                          <item.icon className="w-4 h-4 text-accent" />
                          <p className="text-sm sm:text-base font-semibold text-foreground">{item.label}</p>
                        </div>
                        <p className="text-sm text-foreground-muted leading-relaxed">{item.desc}</p>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>

              <motion.div
                className="flex justify-center lg:justify-end"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={fadeRight}
                transition={{ duration: 0.6, delay: 0.15 }}
              >
                <Image
                  src="/brand/flashcard-session-preview.png"
                  alt="Flashcard study session preview"
                  width={1030}
                  height={618}
                  className="w-full max-w-[520px] xl:max-w-[560px] h-auto rounded-2xl border border-border/70 ring-1 ring-black/5 shadow-[0_30px_65px_-24px_rgba(15,23,42,0.48)] drop-shadow-[0_16px_22px_rgba(0,0,0,0.2)]"
                />
              </motion.div>
            </div>
          </div>
        </section>

        {/* ===== MOCK EXAMS ===== */}
        <section className="relative border-t border-border/60 bg-background overflow-visible">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-24 left-1/3 h-52 w-52 rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute -bottom-20 right-1/4 h-60 w-60 rounded-full bg-accent/8 blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            {/* Centered text block with mascot positioned relative to this wide wrapper */}
            <div className="relative">
              {/* Mascot - positioned from the wide max-w-7xl wrapper so it won't clip */}
              <motion.div
                className="pointer-events-none absolute -top-8 right-[2%] sm:right-[4%] lg:right-[8%] z-20"
                initial={{ opacity: 0, y: 20, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: 6 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Image
                  src="/brand/verso-thinking-clean.svg"
                  alt="Verso thinking mascot"
                  width={265}
                  height={265}
                  className="w-[160px] sm:w-[200px] lg:w-[240px] h-auto opacity-95 drop-shadow-[0_18px_28px_rgba(0,0,0,0.24)]"
                />
              </motion.div>

              <motion.div
                className="max-w-2xl mx-auto text-center mb-12 md:mb-16 pt-16 sm:pt-20 lg:pt-24"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
                variants={staggerContainer}
              >
                <motion.h2
                  className="relative z-10 text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-foreground leading-tight mb-4"
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                >
                  AI-Generated <span className="text-accent">Mock Exams</span>
                </motion.h2>

                <motion.p
                  className="relative z-10 max-w-xl mx-auto text-base sm:text-lg text-foreground-muted leading-relaxed mb-10"
                  variants={fadeUp}
                  transition={{ duration: 0.5 }}
                >
                  Put your knowledge to the test with AI-crafted practice exams that mirror real
                  questions, so you walk into exam day fully prepared.
                </motion.p>

                <motion.div
                  className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8"
                  variants={staggerContainer}
                >
                  {[
                    { icon: LeftToRightListNumberIcon, title: 'Multiple Choice', desc: 'Test your knowledge with AI-generated options — instant feedback on every pick.' },
                    { icon: Tag01Icon, title: 'Identification', desc: 'Fill in the blanks and prove you know the key terms and concepts.' },
                    { icon: PencilEdit01Icon, title: 'Essays', desc: 'Practice long-form answers and build the writing skills exams demand.' },
                  ].map((item) => (
                    <motion.div key={item.title} className="flex flex-col items-center text-center" variants={staggerItem} transition={{ duration: 0.4 }}>
                      <item.icon className="w-7 h-7 text-accent mb-3" />
                      <p className="text-sm sm:text-base font-semibold text-foreground mb-1">{item.title}</p>
                      <p className="text-sm text-foreground-muted leading-relaxed max-w-[220px]">{item.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>

            {/* Exam cards centered below */}
            <motion.div
              className="flex justify-center"
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              <style>{`
                @keyframes examShuffle {
                  0%, 27% {
                    transform: translate(0px, 0px) rotate(0deg) scale(1);
                    z-index: 3;
                    box-shadow: 0 25px 50px -12px rgba(15,23,42,0.35);
                  }
                  33%, 60% {
                    transform: translate(28px, 14px) rotate(3.5deg) scale(0.95);
                    z-index: 1;
                    box-shadow: 0 10px 25px -8px rgba(15,23,42,0.2);
                  }
                  66%, 93% {
                    transform: translate(-18px, 8px) rotate(-2.5deg) scale(0.97);
                    z-index: 2;
                    box-shadow: 0 15px 35px -10px rgba(15,23,42,0.25);
                  }
                  100% {
                    transform: translate(0px, 0px) rotate(0deg) scale(1);
                    z-index: 3;
                    box-shadow: 0 25px 50px -12px rgba(15,23,42,0.35);
                  }
                }
              `}</style>
              <div className="relative w-full max-w-[600px] xl:max-w-[660px] aspect-[4/3]">
                {['/brand/exam-preview-1.png', '/brand/exam-preview-2.png', '/brand/exam-preview-3.png'].map((src, i) => (
                  <div
                    key={src}
                    className="absolute inset-0 rounded-2xl border border-border/70 ring-1 ring-black/5 overflow-hidden bg-background"
                    style={{
                      animation: 'examShuffle 9s cubic-bezier(0.4, 0, 0.2, 1) infinite',
                      animationDelay: `${i * -3}s`,
                    }}
                  >
                    <Image
                      src={src}
                      alt={`Exam question type preview ${i + 1}`}
                      width={750}
                      height={563}
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-foreground">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <Image
              src="/brand/verso-mark.png"
              alt="Verso logo"
              width={32}
              height={32}
              className="w-8 h-8 brightness-0 invert group-hover:scale-105 transition-transform"
            />
            <span className="text-xl font-bold text-background group-hover:text-accent-muted transition-colors">
              Verso
            </span>
          </Link>
          <p className="text-background/60 text-sm">© {new Date().getFullYear()} Verso. AI-Powered Study Assistant.</p>
        </div>
      </footer>
    </div>
  );
}
