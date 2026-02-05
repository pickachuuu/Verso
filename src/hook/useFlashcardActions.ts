'use client';

import { useMemo, useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { GeminiFlashcard, GeminiResponse } from '@/lib/gemini';
import { FlashcardSetInsert, FlashcardInsert, GeminiRequestInsert, Flashcard, FlashcardSet } from '@/lib/database.types';
import {
  SimplifiedRating,
  simplifiedToQuality,
  calculateSM2,
  getInitialSM2ForNewCard,
  getPreviewIntervals,
  formatInterval,
  isCardDue,
  sortCardsByUrgency,
  SM2_DEFAULTS
} from '@/lib/spacedRepetition';

const supabase = createClient();

export interface SaveFlashcardsOptions {
  noteId?: string;
  noteTitle?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  geminiResponse: GeminiResponse;
}

export interface FlashcardWithNavigation extends Flashcard {
  hasNext: boolean;
  hasPrevious: boolean;
  currentIndex: number;
  totalCards: number;
}

export interface StudySetData {
  set: FlashcardSet;
  cards: Flashcard[];
  progress: {
    total: number;
    mastered: number;
    percentage: number;
  };
}

export interface SpacedRepetitionReviewResult {
  flashcard: Flashcard;
  nextReviewFormatted: string;
  wasSuccessful: boolean;
}

// Extended flashcard type with SM-2 fields
export interface FlashcardWithSM2 extends Flashcard {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  lapses: number;
}

export function useFlashcardActions() {
  // Convert Gemini difficulty to numeric difficulty level
  const convertDifficultyToLevel = useCallback((difficulty: 'easy' | 'medium' | 'hard'): number => {
    switch (difficulty) {
      case 'easy': return 1;
      case 'medium': return 2;
      case 'hard': return 3;
      default: return 2;
    }
  }, []);

  return useMemo(() => {
    // Create a new flashcard set
    const createFlashcardSet = async (noteId: string | null, noteTitle: string): Promise<string> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const setTitle = noteTitle ? `Flashcards from: ${noteTitle}` : 'Generated Flashcards';

      const flashcardSet: FlashcardSetInsert = {
        user_id: session.user.id,
        note_id: noteId,
        title: setTitle,
        description: `AI-generated flashcards from note content`,
        total_cards: 0,
        mastered_cards: 0
      };

      const { data, error } = await supabase
        .from('flashcard_sets')
        .insert(flashcardSet)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating flashcard set:', error);
        throw error;
      }

      return data.id;
    };

    // Save individual flashcards with proper positioning
    const saveFlashcards = async (
      setId: string,
      noteId: string | null,
      flashcards: GeminiFlashcard[],
      startPosition: number = 0
    ): Promise<void> => {
      const flashcardInserts: FlashcardInsert[] = flashcards.map((flashcard, index) => ({
        set_id: setId,
        note_id: noteId,
        question: flashcard.question,
        answer: flashcard.answer,
        status: 'new',
        difficulty_level: convertDifficultyToLevel(flashcard.difficulty),
        position: startPosition + index,
        review_count: 0,
        correct_count: 0
      }));

      const { error } = await supabase
        .from('flashcards')
        .insert(flashcardInserts);

      if (error) {
        console.error('Error saving flashcards:', error);
        throw error;
      }
    };

    // Log Gemini API request
    const logGeminiRequest = async (
      noteId: string | null,
      prompt: string,
      response: GeminiResponse,
      status: 'completed' | 'failed' = 'completed',
      errorMessage?: string
    ): Promise<void> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const geminiRequest: GeminiRequestInsert = {
        user_id: session.user.id,
        note_id: noteId,
        request_type: 'flashcard_generation',
        prompt,
        response: JSON.stringify(response.flashcards),
        status,
        tokens_used: response.total_tokens,
        cost_cents: response.cost_cents,
        error_message: errorMessage || null,
        completed_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('gemini_requests')
        .insert(geminiRequest);

      if (error) {
        console.error('Error logging Gemini request:', error);
        // Don't throw here as this is just logging
      }
    };

    // Main function to save generated flashcards
    const saveGeneratedFlashcards = async (options: SaveFlashcardsOptions): Promise<string> => {
      const { noteId, noteTitle, difficulty, geminiResponse } = options;

      try {
        // Create flashcard set
        const setId = await createFlashcardSet(noteId || null, noteTitle || 'Untitled Note');

        // Save individual flashcards (positions start at 0)
        await saveFlashcards(setId, noteId || null, geminiResponse.flashcards, 0);

        // Log the Gemini request
        const prompt = `Generate ${geminiResponse.flashcards.length} ${difficulty} flashcards from note content`;
        await logGeminiRequest(noteId || null, prompt, geminiResponse);

        return setId;
      } catch (error) {
        // Log failed request
        const prompt = `Generate ${geminiResponse.flashcards.length} ${difficulty} flashcards from note content`;
        await logGeminiRequest(noteId || null, prompt, geminiResponse, 'failed', error instanceof Error ? error.message : 'Unknown error');

        throw error;
      }
    };

    // Function to handle reforge operations (add to existing or replace entirely)
    const reforgeFlashcards = async (
      existingSetId: string,
      action: 'add_more' | 'regenerate',
      flashcards: GeminiFlashcard[]
    ): Promise<void> => {
      try {
        let startPosition = 0;

        if (action === 'regenerate') {
          // Delete all existing flashcards in the set
          const { error: deleteError } = await supabase
            .from('flashcards')
            .delete()
            .eq('set_id', existingSetId);

          if (deleteError) {
            console.error('Error deleting existing flashcards:', deleteError);
            throw deleteError;
          }
        } else {
          // For 'add_more', get the max position to continue from
          const { data: maxPosData } = await supabase
            .from('flashcards')
            .select('position')
            .eq('set_id', existingSetId)
            .order('position', { ascending: false })
            .limit(1)
            .single();

          startPosition = (maxPosData?.position ?? -1) + 1;
        }

        // Save the new flashcards with proper positioning
        await saveFlashcards(existingSetId, null, flashcards, startPosition);

        // Update the set's total_cards count and timestamp
        const { data: cardCount } = await supabase
          .from('flashcards')
          .select('id', { count: 'exact', head: true })
          .eq('set_id', existingSetId);

        const { error: updateError } = await supabase
          .from('flashcard_sets')
          .update({
            total_cards: cardCount || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingSetId);

        if (updateError) {
          console.error('Error updating flashcard set:', updateError);
          throw updateError;
        }

      } catch (error) {
        console.error('Error in reforge operation:', error);
        throw error;
      }
    };

    // Get user's flashcard sets
    const getUserFlashcardSets = async (): Promise<FlashcardSet[]> => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          notes (
            id,
            title
          )
        `)
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching flashcard sets:', error);
        return [];
      }

      return data || [];
    };

    // Get complete study set data (set + all cards) in a single call
    // This is the MAIN function to use for loading a study session
    const getStudySetData = async (setId: string): Promise<StudySetData | null> => {
      // Fetch set and cards in parallel
      const [setResult, cardsResult] = await Promise.all([
        supabase
          .from('flashcard_sets')
          .select(`
            *,
            notes (
              id,
              title
            )
          `)
          .eq('id', setId)
          .single(),
        supabase
          .from('flashcards')
          .select('*')
          .eq('set_id', setId)
          .order('position', { ascending: true })
      ]);

      if (setResult.error || !setResult.data) {
        console.error('Error fetching flashcard set:', setResult.error);
        return null;
      }

      if (cardsResult.error) {
        console.error('Error fetching flashcards:', cardsResult.error);
        return null;
      }

      const cards = (cardsResult.data || []) as Flashcard[];
      const masteredCount = cards.filter((c: Flashcard) => c.status === 'mastered').length;

      return {
        set: setResult.data,
        cards,
        progress: {
          total: cards.length,
          mastered: masteredCount,
          percentage: cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0
        }
      };
    };

    // Get flashcards for a specific set (sorted by position)
    const getFlashcardsBySet = async (setId: string): Promise<Flashcard[]> => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching flashcards:', error);
        return [];
      }

      return data || [];
    };

    // Update flashcard status (for study sessions)
    const updateFlashcardStatus = async (
      flashcardId: string,
      status: 'new' | 'learning' | 'review' | 'mastered',
      wasCorrect?: boolean
    ): Promise<Flashcard | null> => {
      // First get the current flashcard
      const { data: currentCard, error: fetchError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', flashcardId)
        .single();

      if (fetchError || !currentCard) {
        console.error('Error fetching current flashcard:', fetchError);
        return null;
      }

      const updateData: Partial<Flashcard> = {
        status,
        last_reviewed: new Date().toISOString()
      };

      if (wasCorrect !== undefined) {
        updateData.review_count = currentCard.review_count + 1;
        if (wasCorrect) {
          updateData.correct_count = currentCard.correct_count + 1;
        }
      }

      const { data, error } = await supabase
        .from('flashcards')
        .update(updateData)
        .eq('id', flashcardId)
        .select('*')
        .single();

      if (error) {
        console.error('Error updating flashcard status:', error);
        return null;
      }

      return data as Flashcard;
    };

    // Get a single flashcard by ID
    const getFlashcardById = async (flashcardId: string): Promise<Flashcard | null> => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', flashcardId)
        .single();

      if (error) {
        console.error('Error fetching flashcard:', error);
        return null;
      }

      return data;
    };

    // Get flashcard set details
    const getFlashcardSetById = async (setId: string): Promise<FlashcardSet | null> => {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`
          *,
          notes (
            id,
            title
          )
        `)
        .eq('id', setId)
        .single();

      if (error) {
        console.error('Error fetching flashcard set:', error);
        return null;
      }

      return data;
    };

    // Mark flashcard as mastered and return updated card
    const markFlashcardAsMastered = async (flashcardId: string): Promise<Flashcard | null> => {
      return updateFlashcardStatus(flashcardId, 'mastered', true);
    };

    // Mark flashcard as needs review (got it wrong)
    const markFlashcardAsLearning = async (flashcardId: string): Promise<Flashcard | null> => {
      return updateFlashcardStatus(flashcardId, 'learning', false);
    };

    // Get progress for a flashcard set
    const getSetProgress = async (setId: string) => {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select('total_cards, mastered_cards')
        .eq('id', setId)
        .single();

      if (error) {
        console.error('Error fetching set progress:', error);
        return { total: 0, mastered: 0, percentage: 0 };
      }

      const percentage = data.total_cards > 0 ? Math.round((data.mastered_cards / data.total_cards) * 100) : 0;

      return {
        total: data.total_cards,
        mastered: data.mastered_cards,
        percentage
      };
    };

    // Get first card in a set
    const getFirstCardInSet = async (setId: string): Promise<{ id: string } | null> => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('id')
        .eq('set_id', setId)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (error) {
        console.error('Error fetching first card:', error);
        return null;
      }

      return data;
    };

    // Get next card in the set by position (without fetching all cards)
    const getNextCard = async (currentCardId: string, setId: string): Promise<{ id: string } | null> => {
      // Get current card's position
      const { data: currentCard, error: currentError } = await supabase
        .from('flashcards')
        .select('position')
        .eq('id', currentCardId)
        .single();

      if (currentError || !currentCard) {
        console.error('Error fetching current card position:', currentError);
        return null;
      }

      // Get next card by position
      const { data: nextCard, error: nextError } = await supabase
        .from('flashcards')
        .select('id')
        .eq('set_id', setId)
        .gt('position', currentCard.position)
        .order('position', { ascending: true })
        .limit(1)
        .single();

      if (nextError || !nextCard) {
        return null; // No next card
      }

      return nextCard;
    };

    // Get previous card in the set by position (without fetching all cards)
    const getPreviousCard = async (currentCardId: string, setId: string): Promise<{ id: string } | null> => {
      // Get current card's position
      const { data: currentCard, error: currentError } = await supabase
        .from('flashcards')
        .select('position')
        .eq('id', currentCardId)
        .single();

      if (currentError || !currentCard) {
        console.error('Error fetching current card position:', currentError);
        return null;
      }

      // Get previous card by position
      const { data: prevCard, error: prevError } = await supabase
        .from('flashcards')
        .select('id')
        .eq('set_id', setId)
        .lt('position', currentCard.position)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      if (prevError || !prevCard) {
        return null; // No previous card
      }

      return prevCard;
    };

    // Delete a flashcard set and all its cards
    const deleteFlashcardSet = async (setId: string) => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', setId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error deleting flashcard set:', error);
        throw error;
      }
    };

    // Toggle public status of flashcard set
    const togglePublicStatus = async (setId: string, isPublic: boolean) => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.user?.id) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('flashcard_sets')
        .update({ is_public: isPublic })
        .eq('id', setId)
        .eq('user_id', session.user.id);

      if (error) {
        console.error('Error updating flashcard set public status:', error);
        throw error;
      }
    };

    // Get public flashcard set by ID (for public viewing)
    const getPublicFlashcardSet = async (setId: string) => {
      const { data, error } = await supabase
        .from('flashcard_sets')
        .select(`
          id,
          title,
          description,
          total_cards,
          user_id,
          created_at,
          profiles!inner(full_name)
        `)
        .eq('id', setId)
        .eq('is_public', true)
        .single();

      if (error) {
        console.error('Error fetching public flashcard set:', error);
        throw error;
      }

      return data;
    };

    // Get public flashcards by set ID (sorted by position)
    const getPublicFlashcards = async (setId: string): Promise<Flashcard[]> => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('id, question, answer, difficulty_level, position')
        .eq('set_id', setId)
        .order('position', { ascending: true });

      if (error) {
        console.error('Error fetching public flashcards:', error);
        throw error;
      }

      return (data || []) as Flashcard[];
    };

    // ============================================
    // Spaced Repetition Functions
    // ============================================

    /**
     * Review a flashcard using the SM-2 spaced repetition algorithm
     * Updates the card's scheduling data and returns the result
     */
    const reviewFlashcardWithSR = async (
      flashcardId: string,
      rating: SimplifiedRating
    ): Promise<SpacedRepetitionReviewResult | null> => {
      // First get the current flashcard
      const { data: currentCard, error: fetchError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', flashcardId)
        .single();

      if (fetchError || !currentCard) {
        console.error('Error fetching flashcard for review:', fetchError);
        return null;
      }

      const card = currentCard as FlashcardWithSM2;
      const quality = simplifiedToQuality(rating);
      const wasSuccessful = quality >= 3;

      // Calculate new SM-2 values
      let sm2Result;
      if (card.status === 'new' && card.repetitions === 0) {
        // First time reviewing this card
        sm2Result = getInitialSM2ForNewCard(quality);
      } else {
        sm2Result = calculateSM2({
          quality,
          currentEaseFactor: card.ease_factor || SM2_DEFAULTS.easeFactor,
          currentInterval: card.interval_days || SM2_DEFAULTS.interval,
          repetitions: card.repetitions || SM2_DEFAULTS.repetitions,
          lapses: card.lapses || SM2_DEFAULTS.lapses,
        });
      }

      // Update the flashcard with new SM-2 values
      // Note: interval_days is stored as INTEGER in database, so we need to round
      // For sub-day intervals (learning cards), we store 0 and rely on next_review for timing
      const updateData = {
        status: sm2Result.status,
        ease_factor: sm2Result.easeFactor,
        interval_days: Math.max(0, Math.round(sm2Result.interval)), // Must be integer
        repetitions: sm2Result.repetitions,
        lapses: sm2Result.lapses,
        next_review: sm2Result.nextReview.toISOString(),
        last_reviewed: new Date().toISOString(),
        review_count: (card.review_count || 0) + 1,
        correct_count: wasSuccessful ? (card.correct_count || 0) + 1 : card.correct_count || 0,
      };

      const { data: updatedCard, error: updateError } = await supabase
        .from('flashcards')
        .update(updateData)
        .eq('id', flashcardId)
        .select('*')
        .single();

      if (updateError) {
        console.error('Error updating flashcard with SR data:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code,
        });
        // If columns don't exist, the migration hasn't been run
        if (updateError.code === '42703' || updateError.message?.includes('column')) {
          console.error('Database migration may be needed. Run add_spaced_repetition_fields.sql');
        }
        return null;
      }

      // Update mastered_cards count in the parent set if status changed to mastered
      if (sm2Result.status === 'mastered' && card.status !== 'mastered') {
        const { error: setUpdateError } = await supabase
          .from('flashcard_sets')
          .update({
            mastered_cards: supabase.rpc('increment', { row_id: card.set_id, field_name: 'mastered_cards' }),
            updated_at: new Date().toISOString()
          })
          .eq('id', card.set_id);

        // If RPC doesn't exist, do a manual update
        if (setUpdateError) {
          const { data: setData } = await supabase
            .from('flashcard_sets')
            .select('mastered_cards')
            .eq('id', card.set_id)
            .single();

          if (setData) {
            await supabase
              .from('flashcard_sets')
              .update({
                mastered_cards: (setData.mastered_cards || 0) + 1,
                updated_at: new Date().toISOString()
              })
              .eq('id', card.set_id);
          }
        }
      }

      return {
        flashcard: updatedCard as Flashcard,
        nextReviewFormatted: formatInterval(sm2Result.interval),
        wasSuccessful,
      };
    };

    /**
     * Get cards that are due for review in a specific set
     * Sorted by urgency (most overdue first)
     */
    const getDueCardsForSet = async (setId: string): Promise<Flashcard[]> => {
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setId)
        .or('status.eq.new,status.eq.learning,status.eq.review')
        .order('next_review', { ascending: true, nullsFirst: true });

      if (error) {
        console.error('Error fetching due cards:', error);
        return [];
      }

      // Filter to only due cards and sort by urgency
      const dueCards = (data || []).filter((card: Flashcard) =>
        card.status === 'new' || isCardDue(card.next_review)
      );

      return sortCardsByUrgency(dueCards);
    };

    /**
     * Get all due cards across all user's flashcard sets
     */
    const getAllDueCards = async (): Promise<Flashcard[]> => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user?.id) return [];

      const { data, error } = await supabase
        .from('flashcards')
        .select(`
          *,
          flashcard_sets!inner (user_id)
        `)
        .eq('flashcard_sets.user_id', session.user.id)
        .or('status.eq.new,status.eq.learning,status.eq.review');

      if (error) {
        console.error('Error fetching all due cards:', error);
        return [];
      }

      // Filter to only due cards and sort by urgency
      const dueCards = (data || []).filter((card: Flashcard) =>
        card.status === 'new' || isCardDue(card.next_review)
      );

      return sortCardsByUrgency(dueCards);
    };

    /**
     * Get preview of next review intervals for each rating option
     * Useful for showing users what will happen with each choice
     */
    const getReviewPreviews = (flashcard: Flashcard): Record<SimplifiedRating, string> => {
      const card = flashcard as FlashcardWithSM2;
      return getPreviewIntervals(
        card.ease_factor || SM2_DEFAULTS.easeFactor,
        card.interval_days || SM2_DEFAULTS.interval,
        card.repetitions || SM2_DEFAULTS.repetitions,
        card.lapses || SM2_DEFAULTS.lapses
      );
    };

    /**
     * Get study statistics for a flashcard set
     */
    const getSetStudyStats = async (setId: string) => {
      const { data: cards, error } = await supabase
        .from('flashcards')
        .select('status, next_review, ease_factor, interval_days')
        .eq('set_id', setId);

      if (error || !cards) {
        console.error('Error fetching set stats:', error);
        return null;
      }

      const now = new Date();
      let newCount = 0;
      let learningCount = 0;
      let reviewCount = 0;
      let masteredCount = 0;
      let dueNowCount = 0;

      cards.forEach((card: { status: string; next_review: string | null }) => {
        switch (card.status) {
          case 'new':
            newCount++;
            dueNowCount++; // New cards are always "due"
            break;
          case 'learning':
            learningCount++;
            if (isCardDue(card.next_review)) dueNowCount++;
            break;
          case 'review':
            reviewCount++;
            if (isCardDue(card.next_review)) dueNowCount++;
            break;
          case 'mastered':
            masteredCount++;
            break;
        }
      });

      return {
        totalCards: cards.length,
        newCount,
        learningCount,
        reviewCount,
        masteredCount,
        dueNowCount,
        masteryPercentage: cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0,
      };
    };

    return {
      // Flashcard set operations
      createFlashcardSet,
      saveFlashcards,
      saveGeneratedFlashcards,
      reforgeFlashcards,
      getUserFlashcardSets,
      getStudySetData,
      getFlashcardsBySet,
      updateFlashcardStatus,
      getFlashcardById,
      getFlashcardSetById,
      markFlashcardAsMastered,
      markFlashcardAsLearning,
      getSetProgress,
      getFirstCardInSet,
      getNextCard,
      getPreviousCard,
      deleteFlashcardSet,
      togglePublicStatus,
      getPublicFlashcardSet,
      getPublicFlashcards,
      // Spaced repetition functions
      reviewFlashcardWithSR,
      getDueCardsForSet,
      getAllDueCards,
      getReviewPreviews,
      getSetStudyStats,
    };
  }, [convertDifficultyToLevel]);
}

// Re-export spaced repetition utilities for convenience
export { formatInterval, isCardDue, sortCardsByUrgency, SM2_DEFAULTS };
export type { SimplifiedRating };
