// components/TemplateButton.tsx
"use client";

import { Template } from '@/types';

interface TemplateButtonProps {
  template: Template;
  onDragStart: (template: Template, e: React.DragEvent) => void;
  onDragEnd: () => void;
  actualCanvasSize: { width: number; height: number };
}

export default function TemplateButton({
  template,
  onDragStart,
  onDragEnd,
  actualCanvasSize
}: TemplateButtonProps) {
  const Icon = template.icon;

  const baseCanvasSize = { width: 850, height: 1100 };
  const templateWidth =
    (template.width / baseCanvasSize.width) * actualCanvasSize.width;
  const templateHeight =
    (template.height / baseCanvasSize.height) * actualCanvasSize.height;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(template, e)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow flex"
      style={{
        width: templateWidth,
        height: templateHeight,
      }}
    >
      <Icon />
    </div>
  );
}
