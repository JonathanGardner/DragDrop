"use client";

import { Template } from '@/types';
import { useState } from 'react';

interface TemplateButtonProps {
  template: Template;
  onDragStart: (template: Template, e: React.DragEvent, offsetXFrac: number, offsetYFrac: number) => void;
  onDragEnd: () => void;
  actualCanvasSize: { width: number; height: number };
}

export default function TemplateButton({
  template,
  onDragStart,
  onDragEnd,
  actualCanvasSize
}: TemplateButtonProps) {
  const [isDragging, setIsDragging] = useState(false);
  const Icon = template.icon;
  const baseCanvasSize = { width: 850, height: 1100 };
  const templateWidth = (template.width*1.4 / baseCanvasSize.width) * actualCanvasSize.width;
  const templateHeight = (template.height*1.4 / baseCanvasSize.height) * actualCanvasSize.height;

  const minDimension = Math.min(templateWidth, templateHeight);
  const fontSize = minDimension * 0.5;
  const iconSize = minDimension * 0.7;

  const handleDragStartInternal = (e: React.DragEvent) => {
    // Calculate the offset where the user clicked on the template button
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const offsetXFrac = clickX / templateWidth;
    const offsetYFrac = clickY / templateHeight;

    // Create a transparent image to remove the default drag ghost
    const img = new Image();
    img.src = "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=";
    e.dataTransfer.setDragImage(img, 0, 0);

    setIsDragging(true);
    onDragStart(template, e, offsetXFrac, offsetYFrac);
  };

  const handleDragEndInternal = () => {
    setIsDragging(false);
    onDragEnd();
  };

  return (
    <div
      draggable
      onDragStart={handleDragStartInternal}
      onDragEnd={handleDragEndInternal}
      style={{
        width: `${templateWidth}px`,
        height: `${templateHeight}px`,
        fontSize: `${fontSize}px`,
        background: '#fff',
        border: '1px solid #ddd',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        paddingLeft: '6px',
        paddingRight: '6px',
        opacity: isDragging ? 0 : 1, // Make the template button invisible while dragging
      }}
      className="hover:border-gray-400 transition-colors rounded-lg"
    >
      <Icon iconSize={iconSize} label={template.id} />
    </div>
  );
}
