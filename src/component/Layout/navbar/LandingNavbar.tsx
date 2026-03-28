'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
        <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b-[4px] border-foreground text-foreground transition-colors duration-300 shadow-sm">
            <div className="max-w-[1700px] mx-auto px-4 sm:px-8">
                <div className="h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-4 group text-foreground">
                        <div className="bg-foreground text-surface p-2 rounded-xl group-hover:scale-110 transition-transform">
                            <Image
                                src="/brand/verso-mark.png"
                                alt="Verso logo"
                                width={40}
                                height={40}
                                className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 brightness-0 invert"
                                priority
                            />
                        </div>
                        <span className="text-2xl sm:text-3xl font-black uppercase tracking-widest transition-colors">
                            Verso
                        </span>
                    </Link>
                    <div className="flex items-center gap-6">
                        {!isCommunityPage && (
                            <Link
                                href="/community"
                                className="hidden sm:block text-[12px] font-black uppercase tracking-[0.2em] text-foreground-muted hover:text-foreground transition-colors"
                            >
                                EXPLORE
                            </Link>
                        )}
                        <Link href={isLoggedIn ? '/dashboard' : '/auth'}>
                            <div className="px-6 py-3 rounded-[1.5rem] bg-foreground text-surface font-black text-[12px] sm:text-[14px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all cursor-pointer">
                                {isLoggedIn ? 'DASHBOARD' : 'GET STARTED'}
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </nav>
    );
}
