"use client";

import * as React from "react";
import { clsx } from "clsx";

type ColSpan = 1 | 2 | 3 | 4 | 6 | 12;

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  cols?: 1 | 2 | 3 | 4 | 6 | 12;
  gap?: "0" | "2" | "4" | "6" | "8";
}

const colClasses: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  6: "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6",
  12: "grid-cols-12",
};

const gapClasses: Record<string, string> = {
  "0": "gap-0",
  "2": "gap-2",
  "4": "gap-4",
  "6": "gap-6",
  "8": "gap-8",
};

export function Grid({ cols = 3, gap = "4", className, children, ...props }: GridProps) {
  return (
    <div className={clsx("grid", colClasses[cols], gapClasses[gap], className)} {...props}>
      {children}
    </div>
  );
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  span?: ColSpan;
}

const spanClasses: Record<number, string> = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  6: "col-span-6",
  12: "col-span-12",
};

export function GridItem({ span = 1, className, children, ...props }: GridItemProps) {
  return (
    <div className={clsx(spanClasses[span], className)} {...props}>
      {children}
    </div>
  );
}
