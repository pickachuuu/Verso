import { NextRequest, NextResponse } from 'next/server';
import { createGeminiService } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { noteContent, count, difficulty, context } = body;

    if (!noteContent) {
      return NextResponse.json({ error: 'noteContent is required' }, { status: 400 });
    }

    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const geminiService = createGeminiService(perplexityKey);
    const response = await geminiService.generateFlashcards(
      noteContent,
      count ?? 10,
      difficulty ?? 'medium',
      context
    );

    return NextResponse.json(response);
  } catch (error) {
    console.error('[API] /ai/flashcards error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate flashcards' },
      { status: 500 }
    );
  }
}
