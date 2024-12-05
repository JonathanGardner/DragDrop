// types/index.ts
import { ComponentType } from 'react';

export type Template = {
  id: string;
  icon: ComponentType;
  label: string;
  width: number;
  height: number;
};

export type DroppedTemplate = {
  id: string;
  x: number; // x position as a percentage (0 to 1)
  y: number; // y position as a percentage (0 to 1)
  template: Template;
};

export type Position = {
  x: number;
  y: number;
};

export type CanvasSize = {
  width: number;
  height: number;
};

export type CanvasOffset = {
  left: number;
  top: number;
};
