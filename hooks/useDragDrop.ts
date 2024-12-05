"use client";

import { useState, useRef, useEffect } from 'react';
import { Template, DroppedTemplate, CanvasSize, Position } from '@/types';
import { BASE_CANVAS_WIDTH, BASE_CANVAS_HEIGHT } from './useCanvas';

export function useDragDrop() {
  const [droppedTemplates, setDroppedTemplates] = useState<DroppedTemplate[]>([]);
  const [draggedTemplate, setDraggedTemplate] = useState<Template | null>(null);
  const [dragPosition, setDragPosition] = useState<Position>({ x: 0, y: 0 });
  const [isValidDrop, setIsValidDrop] = useState(false);
  const dragOffsetRef = useRef<Position>({ x: 0, y: 0 });

  const getAdjustedPosition = (clientX: number, clientY: number, canvasRect: DOMRect): Position => {
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;
    
    return {
      x: clientX + scrollX - canvasRect.left - dragOffsetRef.current.x,
      y: clientY + scrollY - canvasRect.top - dragOffsetRef.current.y,
    };
  };

  const handleDragStart = (template: Template, e: React.DragEvent) => {
    setDraggedTemplate(template);
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    const dragImg = new Image();
    dragImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(dragImg, dragOffsetRef.current.x, dragOffsetRef.current.y);
  };

  const handleDragEnd = () => {
    setDraggedTemplate(null);
    setIsValidDrop(false);
  };

  const isWithinBounds = (
    x: number,
    y: number,
    template: Template,
    canvasSize: CanvasSize
  ) => {
    const templateWidth = (template.width / BASE_CANVAS_WIDTH) * canvasSize.width;
    const templateHeight = (template.height / BASE_CANVAS_HEIGHT) * canvasSize.height;

    return (
      x >= 0 &&
      y >= 0 &&
      x + templateWidth <= canvasSize.width &&
      y + templateHeight <= canvasSize.height
    );
  };

  return {
    droppedTemplates,
    setDroppedTemplates,
    draggedTemplate,
    dragPosition,
    setDragPosition,
    isValidDrop,
    setIsValidDrop,
    dragOffsetRef,
    handleDragStart,
    handleDragEnd,
    isWithinBounds,
    getAdjustedPosition,
  };
}
