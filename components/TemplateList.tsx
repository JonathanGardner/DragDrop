// components/TemplateList.tsx
"use client";

import { Template } from '@/types';
import TemplateButton from './TemplateButton';

interface TemplateListProps {
  templates: Template[];
  onDragStart: (template: Template, e: React.DragEvent) => void;
  onDragEnd: () => void;
  actualCanvasSize: { width: number; height: number };
}

export default function TemplateList({
  templates,
  onDragStart,
  onDragEnd,
  actualCanvasSize,
}: TemplateListProps) {
  return (
    <div className="p-4 space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Templates</h2>
      <div className="space-y-2">
        {templates.map((template) => (
          <TemplateButton
            key={template.id}
            template={template}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            actualCanvasSize={actualCanvasSize}
          />
        ))}
      </div>
    </div>
  );
}
