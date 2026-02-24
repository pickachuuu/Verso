'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import {
  FlashIcon,
  Note01Icon,
  BookOpen01Icon,
  PencilEdit01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  AiChat02Icon,
  Target01Icon,
  ArrowLeft01Icon,
} from 'hugeicons-react';
import Link from 'next/link';
import { handleGithubLogin, handleGoogleLogin } from '@/hook/useAuthActions';

/* Scattered background doodles — study-themed icons like notebook margin sketches */
/* Each gets a unique animation delay so they drift at different times */
const doodles = [
  { icon: FlashIcon, top: '6%', left: '4%', rotate: -12, size: 'w-10 h-10', delay: 0 },
  { icon: BookOpen01Icon, top: '12%', right: '7%', rotate: 8, size: 'w-12 h-12', delay: 1.5 },
  { icon: PencilEdit01Icon, bottom: '18%', left: '7%', rotate: 15, size: 'w-9 h-9', delay: 3 },
  { icon: CheckmarkCircle02Icon, top: '38%', left: '2%', rotate: -5, size: 'w-8 h-8', delay: 4.5 },
  { icon: Note01Icon, bottom: '10%', right: '5%', rotate: -10, size: 'w-11 h-11', delay: 2 },
  { icon: AiChat02Icon, top: '5%', left: '38%', rotate: 6, size: 'w-9 h-9', delay: 5 },
  { icon: Clock01Icon, bottom: '6%', left: '30%', rotate: -8, size: 'w-10 h-10', delay: 3.5 },
  { icon: Target01Icon, top: '28%', right: '3%', rotate: 12, size: 'w-9 h-9', delay: 1 },
  { icon: FlashIcon, bottom: '32%', right: '8%', rotate: -15, size: 'w-8 h-8', delay: 6 },
  { icon: PencilEdit01Icon, top: '62%', left: '5%', rotate: 20, size: 'w-8 h-8', delay: 2.5 },
  { icon: BookOpen01Icon, bottom: '45%', left: '2%', rotate: -18, size: 'w-10 h-10', delay: 4 },
  { icon: AiChat02Icon, top: '75%', right: '6%', rotate: 10, size: 'w-9 h-9', delay: 5.5 },
];

export default function AuthForm() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'auth-failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const handleGithub = async () => {
    setLoadingProvider('github');
    try {
      await handleGithubLogin();
    } catch (e: any) {
      setError(e?.message || 'An error occurred');
      setLoadingProvider(null);
    }
  };

  const handleGoogle = async () => {
    setLoadingProvider('google');
    try {
      await handleGoogleLogin();
    } catch (e: any) {
      setError(e.message || 'An error occurred');
      setLoadingProvider(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center paper-bg px-4 py-8 relative overflow-hidden">
      {/* Back to landing */}
      <Link
        href="/"
        className="absolute top-6 left-6 z-20 clay-button-secondary flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all active:translate-y-0.5"
      >
        <ArrowLeft01Icon className="w-4 h-4" />
        Back
      </Link>

      {/* Notebook ruled lines */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 31px, var(--border) 31px, var(--border) 32px)',
          backgroundSize: '100% 32px',
          opacity: 0.35,
        }}
      />
      {/* Red margin line */}
      <div
        className="pointer-events-none absolute top-0 bottom-0 left-[60px] w-[2px] z-0"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, rgba(220,80,80,0.3) 5%, rgba(220,80,80,0.3) 95%, transparent 100%)',
        }}
      />

      {/* Scattered study doodles — animated drift */}
      {doodles.map(({ icon: Icon, size, rotate, delay, ...pos }, i) => (
        <div
          key={i}
          className="pointer-events-none absolute z-0"
          style={{
            ...pos,
            animation: `doodle-float 8s ease-in-out ${delay}s infinite`,
          }}
        >
          <div style={{ transform: `rotate(${rotate}deg)` }} className="text-foreground/[0.08]">
            <Icon className={size} strokeWidth={1.2} />
          </div>
        </div>
      ))}

      {/* Card */}
      <div className="clay-card-elevated paper-texture border border-dashed border-pencil/40 rounded-3xl w-full max-w-6xl overflow-hidden relative z-10">
        <div className="flex flex-col md:flex-row">
          {/* Form side */}
          <div className="md:w-[55%] shrink-0 px-8 py-10 sm:px-14 sm:py-14 flex flex-col justify-center">
            {/* Brand */}
            <div>
              <Image
                src="/brand/verso-mark.png"
                alt="Verso"
                width={96}
                height={96}
                className="w-24 h-24 rounded-2xl"
              />
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-bold tracking-tight text-foreground mb-3">
              Welcome back
            </h1>
            <p className="text-base text-foreground-muted leading-relaxed mb-10">
              Pick up where you left off.
            </p>

            {/* Error */}
            {error && (
              <div className="mb-6 p-3 bg-error/10 border border-error/20 rounded-xl">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-error">{error}</p>
                  <button
                    onClick={() => setError(null)}
                    className="text-error/70 hover:text-error text-lg leading-none ml-2"
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}

            {/* Auth buttons */}
            <div className="space-y-3 mb-10">
              <button
                onClick={handleGoogle}
                disabled={loadingProvider !== null}
                className="clay-button-secondary w-full flex items-center justify-center gap-2.5 h-13 rounded-xl text-sm font-medium px-6 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" /><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" /><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" /><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" /></svg>
                {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
              </button>

              <button
                onClick={handleGithub}
                disabled={loadingProvider !== null}
                className="clay-button-secondary w-full flex items-center justify-center gap-2.5 h-13 rounded-xl text-sm font-medium px-6 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" /></svg>
                {loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}
              </button>

            </div>
            {/* Terms */}
            <p className="text-xs text-foreground-muted leading-relaxed">
              Secure OAuth, no passwords stored.
            </p>
          </div>

          {/* Image side — stacks on top on small screens, fills remaining width on md+ */}
          <div className="relative w-full h-48 sm:h-64 md:h-auto md:flex-1 order-first md:order-last">
            <Image
              src="https://pub-5d0fe94a3da5458ca88e4e79220a6798.r2.dev/Verso/ChatGPT%20Image%20Feb%2011%2C%202026%2C%2008_47_29%20PM.png"
              alt="Focused study workspace"
              fill
              sizes="(min-width: 768px) 45vw, 100vw"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
}
