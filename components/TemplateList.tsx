"use client";

import { Template } from '@/types';
import TemplateButton from './TemplateButton';
import { Button } from '@/components/ui/button';

interface TemplateListProps {
  templates: Template[];
  onDragStart: (template: Template, e: React.DragEvent) => void;
  onDragEnd: () => void;
  actualCanvasSize: { width: number; height: number };
  onSave: () => void; // Added onSave callback
}

export default function TemplateList({
  templates,
  onDragStart,
  onDragEnd,
  actualCanvasSize,
  onSave,
}: TemplateListProps) {
  return (
    <div className='divide-y'>
      <div className='mb-2'>
        <h2 className="text-sm font-medium text-gray-700">Add Fields</h2>
        <h1 className="text-[.6rem] font-sm text-gray-700">Add all relevant fields for each recipient.</h1>
      </div>
      <div className='mb-2'>
        <div className='mt-2 flex flex-wrap items-center justify-start gap-2'>
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
      <div>
        <Button variant={"outline"} className={"mt-2 w-full"} onClick={onSave}>Save</Button>
      </div>
    </div>
  );
}
