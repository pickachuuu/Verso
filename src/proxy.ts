import { updateSession } from './utils/supabase/proxy'
import { NextRequest } from 'next/server'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/library/:path*',
    '/saved/:path*',
    '/exams/:path*',
    '/exam/:path*',
    '/editor/:path*',
    '/flashcards/:path*',
    '/notes/:path*',
    '/markdown-test/:path*',
    '/api/ai/:path*',
  ],
}

export async function proxy(request: NextRequest) {
  return await updateSession(
    request,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
