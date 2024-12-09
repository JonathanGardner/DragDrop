"use client";

import { useEffect } from 'react';
import { templates } from '@/data/templates';
import { useCanvas } from '@/hooks/useCanvas';
import { useDragDrop } from '@/hooks/useDragDrop';
import Canvas from './Canvas';
import TemplateList from './TemplateList';
import { DroppedTemplate } from '@/types';

export default function DragDropCanvas() {
  const { canvasRef, actualCanvasSize, canvasRect } = useCanvas();
  const {
    droppedTemplates,
    draggedTemplate,
    dragPosition,
    isValidDrop,
    handleDragStart,
    handleDragEnd,
    isWithinBounds,
    getAdjustedPosition,
    setDragPosition,
    setIsValidDrop,
    setDroppedTemplates,
  } = useDragDrop();

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (draggedTemplate && canvasRef.current && canvasRect) {
        const position = getAdjustedPosition(e.clientX, e.clientY, canvasRect);
        setDragPosition(position);
      }
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    return () => window.removeEventListener('dragover', handleGlobalDragOver);
  }, [draggedTemplate, canvasRect, canvasRef, getAdjustedPosition, setDragPosition]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTemplate && canvasRef.current && canvasRect) {
      const position = getAdjustedPosition(e.clientX, e.clientY, canvasRect);
      const isValid = isWithinBounds(position.x, position.y, draggedTemplate, actualCanvasSize);
      setIsValidDrop(isValid);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedTemplate && isValidDrop && canvasRef.current && canvasRect) {
      const position = getAdjustedPosition(e.clientX, e.clientY, canvasRect);

      const relativeX = position.x / canvasRect.width;
      const relativeY = position.y / canvasRect.height;

      const baseCanvasSize = { width: 850, height: 1100 };
      const relativeW = draggedTemplate.width / baseCanvasSize.width;
      const relativeH = draggedTemplate.height / baseCanvasSize.height;

      const newTemplate: DroppedTemplate = {
        id: `${draggedTemplate.id}-${Date.now()}`,
        x: relativeX,
        y: relativeY,
        width: relativeW,
        height: relativeH,
        template: draggedTemplate,
      };
      setDroppedTemplates((prev) => [...prev, newTemplate]);
    }
    handleDragEnd();
  };

  const handleUpdatePosition = (id: string, x: number, y: number) => {
    setDroppedTemplates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  };

  const handleUpdateSize = (id: string, width: number, height: number) => {
    setDroppedTemplates((prev) =>
      prev.map((item) => (item.id === id ? { ...item, width, height } : item))
    );
  };

  const handleDuplicate = (id: string) => {
    setDroppedTemplates((prev) => {
      const item = prev.find((t) => t.id === id);
      if (!item) return prev;
      const newItem: DroppedTemplate = {
        ...item,
        id: `${item.template.id}-${Date.now()}`,
        x: Math.min(item.x + 0.02, 1), // offset by a small amount
        y: Math.min(item.y + 0.02, 1),
      };
      return [...prev, newItem];
    });
  };

  const handleDelete = (id: string) => {
    setDroppedTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-10">
        <Canvas
          canvasRef={canvasRef}
          droppedTemplates={droppedTemplates}
          draggedTemplate={draggedTemplate}
          dragPosition={dragPosition}
          isValidDrop={isValidDrop}
          actualCanvasSize={actualCanvasSize}
          canvasRect={canvasRect}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onUpdatePosition={handleUpdatePosition}
          onUpdateSize={handleUpdateSize}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
        />
      </div>
      <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto">
        <TemplateList
          templates={templates}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          actualCanvasSize={actualCanvasSize}
        />
      </div>
    </div>
  );
}
