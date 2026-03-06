"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { CanvasElement, ElementStyles } from "./types";

const COLORS = {
  bgPanel: "#0f1120",
  bgCard: "rgba(255,255,255,0.04)",
  border: "rgba(255,255,255,0.08)",
  accent: "#6366f1",
  textPrimary: "#f1f5f9",
  textSecondary: "#94a3b8",
  textMuted: "#475569",
};

interface PropertyInspectorProps {
  element: CanvasElement | null;
  onChange: (id: string, styles: ElementStyles, label: string) => void;
}

interface FormValues {
  label: string;
  width: string;
  height: string;
  backgroundColor: string;
  color: string;
  fontSize: string;
  padding: string;
  margin: string;
  borderRadius: string;
}

function Field({ label, name, type = "text", register }: { label: string; name: keyof FormValues; type?: string; register: ReturnType<typeof useForm<FormValues>>["register"] }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "0.6875rem", color: COLORS.textMuted, fontWeight: 500 }}>{label}</span>
      <input
        type={type}
        {...register(name)}
        style={{
          background: COLORS.bgCard,
          border: `1px solid ${COLORS.border}`,
          borderRadius: "6px",
          padding: "5px 8px",
          color: COLORS.textPrimary,
          fontSize: "0.8125rem",
          outline: "none",
          fontFamily: "inherit",
          width: "100%",
        }}
      />
    </label>
  );
}

export default function PropertyInspector({ element, onChange }: PropertyInspectorProps) {
  const { register, watch, reset } = useForm<FormValues>({
    defaultValues: {
      label: "",
      width: "",
      height: "",
      backgroundColor: "",
      color: "",
      fontSize: "",
      padding: "",
      margin: "",
      borderRadius: "",
    },
  });

  useEffect(() => {
    if (element) {
      reset({
        label: element.label,
        width: element.styles.width ?? "",
        height: element.styles.height ?? "",
        backgroundColor: element.styles.backgroundColor ?? "",
        color: element.styles.color ?? "",
        fontSize: element.styles.fontSize ?? "",
        padding: element.styles.padding ?? "",
        margin: element.styles.margin ?? "",
        borderRadius: element.styles.borderRadius ?? "",
      });
    }
  }, [element, reset]);

  useEffect(() => {
    if (!element) return;
    const subscription = watch((values) => {
      const styles: ElementStyles = {};
      if (values.width) styles.width = values.width;
      if (values.height) styles.height = values.height;
      if (values.backgroundColor) styles.backgroundColor = values.backgroundColor;
      if (values.color) styles.color = values.color;
      if (values.fontSize) styles.fontSize = values.fontSize;
      if (values.padding) styles.padding = values.padding;
      if (values.margin) styles.margin = values.margin;
      if (values.borderRadius) styles.borderRadius = values.borderRadius;
      onChange(element.id, styles, values.label ?? element.label);
    });
    return () => subscription.unsubscribe();
  }, [element, watch, onChange]);

  if (!element) {
    return (
      <div
        style={{
          width: "240px",
          flexShrink: 0,
          background: COLORS.bgPanel,
          borderLeft: `1px solid ${COLORS.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: COLORS.textMuted, textAlign: "center" }}>
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "240px",
        flexShrink: 0,
        background: COLORS.bgPanel,
        borderLeft: `1px solid ${COLORS.border}`,
        overflowY: "auto",
        padding: "12px",
      }}
    >
      <div style={{ marginBottom: "12px" }}>
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 4px" }}>
          Properties
        </p>
        <p style={{ fontSize: "0.8125rem", color: COLORS.accent, fontWeight: 600, margin: 0, fontFamily: "monospace" }}>
          {element.type}
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <Field label="Label" name="label" register={register} />

        <div style={{ height: "1px", background: COLORS.border, margin: "2px 0" }} />
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.textMuted, margin: "0" }}>Size</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
          <Field label="Width" name="width" register={register} />
          <Field label="Height" name="height" register={register} />
        </div>

        <div style={{ height: "1px", background: COLORS.border, margin: "2px 0" }} />
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.textMuted, margin: "0" }}>Appearance</p>
        <Field label="Background Color" name="backgroundColor" type="color" register={register} />
        <Field label="Text Color" name="color" type="color" register={register} />
        <Field label="Font Size" name="fontSize" register={register} />
        <Field label="Border Radius" name="borderRadius" register={register} />

        <div style={{ height: "1px", background: COLORS.border, margin: "2px 0" }} />
        <p style={{ fontSize: "0.6875rem", fontWeight: 600, color: COLORS.textMuted, margin: "0" }}>Spacing</p>
        <Field label="Padding" name="padding" register={register} />
        <Field label="Margin" name="margin" register={register} />
      </div>
    </div>
  );
}
