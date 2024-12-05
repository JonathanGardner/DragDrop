"use client";

import { useState, useRef, useEffect } from 'react';
import { CanvasSize } from '@/types';

export const BASE_CANVAS_WIDTH = 850;
export const BASE_CANVAS_HEIGHT = 1100;

export function useCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [actualCanvasSize, setActualCanvasSize] = useState<CanvasSize>({
    width: BASE_CANVAS_WIDTH,
    height: BASE_CANVAS_HEIGHT,
  });
  const [canvasRect, setCanvasRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setActualCanvasSize({ width: rect.width, height: rect.height });
        setCanvasRect(rect);
      }
    };

    window.addEventListener('resize', updateCanvasSize);
    updateCanvasSize();

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, []);

  return {
    canvasRef,
    actualCanvasSize,
    canvasRect,
  };
}
