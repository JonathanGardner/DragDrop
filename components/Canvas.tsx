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
}: CanvasProps) {
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
            isDragging={false}
            baseCanvasSize={{
              width: 850,
              height: 1100,
            }}
            actualCanvasSize={actualCanvasSize}
            canvasOffset={{ left: canvasRect.left, top: canvasRect.top }}
            onUpdatePosition={(newX, newY) => onUpdatePosition(item.id, newX, newY)}
          />
        ))}

      {draggedTemplate && canvasRect && (
        <DraggableTemplate
          template={draggedTemplate}
          position={dragPosition}
          isDragging={true}
          isValidDrop={isValidDrop}
          baseCanvasSize={{
            width: 850,
            height: 1100,
          }}
          actualCanvasSize={actualCanvasSize}
          canvasOffset={{ left: canvasRect.left, top: canvasRect.top }}
        />
      )}
    </div>
  );
}
