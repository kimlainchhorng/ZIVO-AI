// components/ui/Tabs.tsx — Accessible tabs component using design tokens
'use client';

import * as React from 'react';

export interface TabItem {
  id: string;
  label: React.ReactNode;
  content: React.ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  activeTab?: string;
  onChange?: (tabId: string) => void;
  style?: React.CSSProperties;
  tabBarStyle?: React.CSSProperties;
}

export function Tabs({
  items,
  defaultTab,
  activeTab: controlledTab,
  onChange,
  style,
  tabBarStyle,
}: TabsProps): React.ReactElement {
  const [internalTab, setInternalTab] = React.useState<string>(
    defaultTab ?? items[0]?.id ?? ''
  );

  const activeId = controlledTab ?? internalTab;

  const handleChange = (id: string): void => {
    if (!controlledTab) setInternalTab(id);
    onChange?.(id);
  };

  const activeItem = items.find((t) => t.id === activeId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', ...style }}>
      {/* Tab bar */}
      <div
        role="tablist"
        style={{
          display: 'flex',
          gap: '2px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '8px',
          padding: '3px',
          ...tabBarStyle,
        }}
      >
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`panel-${item.id}`}
              disabled={item.disabled}
              onClick={() => !item.disabled && handleChange(item.id)}
              style={{
                flex: 1,
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                border: 'none',
                background: isActive
                  ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
                  : 'transparent',
                color: isActive ? '#ffffff' : item.disabled ? '#475569' : '#94a3b8',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 400,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeItem && (
        <div
          role="tabpanel"
          id={`panel-${activeItem.id}`}
          style={{ marginTop: '1rem' }}
        >
          {activeItem.content}
        </div>
      )}
    </div>
  );
}
