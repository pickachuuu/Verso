'use client';

import { Node, mergeAttributes } from '@tiptap/core';
import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from '@tiptap/react';
import { useState, useRef, useCallback, useEffect } from 'react';

// Extend Tiptap's Commands interface
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    resizableImage: {
      setResizableImage: (options: { src: string; alt?: string; title?: string }) => ReturnType;
    };
  }
}

// Line height for snapping (matches notebook lines)
const LINE_HEIGHT = 32;

// Snap value to nearest line height
const snapToLine = (value: number): number => {
  return Math.round(value / LINE_HEIGHT) * LINE_HEIGHT;
};

// Calculate height that preserves aspect ratio and snaps to line
const calculateSnappedHeight = (
  width: number,
  originalWidth: number,
  originalHeight: number
): number => {
  const aspectRatio = originalWidth / originalHeight;
  const rawHeight = width / aspectRatio;
  return snapToLine(rawHeight);
};

// React component for the resizable image
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const { src, alt, width, height } = node.attrs;
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [originalDimensions, setOriginalDimensions] = useState({ width: 0, height: 0 });
  const [currentWidth, setCurrentWidth] = useState<number>(width || 0);
  const [showGuide, setShowGuide] = useState(false);

  // Load original image dimensions
  useEffect(() => {
    if (src) {
      const img = new window.Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        if (!width) {
          // Set initial width to fit container or image natural width
          const maxWidth = Math.min(img.naturalWidth, 500);
          const snappedHeight = calculateSnappedHeight(maxWidth, img.naturalWidth, img.naturalHeight);
          setCurrentWidth(maxWidth);
          updateAttributes({ width: maxWidth, height: snappedHeight });
        }
      };
      img.src = src;
    }
  }, [src, width, updateAttributes]);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: 'right' | 'left' | 'corner') => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setShowGuide(true);

    const startX = e.clientX;
    const startWidth = currentWidth || (imageRef.current?.offsetWidth || 300);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let deltaX = moveEvent.clientX - startX;

      // For left handle, invert the delta
      if (direction === 'left') {
        deltaX = -deltaX;
      }

      const newWidth = Math.max(100, Math.min(800, startWidth + deltaX));

      // Calculate snapped height
      const snappedHeight = calculateSnappedHeight(
        newWidth,
        originalDimensions.width || newWidth,
        originalDimensions.height || newWidth
      );

      setCurrentWidth(newWidth);
      updateAttributes({ width: newWidth, height: snappedHeight });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setShowGuide(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [currentWidth, originalDimensions, updateAttributes]);

  // Calculate display height with line snapping
  const displayHeight = height || (
    originalDimensions.width && originalDimensions.height && currentWidth
      ? calculateSnappedHeight(currentWidth, originalDimensions.width, originalDimensions.height)
      : 'auto'
  );

  // Calculate margin to center on line grid
  const marginTop = LINE_HEIGHT - (typeof displayHeight === 'number' ? displayHeight % LINE_HEIGHT : 0);
  const adjustedMargin = marginTop === LINE_HEIGHT ? 0 : marginTop / 2;

  return (
    <NodeViewWrapper
      className="resizable-image-wrapper"
      style={{
        margin: `${adjustedMargin}px 0`,
        lineHeight: `${LINE_HEIGHT}px`,
      }}
    >
      <div
        ref={containerRef}
        className={`resizable-image-container ${selected ? 'selected' : ''} ${isResizing ? 'resizing' : ''}`}
        style={{ width: currentWidth || width || 'auto' }}
      >
        {/* Line guide indicator */}
        {showGuide && typeof displayHeight === 'number' && (
          <div className="resize-guide">
            {Math.round(displayHeight / LINE_HEIGHT)} lines
          </div>
        )}

        {/* Left resize handle */}
        <div
          className="resize-handle resize-handle-left"
          onMouseDown={(e) => handleResizeStart(e, 'left')}
        >
          <div className="handle-bar" />
        </div>

        {/* Image */}
        <img
          ref={imageRef}
          src={src}
          alt={alt || ''}
          style={{
            width: currentWidth || width || 'auto',
            height: displayHeight,
            objectFit: 'cover',
          }}
          draggable={false}
        />

        {/* Right resize handle */}
        <div
          className="resize-handle resize-handle-right"
          onMouseDown={(e) => handleResizeStart(e, 'right')}
        >
          <div className="handle-bar" />
        </div>

        {/* Corner resize handle */}
        <div
          className="resize-handle resize-handle-corner"
          onMouseDown={(e) => handleResizeStart(e, 'corner')}
        >
          <svg viewBox="0 0 10 10" className="corner-icon">
            <path d="M0 10 L10 0 M3 10 L10 3 M6 10 L10 6" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      </div>
    </NodeViewWrapper>
  );
}

// Custom Tiptap extension for resizable images
export const ResizableImage = Node.create({
  name: 'resizableImage',

  group: 'block',

  atom: true,

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
        default: null,
      },
      height: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'img[src]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['img', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },

  addCommands() {
    return {
      setResizableImage:
        (options: { src: string; alt?: string; title?: string }) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: options,
          });
        },
    };
  },
});

export default ResizableImage;
