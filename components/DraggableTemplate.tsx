// DraggableTemplate.tsx
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Template, Position, CanvasSize, CanvasOffset } from '@/types';

interface DraggableTemplateProps {
  template: Template;
  position: Position;
  isDragging: boolean;
  isValidDrop?: boolean;
  baseCanvasSize: CanvasSize;
  actualCanvasSize: CanvasSize;
  canvasOffset: CanvasOffset;
  onUpdatePosition?: (x: number, y: number) => void;
}

export default function DraggableTemplate({
  template,
  position,
  isDragging,
  isValidDrop = true,
  baseCanvasSize,
  actualCanvasSize,
  canvasOffset,
  onUpdatePosition,
}: DraggableTemplateProps) {
  const Icon = template.icon;

  // Calculate template size based on actual canvas size
  const templateWidth =
    (template.width / baseCanvasSize.width) * actualCanvasSize.width;
  const templateHeight =
    (template.height / baseCanvasSize.height) * actualCanvasSize.height;

  const [isDraggingInternal, setIsDraggingInternal] = useState(false);
  const [initialMouseOffset, setInitialMouseOffset] = useState<Position>({
    x: 0,
    y: 0,
  });
  const [absolutePosition, setAbsolutePosition] = useState<Position>({ x: 0, y: 0 });

  useEffect(() => {
    if (!isDragging && !isDraggingInternal) {
      // When not dragging, set the absolute position based on the percentage position
      setAbsolutePosition({
        x: position.x * actualCanvasSize.width,
        y: position.y * actualCanvasSize.height,
      });
    } else if (isDragging && !isDraggingInternal) {
      // When dragging from the TemplateButton to the canvas, use the provided absolute position
      setAbsolutePosition({
        x: position.x,
        y: position.y,
      });
    }
  }, [position, actualCanvasSize, isDragging, isDraggingInternal]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDragging) {
      e.preventDefault();
      const mouseX = e.clientX - canvasOffset.left;
      const mouseY = e.clientY - canvasOffset.top;

      // Calculate the offset between the mouse position and the element's position
      const offsetX = mouseX - absolutePosition.x;
      const offsetY = mouseY - absolutePosition.y;

      setIsDraggingInternal(true);
      setInitialMouseOffset({ x: offsetX, y: offsetY });
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingInternal) {
        const mouseX = e.clientX - canvasOffset.left;
        const mouseY = e.clientY - canvasOffset.top;

        let newAbsoluteX = mouseX - initialMouseOffset.x;
        let newAbsoluteY = mouseY - initialMouseOffset.y;

        // Constrain within bounds
        newAbsoluteX = Math.max(
          0,
          Math.min(newAbsoluteX, actualCanvasSize.width - templateWidth)
        );
        newAbsoluteY = Math.max(
          0,
          Math.min(newAbsoluteY, actualCanvasSize.height - templateHeight)
        );

        setAbsolutePosition({ x: newAbsoluteX, y: newAbsoluteY });
      }
    };

    const handleMouseUp = () => {
      if (isDraggingInternal) {
        const newXPercentage = absolutePosition.x / actualCanvasSize.width;
        const newYPercentage = absolutePosition.y / actualCanvasSize.height;

        const boundedX = Math.max(0, Math.min(1, newXPercentage));
        const boundedY = Math.max(0, Math.min(1, newYPercentage));

        onUpdatePosition && onUpdatePosition(boundedX, boundedY);

        setIsDraggingInternal(false);
      }
    };

    if (isDraggingInternal) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      if (isDraggingInternal) {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      }
    };
  }, [
    isDraggingInternal,
    initialMouseOffset,
    absolutePosition,
    actualCanvasSize,
    onUpdatePosition,
    canvasOffset,
    templateWidth,
    templateHeight,
  ]);

  const style = {
    left: `${absolutePosition.x}px`,
    top: `${absolutePosition.y}px`,
    width: `${templateWidth}px`,
    height: `${templateHeight}px`,
    transform: isDragging && !isValidDrop ? 'rotate(6deg)' : 'rotate(0deg)',
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute transition-all duration-0',
        isDraggingInternal ? 'cursor-grabbing' : 'cursor-move',
        isDragging && 'pointer-events-none z-50',
        isDragging && !isValidDrop && 'opacity-50',
        isDragging && isValidDrop && 'opacity-90'
      )}
      style={style}
    >
      <div
        className={cn(
          'w-full h-full flex items-center justify-center bg-white rounded-lg shadow-sm ring-2',
          isDragging && isValidDrop
            ? 'ring-green-500'
            : isDragging && !isValidDrop
            ? 'ring-red-500'
            : 'ring-gray-300'
        )}
      >
        <Icon />
      </div>
    </div>
  );
}
