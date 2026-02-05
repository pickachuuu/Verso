// AI API service for converting notes to flashcards and exams (using Perplexity API)
export interface GeminiFlashcard {
  question: string;
  answer: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface GeminiResponse {
  flashcards: GeminiFlashcard[];
  total_tokens: number;
  cost_cents: number;
}

// Exam types
export interface ExamQuestionGenerated {
  question: string;
  correct_answer: string;
  question_type: 'multiple_choice' | 'identification' | 'essay';
  options?: string[]; // For multiple choice only
  points: number;
}

export interface ExamGenerationResponse {
  questions: ExamQuestionGenerated[];
  total_tokens: number;
  cost_cents: number;
}

export interface ExamGenerationConfig {
  multipleChoiceCount: number;
  identificationCount: number;
  essayCount: number;
  difficulty: 'easy' | 'medium' | 'hard' | 'mixed';
  customInstructions?: string;
}

export interface EssayGradingResult {
  score: number; // 0-100
  feedback: string;
  total_tokens: number;
  cost_cents: number;
}

export class GeminiService {
  private apiKey: string;
  private geminiApiKey: string | null;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';
  // Using gemini-2.0-flash-lite - cheapest model with highest free tier rate limits (30 RPM)
  private geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent';

  constructor(apiKey: string, geminiApiKey?: string) {
    this.apiKey = apiKey;
    this.geminiApiKey = geminiApiKey || null;
  }

  async generateFlashcards(
    noteContent: string,
    count: number = 10,
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
    context?: string
  ): Promise<GeminiResponse> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('API key is required');
    }

    const prompt = this.buildFlashcardPrompt(noteContent, count, difficulty, context);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educator creating flashcards from study notes. Always respond with valid JSON only, no markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 4096,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected Perplexity API response structure:', data);
        throw new Error('Unexpected response structure from Perplexity API');
      }

      const generatedText = data.choices[0].message.content;

      // Parse the response to extract flashcards
      const flashcards = this.parseFlashcardResponse(generatedText);

      // Get token usage from response or estimate
      const totalTokens = data.usage?.total_tokens || this.estimateTokenUsage(prompt + generatedText);
      const costCents = data.usage?.cost?.total_cost
        ? Math.round(data.usage.cost.total_cost * 100)
        : this.calculateCost(totalTokens);

      return {
        flashcards,
        total_tokens: totalTokens,
        cost_cents: costCents
      };
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }

  private buildFlashcardPrompt(
    noteContent: string,
    count: number,
    difficulty: 'easy' | 'medium' | 'hard',
    context?: string
  ): string {
    let prompt = `You are an expert educator creating flashcards from study notes.

Please create ${count} high-quality flashcards from the following note content. The flashcards should be at a ${difficulty} difficulty level.

IMPORTANT: Difficulty should be based on concept complexity, NOT word count. All answers should be concise and to the point:
- Easy: Basic facts, definitions, simple concepts
- Medium: Application of concepts, moderate complexity
- Hard: Advanced analysis, synthesis, complex relationships

Keep all answers concise regardless of difficulty level to minimize token usage.`;

    // Extract custom instructions from context if present
    let customInstructions = '';
    let existingFlashcardsContext = '';

    if (context) {
      // Check if context contains custom instructions
      if (context.includes('Additional Instructions:')) {
        const parts = context.split('Additional Instructions:');
        existingFlashcardsContext = parts[0].trim();
        customInstructions = parts[1].trim();
      } else {
        existingFlashcardsContext = context;
      }
    }

    if (existingFlashcardsContext) {
      prompt += `\n\n${existingFlashcardsContext}`;
    }

    prompt += `\n\nNote Content:
${noteContent}

Instructions:
1. Create exactly ${count} flashcards
2. Each flashcard should have a clear question and concise answer
3. Questions should test understanding, not just memorization
4. Answers should be detailed but concise (aim for 1-3 sentences max)
5. Difficulty should reflect concept complexity, not answer length
6. ${existingFlashcardsContext ? 'Focus on topics and concepts that are NOT already covered in the existing flashcards. Analyze the note content thoroughly to identify gaps.' : ''}
${customInstructions ? `7. CRITICAL: Follow these specific instructions: ${customInstructions}` : ''}
${customInstructions ? '8. ' : '7. '}Format your response as a JSON array with this exact structure:
[
  {
    "question": "What is...?",
    "answer": "The answer is...",
    "difficulty": "easy|medium|hard"
  }
]

Please ensure the JSON is valid and properly formatted.
IMPORTANT: Do not wrap the JSON in \`\`\`json or add any prefix/suffix.
Do not include any additional text outside the JSON array.`;
    return prompt;
  }

  private parseFlashcardResponse(response: string): GeminiFlashcard[] {
    try {
      // Extract JSON from the response (in case there's extra text)
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const flashcards = JSON.parse(jsonMatch[0]);

      // Validate the structure
      if (!Array.isArray(flashcards)) {
        throw new Error('Response is not an array');
      }

      return flashcards.map((card, index) => {
        if (!card.question || !card.answer) {
          throw new Error(`Invalid flashcard at index ${index}`);
        }

        return {
          question: card.question.trim(),
          answer: card.answer.trim(),
          difficulty: card.difficulty || 'medium'
        };
      });
    } catch (error) {
      console.error('Error parsing Perplexity response:', error);
      throw new Error('Failed to parse flashcard response from Perplexity API');
    }
  }

  private estimateTokenUsage(text: string): number {
    // Rough estimation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  private calculateCost(tokens: number): number {
    // Perplexity Sonar pricing (approximate): $1 per 1M input tokens, $1 per 1M output tokens
    // This is a simplified calculation
    const costPerToken = 0.000001; // $1 per 1M tokens
    return Math.round(tokens * costPerToken * 2 * 100); // Convert to cents
  }

  // Helper method to validate API key
  async validateApiKey(): Promise<boolean> {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'user',
              content: 'Hello'
            }
          ],
          max_tokens: 10,
        })
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Generate exam questions from note content
  async generateExamQuestions(
    noteContent: string,
    config: ExamGenerationConfig
  ): Promise<ExamGenerationResponse> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('API key is required');
    }

    const prompt = this.buildExamPrompt(noteContent, config);

    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'sonar',
          messages: [
            {
              role: 'system',
              content: 'You are an expert educator creating exam questions from study notes. Always respond with valid JSON only, no markdown formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 8192,
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Perplexity API error response:', errorText);
        throw new Error(`Perplexity API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Unexpected Perplexity API response structure:', data);
        throw new Error('Unexpected response structure from Perplexity API');
      }

      const generatedText = data.choices[0].message.content;
      const questions = this.parseExamResponse(generatedText, config);

      const totalTokens = data.usage?.total_tokens || this.estimateTokenUsage(prompt + generatedText);
      const costCents = data.usage?.cost?.total_cost
        ? Math.round(data.usage.cost.total_cost * 100)
        : this.calculateCost(totalTokens);

      return {
        questions,
        total_tokens: totalTokens,
        cost_cents: costCents
      };
    } catch (error) {
      console.error('Perplexity API error:', error);
      throw error;
    }
  }

  private buildExamPrompt(noteContent: string, config: ExamGenerationConfig): string {
    const { multipleChoiceCount, identificationCount, essayCount, difficulty, customInstructions } = config;
    const totalQuestions = multipleChoiceCount + identificationCount + essayCount;

    let prompt = `You are an expert educator creating exam questions from study notes.

Please create ${totalQuestions} exam questions from the following note content. The questions should be at a ${difficulty} difficulty level.

IMPORTANT: Difficulty should be based on concept complexity:
- Easy: Basic facts, definitions, simple recall
- Medium: Application of concepts, understanding relationships
- Hard: Advanced analysis, synthesis, critical thinking
- Mixed: A combination of all difficulty levels

Question Distribution:
${multipleChoiceCount > 0 ? `- Multiple Choice: ${multipleChoiceCount} questions` : ''}
${identificationCount > 0 ? `- Identification/Short Answer: ${identificationCount} questions` : ''}
${essayCount > 0 ? `- Essay: ${essayCount} questions` : ''}

Note Content:
${noteContent}

Instructions:
1. Create exactly the specified number of questions for each type
2. For Multiple Choice questions:
   - Provide exactly 4 options (A, B, C, D)
   - Make sure distractors are plausible but clearly incorrect
   - Indicate the correct answer letter
3. For Identification questions:
   - Create fill-in-the-blank or short answer questions
   - The answer should be 1-5 words maximum
4. For Essay questions:
   - Create open-ended questions that require analysis or explanation
   - The answer should be a model response or key points to cover
${customInstructions ? `5. CRITICAL: Follow these specific instructions: ${customInstructions}` : ''}

Format your response as a JSON array with this exact structure:
[
  {
    "question": "The question text",
    "correct_answer": "The correct answer",
    "question_type": "multiple_choice|identification|essay",
    "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
    "points": 1
  }
]

Notes:
- For multiple_choice: include "options" array with 4 options, correct_answer should be the letter (e.g., "A", "B", "C", or "D")
- For identification: omit "options" or set to null, correct_answer should be the short answer
- For essay: omit "options" or set to null, correct_answer should be model answer/key points
- Points: multiple_choice = 1, identification = 2, essay = 5

Please ensure the JSON is valid and properly formatted.
IMPORTANT: Do not wrap the JSON in \`\`\`json or add any prefix/suffix.
Do not include any additional text outside the JSON array.`;

    return prompt;
  }

  private parseExamResponse(response: string, config: ExamGenerationConfig): ExamQuestionGenerated[] {
    try {
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(questions)) {
        throw new Error('Response is not an array');
      }

      // Filter and cap questions by type to match what was requested
      const mcQuestions = questions.filter(q => q.question_type === 'multiple_choice').slice(0, config.multipleChoiceCount);
      const idQuestions = questions.filter(q => q.question_type === 'identification').slice(0, config.identificationCount);
      const essayQuestions = questions.filter(q => q.question_type === 'essay').slice(0, config.essayCount);

      // Combine in order: MC first, then ID, then Essay
      const sortedQuestions = [...mcQuestions, ...idQuestions, ...essayQuestions];

      console.log(`[Gemini] Parsed questions: ${mcQuestions.length} MC, ${idQuestions.length} ID, ${essayQuestions.length} Essay`);

      return sortedQuestions.map((q, index) => {
        if (!q.question || !q.correct_answer || !q.question_type) {
          throw new Error(`Invalid question at index ${index}`);
        }

        // Assign points based on question type
        let points = q.points || 1;
        if (q.question_type === 'identification') points = 2;
        if (q.question_type === 'essay') points = 5;

        return {
          question: q.question.trim(),
          correct_answer: q.correct_answer.trim(),
          question_type: q.question_type,
          options: q.question_type === 'multiple_choice' ? q.options : null,
          points
        };
      });
    } catch (error) {
      console.error('Error parsing exam response:', error);
      throw new Error('Failed to parse exam response from Perplexity API');
    }
  }

  // Grade multiple essays - batches if there are too many
  async gradeAllEssays(
    essays: Array<{
      id: string;
      question: string;
      modelAnswer: string;
      userAnswer: string;
      maxPoints: number;
    }>
  ): Promise<Map<string, EssayGradingResult>> {
    const results = new Map<string, EssayGradingResult>();

    if (essays.length === 0) {
      return results;
    }

    // If too many essays, batch them (max 5 per call to avoid token limits)
    const BATCH_SIZE = 5;
    if (essays.length > BATCH_SIZE) {
      console.log(`[GeminiService] Batching ${essays.length} essays into groups of ${BATCH_SIZE}`);
      for (let i = 0; i < essays.length; i += BATCH_SIZE) {
        const batch = essays.slice(i, i + BATCH_SIZE);
        console.log(`[GeminiService] Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(essays.length / BATCH_SIZE)}`);
        const batchResults = await this.gradeEssayBatch(batch);
        batchResults.forEach((value, key) => results.set(key, value));
        // Small delay between batches to avoid rate limits
        if (i + BATCH_SIZE < essays.length) {
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      return results;
    }

    return this.gradeEssayBatch(essays);
  }

  // Grade a single batch of essays (max ~5)
  private async gradeEssayBatch(
    essays: Array<{
      id: string;
      question: string;
      modelAnswer: string;
      userAnswer: string;
      maxPoints: number;
    }>
  ): Promise<Map<string, EssayGradingResult>> {
    const results = new Map<string, EssayGradingResult>();

    // Build prompt for this batch
    const prompt = `You are an expert educator grading essay responses. Grade ALL of the following student answers.

${essays.map((e, i) => `
=== ESSAY ${i + 1} (ID: ${e.id}) ===
Question: ${e.question}
Model Answer: ${e.modelAnswer}
Student Answer: ${e.userAnswer || '(No answer provided)'}
Max Points: ${e.maxPoints}
`).join('\n')}

Instructions:
1. Grade each response on its max points scale
2. Consider: accuracy, completeness, understanding, clarity
3. Partial credit is encouraged
4. Provide brief constructive feedback for each

Return a JSON array with grades for ALL essays in order:
[
  {"id": "essay-id", "score": <number>, "feedback": "<brief feedback>"},
  ...
]

IMPORTANT: Return ONLY the JSON array, no markdown.`;

    try {
      let data: { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> } | null = null;

      // Try Gemini first
      if (this.geminiApiKey) {
        console.log('[GeminiService] Calling Gemini API for essay grading...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(this.geminiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': this.geminiApiKey,
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.3, maxOutputTokens: 2048 }
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('[GeminiService] Gemini response status:', response.status);

        if (response.ok) {
          data = await response.json();
          console.log('[GeminiService] Gemini API success!');
        } else {
          console.warn('[GeminiService] Gemini API failed:', response.status);
        }
      }

      // Fallback to Perplexity
      if (!data && this.apiKey) {
        console.log('[GeminiService] Falling back to Perplexity API...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(this.baseUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            model: 'sonar',
            messages: [
              { role: 'system', content: 'You are an expert educator grading essays. Respond with valid JSON only.' },
              { role: 'user', content: prompt }
            ],
            max_tokens: 2048,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        console.log('[GeminiService] Perplexity response status:', response.status);

        if (response.ok) {
          const perplexityData = await response.json();
          console.log('[GeminiService] Perplexity API success!');
          // Convert to similar structure
          data = {
            candidates: [{
              content: {
                parts: [{ text: perplexityData.choices?.[0]?.message?.content }]
              }
            }]
          };
        } else {
          console.warn('[GeminiService] Perplexity API failed:', response.status);
        }
      }

      // Parse the response
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('[GeminiService] Raw response length:', generatedText.length, 'chars');

      if (!generatedText) {
        console.error('[GeminiService] API returned EMPTY response!');
      } else {
        const jsonMatch = generatedText.match(/\[[\s\S]*\]/);

        if (jsonMatch) {
          try {
            const grades = JSON.parse(jsonMatch[0]);
            console.log('[GeminiService] Successfully parsed', grades.length, 'grades from API');

            for (const grade of grades) {
              const essay = essays.find(e => e.id === grade.id);
              if (essay) {
                results.set(grade.id, {
                  score: Math.min(Math.max(grade.score || 0, 0), essay.maxPoints),
                  feedback: grade.feedback || 'Graded by AI.',
                  total_tokens: 0,
                  cost_cents: 0
                });
              } else {
                console.warn('[GeminiService] Grade ID not found in essays:', grade.id?.slice(0, 8));
              }
            }
            console.log('[GeminiService] Matched', results.size, 'of', essays.length, 'essays');
          } catch (parseError) {
            console.error('[GeminiService] JSON parse failed:', parseError);
            console.error('[GeminiService] Raw JSON was:', jsonMatch[0].slice(0, 200));
          }
        } else {
          console.error('[GeminiService] No JSON array found in response!');
          console.error('[GeminiService] Response preview:', generatedText.slice(0, 300));
        }
      }
    } catch (error) {
      console.error('[GeminiService] Essay batch grading EXCEPTION:', error);
    }

    // Fill in any missing results with partial credit
    for (const essay of essays) {
      if (!results.has(essay.id)) {
        results.set(essay.id, {
          score: Math.round(essay.maxPoints * 0.5),
          feedback: 'Unable to grade automatically. Partial credit awarded.',
          total_tokens: 0,
          cost_cents: 0
        });
      }
    }

    return results;
  }

}

// Utility function to create Gemini service instance
export function createGeminiService(perplexityApiKey: string, geminiApiKey?: string): GeminiService {
  return new GeminiService(perplexityApiKey, geminiApiKey);
}