'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  GithubIcon,
  ChromeIcon,
  FlashIcon,
  Note01Icon,
  BookOpen01Icon,
  PencilEdit01Icon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  AiChat02Icon,
  Target01Icon,
} from 'hugeicons-react';
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
  const [error, setError] = useState<string | null>(null);
  const [loadingProvider, setLoadingProvider] = useState<'github' | 'google' | null>(null);

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
            <div className="flex items-center gap-4 mb-10">
              <Image
                src="/brand/verso-mark.png"
                alt="Verso"
                width={56}
                height={56}
                className="rounded-xl"
              />
              <span className="text-2xl font-bold tracking-tight text-foreground">Verso</span>
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
                onClick={handleGithub}
                disabled={loadingProvider !== null}
                className="clay-button-secondary w-full flex items-center justify-center gap-2.5 h-13 rounded-xl text-sm font-medium px-6 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                <GithubIcon className="w-5 h-5" />
                {loadingProvider === 'github' ? 'Connecting...' : 'Continue with GitHub'}
              </button>
              <button
                onClick={handleGoogle}
                disabled={loadingProvider !== null}
                className="clay-button-secondary w-full flex items-center justify-center gap-2.5 h-13 rounded-xl text-sm font-medium px-6 transition-all active:translate-y-0.5 disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChromeIcon className="w-5 h-5" />
                {loadingProvider === 'google' ? 'Connecting...' : 'Continue with Google'}
              </button>
            </div>

            {/* Terms */}
            <p className="text-xs text-foreground-muted leading-relaxed">
              By continuing, you agree to our{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Terms</span>
              {' '}and{' '}
              <span className="underline underline-offset-2 cursor-pointer hover:text-foreground transition-colors">Privacy Policy</span>.
              {' '}&middot;{' '}Secure OAuth, no passwords stored.
            </p>
          </div>

          {/* Image side — stacks on top on small screens, fills remaining width on md+ */}
          <div className="relative w-full h-48 sm:h-64 md:h-auto md:flex-1 order-first md:order-last">
            <Image
              src="https://pub-5d0fe94a3da5458ca88e4e79220a6798.r2.dev/Verso/9b1afcb0-846d-45ea-b422-25cf1f9af990.png"
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
