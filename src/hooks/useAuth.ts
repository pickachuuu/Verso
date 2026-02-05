import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

// ============================================
// Types
// ============================================

export interface UserProfile {
  full_name: string | null;
  email: string | null;
}

// ============================================
// Query Keys
// ============================================

export const authKeys = {
  all: ['auth'] as const,
  profile: () => [...authKeys.all, 'profile'] as const,
};

// ============================================
// API Functions
// ============================================

async function fetchUserProfile(): Promise<UserProfile | null> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user?.id) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, email')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Profile fetch error:', error.message);
    return null;
  }

  return data;
}

// ============================================
// Query Hooks
// ============================================

export function useUserProfile() {
  return useQuery({
    queryKey: authKeys.profile(),
    queryFn: fetchUserProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes - profile rarely changes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
