// AI API service for converting notes to flashcards (using Perplexity API)
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

export class GeminiService {
  private apiKey: string;
  private baseUrl = 'https://api.perplexity.ai/chat/completions';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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

${customInstructions && customInstructions.toLowerCase().includes('multiple choice') ? `
SPECIAL INSTRUCTIONS FOR MULTIPLE CHOICE:
- FORMAT THE QUESTION WITH LINE BREAKS BETWEEN OPTIONS
- Question structure: "Which of the following is correct about [topic]?" followed by line break
- Then each option on its own line:
  A) [first option] (line break)
  B) [second option] (line break)
  C) [third option] (line break)
  D) [fourth option]
- The answer should only be the correct option letter (A, B, C, or D)
- Example format:
  "question": "Which of the following is correct about photosynthesis?
A) Plants convert sunlight into energy
B) Animals perform photosynthesis
C) Photosynthesis only occurs at night
D) No organisms use photosynthesis",
  "answer": "A"
- MANDATORY: Use actual line breaks between A), B), C), and D) options in the question field
- DO NOT put all options on the same line
` : ''}

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

        // Post-process multiple choice questions to ensure proper formatting
        let processedQuestion = card.question.trim();
        let processedAnswer = card.answer.trim();

        // Check if this looks like a multiple choice question that needs formatting
        // Simple check: contains A), B), C), D) and doesn't already have line breaks
        if (processedQuestion.includes('A)') && processedQuestion.includes('B)') &&
            processedQuestion.includes('C)') && processedQuestion.includes('D)') &&
            !processedQuestion.includes('\nA)') && !processedQuestion.includes('\nB)')) {

          console.log('Processing multiple choice question:', processedQuestion);

          // Format the question with line breaks
          processedQuestion = processedQuestion
            .replace(/A\)/g, '\nA)')
            .replace(/B\)/g, '\nB)')
            .replace(/C\)/g, '\nC)')
            .replace(/D\)/g, '\nD)')
            .trim();

          // Remove the first line break if it's at the beginning
          if (processedQuestion.startsWith('\n')) {
            processedQuestion = processedQuestion.substring(1);
          }

          console.log('After processing:', processedQuestion);
        }

        return {
          question: processedQuestion,
          answer: processedAnswer,
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
}

// Utility function to create Gemini service instance
export function createGeminiService(apiKey: string): GeminiService {
  return new GeminiService(apiKey);
}