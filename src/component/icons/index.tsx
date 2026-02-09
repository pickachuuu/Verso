/**
 * ============================================
 * MemoForge Custom Icon System
 * ============================================
 *
 * App-specific icons for Notebooks, Flashcards, and Exams.
 *
 * Each icon:
 *   - Uses `currentColor` so it inherits text color via Tailwind (e.g. `text-primary`)
 *   - Accepts all standard SVG props (`className`, `style`, etc.)
 *   - Defaults to `1em × 1em` so it scales with font-size, or use `w-X h-X` classes
 *
 * Variants:
 *   - Base       → `NotebookIcon`, `FlashcardIcon`, `ExamIcon`
 *   - Add (+)    → `NotebookAddIcon`, `FlashcardAddIcon`, `ExamAddIcon`
 *
 * Usage:
 *   import { NotebookIcon, FlashcardAddIcon } from '@/component/icons';
 *   <NotebookIcon className="w-6 h-6 text-primary" />
 */

import type { SVGProps } from 'react';

// ─── Shared type ────────────────────────────────────────────
export type IconProps = SVGProps<SVGSVGElement>;

// ─── Plus badge (reused by all "Add" variants) ─────────────
function PlusBadge() {
  return (
    <g>
      <circle cx="19" cy="19" r="5.5" fill="currentColor" />
      <path
        d="M19 16.5v5M16.5 19h5"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────
//  NOTEBOOK
//  A bound notebook with spine lines and pages
// ─────────────────────────────────────────────────────────────

export function NotebookIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Cover */}
      <rect x="4" y="2" width="16" height="20" rx="2" />
      {/* Spine binding */}
      <line x1="8" y1="2" x2="8" y2="22" />
      {/* Ruled lines */}
      <line x1="11" y1="8" x2="17" y2="8" />
      <line x1="11" y1="12" x2="17" y2="12" />
      <line x1="11" y1="16" x2="15" y2="16" />
    </svg>
  );
}

export function NotebookAddIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Cover */}
      <rect x="4" y="2" width="16" height="20" rx="2" />
      {/* Spine binding */}
      <line x1="8" y1="2" x2="8" y2="22" />
      {/* Ruled lines */}
      <line x1="11" y1="8" x2="17" y2="8" />
      <line x1="11" y1="12" x2="17" y2="12" />
      {/* Plus badge */}
      <PlusBadge />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  FLASHCARD
//  Two stacked cards with a lightning bolt on the front card
// ─────────────────────────────────────────────────────────────

export function FlashcardIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Back card (offset) */}
      <rect x="5" y="2" width="16" height="14" rx="2" opacity="0.4" />
      {/* Front card */}
      <rect x="3" y="5" width="16" height="14" rx="2" />
      {/* Lightning bolt */}
      <path d="M12.5 8.5L10.5 12.5h3l-2 3.5" />
    </svg>
  );
}

export function FlashcardAddIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Back card (offset) */}
      <rect x="5" y="2" width="16" height="14" rx="2" opacity="0.4" />
      {/* Front card */}
      <rect x="3" y="5" width="16" height="14" rx="2" />
      {/* Lightning bolt */}
      <path d="M12.5 8.5L10.5 12.5h3l-2 3.5" />
      {/* Plus badge */}
      <PlusBadge />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  EXAM
//  A clipboard with checklist marks
// ─────────────────────────────────────────────────────────────

export function ExamIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Clipboard body */}
      <rect x="4" y="4" width="16" height="18" rx="2" />
      {/* Clipboard clip */}
      <path d="M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" />
      {/* Checkmark 1 */}
      <path d="M8 10l1.5 1.5L12 9" />
      {/* Line 1 */}
      <line x1="14" y1="10" x2="17" y2="10" />
      {/* Checkmark 2 */}
      <path d="M8 15l1.5 1.5L12 14" />
      {/* Line 2 */}
      <line x1="14" y1="15" x2="17" y2="15" />
    </svg>
  );
}

export function ExamAddIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Clipboard body */}
      <rect x="4" y="4" width="16" height="18" rx="2" />
      {/* Clipboard clip */}
      <path d="M9 2h6a1 1 0 011 1v1a1 1 0 01-1 1H9a1 1 0 01-1-1V3a1 1 0 011-1z" />
      {/* Checkmark */}
      <path d="M8 10l1.5 1.5L12 9" />
      {/* Line */}
      <line x1="14" y1="10" x2="17" y2="10" />
      {/* Plus badge */}
      <PlusBadge />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  DASHBOARD
//  An asymmetric grid of four panels
// ─────────────────────────────────────────────────────────────

export function DashboardIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Top-left panel (tall) */}
      <rect x="3" y="3" width="8" height="10" rx="2" />
      {/* Top-right panel (short) */}
      <rect x="13" y="3" width="8" height="5" rx="2" />
      {/* Bottom-right panel (tall) */}
      <rect x="13" y="10" width="8" height="11" rx="2" />
      {/* Bottom-left panel (short) */}
      <rect x="3" y="15" width="8" height="6" rx="2" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  SAVED
//  A bookmark ribbon with an inner fold detail
// ─────────────────────────────────────────────────────────────

export function SavedIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Bookmark body */}
      <path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4.5L5 21V3a1 1 0 0 1 1-1z" />
      {/* Inner ribbon fold */}
      <path d="M14 2v5.5l-2-1.5-2 1.5V2" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  COMMUNITY
//  Two people — the back one faded like the flashcard back card
// ─────────────────────────────────────────────────────────────

export function CommunityIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Back person (faded) */}
      <path d="M17 4a3 3 0 0 1 0 6" opacity="0.4" />
      <path d="M21 21v-2a3.5 3.5 0 0 0-2.5-3.37" opacity="0.4" />
      {/* Front person */}
      <circle cx="9" cy="7" r="3" />
      <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
//  NOTIFICATION
//  A bell with a top loop and clapper
// ─────────────────────────────────────────────────────────────

export function NotificationIcon(props: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {/* Bell top loop */}
      <path d="M10 4a2 2 0 0 1 4 0" />
      {/* Bell body */}
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      {/* Clapper */}
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
