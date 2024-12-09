"use client";

import { DragEvent } from 'react';
import { Template, DroppedTemplate } from '@/types';
import DraggableTemplate from './DraggableTemplate';

interface CanvasProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  droppedTemplates: DroppedTemplate[];
  draggedTemplate: Template | null;
  dragPosition: { x: number; y: number };
  isValidDrop: boolean;
  actualCanvasSize: { width: number; height: number };
  canvasRect: DOMRect | null;
  onDrop: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function Canvas({
  canvasRef,
  droppedTemplates,
  draggedTemplate,
  dragPosition,
  isValidDrop,
  actualCanvasSize,
  canvasRect,
  onDrop,
  onDragOver,
  onUpdatePosition,
  onUpdateSize,
  onDuplicate,
  onDelete,
}: CanvasProps) {
  const handleDuplicate = onDuplicate ?? (() => {});
  const handleDelete = onDelete ?? (() => {});

  return (
    <div
      ref={canvasRef}
      className="bg-white border-2 border-dashed border-gray-700 rounded-lg relative aspect-[1/1.4142] w-1/2 mx-auto"
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {canvasRect &&
        droppedTemplates.map((item) => (
          <DraggableTemplate
            key={item.id}
            template={item.template}
            position={{ x: item.x, y: item.y }}
            width={item.width}
            height={item.height}
            isDragging={false}
            baseCanvasSize={{
              width: 850,
              height: 1100,
            }}
            actualCanvasSize={actualCanvasSize}
            canvasOffset={{ left: canvasRect.left, top: canvasRect.top }}
            onUpdatePosition={(newX, newY) => onUpdatePosition(item.id, newX, newY)}
            onUpdateSize={(newW, newH) => onUpdateSize(item.id, newW, newH)}
            onDuplicate={() => handleDuplicate(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}

      {draggedTemplate && canvasRect && (
        <DraggableTemplate
          template={draggedTemplate}
          position={dragPosition}
          width={draggedTemplate.width / 850}
          height={draggedTemplate.height / 1100}
          isDragging={true}
          isValidDrop={isValidDrop}
          baseCanvasSize={{
            width: 850,
            height: 1100,
          }}
          actualCanvasSize={actualCanvasSize}
          canvasOffset={{ left: canvasRect.left, top: canvasRect.top }}
          // For dragged (not placed yet) templates, no menu actions are needed
          // Pass no-op functions to prevent errors
          onDuplicate={() => {}}
          onDelete={() => {}}
        />
      )}
    </div>
  );
}
