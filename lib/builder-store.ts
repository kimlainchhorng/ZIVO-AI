import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { Page, Section, StylePreset, UIOutput, ProjectVersion, Deployment } from '@/types/builder';

interface BuilderState {
  projectId: string | null;
  prompt: string;
  stylePreset: StylePreset;
  pages: Page[];
  activePageId: string | null;
  isGenerating: boolean;
  versions: ProjectVersion[];
  selectedVersionIds: [string | null, string | null];
  deployments: Deployment[];
  templateId: string | null;
  // Actions
  setProjectId: (id: string | null) => void;
  setPrompt: (p: string) => void;
  setStylePreset: (p: StylePreset) => void;
  setUIOutput: (output: UIOutput) => void;
  setActivePage: (pageId: string) => void;
  updateSection: (pageId: string, sectionId: string, updates: Partial<Section>) => void;
  deleteSection: (pageId: string, sectionId: string) => void;
  addSection: (pageId: string, section: Section) => void;
  reorderSections: (pageId: string, oldIndex: number, newIndex: number) => void;
  addPage: (page: Page) => void;
  setVersions: (versions: ProjectVersion[]) => void;
  setDeployments: (deployments: Deployment[]) => void;
  setIsGenerating: (v: boolean) => void;
  setTemplateId: (id: string | null) => void;
  selectVersionForCompare: (versionId: string | null, slot: 0 | 1) => void;
  reset: () => void;
}

const initialState = {
  projectId: null,
  prompt: '',
  stylePreset: 'premium' as StylePreset,
  pages: [],
  activePageId: null,
  isGenerating: false,
  versions: [],
  selectedVersionIds: [null, null] as [string | null, string | null],
  deployments: [],
  templateId: null,
};

export const useBuilderStore = create<BuilderState>()(
  immer((set) => ({
    ...initialState,

    setProjectId: (id) => set((state) => { state.projectId = id; }),

    setPrompt: (p) => set((state) => { state.prompt = p; }),

    setStylePreset: (p) => set((state) => { state.stylePreset = p; }),

    setUIOutput: (output) =>
      set((state) => {
        state.pages = output.pages;
        if (output.stylePreset) state.stylePreset = output.stylePreset;
        if (output.pages.length > 0 && !state.activePageId) {
          const homePage = output.pages.find((p) => p.isHome) ?? output.pages[0];
          state.activePageId = homePage.id;
        }
      }),

    setActivePage: (pageId) => set((state) => { state.activePageId = pageId; }),

    updateSection: (pageId, sectionId, updates) =>
      set((state) => {
        const page = state.pages.find((p) => p.id === pageId);
        if (!page) return;
        const section = page.sections.find((s) => s.id === sectionId);
        if (!section) return;
        Object.assign(section, updates);
      }),

    deleteSection: (pageId, sectionId) =>
      set((state) => {
        const page = state.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.sections = page.sections.filter((s) => s.id !== sectionId);
      }),

    addSection: (pageId, section) =>
      set((state) => {
        const page = state.pages.find((p) => p.id === pageId);
        if (!page) return;
        page.sections.push(section);
      }),

    reorderSections: (pageId, oldIndex, newIndex) =>
      set((state) => {
        const page = state.pages.find((p) => p.id === pageId);
        if (!page) return;
        const [removed] = page.sections.splice(oldIndex, 1);
        page.sections.splice(newIndex, 0, removed);
        // Update order field
        page.sections.forEach((s, i) => { s.order = i; });
      }),

    addPage: (page) =>
      set((state) => {
        state.pages.push(page);
      }),

    setVersions: (versions) => set((state) => { state.versions = versions; }),

    setDeployments: (deployments) => set((state) => { state.deployments = deployments; }),

    setIsGenerating: (v) => set((state) => { state.isGenerating = v; }),

    setTemplateId: (id) => set((state) => { state.templateId = id; }),

    selectVersionForCompare: (versionId, slot) =>
      set((state) => {
        state.selectedVersionIds[slot] = versionId;
      }),

    reset: () => set(() => ({ ...initialState })),
  }))
);
