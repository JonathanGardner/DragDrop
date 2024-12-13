"use client";

import { DragEvent } from 'react';
import { Template, DroppedTemplate } from '@/types';
import DraggableTemplate from './DraggableTemplate';

interface PDFPageCanvasProps {
  pageRef: React.RefObject<HTMLDivElement>;
  droppedTemplates: DroppedTemplate[];
  draggedTemplate: Template | null;
  dragPosition: { x: number; y: number };
  isValidDrop: boolean;
  actualCanvasSize: { width: number; height: number };
  pageRect: DOMRect | null;
  onDrop: (e: DragEvent) => void;
  onDragOver: (e: DragEvent) => void;
  onUpdatePosition: (id: string, x: number, y: number) => void;
  onUpdateSize: (id: string, width: number, height: number) => void;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function PDFPageCanvas({
  pageRef,
  droppedTemplates,
  draggedTemplate,
  dragPosition,
  isValidDrop,
  actualCanvasSize,
  pageRect,
  onDrop,
  onDragOver,
  onUpdatePosition,
  onUpdateSize,
  onDuplicate,
  onDelete,
}: PDFPageCanvasProps) {
  const handleDuplicate = onDuplicate ?? (() => {});
  const handleDelete = onDelete ?? (() => {});

  return (
    <div
      className="absolute top-0 left-0 border rounded-lg"
      style={{
        width: '100%',
        height: '100%',
        pointerEvents: 'all',
      }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      {pageRect &&
        droppedTemplates.map((item) => (
          <DraggableTemplate
            key={item.id}
            template={item.template}
            position={{ x: item.x, y: item.y }}
            width={item.width}
            height={item.height}
            isDragging={false}
            baseCanvasSize={{ width: 850, height: 1100 }}
            actualCanvasSize={actualCanvasSize}
            canvasOffset={{ left: pageRect.left, top: pageRect.top }}
            onUpdatePosition={(newX, newY) => onUpdatePosition(item.id, newX, newY)}
            onUpdateSize={(newW, newH) => onUpdateSize(item.id, newW, newH)}
            onDuplicate={() => handleDuplicate(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
    </div>
  );
}
