import { updateSession } from './utils/supabase/middleware'
import { NextRequest } from 'next/server'

export const config = {  
  matcher: [
    // Protect dashboard routes only - landing page and auth are public
    '/dashboard/:path*',
    '/notes/:path*',
    '/flashcards/:path*',
  ],
}

export async function middleware(request: NextRequest) {
  return await updateSession(
    request,
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
