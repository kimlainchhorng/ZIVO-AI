// code-generator-agent.ts

// This module provides code generation functionality for React + Supabase applications.

export interface GeneratorOptions {
  projectName: string;
  description: string;
  template?: string;
  features?: string[];
  authProviders?: string[];
  tables?: string[];
}

export interface GeneratedFile {
  path: string;
  content: string;
}

export class CodeGenerator {
  static generateCode(template: string, data: Record<string, any>): string {
    let code = template;
    for (const key in data) {
      const placeholder = `{{${key}}}`;
      code = code.replace(new RegExp(placeholder, 'g'), String(data[key]));
    }
    return code;
  }

  static generateSupabaseClient(supabaseUrl: string, supabaseKey: string): string {
    return `import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '${supabaseUrl}';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '${supabaseKey}';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
`;
  }

  static generateEnvFile(options: GeneratorOptions): string {
    return `# Supabase
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# App
VITE_APP_NAME=${options.projectName}
VITE_APP_URL=http://localhost:5173
`;
  }

  static generatePackageJson(options: GeneratorOptions): string {
    const slug = options.projectName.toLowerCase().replace(/\s+/g, '-');
    return JSON.stringify(
      {
        name: slug,
        version: '0.1.0',
        private: true,
        type: 'module',
        scripts: {
          dev: 'vite',
          build: 'tsc && vite build',
          preview: 'vite preview',
          lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
        },
        dependencies: {
          '@supabase/supabase-js': '^2.39.0',
          react: '^18.2.0',
          'react-dom': '^18.2.0',
          'react-router-dom': '^6.21.0',
        },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          '@vitejs/plugin-react': '^4.2.0',
          autoprefixer: '^10.4.0',
          eslint: '^8.55.0',
          postcss: '^8.4.0',
          tailwindcss: '^3.4.0',
          typescript: '^5.3.0',
          vite: '^5.0.0',
        },
      },
      null,
      2
    );
  }

  static generateReadme(options: GeneratorOptions): string {
    const { projectName, description, features = [], template } = options;
    return `# ${projectName}

${description}

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth + Realtime + Storage)
- **Template**: ${template || 'Custom'}

## Features

${features.map(f => `- ${f}`).join('\n')}

## Getting Started

### Prerequisites

- Node.js 20+
- Supabase account

### Installation

\`\`\`bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Fill in your Supabase credentials in .env.local
\`\`\`

### Database Setup

1. Create a new Supabase project at https://supabase.com
2. Apply migrations:
   \`\`\`bash
   npx supabase db push
   \`\`\`
3. Or run the SQL files in \`supabase/migrations/\` manually

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment instructions.

## License

MIT
`;
  }
}

// Example usage:
// const generator = new CodeGenerator();
// const pkg = CodeGenerator.generatePackageJson({ projectName: 'My App', description: 'A test app' });