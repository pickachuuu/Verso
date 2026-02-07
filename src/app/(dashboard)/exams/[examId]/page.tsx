'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// Redirect to the exam page outside dashboard (no navbar)
export default function ExamRedirect() {
  const params = useParams();
  const router = useRouter();
  const examId = params.examId as string;

  useEffect(() => {
    router.replace(`/exam/${examId}`);
  }, [examId, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-foreground-muted">Loading exam...</p>
    </div>
  );
}
