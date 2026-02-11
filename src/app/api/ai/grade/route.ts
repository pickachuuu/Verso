import { NextRequest, NextResponse } from 'next/server';
import { createGeminiService } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { essays } = body as {
      essays: Array<{
        id: string;
        question: string;
        modelAnswer: string;
        userAnswer: string;
        maxPoints: number;
      }>;
    };

    if (!essays || !Array.isArray(essays) || essays.length === 0) {
      return NextResponse.json({ error: 'essays array is required' }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;

    if (!perplexityKey && !geminiKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const geminiService = createGeminiService(perplexityKey || '', geminiKey);
    const resultsMap = await geminiService.gradeAllEssays(essays);

    // Convert Map to plain object for JSON serialization
    const results: Record<string, { score: number; feedback: string; total_tokens: number; cost_cents: number }> = {};
    resultsMap.forEach((value, key) => {
      results[key] = value;
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('[API] /ai/grade error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to grade essays' },
      { status: 500 }
    );
  }
}
