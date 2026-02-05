// Centralized exports for all custom hooks

// Note hooks
export {
  useUserNotes,
  useNote,
  useNotePages,
  useCreateNote,
  useSaveNote,
  useDeleteNote,
  useCreatePage,
  useSavePage,
  useDeletePage,
  extractH1Title,
  noteKeys,
  type Note,
  type NotePage,
} from './useNotes';

// Dashboard hooks
export {
  useDashboardStats,
  useRecentActivity,
  useStudyStreak,
  useCardsDue,
  useMasteryData,
  useWeeklyActivity,
  useContinueLearning,
  dashboardKeys,
  type DashboardStats,
  type ActivityItem,
  type StudyStreakData,
  type CardsDueData,
  type MasteryData,
  type WeeklyActivityData,
  type ContinueLearningData,
} from './useDashboard';

// Activity tracking hooks
export {
  useStartStudySession,
  useCompleteStudySession,
  useTrackNoteActivity,
  useTrackExamActivity,
  startStudySession,
  completeStudySession,
  trackNoteActivity,
  trackExamActivity,
  logCardReview,
  getOrCreateFlashcardSession,
  incrementSessionStats,
  type ActivityType,
  type StartSessionParams,
  type CompleteSessionParams,
  type TrackNoteActivityParams,
  type TrackExamActivityParams,
} from './useActivityTracking';

// Auth hooks
export {
  useUserProfile,
  authKeys,
  type UserProfile,
} from './useAuth';

// Flashcard hooks
export {
  useFlashcardSets,
  useFlashcardSet,
  useStudySetData,
  usePublicFlashcardSet,
  usePublicFlashcards,
  useSaveGeneratedFlashcards,
  useReforgeFlashcards,
  useUpdateFlashcardStatus,
  useDeleteFlashcardSet,
  useTogglePublicStatus,
  flashcardKeys,
  type StudySetData,
  type SaveFlashcardsOptions,
  type ReforgeOptions,
  type UpdateStatusParams,
  type Flashcard,
  type FlashcardSet,
} from './useFlashcards';

// Exam hooks
export {
  useExams,
  useExam,
  useAttemptResults,
  useInProgressAttempt,
  useExamAttempts,
  useCreateExam,
  useDeleteExam,
  useStartExamAttempt,
  useSaveResponse,
  useSubmitExam,
  useAbandonAttempt,
  examKeys,
  type ExamWithQuestions,
  type AttemptWithResponses,
  type ExamListItem,
  type CreateExamParams,
  type SaveResponseParams,
  type SubmitExamParams,
  type ExamSet,
  type ExamQuestion,
  type ExamAttempt,
  type ExamResponse,
} from './useExams';
