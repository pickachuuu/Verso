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
  dashboardKeys,
  type DashboardStats,
  type ActivityItem,
} from './useDashboard';
