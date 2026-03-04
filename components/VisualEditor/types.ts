export type ElementType =
  | "text"
  | "heading"
  | "button"
  | "image"
  | "icon"
  | "container"
  | "grid"
  | "flexbox"
  | "card"
  | "modal"
  | "navbar"
  | "footer"
  | "sidebar"
  | "form"
  | "input"
  | "select"
  | "checkbox"
  | "radio"
  | "chart"
  | "table"
  | "badge"
  | "avatar";

export interface ElementStyles {
  width?: string;
  height?: string;
  backgroundColor?: string;
  color?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  display?: string;
  flexDirection?: string;
  gap?: string;
  gridTemplateColumns?: string;
}

export interface CanvasElement {
  id: string;
  type: ElementType;
  label: string;
  styles: ElementStyles;
  children?: CanvasElement[];
  props?: Record<string, string>;
}

export interface DesignState {
  elements: CanvasElement[];
  selectedId: string | null;
}
