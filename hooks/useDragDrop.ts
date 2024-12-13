import { useState } from 'react';
import { Template } from '@/types';

interface Position {
  x: number;
  y: number;
}

export function useDragDrop() {
  const [draggedTemplate, setDraggedTemplate] = useState<Template | null>(null);
  const [dragPosition, setDragPosition] = useState<Position>({ x: 0, y: 0 });
  const [isValidDrop, setIsValidDrop] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ xFrac: number; yFrac: number }>({ xFrac: 0, yFrac: 0 });

  const handleDragStart = (template: Template, e: React.DragEvent, offsetXFrac: number, offsetYFrac: number) => {
    setDraggedTemplate(template);
    // Store offset fractions relative to the template size
    setDragOffset({ xFrac: offsetXFrac, yFrac: offsetYFrac });
  };

  const handleDragEnd = () => {
    setDraggedTemplate(null);
    setIsValidDrop(false);
  };

  const getAdjustedPosition = (clientX: number, clientY: number, rect: DOMRect) => {
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    return { x, y };
  };

  const isWithinBounds = (x: number, y: number, template: Template, actualCanvasSize: { width: number; height: number }) => {
    // Determine width and height in pixels at current scale
    const baseCanvas = { width: 850, height: 1100 };
    const templateWFrac = template.width / baseCanvas.width;
    const templateHFrac = template.height / baseCanvas.height;

    const templateWidthPx = templateWFrac * actualCanvasSize.width;
    const templateHeightPx = templateHFrac * actualCanvasSize.height;

    // Check if top-left corner (x - offset, y - offset) would be inside the canvas:
    // Because we will place template so that the user's clicked point remains under the cursor,
    // the top-left of the template is (x - offsetX * templateWidthPx, y - offsetY * templateHeightPx)
    const topLeftX = x - dragOffset.xFrac * templateWidthPx;
    const topLeftY = y - dragOffset.yFrac * templateHeightPx;

    return (
      topLeftX >= 0 &&
      topLeftY >= 0 &&
      topLeftX + templateWidthPx <= actualCanvasSize.width &&
      topLeftY + templateHeightPx <= actualCanvasSize.height
    );
  };

  return {
    draggedTemplate,
    dragPosition,
    isValidDrop,
    dragOffset,
    handleDragStart,
    handleDragEnd,
    setDragPosition,
    setIsValidDrop,
    getAdjustedPosition,
    isWithinBounds,
  };
}
