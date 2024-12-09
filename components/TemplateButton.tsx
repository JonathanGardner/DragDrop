// TemplateButton.tsx
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

  const minDimension = Math.min(templateWidth, templateHeight);
  // Apply same scaling logic here
  const fontSize = minDimension * 0.5;
  const iconSize = minDimension * 0.7;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(template, e)}
      onDragEnd={onDragEnd}
      className="bg-white rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow flex items-center justify-center"
      style={{
        width: `${templateWidth}px`,
        height: `${templateHeight}px`,
        fontSize: `${fontSize}px`,
      }}
    >
      <Icon iconSize={iconSize} label={template.id} />
    </div>
  );
}
