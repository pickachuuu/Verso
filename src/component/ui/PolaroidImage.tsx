'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useRef, useCallback, useEffect } from 'react';

// Extend Tiptap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    polaroidImage: {
      setPolaroidImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

type ImageAlignment = 'left' | 'center' | 'right' | 'float-left' | 'float-right';

// React component for the polaroid image - block element with optional float
function PolaroidImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, alignment, rotation } = node.attrs;
  const isFloating = alignment === 'float-left' || alignment === 'float-right';
  const containerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [currentWidth, setCurrentWidth] = useState<number>(width || 200);

  // Use ref to track current width to avoid stale closure issues
  const widthRef = useRef(currentWidth);

  // Keep ref in sync with state
  useEffect(() => {
    widthRef.current = currentWidth;
  }, [currentWidth]);

  // Sync width from attributes when they change externally
  useEffect(() => {
    if (!isResizing && width && width !== currentWidth) {
      setCurrentWidth(width);
    }
  }, [width, isResizing, currentWidth]);

  // Cleanup effect to remove body classes if component unmounts during resize
  useEffect(() => {
    return () => {
      document.body.classList.remove('polaroid-resizing');
    };
  }, []);

  // Resize handling with proper closure management
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsResizing(true);

    // Add body class for global cursor handling
    document.body.classList.add('polaroid-resizing');

    const startX = e.clientX;
    const startWidth = widthRef.current;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      moveEvent.preventDefault();
      moveEvent.stopPropagation();

      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(80, Math.min(600, startWidth + deltaX));

      setCurrentWidth(newWidth);
      widthRef.current = newWidth;
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      upEvent.preventDefault();
      upEvent.stopPropagation();

      setIsResizing(false);

      // Remove body class
      document.body.classList.remove('polaroid-resizing');

      // Save final width using the ref (always current)
      updateAttributes({ width: widthRef.current });

      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [updateAttributes]);

  // Handle alignment change - prevent event bubbling to keep selection
  const handleAlignmentClick = useCallback((e: React.MouseEvent, newAlignment: ImageAlignment) => {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ alignment: newAlignment });
  }, [updateAttributes]);

  return (
    <NodeViewWrapper
      className={`polaroid-image-wrapper ${isFloating ? 'polaroid-floating' : ''}`}
      data-alignment={alignment || 'left'}
    >
      <div
        ref={containerRef}
        className={`polaroid-image ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{
          width: currentWidth + 24, // Add padding for polaroid frame
          transform: `rotate(${rotation || 0}deg)`,
        }}
        draggable={false}
      >
        {/* Polaroid frame */}
        <div className="polaroid-frame">
          {/* Image container */}
          <div className="polaroid-image-container">
            <img
              src={src}
              alt={alt || ''}
              style={{ width: currentWidth }}
              draggable={false}
            />
          </div>

          {/* Polaroid caption area */}
          <div className="polaroid-caption">
            {alt && <span className="polaroid-caption-text">{alt}</span>}
          </div>
        </div>

        {/* Controls - shown when selected */}
        {selected && (
          <>
            {/* Toolbar with drag handle and alignment options */}
            <div
              className="polaroid-toolbar"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {/* Drag handle */}
              <div
                className="polaroid-drag-handle"
                data-drag-handle
                draggable="true"
                title="Drag to reorder"
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="9" cy="6" r="1.5" />
                  <circle cx="15" cy="6" r="1.5" />
                  <circle cx="9" cy="12" r="1.5" />
                  <circle cx="15" cy="12" r="1.5" />
                  <circle cx="9" cy="18" r="1.5" />
                  <circle cx="15" cy="18" r="1.5" />
                </svg>
              </div>

              <div className="polaroid-toolbar-divider" />

              {/* Float left - text wraps on right */}
              <button
                className={`polaroid-align-button ${alignment === 'float-left' ? 'active' : ''}`}
                onClick={(e) => handleAlignmentClick(e, 'float-left')}
                onMouseDown={(e) => e.stopPropagation()}
                title="Float left (text wraps right)"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="8" height="8" rx="1" />
                  <line x1="14" y1="5" x2="21" y2="5" />
                  <line x1="14" y1="9" x2="21" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="3" y1="19" x2="21" y2="19" />
                </svg>
              </button>

              {/* Float right - text wraps on left */}
              <button
                className={`polaroid-align-button ${alignment === 'float-right' ? 'active' : ''}`}
                onClick={(e) => handleAlignmentClick(e, 'float-right')}
                onMouseDown={(e) => e.stopPropagation()}
                title="Float right (text wraps left)"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="13" y="3" width="8" height="8" rx="1" />
                  <line x1="3" y1="5" x2="10" y2="5" />
                  <line x1="3" y1="9" x2="10" y2="9" />
                  <line x1="3" y1="15" x2="21" y2="15" />
                  <line x1="3" y1="19" x2="21" y2="19" />
                </svg>
              </button>

              <div className="polaroid-toolbar-divider" />

              {/* Left align (block) */}
              <button
                className={`polaroid-align-button ${!alignment || alignment === 'left' ? 'active' : ''}`}
                onClick={(e) => handleAlignmentClick(e, 'left')}
                onMouseDown={(e) => e.stopPropagation()}
                title="Align left (block)"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="15" y2="12" />
                  <line x1="3" y1="18" x2="18" y2="18" />
                </svg>
              </button>

              {/* Center align (block) */}
              <button
                className={`polaroid-align-button ${alignment === 'center' ? 'active' : ''}`}
                onClick={(e) => handleAlignmentClick(e, 'center')}
                onMouseDown={(e) => e.stopPropagation()}
                title="Align center (block)"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="6" y1="12" x2="18" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </svg>
              </button>

              {/* Right align (block) */}
              <button
                className={`polaroid-align-button ${alignment === 'right' ? 'active' : ''}`}
                onClick={(e) => handleAlignmentClick(e, 'right')}
                onMouseDown={(e) => e.stopPropagation()}
                title="Align right (block)"
                type="button"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="9" y1="12" x2="21" y2="12" />
                  <line x1="6" y1="18" x2="21" y2="18" />
                </svg>
              </button>
            </div>

            {/* Resize handle */}
            <div
              className="polaroid-resize-handle"
              onMouseDown={handleResizeStart}
            >
              <svg viewBox="0 0 10 10" className="resize-icon">
                <path d="M0 10 L10 0 M3 10 L10 3 M6 10 L10 6" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Custom Tiptap extension for polaroid images
// Now a block-level element that sits in the document flow
export const PolaroidImage = Node.create({
  name: 'polaroidImage',

  // Block element - sits between paragraphs in document flow
  group: 'block',

  // Atomic - cannot be edited internally
  atom: true,

  // Draggable in terms of TipTap's node dragging (reorder in document)
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: 200,
      },
      // Alignment: left, center, right
      alignment: {
        default: 'left',
      },
      // Small random rotation for aesthetic (-3 to 3 degrees)
      rotation: {
        default: 0,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-polaroid-image]',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            src: element.querySelector('img')?.getAttribute('src'),
            alt: element.querySelector('img')?.getAttribute('alt'),
            width: element.getAttribute('data-width') ? parseInt(element.getAttribute('data-width')!) : 200,
            alignment: element.getAttribute('data-alignment') || 'center',
            rotation: element.getAttribute('data-rotation') ? parseInt(element.getAttribute('data-rotation')!) : 0,
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        'data-polaroid-image': '',
        'data-width': HTMLAttributes.width,
        'data-alignment': HTMLAttributes.alignment,
        'data-rotation': HTMLAttributes.rotation,
      }),
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt }]
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PolaroidImageComponent);
  },

  addCommands() {
    return {
      setPolaroidImage:
        (options: { src: string; alt?: string; title?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: {
              ...options,
              // Random slight rotation for natural polaroid look (-3 to 3 degrees)
              rotation: Math.floor(Math.random() * 7) - 3,
            },
          });
        },
    };
  },
});

export default PolaroidImage;
