"use client";

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Template, Position, CanvasSize, CanvasOffset } from '@/types';
import { Copy, Trash } from 'lucide-react';

interface DraggableTemplateProps {
  template: Template;
  // Fractional position and size relative to the canvas
  position: Position; // { x: 0..1, y: 0..1 }
  width: number;      // fraction of the canvas width (0..1)
  height: number;     // fraction of the canvas height (0..1)
  isDragging: boolean;
  isValidDrop?: boolean;
  baseCanvasSize: CanvasSize;
  actualCanvasSize: CanvasSize;
  canvasOffset: CanvasOffset;
  onUpdatePosition?: (xFrac: number, yFrac: number) => void;
  onUpdateSize?: (wFrac: number, hFrac: number) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  isPreview?: boolean;  // If true, no drag/resize logic, just a static preview
}

type ResizeHandle =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'right'
  | 'bottom-right'
  | 'bottom'
  | 'bottom-left'
  | 'left';

export default function DraggableTemplate({
  template,
  position,
  width,
  height,
  isDragging,
  isValidDrop = true,
  baseCanvasSize,
  actualCanvasSize,
  canvasOffset,
  onUpdatePosition,
  onUpdateSize,
  onDuplicate,
  onDelete,
  isPreview = false,
}: DraggableTemplateProps) {
  const Icon = template.icon;

  // Compute absolute sizes/positions from fractions
  const absoluteX = position.x * actualCanvasSize.width;
  const absoluteY = position.y * actualCanvasSize.height;
  const absoluteWidth = width * actualCanvasSize.width;
  const absoluteHeight = height * actualCanvasSize.height;

  const fontSize = Math.min(absoluteWidth, absoluteHeight) * 0.5;
  const iconSize = Math.min(absoluteWidth, absoluteHeight) * 0.7;

  // If this is a preview, we skip dragging/resizing and show static preview
  if (isPreview) {
    return (
      <div
        className={cn(
          'absolute pointer-events-none',
          isDragging && !isValidDrop && 'opacity-50',
          isDragging && isValidDrop && 'opacity-90'
        )}
        style={{
          width: `${absoluteWidth}px`,
          height: `${absoluteHeight}px`,
          fontSize: `${fontSize}px`,
          top: 0,
          left: 0,
          position: 'absolute',
        }}
      >
        <div
          className={cn(
            'w-full h-full flex bg-white rounded-lg shadow-sm ring-2 relative',
            isDragging && isValidDrop
              ? 'ring-green-500 rotate-6)'
              : isDragging && !isValidDrop
              ? 'ring-red-500 rotate-6'
              : 'ring-green-500'
          )}
        >
          <Icon iconSize={iconSize} label={template.id} />
        </div>
      </div>
    );
  }

  // Non-preview mode: enable drag/resize
  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);

  // Store initial mouse offsets and initial fractions for dragging/resizing
  const [initialMouse, setInitialMouse] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState<Position>({ x: position.x, y: position.y });
  const [initialSize, setInitialSize] = useState<{ w: number; h: number }>({ w: width, h: height });

  const handles: { handle: ResizeHandle; style: React.CSSProperties }[] = [
    { handle: 'top-left', style: { top: 0, left: 0, cursor: 'nw-resize' } },
    { handle: 'top', style: { top: 0, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
    { handle: 'top-right', style: { top: 0, right: 0, cursor: 'ne-resize' } },
    { handle: 'right', style: { right: 0, top: '50%', transform: 'translateY(-50%)', cursor: 'e-resize' } },
    { handle: 'bottom-right', style: { bottom: 0, right: 0, cursor: 'se-resize' } },
    { handle: 'bottom', style: { bottom: 0, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
    { handle: 'bottom-left', style: { bottom: 0, left: 0, cursor: 'sw-resize' } },
    { handle: 'left', style: { left: 0, top: '50%', transform: 'translateY(-50%)', cursor: 'w-resize' } },
  ];

  const [showMenu, setShowMenu] = useState(false);

  const handleTemplateClick = (e: React.MouseEvent) => {
    if (isDragging || isDraggingInternal || isResizing) return;
    e.stopPropagation();
    setShowMenu((prev) => !prev);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.template-menu')) {
      return;
    }
    if (!isDragging && !isResizing) {
      e.preventDefault();
      const mouseX = e.clientX - canvasOffset.left;
      const mouseY = e.clientY - canvasOffset.top;

      // We are starting a drag
      setIsDraggingInternal(true);
      setInitialMouse({ x: mouseX, y: mouseY });
      setInitialPosition({ x: position.x, y: position.y });
    }
  };

  const handleResizeMouseDown = (handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isDraggingInternal) {
      setIsResizing(true);
      setResizeHandle(handle);
      setInitialMouse({ x: e.clientX - canvasOffset.left, y: e.clientY - canvasOffset.top });
      setInitialPosition({ x: position.x, y: position.y });
      setInitialSize({ w: width, h: height });
      setShowMenu(false);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingInternal && !isResizing) {
        // Dragging
        const mouseX = e.clientX - canvasOffset.left;
        const mouseY = e.clientY - canvasOffset.top;

        // Compute delta in absolute pixels
        const dx = mouseX - initialMouse.x;
        const dy = mouseY - initialMouse.y;

        // Convert dx, dy to fractions
        const newXFrac = initialPosition.x + dx / actualCanvasSize.width;
        const newYFrac = initialPosition.y + dy / actualCanvasSize.height;

        // Clamp to [0..1 - w/h] so template stays inside
        const clampedX = Math.min(Math.max(newXFrac, 0), 1 - width);
        const clampedY = Math.min(Math.max(newYFrac, 0), 1 - height);

        onUpdatePosition?.(clampedX, clampedY);
      }

      if (isResizing && resizeHandle) {
        // Resizing
        const mouseX = e.clientX - canvasOffset.left;
        const mouseY = e.clientY - canvasOffset.top;
        const dx = mouseX - initialMouse.x;
        const dy = mouseY - initialMouse.y;

        let newXFrac = initialPosition.x;
        let newYFrac = initialPosition.y;
        let newWFrac = initialSize.w;
        let newHFrac = initialSize.h;

        const dxFrac = dx / actualCanvasSize.width;
        const dyFrac = dy / actualCanvasSize.height;

        // Adjust fractions based on handle
        switch (resizeHandle) {
          case 'right':
            newWFrac = Math.max(0.01, initialSize.w + dxFrac);
            break;
          case 'bottom':
            newHFrac = Math.max(0.01, initialSize.h + dyFrac);
            break;
          case 'bottom-right':
            newWFrac = Math.max(0.01, initialSize.w + dxFrac);
            newHFrac = Math.max(0.01, initialSize.h + dyFrac);
            break;
          case 'left':
            newWFrac = Math.max(0.01, initialSize.w - dxFrac);
            newXFrac = initialPosition.x + (initialSize.w - newWFrac);
            break;
          case 'top':
            newHFrac = Math.max(0.01, initialSize.h - dyFrac);
            newYFrac = initialPosition.y + (initialSize.h - newHFrac);
            break;
          case 'top-left':
            newWFrac = Math.max(0.01, initialSize.w - dxFrac);
            newXFrac = initialPosition.x + (initialSize.w - newWFrac);
            newHFrac = Math.max(0.01, initialSize.h - dyFrac);
            newYFrac = initialPosition.y + (initialSize.h - newHFrac);
            break;
          case 'top-right':
            newWFrac = Math.max(0.01, initialSize.w + dxFrac);
            newHFrac = Math.max(0.01, initialSize.h - dyFrac);
            newYFrac = initialPosition.y + (initialSize.h - newHFrac);
            break;
          case 'bottom-left':
            newWFrac = Math.max(0.01, initialSize.w - dxFrac);
            newXFrac = initialPosition.x + (initialSize.w - newWFrac);
            newHFrac = Math.max(0.01, initialSize.h + dyFrac);
            break;
        }

        // Clamp so it stays inside [0,1]
        newXFrac = Math.min(Math.max(newXFrac, 0), 1 - newWFrac);
        newYFrac = Math.min(Math.max(newYFrac, 0), 1 - newHFrac);

        onUpdatePosition?.(newXFrac, newYFrac);
        onUpdateSize?.(newWFrac, newHFrac);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingInternal && !isResizing) {
        setIsDraggingInternal(false);
      }

      if (isResizing && resizeHandle) {
        setIsResizing(false);
        setResizeHandle(null);
      }
    };

    if (isDraggingInternal || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (isDraggingInternal || isResizing) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [
    isDraggingInternal,
    isResizing,
    resizeHandle,
    initialMouse,
    initialPosition,
    initialSize,
    actualCanvasSize,
    width,
    height,
    onUpdatePosition,
    onUpdateSize,
    canvasOffset
  ]);

  const style = {
    left: `${absoluteX}px`,
    top: `${absoluteY}px`,
    width: `${absoluteWidth}px`,
    height: `${absoluteHeight}px`,
    transform: isDragging && !isValidDrop ? 'rotate(6deg)' : 'rotate(0deg)',
    fontSize: `${fontSize}px`,
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleTemplateClick}
      className={cn(
        'absolute transition-all duration-0 group',
        isDraggingInternal ? 'cursor-grabbing' : 'cursor-move',
        (isDragging && !isPreview) && 'pointer-events-none z-50',
        isDragging && !isValidDrop && 'opacity-40',
        isDragging && isValidDrop && 'opacity-90'
      )}
      style={style}
    >
      <div
        className={cn(
          'w-full h-full flex bg-white rounded-lg shadow-sm ring-2 relative',
          isDragging && isValidDrop
            ? 'ring-green-500'
            : isDragging && !isValidDrop
            ? 'ring-red-500'
            : 'ring-green-500'
        )}
      >
        <Icon iconSize={iconSize} label={template.id} />

        {!isDragging && !isDraggingInternal && !isPreview && (
          <>
            {handles.map((h) => (
              <div
                key={h.handle}
                onMouseDown={handleResizeMouseDown(h.handle)}
                className="absolute w-3 h-3 bg-white rounded-full border border-gray-500 opacity-0 group-hover:opacity-100"
                style={h.style}
              />
            ))}

            {showMenu && (
              <div
                className="template-menu absolute z-50 bg-white border border-gray-300 rounded shadow p-2 top-full left-1/2 transform -translate-x-1/2 mt-2 flex space-x-2"
                style={{ minWidth: '50px' }}
              >
                {onDuplicate && (
                  <button
                    className="block text-gray-700 hover:bg-gray-100 p-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicate?.();
                      setShowMenu(false);
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
                {onDelete && (
                  <button
                    className="block text-red-600 hover:bg-gray-100 p-1 rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete?.();
                      setShowMenu(false);
                    }}
                  >
                    <Trash className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
