'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ClayButton } from '@/component/ui/Clay';
import { createClient } from '@/utils/supabase/client';

export default function LandingNavbar({ variant = 'hero' }: { variant?: 'hero' | 'normal' }) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const isHero = variant === 'hero';

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(
            (result: { data: { session: { user: unknown } | null } }) => {
                setIsLoggedIn(!!result.data.session?.user);
            },
        );
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${isHero
                ? 'bg-primary-dark/10 border-white/10 text-white'
                : 'bg-white/70 border-border text-foreground'
            }`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-14 sm:h-16 flex items-center justify-between">
                    <Link href="/" className={`flex items-center gap-2 sm:gap-3 group ${isHero ? 'text-white' : 'text-foreground'}`}>
                        <Image
                            src="/brand/verso-mark.png"
                            alt="Verso logo"
                            width={40}
                            height={40}
                            className={`w-8 h-8 sm:w-10 sm:h-10 shrink-0 group-hover:scale-105 transition-transform ${isHero ? 'brightness-0 invert' : ''}`}
                            priority
                        />
                        <span className={`text-lg sm:text-xl font-bold transition-colors ${isHero ? 'group-hover:text-blue-200' : 'group-hover:text-primary'}`}>
                            Verso
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link
                            href="/community"
                            className={`text-sm font-medium transition-colors mr-2 ${isHero ? 'text-white/80 hover:text-white' : 'text-foreground-muted hover:text-foreground'
                                }`}
                        >
                            Explore
                        </Link>
                        <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                            <ClayButton variant={isHero ? "secondary" : "primary"} size="sm">
                                {isLoggedIn ? 'Dashboard' : 'Get Started'}
                            </ClayButton>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
