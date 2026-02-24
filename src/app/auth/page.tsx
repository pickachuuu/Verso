import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import AuthForm from './AuthForm';

export default async function AuthPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect('/dashboard');
  }

  return (
    <Suspense fallback={<div className="min-h-screen paper-bg" />}>
      <AuthForm />
    </Suspense>
  );
}