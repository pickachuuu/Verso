import { NextRequest, NextResponse } from 'next/server';
import { createGeminiService, ExamGenerationConfig } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { noteContent, config } = body as {
      noteContent: string;
      config: ExamGenerationConfig;
    };

    if (!noteContent || !config) {
      return NextResponse.json({ error: 'noteContent and config are required' }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const geminiService = createGeminiService(perplexityKey);
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
