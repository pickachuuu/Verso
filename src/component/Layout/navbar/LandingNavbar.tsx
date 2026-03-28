'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClayButton } from '@/component/ui/Clay';
import { createClient } from '@/utils/supabase/client';

export default function LandingNavbar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const pathname = usePathname();
    const isCommunityPage = pathname === '/community';

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.getSession().then(
            (result: { data: { session: { user: unknown } | null } }) => {
                setIsLoggedIn(!!result.data.session?.user);
            },
        );
    }, []);

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="h-14 sm:h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 sm:gap-3 group text-foreground">
                        <Image
                            src="/brand/verso-mark.png"
                            alt="Verso logo"
                            width={40}
                            height={40}
                            className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 group-hover:scale-105 transition-transform"
                            priority
                        />
                        <span className="text-lg sm:text-xl font-bold transition-colors group-hover:text-primary">
                            Verso
                        </span>
                    </Link>
                    <div className="flex items-center gap-3">
                        {!isCommunityPage && (
                            <Link
                                href="/community"
                                className="text-sm font-medium transition-colors mr-2 text-foreground-muted hover:text-foreground"
                            >
                                Explore
                            </Link>
                        )}
                        <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                            <ClayButton variant="primary" size="sm">
                                {isLoggedIn ? 'Dashboard' : 'Get Started'}
                            </ClayButton>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
