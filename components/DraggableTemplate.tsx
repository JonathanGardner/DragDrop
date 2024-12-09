"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Template, Position, CanvasSize, CanvasOffset } from '@/types';
import { Copy, Trash } from 'lucide-react';

interface DraggableTemplateProps {
  template: Template;
  position: Position;
  width: number;
  height: number;
  isDragging: boolean;
  isValidDrop?: boolean;
  baseCanvasSize: CanvasSize;
  actualCanvasSize: CanvasSize;
  canvasOffset: CanvasOffset;
  onUpdatePosition?: (x: number, y: number) => void;
  onUpdateSize?: (width: number, height: number) => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
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
}: DraggableTemplateProps) {
  const Icon = template.icon;

  const [absolutePosition, setAbsolutePosition] = useState<Position>({ x: 0, y: 0 });
  const [absoluteWidth, setAbsoluteWidth] = useState(0);
  const [absoluteHeight, setAbsoluteHeight] = useState(0);

  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [initialMouseOffset, setInitialMouseOffset] = useState<Position>({ x: 0, y: 0 });

  // Resizing states
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle | null>(null);
  const [initialResizeMousePos, setInitialResizeMousePos] = useState<Position>({ x: 0, y: 0 });
  const [initialResizeDims, setInitialResizeDims] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  });

  // State for showing the menu
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    if (isDragging && !isDraggingInternal && !isResizing) {
      setAbsolutePosition({ x: position.x, y: position.y });
      setAbsoluteWidth(width * actualCanvasSize.width);
      setAbsoluteHeight(height * actualCanvasSize.height);
    } else if (!isDraggingInternal && !isResizing && !isDragging) {
      setAbsolutePosition({
        x: position.x * actualCanvasSize.width,
        y: position.y * actualCanvasSize.height,
      });
      setAbsoluteWidth(width * actualCanvasSize.width);
      setAbsoluteHeight(height * actualCanvasSize.height);
    }
  }, [position, width, height, actualCanvasSize, isDragging, isDraggingInternal, isResizing]);

  const fontSize = Math.min(absoluteWidth, absoluteHeight) * 0.5;
  const iconSize = Math.min(absoluteWidth, absoluteHeight) * 0.7;

  const handleMouseDown = (e: React.MouseEvent) => {
    // If click is on the menu area, do not drag
    if ((e.target as HTMLElement).closest('.template-menu')) {
      return;
    }

    if (!isDragging && !isResizing) {
      e.preventDefault();
      const mouseX = e.clientX - canvasOffset.left;
      const mouseY = e.clientY - canvasOffset.top;

      const offsetX = mouseX - absolutePosition.x;
      const offsetY = mouseY - absolutePosition.y;

      setIsDraggingInternal(true);
      setInitialMouseOffset({ x: offsetX, y: offsetY });
      // Do not toggle menu here since we are dragging
    }
  };

  const handleResizeMouseDown = (handle: ResizeHandle) => (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isDraggingInternal) {
      setIsResizing(true);
      setResizeHandle(handle);
      setInitialResizeMousePos({ x: e.clientX, y: e.clientY });
      setInitialResizeDims({
        x: absolutePosition.x,
        y: absolutePosition.y,
        w: absoluteWidth,
        h: absoluteHeight,
      });
      setShowMenu(false); // Hide menu when resizing starts
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingInternal && !isResizing) {
        const mouseX = e.clientX - canvasOffset.left;
        const mouseY = e.clientY - canvasOffset.top;

        let newAbsoluteX = mouseX - initialMouseOffset.x;
        let newAbsoluteY = mouseY - initialMouseOffset.y;

        newAbsoluteX = Math.max(
          0,
          Math.min(newAbsoluteX, actualCanvasSize.width - absoluteWidth)
        );
        newAbsoluteY = Math.max(
          0,
          Math.min(newAbsoluteY, actualCanvasSize.height - absoluteHeight)
        );

        setAbsolutePosition({ x: newAbsoluteX, y: newAbsoluteY });
      }

      if (isResizing && resizeHandle) {
        const deltaX = e.clientX - initialResizeMousePos.x;
        const deltaY = e.clientY - initialResizeMousePos.y;

        let { x, y, w, h } = initialResizeDims;

        switch (resizeHandle) {
          case 'right':
            w = Math.max(10, initialResizeDims.w + deltaX);
            break;
          case 'bottom':
            h = Math.max(10, initialResizeDims.h + deltaY);
            break;
          case 'bottom-right':
            w = Math.max(10, initialResizeDims.w + deltaX);
            h = Math.max(10, initialResizeDims.h + deltaY);
            break;
          case 'left':
            w = Math.max(10, initialResizeDims.w - deltaX);
            x = x + (initialResizeDims.w - w);
            break;
          case 'top':
            h = Math.max(10, initialResizeDims.h - deltaY);
            y = y + (initialResizeDims.h - h);
            break;
          case 'top-left':
            w = Math.max(10, initialResizeDims.w - deltaX);
            x = x + (initialResizeDims.w - w);
            h = Math.max(10, initialResizeDims.h - deltaY);
            y = y + (initialResizeDims.h - h);
            break;
          case 'top-right':
            w = Math.max(10, initialResizeDims.w + deltaX);
            h = Math.max(10, initialResizeDims.h - deltaY);
            y = y + (initialResizeDims.h - h);
            break;
          case 'bottom-left':
            w = Math.max(10, initialResizeDims.w - deltaX);
            x = x + (initialResizeDims.w - w);
            h = Math.max(10, initialResizeDims.h + deltaY);
            break;
        }

        // Constrain within canvas
        if (x < 0) {
          w += x;
          x = 0;
        }
        if (y < 0) {
          h += y;
          y = 0;
        }
        if (x + w > actualCanvasSize.width) {
          w = actualCanvasSize.width - x;
        }
        if (y + h > actualCanvasSize.height) {
          h = actualCanvasSize.height - y;
        }

        setAbsolutePosition({ x, y });
        setAbsoluteWidth(w);
        setAbsoluteHeight(h);
      }
    };

    const handleMouseUp = () => {
      if (isDraggingInternal && !isResizing) {
        const newXPercentage = absolutePosition.x / actualCanvasSize.width;
        const newYPercentage = absolutePosition.y / actualCanvasSize.height;

        const boundedX = Math.max(0, Math.min(1, newXPercentage));
        const boundedY = Math.max(0, Math.min(1, newYPercentage));

        onUpdatePosition?.(boundedX, boundedY);
        setIsDraggingInternal(false);
      }

      if (isResizing && resizeHandle) {
        const newXPercentage = absolutePosition.x / actualCanvasSize.width;
        const newYPercentage = absolutePosition.y / actualCanvasSize.height;
        const newWPercentage = absoluteWidth / actualCanvasSize.width;
        const newHPercentage = absoluteHeight / actualCanvasSize.height;

        onUpdatePosition?.(
          Math.max(0, Math.min(1, newXPercentage)),
          Math.max(0, Math.min(1, newYPercentage))
        );
        onUpdateSize?.(
          Math.max(0.01, Math.min(1, newWPercentage)),
          Math.max(0.01, Math.min(1, newHPercentage))
        );

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
    initialMouseOffset,
    absolutePosition,
    absoluteWidth,
    absoluteHeight,
    actualCanvasSize,
    onUpdatePosition,
    onUpdateSize,
    canvasOffset,
    initialResizeMousePos,
    initialResizeDims,
  ]);

  const style = {
    left: `${absolutePosition.x}px`,
    top: `${absolutePosition.y}px`,
    width: `${absoluteWidth}px`,
    height: `${absoluteHeight}px`,
    transform: isDragging && !isValidDrop ? 'rotate(6deg)' : 'rotate(0deg)',
    fontSize: `${fontSize}px`,
  };

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

  const handleTemplateClick = (e: React.MouseEvent) => {
    if (isDragging || isDraggingInternal || isResizing) return;
    e.stopPropagation();
    // Toggle the menu on each click
    setShowMenu((prev) => !prev);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onClick={handleTemplateClick}
      className={cn(
        'absolute transition-all duration-0 group',
        isDraggingInternal ? 'cursor-grabbing' : 'cursor-move',
        isDragging && 'pointer-events-none z-50',
        isDragging && !isValidDrop && 'opacity-50',
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

        {!isDragging && !isDraggingInternal && (
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
