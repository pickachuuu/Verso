'use client';

import Link from 'next/link';
import { LazyMotion, domAnimation } from 'motion/react';
import * as m from 'motion/react-m';
import {
  Note01Icon,
  FlashIcon,
  AiMagicIcon,
  Share01Icon,
  CheckmarkCircle02Icon,
  ArrowRight01Icon,
  SparklesIcon,
  Target01Icon,
  BookOpen01Icon,
  Clock01Icon,
  Idea01Icon,
} from 'hugeicons-react';
import { ClayCard, ClayButton, ClayBadge, ClayIconBox, ClaySection } from '@/component/ui/Clay';
import {
  fadeIn,
  fadeInUp,
  fadeInRight,
  scaleIn,
  staggerContainer,
  viewportOnce,
  hoverScale,
  tapScale,
} from '@/lib/animations';

export default function LandingPage() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-screen bg-background">
        {/* Navigation */}
        <m.nav
          className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-2xl font-bold text-foreground hover:text-accent transition-colors">
                MemoForge
              </Link>
              <div className="flex items-center gap-4">
                <Link href="/auth">
                  <ClayButton variant="ghost" size="sm">Sign In</ClayButton>
                </Link>
                <Link href="/auth">
                  <ClayButton variant="primary" size="sm">Get Started</ClayButton>
                </Link>
              </div>
            </div>
          </div>
        </m.nav>

        {/* Hero Section with Academic Background */}
        <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 academic-bg">
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left Content */}
              <m.div
                variants={staggerContainer}
                initial="hidden"
                animate="visible"
              >
                <m.div variants={fadeInUp}>
                  <ClayBadge variant="accent" className="mb-6">
                    <SparklesIcon className="w-4 h-4" />
                    Powered by Google Gemini AI
                  </ClayBadge>
                </m.div>

                <m.h1
                  variants={fadeInUp}
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight"
                >
                  Study Smarter,
                  <br />
                  <span className="text-accent">Not Harder</span>
                </m.h1>

                <m.p
                  variants={fadeInUp}
                  className="text-lg text-foreground-muted mb-8 max-w-lg"
                >
                  Transform your notes into interactive flashcards instantly with AI.
                  MemoForge analyzes your content and creates personalized study materials
                  that help you retain information 3x faster than traditional methods.
                </m.p>

                <m.div variants={fadeInUp} className="flex flex-wrap gap-4 mb-8">
                  <Link href="/auth">
                    <m.div whileHover={hoverScale} whileTap={tapScale}>
                      <ClayButton variant="primary" size="lg" className="flex items-center gap-2">
                        Start Learning Free
                        <ArrowRight01Icon className="w-5 h-5" />
                      </ClayButton>
                    </m.div>
                  </Link>
                  <Link href="#how-it-works">
                    <m.div whileHover={hoverScale} whileTap={tapScale}>
                      <ClayButton variant="secondary" size="lg">
                        See How It Works
                      </ClayButton>
                    </m.div>
                  </Link>
                </m.div>

                {/* Quick Stats in Hero */}
                <m.div variants={fadeInUp} className="flex flex-wrap gap-6">
                  <div className="flex items-center gap-2">
                    <Clock01Icon className="w-5 h-5 text-accent" />
                    <span className="text-sm text-foreground-muted">Generate in 2-5 seconds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckmarkCircle02Icon className="w-5 h-5 text-accent" />
                    <span className="text-sm text-foreground-muted">95% accuracy rate</span>
                  </div>
                </m.div>
              </m.div>

              {/* Right - Hero Visual */}
              <m.div
                className="relative"
                variants={fadeInRight}
                initial="hidden"
                animate="visible"
              >
                <ClayCard variant="elevated" padding="lg" className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <ClayIconBox size="sm" variant="accent">
                      <Note01Icon className="w-5 h-5 text-accent" />
                    </ClayIconBox>
                    <span className="font-semibold text-foreground">Your Study Notes</span>
                  </div>
                  <div className="space-y-3 mb-6">
                    <div className="h-3 bg-background-muted rounded-full w-full" />
                    <div className="h-3 bg-background-muted rounded-full w-4/5" />
                    <div className="h-3 bg-background-muted rounded-full w-3/5" />
                  </div>
                  <div className="flex justify-center my-4">
                    <ClayIconBox variant="accent" size="md">
                      <AiMagicIcon className="w-6 h-6 text-accent" />
                    </ClayIconBox>
                  </div>
                  <ClayCard variant="pressed" padding="md">
                    <div className="flex items-center gap-3 mb-3">
                      <FlashIcon className="w-5 h-5 text-accent" />
                      <span className="font-medium text-foreground">AI Generated Flashcard</span>
                    </div>
                    <p className="text-sm text-foreground font-medium mb-2">
                      Q: What is photosynthesis?
                    </p>
                    <p className="text-xs text-foreground-muted">
                      Click to reveal answer...
                    </p>
                  </ClayCard>
                </ClayCard>

                {/* Static Decorative Elements */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent-muted rounded-3xl -z-10 opacity-60" />
                <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-accent-muted rounded-3xl -z-10 opacity-40" />
              </m.div>
            </div>
          </div>
        </section>

        {/* Features Section - Combined and More Detailed */}
        <ClaySection variant="muted" id="features" className="notebook-bg-bold">
          <m.div
            className="text-center mb-16 relative z-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <ClayBadge variant="accent" className="mb-4">Powerful Features</ClayBadge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Master Any Subject
            </h2>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto">
              From note-taking to flashcard generation to collaborative study sessions,
              MemoForge provides a complete learning ecosystem designed by students, for students.
            </p>
          </m.div>

          <m.div
            className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {/* Main Feature Card - AI Generation */}
            <m.div variants={fadeInUp} className="md:col-span-2">
              <ClayCard variant="elevated" padding="lg" className="hover:translate-y-[-4px] transition-transform duration-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                  <div>
                    <ClayIconBox variant="accent" className="mb-4">
                      <AiMagicIcon className="w-8 h-8 text-accent" />
                    </ClayIconBox>
                    <h3 className="text-2xl font-bold text-foreground mb-3">AI-Powered Flashcard Generation</h3>
                    <p className="text-foreground-muted mb-4">
                      Our Google Gemini AI integration analyzes your notes and automatically extracts
                      key concepts, definitions, and relationships. It understands context, identifies
                      important terms, and creates questions that test true comprehension—not just memorization.
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2 text-sm text-foreground-muted">
                        <CheckmarkCircle02Icon className="w-4 h-4 text-accent flex-shrink-0" />
                        Generates up to 50+ cards from a single note
                      </li>
                      <li className="flex items-center gap-2 text-sm text-foreground-muted">
                        <CheckmarkCircle02Icon className="w-4 h-4 text-accent flex-shrink-0" />
                        Supports multiple choice and open-ended formats
                      </li>
                      <li className="flex items-center gap-2 text-sm text-foreground-muted">
                        <CheckmarkCircle02Icon className="w-4 h-4 text-accent flex-shrink-0" />
                        Customizable difficulty levels (Easy, Medium, Hard)
                      </li>
                    </ul>
                  </div>
                  <div className="bg-background-muted rounded-2xl p-6">
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent-muted flex items-center justify-center flex-shrink-0">
                          <Note01Icon className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-foreground-muted mb-1">Your Notes</p>
                          <p className="text-sm text-foreground">&quot;Photosynthesis converts light energy into chemical energy stored in glucose...&quot;</p>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <ArrowRight01Icon className="w-5 h-5 text-accent rotate-90" />
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                          <FlashIcon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-foreground-muted mb-1">Generated Card</p>
                          <p className="text-sm text-foreground font-medium">Q: What does photosynthesis convert light energy into?</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </ClayCard>
            </m.div>

            {/* Secondary Features */}
            {[
              {
                icon: Target01Icon,
                title: 'Adaptive Difficulty',
                desc: 'Choose your challenge level. Easy mode focuses on basic recall, Medium tests understanding, and Hard pushes critical thinking with application-based questions.'
              },
              {
                icon: BookOpen01Icon,
                title: 'Rich Note Editor',
                desc: 'Write and organize your study notes with full markdown support. Add headings, lists, code blocks, and more. Your notes are automatically saved and synced.'
              },
              {
                icon: Share01Icon,
                title: 'Collaborative Learning',
                desc: 'Make your flashcard sets public to share with classmates, or keep them private. Build a study community and learn from others\' materials.'
              },
              {
                icon: Idea01Icon,
                title: 'Smart Study Sessions',
                desc: 'Interactive flip-card interface helps you actively recall information. Track which cards you\'ve mastered and which need more practice.'
              },
            ].map((feature, index) => (
              <m.div key={index} variants={fadeInUp}>
                <ClayCard className="h-full hover:translate-y-[-4px] transition-transform duration-200">
                  <ClayIconBox variant="accent" className="mb-4">
                    <feature.icon className="w-6 h-6 text-accent" />
                  </ClayIconBox>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-foreground-muted">{feature.desc}</p>
                </ClayCard>
              </m.div>
            ))}
          </m.div>
        </ClaySection>

        {/* How It Works + Stats Combined Section */}
        <ClaySection id="how-it-works" className="notebook-bg">
          <m.div
            className="text-center mb-16 relative z-10"
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            <ClayBadge variant="accent" className="mb-4">Simple Process</ClayBadge>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              From Notes to Knowledge in 3 Steps
            </h2>
            <p className="text-lg text-foreground-muted max-w-3xl mx-auto">
              No complicated setup. No learning curve. Just paste your notes, click generate,
              and start studying. It&apos;s that simple.
            </p>
          </m.div>

          <m.div
            className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {[
              {
                num: '01',
                title: 'Write or Paste Your Notes',
                desc: 'Create notes from scratch using our markdown editor, or paste existing content from lectures, textbooks, or research. The AI works with any text-based content.',
                detail: 'Supports lectures, textbooks, articles, and more'
              },
              {
                num: '02',
                title: 'Configure & Generate',
                desc: 'Select your preferred difficulty level and card count. Our Gemini AI analyzes your content and generates high-quality flashcards in just 2-5 seconds.',
                detail: 'Customize difficulty, format, and quantity'
              },
              {
                num: '03',
                title: 'Study & Share',
                desc: 'Flip through your personalized flashcards with our interactive study mode. Share your best sets with classmates or keep them private for personal review.',
                detail: 'Track progress and share with study groups'
              },
            ].map((step, index) => (
              <m.div key={index} variants={scaleIn}>
                <ClayCard variant="elevated" padding="lg" className="h-full hover:translate-y-[-4px] transition-transform duration-200">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl font-bold text-accent opacity-50">{step.num}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-foreground-muted mb-4">{step.desc}</p>
                  <div className="flex items-center gap-2 text-sm text-accent">
                    <CheckmarkCircle02Icon className="w-4 h-4" />
                    {step.detail}
                  </div>
                </ClayCard>
              </m.div>
            ))}
          </m.div>

          {/* Stats Row */}
          <m.div
            className="grid grid-cols-2 md:grid-cols-4 gap-6 relative z-10"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
          >
            {[
              { value: '2-5s', label: 'Average Generation Time', sublabel: 'Fast enough for last-minute cramming' },
              { value: '50+', label: 'Cards Per Request', sublabel: 'Comprehensive coverage of your material' },
              { value: '95%', label: 'Accuracy Rate', sublabel: 'Quality questions that test understanding' },
              { value: 'Free', label: 'To Get Started', sublabel: 'No credit card required' },
            ].map((stat, index) => (
              <m.div key={index} variants={fadeInUp}>
                <ClayCard className="text-center h-full">
                  <div className="text-3xl sm:text-4xl font-bold text-accent mb-2">
                    {stat.value}
                  </div>
                  <div className="text-foreground font-medium text-sm mb-1">{stat.label}</div>
                  <div className="text-foreground-muted text-xs">{stat.sublabel}</div>
                </ClayCard>
              </m.div>
            ))}
          </m.div>
        </ClaySection>

        {/* Footer */}
        <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <Link href="/" className="text-xl font-bold text-foreground hover:text-accent transition-colors">
              MemoForge
            </Link>
            <p className="text-foreground-muted text-sm">
              © 2025 MemoForge. AI-Powered Study Assistant.
            </p>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
