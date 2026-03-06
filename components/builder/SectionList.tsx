'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Section } from '@/types/builder';

const SECTION_ICONS: Record<string, string> = {
  hero: '🦸',
  features: '✨',
  pricing: '💰',
  testimonials: '💬',
  faq: '❓',
  contact: '📬',
  dashboard_cards: '📊',
  login_signup: '🔐',
  navigation: '🧭',
  footer: '🔻',
  custom: '🔧',
};

const COLORS = {
  bgCard: 'rgba(255,255,255,0.04)',
  bgCardHover: 'rgba(255,255,255,0.06)',
  border: 'rgba(255,255,255,0.08)',
  accent: '#6366f1',
  textPrimary: '#f1f5f9',
  textMuted: '#475569',
};

interface SortableItemProps {
  section: Section;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
}

function SortableItem({ section, onRegenerate, onDelete }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.625rem',
        background: isDragging ? 'rgba(99,102,241,0.1)' : COLORS.bgCard,
        border: `1px solid ${isDragging ? COLORS.accent : COLORS.border}`,
        borderRadius: '8px',
        cursor: 'default',
      }}
      layout
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        style={{
          background: 'none',
          border: 'none',
          color: COLORS.textMuted,
          cursor: 'grab',
          padding: '0 0.125rem',
          fontSize: '0.875rem',
          lineHeight: 1,
          flexShrink: 0,
        }}
        title="Drag to reorder"
      >
        ⠿
      </button>

      {/* Icon */}
      <span style={{ fontSize: '0.875rem', flexShrink: 0 }}>
        {SECTION_ICONS[section.type] ?? '🔧'}
      </span>

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 600,
            color: COLORS.textPrimary,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {section.title}
        </div>
        <div style={{ fontSize: '0.625rem', color: COLORS.textMuted, marginTop: '1px' }}>
          {section.type.replace(/_/g, ' ')}
        </div>
      </div>

      {/* Actions */}
      <button
        onClick={() => onRegenerate(section.id)}
        title="Regenerate section"
        style={{
          background: 'none',
          border: 'none',
          color: COLORS.textMuted,
          cursor: 'pointer',
          fontSize: '0.75rem',
          padding: '0.25rem',
          borderRadius: '4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ↺
      </button>
      <button
        onClick={() => onDelete(section.id)}
        title="Delete section"
        style={{
          background: 'none',
          border: 'none',
          color: '#ef4444',
          cursor: 'pointer',
          fontSize: '0.75rem',
          padding: '0.25rem',
          borderRadius: '4px',
          lineHeight: 1,
          flexShrink: 0,
        }}
      >
        ✕
      </button>
    </motion.div>
  );
}

interface SectionListProps {
  sections: Section[];
  onReorder: (sections: Section[]) => void;
  onRegenerate: (id: string) => void;
  onDelete: (id: string) => void;
  onInsert: () => void;
}

export default function SectionList({
  sections,
  onReorder,
  onRegenerate,
  onDelete,
  onInsert,
}: SectionListProps) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      onReorder(arrayMove(sections, oldIndex, newIndex));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence>
            {sections.map((section) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <SortableItem
                  section={section}
                  onRegenerate={onRegenerate}
                  onDelete={onDelete}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div
          style={{
            padding: '1.5rem',
            textAlign: 'center',
            color: COLORS.textMuted,
            fontSize: '0.75rem',
            border: `1px dashed ${COLORS.border}`,
            borderRadius: '8px',
          }}
        >
          No sections yet
        </div>
      )}

      <button
        onClick={onInsert}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.375rem',
          padding: '0.5rem',
          background: 'rgba(99,102,241,0.08)',
          border: `1px dashed ${COLORS.accent}`,
          borderRadius: '8px',
          color: COLORS.accent,
          fontSize: '0.75rem',
          fontWeight: 600,
          cursor: 'pointer',
          width: '100%',
          marginTop: '0.25rem',
        }}
      >
        + Insert Section
      </button>
    </div>
  );
}
