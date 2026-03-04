export interface ProjectMemory {
  projectId: string;
  techStack: {
    framework?: string;
    styling?: string;
    database?: string;
    auth?: string;
  };
  codingStyle: {
    componentStyle?: "functional" | "class";
    arrowFunctions?: boolean;
    semicolons?: boolean;
    quotes?: "single" | "double";
  };
  designPreferences: {
    colorPalette?: string[];
    fontFamily?: string;
    darkMode?: boolean;
  };
  pastGenerations: Array<{
    id: string;
    prompt: string;
    files: string[];
    createdAt: string;
  }>;
  errorPatterns: Array<{
    error: string;
    fix: string;
    context: string;
  }>;
  updatedAt: string;
}

export function createDefaultMemory(projectId: string): ProjectMemory {
  return {
    projectId,
    techStack: {},
    codingStyle: {
      componentStyle: "functional",
      arrowFunctions: true,
      semicolons: true,
      quotes: "double",
    },
    designPreferences: {
      darkMode: false,
      colorPalette: [],
    },
    pastGenerations: [],
    errorPatterns: [],
    updatedAt: new Date().toISOString(),
  };
}

export function mergeMemory(
  existing: ProjectMemory,
  updates: Partial<ProjectMemory>
): ProjectMemory {
  return {
    ...existing,
    ...updates,
    techStack: { ...existing.techStack, ...updates.techStack },
    codingStyle: { ...existing.codingStyle, ...updates.codingStyle },
    designPreferences: {
      ...existing.designPreferences,
      ...updates.designPreferences,
    },
    pastGenerations: updates.pastGenerations ?? existing.pastGenerations,
    errorPatterns: updates.errorPatterns ?? existing.errorPatterns,
    updatedAt: new Date().toISOString(),
  };
}
