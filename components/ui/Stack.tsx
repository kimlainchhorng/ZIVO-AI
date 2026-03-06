"use client";

import * as React from "react";
import { clsx } from "clsx";

type Direction = "row" | "col";
type Align = "start" | "center" | "end" | "stretch" | "baseline";
type Justify = "start" | "center" | "end" | "between" | "around" | "evenly";
type Wrap = "wrap" | "nowrap" | "wrap-reverse";
type GapSize = "0" | "1" | "2" | "3" | "4" | "6" | "8";

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: Direction;
  align?: Align;
  justify?: Justify;
  wrap?: Wrap;
  gap?: GapSize;
  as?: React.ElementType;
}

const alignClasses: Record<Align, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
  baseline: "items-baseline",
};

const justifyClasses: Record<Justify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  around: "justify-around",
  evenly: "justify-evenly",
};

const gapClasses: Record<GapSize, string> = {
  "0": "gap-0",
  "1": "gap-1",
  "2": "gap-2",
  "3": "gap-3",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
};

export function Stack({
  direction = "col",
  align = "stretch",
  justify = "start",
  wrap = "nowrap",
  gap = "4",
  as: Tag = "div",
  className,
  children,
  ...props
}: StackProps) {
  return (
    <Tag
      className={clsx(
        "flex",
        direction === "row" ? "flex-row" : "flex-col",
        alignClasses[align],
        justifyClasses[justify],
        wrap === "wrap" ? "flex-wrap" : wrap === "wrap-reverse" ? "flex-wrap-reverse" : "flex-nowrap",
        gapClasses[gap],
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
