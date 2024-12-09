// components/DragDropCanvas.tsx
"use client";

import { useEffect, useState, useCallback } from 'react';
import { templates } from '@/data/templates';
import { useCanvas } from '@/hooks/useCanvas';
import { useDragDrop } from '@/hooks/useDragDrop';
import Canvas from './Canvas';
import TemplateList from './TemplateList';
import { DroppedTemplate } from '@/types';
import DraggableTemplate from './DraggableTemplate';

export default function DragDropCanvas() {
  // Multiple canvases stacked vertically
  const canvasCount = 2;

  const canvasHooks = Array.from({ length: canvasCount }, () => useCanvas());

  const [droppedTemplatesForCanvases, setDroppedTemplatesForCanvases] = useState<DroppedTemplate[][]>(
    Array.from({ length: canvasCount }, () => [])
  );

  const {
    draggedTemplate,
    dragPosition,
    handleDragStart,
    handleDragEnd,
    isWithinBounds,
    getAdjustedPosition,
    setDragPosition,
    setIsValidDrop,
    isValidDrop,
  } = useDragDrop();

  const [hoveredCanvasIndex, setHoveredCanvasIndex] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const updateDroppedTemplatesForCanvas = useCallback(
    (canvasIndex: number, updater: (prev: DroppedTemplate[]) => DroppedTemplate[]) => {
      setDroppedTemplatesForCanvases((prev) => {
        const newArr = [...prev];
        newArr[canvasIndex] = updater(newArr[canvasIndex]);
        return newArr;
      });
    },
    []
  );

  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (draggedTemplate) {
        setMousePos({ x: e.clientX, y: e.clientY });

        let newHoveredIndex: number | null = null;
        const canvasRects = canvasHooks.map((ch) => {
          if (ch.canvasRef.current) {
            return ch.canvasRef.current.getBoundingClientRect();
          }
          return null;
        });

        for (let i = 0; i < canvasCount; i++) {
          const canvasRect = canvasRects[i];
          if (canvasRect) {
            const { left, top, right, bottom } = canvasRect;
            if (e.clientX >= left && e.clientX <= right && e.clientY >= top && e.clientY <= bottom) {
              newHoveredIndex = i;
              break;
            }
          }
        }

        setHoveredCanvasIndex(newHoveredIndex);

        if (newHoveredIndex !== null) {
          const canvasRect = canvasRects[newHoveredIndex];
          const { actualCanvasSize } = canvasHooks[newHoveredIndex];

          if (canvasRect && actualCanvasSize && draggedTemplate) {
            const position = getAdjustedPosition(e.clientX, e.clientY, canvasRect);
            setDragPosition(position);

            const isValid = isWithinBounds(position.x, position.y, draggedTemplate, actualCanvasSize);
            setIsValidDrop(isValid);
          } else {
            setIsValidDrop(false);
          }
        } else {
          setIsValidDrop(false);
        }
      }
    };

    window.addEventListener('dragover', handleGlobalDragOver);
    return () => window.removeEventListener('dragover', handleGlobalDragOver);
  }, [
    draggedTemplate,
    canvasHooks,
    canvasCount,
    getAdjustedPosition,
    isWithinBounds,
    setDragPosition,
    setIsValidDrop,
  ]);

  const handleDragOver = (canvasIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (canvasIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();

    const canvasRect = canvasHooks[canvasIndex].canvasRef.current?.getBoundingClientRect();
    const { actualCanvasSize } = canvasHooks[canvasIndex];

    if (draggedTemplate && isValidDrop && canvasRect && actualCanvasSize) {
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

      updateDroppedTemplatesForCanvas(canvasIndex, (prev) => [...prev, newTemplate]);
    }

    handleDragEnd();
  };

  const handleUpdatePosition = (canvasIndex: number) => (id: string, x: number, y: number) => {
    updateDroppedTemplatesForCanvas(canvasIndex, (prev) =>
      prev.map((item) => (item.id === id ? { ...item, x, y } : item))
    );
  };

  const handleUpdateSize = (canvasIndex: number) => (id: string, width: number, height: number) => {
    updateDroppedTemplatesForCanvas(canvasIndex, (prev) =>
      prev.map((item) => (item.id === id ? { ...item, width, height } : item))
    );
  };

  const handleDuplicate = (canvasIndex: number) => (id: string) => {
    updateDroppedTemplatesForCanvas(canvasIndex, (prev) => {
      const item = prev.find((t) => t.id === id);
      if (!item) return prev;

      // We need to ensure the duplicated item stays inside the canvas completely.
      // We'll try a set of offsets until we find one that fits entirely inside.
      const tryOffsets = [
        { x: 0.02, y: 0.02 },
        { x: -0.02, y: -0.02 },
        { x: 0.02, y: -0.02 },
        { x: -0.02, y: 0.02 },
        { x: 0.02, y: 0 },
        { x: 0, y: 0.02 },
        { x: -0.02, y: 0 },
        { x: 0, y: -0.02 },
        { x: 0, y: 0 }, // fallback: same spot
      ];

      // Item width/height are relative as well, ensure that x+width <=1 and y+height <=1
      const width = item.width;
      const height = item.height;

      const fitOffset = tryOffsets.find((offset) => {
        let newX = item.x + offset.x;
        let newY = item.y + offset.y;
        // Clamp so that entire template is within bounds
        newX = Math.max(0, Math.min(newX, 1 - width));
        newY = Math.max(0, Math.min(newY, 1 - height));
        // Check if after clamping, it's inside
        return newX >= 0 && newY >= 0 && (newX + width) <= 1 && (newY + height) <= 1;
      });

      // Use the found offset
      const chosenOffset = fitOffset || { x: 0, y: 0 }; 
      let newX = item.x + chosenOffset.x;
      let newY = item.y + chosenOffset.y;
      // Re-clamp after chosen offset
      newX = Math.max(0, Math.min(newX, 1 - width));
      newY = Math.max(0, Math.min(newY, 1 - height));

      const newItem: DroppedTemplate = {
        ...item,
        id: `${item.template.id}-${Date.now()}`,
        x: newX,
        y: newY,
      };
      return [...prev, newItem];
    });
  };

  const handleDelete = (canvasIndex: number) => (id: string) => {
    updateDroppedTemplatesForCanvas(canvasIndex, (prev) => prev.filter((t) => t.id !== id));
  };

  const showGlobalDragPreview = draggedTemplate != null;
  let globalDragWidth = 0;
  let globalDragHeight = 0;
  let globalBaseCanvas = { width: 850, height: 1100 };
  
  if (draggedTemplate) {
    const refCanvasSize = canvasHooks[0].actualCanvasSize;
    if (refCanvasSize.width && refCanvasSize.height) {
      const relativeW = draggedTemplate.width / globalBaseCanvas.width;
      const relativeH = draggedTemplate.height / globalBaseCanvas.height;
      globalDragWidth = relativeW * refCanvasSize.width;
      globalDragHeight = relativeH * refCanvasSize.height;
    }
  }

  const previewStyle = {
    position: 'fixed' as const,
    pointerEvents: 'none' as const,
    left: mousePos.x - globalDragWidth / 2,
    top: mousePos.y - globalDragHeight / 2,
    width: `${globalDragWidth}px`,
    height: `${globalDragHeight}px`,
    zIndex: 9999,
    opacity: hoveredCanvasIndex !== null ? (isValidDrop ? 0.9 : 0.5) : 0.5,
  };

  return (
    <div className="flex h-screen">
      <div className="flex-1 p-10 overflow-auto relative">
        <div className="space-y-10">
          {Array.from({ length: canvasCount }, (_, i) => {
            const { canvasRef, actualCanvasSize, canvasRect } = canvasHooks[i];
            return (
              <Canvas
                key={i}
                canvasRef={canvasRef}
                droppedTemplates={droppedTemplatesForCanvases[i]}
                draggedTemplate={null}
                dragPosition={{ x: 0, y: 0 }}
                isValidDrop={false}
                actualCanvasSize={actualCanvasSize}
                canvasRect={canvasRect}
                onDrop={handleDrop(i)}
                onDragOver={handleDragOver(i)}
                onUpdatePosition={handleUpdatePosition(i)}
                onUpdateSize={handleUpdateSize(i)}
                onDuplicate={handleDuplicate(i)}
                onDelete={handleDelete(i)}
              />
            );
          })}
        </div>
        {showGlobalDragPreview && draggedTemplate && globalDragWidth > 0 && globalDragHeight > 0 && (
          <div style={previewStyle}>
            <DraggableTemplate
              template={draggedTemplate}
              position={{ x: 0, y: 0 }}
              width={globalDragWidth / canvasHooks[0].actualCanvasSize.width}
              height={globalDragHeight / canvasHooks[0].actualCanvasSize.height}
              isDragging={true}
              isValidDrop={hoveredCanvasIndex !== null ? isValidDrop : false}
              baseCanvasSize={globalBaseCanvas}
              actualCanvasSize={canvasHooks[0].actualCanvasSize}
              canvasOffset={{ left: 0, top: 0 }}
              onUpdatePosition={() => {}}
              onUpdateSize={() => {}}
              onDuplicate={() => {}}
              onDelete={() => {}}
            />
          </div>
        )}
      </div>
      <div className="w-64 flex-shrink-0 border-l border-gray-200 bg-gray-50 overflow-y-auto">
        <TemplateList
          templates={templates}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          actualCanvasSize={canvasHooks[0].actualCanvasSize}
        />
      </div>
    </div>
  );
}
