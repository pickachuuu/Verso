import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { systemPrompt, userContent } = body as {
      systemPrompt: string;
      userContent: string;
    };

    if (!systemPrompt || !userContent) {
      return NextResponse.json({ error: 'systemPrompt and userContent are required' }, { status: 400 });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    const perplexityKey = process.env.PERPLEXITY_API_KEY;

    // Try Gemini first
    if (geminiKey) {
      const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': geminiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userContent}` }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 2048 },
          }),
        }
      );

      if (res.ok) {
        const data = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
        return NextResponse.json({ text });
      }
      // If Gemini fails, fall through to Perplexity
      console.warn('[API] Gemini failed, falling back to Perplexity');
    }

    // Fallback to Perplexity
    if (!perplexityKey) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const res = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${perplexityKey}`,
      },
      body: JSON.stringify({
        model: 'sonar',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      throw new Error(`Perplexity API error: ${res.status}`);
    }

    const data = await res.json();
    const text = data?.choices?.[0]?.message?.content || '';

    return NextResponse.json({ text });
  } catch (error) {
    console.error('[API] /ai/editor error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'AI request failed' },
      { status: 500 }
    );
  }
}
