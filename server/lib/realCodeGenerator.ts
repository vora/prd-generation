import OpenAI from "openai";

export interface GeneratedApp {
  appName: string;
  components: GeneratedFile[];
  pages: GeneratedFile[];
  hooks: GeneratedFile[];
  utils: GeneratedFile[];
  config: GeneratedFile[];
  packageJson: any;
  readme: string;
  deployInstructions: string;
}

export interface GeneratedFile {
  path: string;
  filename: string;
  content: string;
  description: string;
}

export async function generateCompleteApp(
  epics: any[],
  prdTitle: string
): Promise<GeneratedApp> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  // Extract all user stories for analysis
  const allUserStories = epics.flatMap(epic => epic.userStories || []);
  
  // Generate main App component with routing
  const appComponent = await generateAppComponent(epics, prdTitle, openai);
  
  // Generate pages for each major epic
  const pages: GeneratedFile[] = [];
  for (const epic of epics) {
    const page = await generatePageFromEpic(epic, openai);
    pages.push(page);
  }
  
  // Generate reusable components
  const components = await generateComponents(allUserStories, openai);
  
  // Generate custom hooks for state management
  const hooks = await generateHooks(allUserStories, openai);
  
  // Generate utility functions
  const utils = await generateUtils(allUserStories, openai);
  
  // Generate configuration files
  const config = await generateConfigFiles(prdTitle, openai);
  
  // Generate package.json with all required dependencies
  const packageJson = generatePackageJson(prdTitle, epics);
  
  // Generate comprehensive README
  const readme = generateReadme(prdTitle, epics, allUserStories);
  
  // Generate deployment instructions
  const deployInstructions = generateDeployInstructions(prdTitle);

  return {
    appName: prdTitle,
    components: [appComponent, ...components],
    pages,
    hooks,
    utils,
    config,
    packageJson,
    readme,
    deployInstructions
  };
}

async function generateAppComponent(epics: any[], prdTitle: string, openai: OpenAI): Promise<GeneratedFile> {
  const routes = epics.map(epic => ({
    name: epic.title.replace(/\s+/g, ''),
    path: `/${epic.title.toLowerCase().replace(/\s+/g, '-')}`,
    title: epic.title
  }));

  const prompt = `Generate a complete App.tsx component for "${prdTitle}" with the following requirements:

Routes needed:
${routes.map(r => `- ${r.path} -> ${r.name}Page`).join('\n')}

Requirements:
- Use wouter for routing
- Include proper navigation header
- Add authentication check
- Include error boundaries
- Use TypeScript
- Include responsive design
- Add proper SEO meta tags

Generate a production-ready App.tsx file with all imports and routing logic.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate complete, production-ready React TypeScript components. Include all necessary imports and proper error handling."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return {
    path: "src/App.tsx",
    filename: "App.tsx",
    content: response.choices[0].message.content || '',
    description: "Main application component with routing and navigation"
  };
}

async function generatePageFromEpic(epic: any, openai: OpenAI): Promise<GeneratedFile> {
  const pageName = epic.title.replace(/\s+/g, '');
  const userStories = epic.userStories || [];

  const prompt = `Generate a complete React page component for "${epic.title}".

Epic Details:
- Title: ${epic.title}
- Description: ${epic.description}
- Goals: ${epic.goals?.join(', ') || 'Not specified'}

User Stories to implement:
${userStories.map(story => `
- ${story.title}: ${story.description}
  Acceptance Criteria: ${story.acceptanceCriteria?.join(', ') || 'Not specified'}
`).join('\n')}

Requirements:
- Generate a fully functional page component
- Implement all user story requirements
- Use real state management (useState, useEffect)
- Include proper form handling where needed
- Add loading states and error handling
- Use TypeScript with proper types
- Include responsive Tailwind CSS styling
- Add proper accessibility attributes
- Include real CRUD operations (with mock API calls)

Component name: ${pageName}Page
File name: ${pageName}Page.tsx`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate complete, production-ready React page components with full functionality. Include all necessary imports, state management, and real working features."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return {
    path: `src/pages/${pageName}Page.tsx`,
    filename: `${pageName}Page.tsx`,
    content: response.choices[0].message.content || '',
    description: `Page component for ${epic.title} functionality`
  };
}

async function generateComponents(userStories: any[], openai: OpenAI): Promise<GeneratedFile[]> {
  // Identify common component patterns from user stories
  const componentPatterns = [
    { name: "DataTable", purpose: "Display and manage tabular data with sorting, filtering" },
    { name: "SearchFilter", purpose: "Search and filter functionality" },
    { name: "FormModal", purpose: "Modal forms for adding/editing records" },
    { name: "StatsCard", purpose: "Display key metrics and statistics" },
    { name: "LoadingSpinner", purpose: "Loading states across the application" },
    { name: "ErrorBoundary", purpose: "Error handling and user feedback" }
  ];

  const components: GeneratedFile[] = [];

  for (const pattern of componentPatterns) {
    const prompt = `Generate a reusable React component: ${pattern.name}

Purpose: ${pattern.purpose}

Requirements:
- TypeScript with proper prop types
- Fully functional with real logic
- Responsive Tailwind CSS styling
- Proper accessibility attributes
- Error handling where appropriate
- Reusable across different contexts
- Include prop validation

Make this a production-ready component that can be used throughout the application.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate complete, reusable React components with TypeScript. Focus on real functionality and proper patterns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1
    });

    components.push({
      path: `src/components/${pattern.name}.tsx`,
      filename: `${pattern.name}.tsx`,
      content: response.choices[0].message.content || '',
      description: pattern.purpose
    });
  }

  return components;
}

async function generateHooks(userStories: any[], openai: OpenAI): Promise<GeneratedFile[]> {
  const hooks = [
    { name: "useApi", purpose: "API calls and data fetching" },
    { name: "useAuth", purpose: "Authentication state management" },
    { name: "useLocalStorage", purpose: "Local storage operations" },
    { name: "useDebounce", purpose: "Debounced input handling" }
  ];

  const hookFiles: GeneratedFile[] = [];

  for (const hook of hooks) {
    const prompt = `Generate a custom React hook: ${hook.name}

Purpose: ${hook.purpose}

Requirements:
- TypeScript with proper return types
- Real functionality, not mock data
- Error handling and loading states
- Proper cleanup and memory management
- Follow React hooks best practices
- Include JSDoc comments

Generate a production-ready custom hook.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Generate custom React hooks with TypeScript. Focus on real functionality and proper patterns."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1
    });

    hookFiles.push({
      path: `src/hooks/${hook.name}.ts`,
      filename: `${hook.name}.ts`,
      content: response.choices[0].message.content || '',
      description: hook.purpose
    });
  }

  return hookFiles;
}

async function generateUtils(userStories: any[], openai: OpenAI): Promise<GeneratedFile[]> {
  const prompt = `Generate utility functions based on these user story requirements:

${userStories.slice(0, 5).map(story => `- ${story.title}: ${story.description}`).join('\n')}

Create a utils.ts file with common utility functions needed for this application:
- Data formatting functions
- Validation helpers
- Date/time utilities
- Export/import functions
- String manipulation helpers

Requirements:
- TypeScript with proper types
- Well-documented with JSDoc
- Pure functions where possible
- Comprehensive error handling
- Unit test friendly`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate utility functions for React applications. Focus on reusable, well-typed functions."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return [{
    path: "src/utils/index.ts",
    filename: "index.ts",
    content: response.choices[0].message.content || '',
    description: "Common utility functions"
  }];
}

async function generateConfigFiles(prdTitle: string, openai: OpenAI): Promise<GeneratedFile[]> {
  const configs = [
    {
      name: "tailwind.config.js",
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`
    },
    {
      name: "vite.config.ts",
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})`
    },
    {
      name: "tsconfig.json",
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`
    }
  ];

  return configs.map(config => ({
    path: config.name,
    filename: config.name,
    content: config.content,
    description: `Configuration file: ${config.name}`
  }));
}

function generatePackageJson(prdTitle: string, epics: any[]): any {
  return {
    name: prdTitle.toLowerCase().replace(/\s+/g, '-'),
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      wouter: "^3.0.0",
      "@tanstack/react-query": "^5.0.0",
      "lucide-react": "^0.400.0"
    },
    devDependencies: {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@vitejs/plugin-react": "^4.0.3",
      typescript: "^5.0.2",
      vite: "^4.4.5",
      tailwindcss: "^3.3.0",
      autoprefixer: "^10.4.14",
      postcss: "^8.4.24"
    }
  };
}

function generateReadme(prdTitle: string, epics: any[], userStories: any[]): string {
  return `# ${prdTitle}

## Overview
This application was automatically generated from product requirements and user stories using Beanstalk AI.

## Features
${epics.map(epic => `### ${epic.title}
${epic.description}

**User Stories:**
${(epic.userStories || []).map((story: any) => `- ${story.title}: ${story.description}`).join('\n')}
`).join('\n')}

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation
1. Clone this repository
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start the development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open http://localhost:3000 in your browser

### Building for Production
\`\`\`bash
npm run build
\`\`\`

## Architecture
- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Routing**: Wouter
- **State Management**: React Query + useState
- **Build Tool**: Vite

## Generated Components
- **Pages**: ${epics.length} main pages based on epics
- **Components**: Reusable UI components
- **Hooks**: Custom React hooks for state management
- **Utils**: Helper functions and utilities

## Deployment
Ready for deployment to any static hosting service:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

---
*Generated by Beanstalk AI Code Generator*
`;
}

function generateDeployInstructions(prdTitle: string): string {
  return `# Deployment Instructions for ${prdTitle}

## Option 1: Vercel (Recommended)
1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy automatically

## Option 2: Netlify
1. Build the project: \`npm run build\`
2. Upload the \`dist\` folder to Netlify
3. Configure redirects for SPA routing

## Option 3: Traditional Hosting
1. Build: \`npm run build\`
2. Upload \`dist\` folder contents to your web server
3. Configure web server for SPA routing

## Environment Variables
Create a \`.env\` file for any API keys or configuration:
\`\`\`
VITE_API_URL=https://your-api.com
\`\`\`

Your application is ready for production deployment!
`;
}