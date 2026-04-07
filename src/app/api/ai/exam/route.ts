import { NextRequest, NextResponse } from 'next/server';
import { createGeminiService, ExamGenerationConfig } from '@/lib/gemini';
import { createClient } from '@/utils/supabase/server';
import { aiRateLimiter } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const rateLimitResult = aiRateLimiter(user.id);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    const body = await req.json();
    const { noteContent, config } = body as {
      noteContent: string;
      config: ExamGenerationConfig;
    };

    if (!noteContent || !config) {
      return NextResponse.json({ error: 'noteContent and config are required' }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!perplexityKey && !geminiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const geminiService = createGeminiService(perplexityKey || '', geminiKey);
    const response = await geminiService.generateExamQuestions(noteContent, config);

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] /ai/exam error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate exam' },
      { status: 500 }
    );
  }
}
