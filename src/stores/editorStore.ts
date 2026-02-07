import { create } from 'zustand';
import { Editor } from '@tiptap/react';
import { ViewType } from '@/component/ui/PageFlipContainer';
import { NotePage } from '@/component/ui/TableOfContents';
import { NotebookColorKey } from '@/component/ui/ClayNotebookCover';
import { ReactNode } from 'react';

// ============================================
// Editor Store - Handles editor view and page navigation state
// ============================================

interface EditorState {
  // View state
  currentView: ViewType;
  currentPageIndex: number | null;

  // Content tracking
  currentPageContent: string;
  lastSavedContent: string;

  // Editor instance
  editor: Editor | null;

  // Previous content for flip animation
  previousContent: ReactNode;
}

interface EditorActions {
  // View actions
  setCurrentView: (view: ViewType) => void;
  setCurrentPageIndex: (index: number | null) => void;

  // Content actions
  setCurrentPageContent: (content: string) => void;
  setLastSavedContent: (content: string) => void;

  // Editor actions
  setEditor: (editor: Editor | null) => void;

  // Animation support
  setPreviousContent: (content: ReactNode) => void;

  // Navigation helpers
  navigateToPage: (index: number, pages: NotePage[]) => void;
  navigateToTOC: () => void;
  navigateToCover: () => void;

  // Reset
  reset: () => void;
}

const initialState: EditorState = {
  currentView: 'cover',
  currentPageIndex: null,
  currentPageContent: '',
  lastSavedContent: '',
  editor: null,
  previousContent: null,
};

export const useEditorStore = create<EditorState & EditorActions>((set, get) => ({
  ...initialState,

  // View actions
  setCurrentView: (view) => set({ currentView: view }),
  setCurrentPageIndex: (index) => set({ currentPageIndex: index }),

  // Content actions
  setCurrentPageContent: (content) => set({ currentPageContent: content }),
  setLastSavedContent: (content) => set({ lastSavedContent: content }),

  // Editor actions
  setEditor: (editor) => set({ editor }),

  // Animation support
  setPreviousContent: (content) => set({ previousContent: content }),

  // Navigation helpers
  navigateToPage: (index, pages) => {
    const page = pages[index];
    if (page) {
      set({
        currentPageIndex: index,
        currentPageContent: page.content || '',
        lastSavedContent: page.content || '',
        currentView: 'page',
      });
    }
  },

  navigateToTOC: () => {
    set({
      currentView: 'toc',
      currentPageIndex: null,
      editor: null,
    });
  },

  navigateToCover: () => {
    set({
      currentView: 'cover',
      currentPageIndex: null,
      editor: null,
    });
  },

  // Reset
  reset: () => set(initialState),
}));

// ============================================
// Note Store - Handles note metadata
// ============================================

interface NoteState {
  id: string | null;
  slug: string | null;
  title: string;
  tags: string[];
  coverColor: NotebookColorKey;
}

interface NoteActions {
  setId: (id: string | null) => void;
  setSlug: (slug: string | null) => void;
  setTitle: (title: string) => void;
  setTags: (tags: string[]) => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  setCoverColor: (color: NotebookColorKey) => void;

  // Bulk set for loading note data
  setNoteData: (data: Partial<NoteState>) => void;

  // Reset
  reset: () => void;
}

const initialNoteState: NoteState = {
  id: null,
  slug: null,
  title: '',
  tags: [],
  coverColor: 'royal',
};

export const useNoteStore = create<NoteState & NoteActions>((set, get) => ({
  ...initialNoteState,

  setId: (id) => set({ id }),
  setSlug: (slug) => set({ slug }),
  setTitle: (title) => set({ title }),
  setTags: (tags) => set({ tags }),

  addTag: (tag) => {
    const trimmedTag = tag.trim();
    const { tags } = get();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      set({ tags: [...tags, trimmedTag] });
    }
  },

  removeTag: (tagToRemove) => {
    set({ tags: get().tags.filter((tag) => tag !== tagToRemove) });
  },

  setCoverColor: (color) => set({ coverColor: color }),

  setNoteData: (data) => set(data),

  reset: () => set(initialNoteState),
}));

// ============================================
// UI Store - Handles UI state
// ============================================

type SaveStatus = 'saved' | 'saving' | 'error';

interface UIState {
  saveStatus: SaveStatus;
  isLoading: boolean;
  showTagInput: boolean;
  tagInput: string;
}

interface UIActions {
  setSaveStatus: (status: SaveStatus) => void;
  setIsLoading: (loading: boolean) => void;
  setShowTagInput: (show: boolean) => void;
  setTagInput: (input: string) => void;
  reset: () => void;
}

const initialUIState: UIState = {
  saveStatus: 'saved',
  isLoading: false,
  showTagInput: false,
  tagInput: '',
};

export const useUIStore = create<UIState & UIActions>((set) => ({
  ...initialUIState,

  setSaveStatus: (status) => set({ saveStatus: status }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setShowTagInput: (show) => set({ showTagInput: show }),
  setTagInput: (input) => set({ tagInput: input }),
  reset: () => set(initialUIState),
}));
