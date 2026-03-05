"use client";

import * as React from "react";
import * as LucideIcons from "lucide-react";

export type IconName = keyof typeof LucideIcons;

export interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
  "aria-label"?: string;
  "aria-hidden"?: boolean | "true" | "false";
}

/**
 * Central icon wrapper using lucide-react.
 * Always use this component instead of raw emoji or inline SVG for UI icons.
 *
 * @example
 * <Icon name="Rocket" size={16} />
 * <Icon name="ShoppingCart" className="text-indigo-400" />
 */
export function Icon({
  name,
  size = 16,
  color,
  strokeWidth = 2,
  className,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
}: IconProps) {
  const LucideIcon = LucideIcons[name] as React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
    className?: string;
    "aria-label"?: string;
    "aria-hidden"?: boolean | "true" | "false";
  }> | undefined;

  if (!LucideIcon) {
    // Fallback: render a square placeholder so layout is not broken
    return (
      <span
        className={className}
        style={{ display: "inline-block", width: size, height: size, background: "currentColor", opacity: 0.3, borderRadius: 2 }}
        aria-hidden="true"
      />
    );
  }

  return (
    <LucideIcon
      size={size}
      color={color}
      strokeWidth={strokeWidth}
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden ?? (ariaLabel ? undefined : "true")}
    />
  );
}
