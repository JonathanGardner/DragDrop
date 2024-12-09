export interface PlaceholderProps {
  iconSize?: number;
  label?: string;
}

export interface Template {
  id: string;
  width: number;
  height: number;
  icon: React.FC<PlaceholderProps>;
  label?: string; // Added this property
}

export interface DroppedTemplate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  template: Template;
}

export interface Position {
  x: number;
  y: number;
}

export interface CanvasSize {
  width: number;
  height: number;
}

export interface CanvasOffset {
  left: number;
  top: number;
}
