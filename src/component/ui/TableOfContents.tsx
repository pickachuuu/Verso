'use client';

import { Add01Icon, File01Icon, Delete01Icon } from 'hugeicons-react';

export interface NotePage {
  id: string;
  note_id: string;
  title: string;
  content: string;
  page_order: number;
  created_at: string;
  updated_at: string;
}

export interface TableOfContentsProps {
  notebookTitle: string;
  pages: NotePage[];
  onPageClick: (pageIndex: number) => void;
  onAddPage: () => void;
  onDeletePage?: (pageId: string) => void;
  theme: 'light' | 'dark';
  /** When true, shows skeleton placeholders instead of the empty state */
  isLoading?: boolean;
  readOnly?: boolean;
}

/**
 * TableOfContents - The first page after the cover showing all notebook pages
 */
export default function TableOfContents({
  notebookTitle,
  pages,
  onPageClick,
  onAddPage,
  onDeletePage,
  theme,
  isLoading = false,
  readOnly = false,
}: TableOfContentsProps) {
  const isDark = theme === 'dark';

  return (
    <div className={`toc-page ${isDark ? 'toc-page--dark' : 'toc-page--light'}`}>
      {/* Paper texture */}
      <div className="toc-page__texture" />

      {/* Header */}
      <div className="toc-page__header">
        <h1 className="toc-page__notebook-title">{notebookTitle || 'Untitled Notebook'}</h1>
        <div className="toc-page__divider" />
        <h2 className="toc-page__title">Table of Contents</h2>
      </div>

      {/* Page list */}
      <div className="toc-page__content">
        {isLoading ? (
          /* Skeleton loading state - prevents flash of empty "No pages yet" */
          <ul className="toc-page__list">
            {[...Array(3)].map((_, index) => (
              <li key={index} className="toc-page__item">
                <div className="toc-page__link" style={{ pointerEvents: 'none' }}>
                  <span className="toc-page__page-number" style={{ opacity: 0.3 }}>{index + 1}</span>
                  <span
                    className="toc-page__page-title"
                    style={{ opacity: 0 }}
                  >
                    {/* Invisible placeholder to maintain height */}
                    Loading
                  </span>
                  <span
                    className="toc-page__dots"
                    style={{
                      opacity: 0.15,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${index * 0.15}s`,
                    }}
                  />
                  <span
                    className="toc-page__page-indicator"
                    style={{ opacity: 0.15 }}
                  >
                    <span
                      className="inline-block rounded"
                      style={{
                        width: '3rem',
                        height: '0.75rem',
                        backgroundColor: 'currentColor',
                        opacity: 0.4,
                        animation: 'pulse 1.5s ease-in-out infinite',
                        animationDelay: `${index * 0.15}s`,
                      }}
                    />
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : pages.length === 0 ? (
          <div className="toc-page__empty">
            <File01Icon className="w-12 h-12 opacity-30" />
            <p>No pages available</p>
            {!readOnly && (
              <p className="text-sm opacity-60">Click the button below to add your first page</p>
            )}
          </div>
        ) : (
          <ul className="toc-page__list">
            {pages.map((page, index) => (
              <li key={page.id} className="toc-page__item">
                <button
                  className="toc-page__link"
                  onClick={() => onPageClick(index)}
                >
                  <span className="toc-page__page-number">{index + 1}</span>
                  <span className="toc-page__page-title">{page.title || 'Untitled Page'}</span>
                  <span className="toc-page__dots" />
                  <span className="toc-page__page-indicator">Page {index + 1}</span>
                </button>
                {!readOnly && onDeletePage && pages.length > 1 && (
                  <button
                    className="toc-page__delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(page.id);
                    }}
                    title="Delete page"
                  >
                    <Delete01Icon className="w-4 h-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Add page button */}
      <div className="toc-page__footer">
        {!readOnly && (
          <button className="toc-page__add-button" onClick={onAddPage} disabled={isLoading}>
            <Add01Icon className="w-5 h-5" />
            <span>Add New Page</span>
          </button>
        )}

        <div className="toc-page__page-count">
          {isLoading ? '\u00A0' : `${pages.length} ${pages.length === 1 ? 'page' : 'pages'}`}
        </div>
      </div>
    </div>
  );
}
