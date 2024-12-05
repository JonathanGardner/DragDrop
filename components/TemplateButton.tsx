"use client";

import { Template } from '@/types';

interface TemplateButtonProps {
  template: Template;
  onDragStart: (template: Template, e: React.DragEvent) => void;
  onDragEnd: () => void;
}

export default function TemplateButton({
  template,
  onDragStart,
  onDragEnd,
}: TemplateButtonProps) {
  const Icon = template.icon;

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(template, e)}
      onDragEnd={onDragEnd}
      className="p-2 bg-white rounded-lg shadow-sm cursor-move hover:shadow-md transition-shadow flex items-center justify-center w-full"
      style={{
        height: template.height,
      }}
    >
      <Icon />
    </div>
  );
}
