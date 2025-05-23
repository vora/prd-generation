import OpenAI from "openai";

export interface GeneratedComponent {
  name: string;
  filename: string;
  code: string;
  type: 'component' | 'page' | 'hook' | 'api';
  dependencies: string[];
}

export interface CodeGenerationResult {
  components: GeneratedComponent[];
  packageJson: any;
  readme: string;
  processingTime: number;
}

export async function generateFrontendCode(
  epics: any[],
  prdTitle: string
): Promise<CodeGenerationResult> {
  const startTime = Date.now();
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  // Analyze user stories and generate component structure
  const analysisPrompt = `
You are an expert React developer. Analyze these epics and user stories to generate a complete frontend application structure.

PRD Title: ${prdTitle}

Epics and User Stories:
${JSON.stringify(epics, null, 2)}

Generate a JSON response with this structure:
{
  "appStructure": {
    "components": [
      {
        "name": "ComponentName",
        "filename": "component-name.tsx", 
        "type": "component",
        "purpose": "What this component does",
        "userStories": ["story-1", "story-2"],
        "features": ["List of features this component implements"]
      }
    ],
    "pages": [
      {
        "name": "PageName",
        "filename": "page-name.tsx",
        "route": "/route-path",
        "purpose": "What this page does",
        "components": ["ComponentName1", "ComponentName2"]
      }
    ],
    "hooks": [
      {
        "name": "useHookName",
        "filename": "use-hook-name.ts",
        "purpose": "What this hook manages"
      }
    ]
  },
  "dependencies": [
    "@tanstack/react-query",
    "wouter",
    "lucide-react"
  ]
}

Focus on:
- Modern React patterns with TypeScript
- Responsive design with Tailwind CSS
- Real data integration (no mock data)
- Clean component architecture
- Proper state management
`;

  const analysisResponse = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert React developer who creates production-ready applications. Always respond with valid JSON."
      },
      {
        role: "user", 
        content: analysisPrompt
      }
    ],
    response_format: { type: "json_object" },
    temperature: 0.1
  });

  const analysis = JSON.parse(analysisResponse.choices[0].message.content || '{}');
  const components: GeneratedComponent[] = [];

  // Generate individual components
  for (const component of analysis.appStructure?.components || []) {
    const componentCode = await generateComponent(component, epics, openai);
    components.push(componentCode);
  }

  // Generate pages
  for (const page of analysis.appStructure?.pages || []) {
    const pageCode = await generatePage(page, analysis.appStructure.components, openai);
    components.push(pageCode);
  }

  // Generate custom hooks
  for (const hook of analysis.appStructure?.hooks || []) {
    const hookCode = await generateHook(hook, openai);
    components.push(hookCode);
  }

  // Generate App.tsx with routing
  const appCode = await generateAppComponent(analysis.appStructure, prdTitle, openai);
  components.push(appCode);

  // Generate package.json
  const packageJson = generatePackageJson(prdTitle, analysis.dependencies || []);

  // Generate README
  const readme = generateReadme(prdTitle, epics, components);

  const processingTime = Date.now() - startTime;

  return {
    components,
    packageJson,
    readme,
    processingTime
  };
}

async function generateComponent(
  componentSpec: any,
  epics: any[],
  openai: OpenAI
): Promise<GeneratedComponent> {
  const relevantStories = epics
    .flatMap(epic => epic.userStories || [])
    .filter(story => componentSpec.userStories?.includes(story.id));

  const prompt = `
Generate a complete React TypeScript component based on this specification:

Component: ${componentSpec.name}
Purpose: ${componentSpec.purpose}
Features: ${JSON.stringify(componentSpec.features)}

Related User Stories:
${JSON.stringify(relevantStories, null, 2)}

Requirements:
- Use TypeScript with proper typing
- Use Tailwind CSS for styling  
- Use Lucide React for icons
- Implement real functionality (no placeholder data)
- Include proper error handling
- Use modern React patterns (hooks, functional components)
- Add proper accessibility attributes
- Include loading states where appropriate

Generate ONLY the component code, nothing else.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert React developer. Generate production-ready TypeScript components."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return {
    name: componentSpec.name,
    filename: componentSpec.filename,
    code: response.choices[0].message.content || '',
    type: 'component',
    dependencies: extractDependencies(response.choices[0].message.content || '')
  };
}

async function generatePage(
  pageSpec: any,
  components: any[],
  openai: OpenAI
): Promise<GeneratedComponent> {
  const prompt = `
Generate a complete React page component:

Page: ${pageSpec.name}
Route: ${pageSpec.route}
Purpose: ${pageSpec.purpose}
Uses Components: ${JSON.stringify(pageSpec.components)}

Requirements:
- Use TypeScript
- Use Tailwind CSS for layout
- Import and use the specified components
- Implement proper page structure with header, main content, footer
- Add proper SEO meta tags
- Include error boundaries
- Use responsive design

Generate ONLY the page component code.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system", 
        content: "You are an expert React developer. Generate production-ready page components."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return {
    name: pageSpec.name,
    filename: pageSpec.filename,
    code: response.choices[0].message.content || '',
    type: 'page',
    dependencies: extractDependencies(response.choices[0].message.content || '')
  };
}

async function generateHook(
  hookSpec: any,
  openai: OpenAI
): Promise<GeneratedComponent> {
  const prompt = `
Generate a custom React hook:

Hook: ${hookSpec.name}
Purpose: ${hookSpec.purpose}

Requirements:
- Use TypeScript with proper return types
- Follow React hooks best practices
- Include proper error handling
- Add JSDoc comments
- Use modern patterns (useCallback, useMemo where appropriate)

Generate ONLY the hook code.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert React developer. Generate production-ready custom hooks."
      },
      {
        role: "user", 
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return {
    name: hookSpec.name,
    filename: hookSpec.filename,
    code: response.choices[0].message.content || '',
    type: 'hook',
    dependencies: extractDependencies(response.choices[0].message.content || '')
  };
}

async function generateAppComponent(
  appStructure: any,
  prdTitle: string,
  openai: OpenAI
): Promise<GeneratedComponent> {
  const prompt = `
Generate the main App.tsx component with routing:

Application: ${prdTitle}
Pages: ${JSON.stringify(appStructure.pages)}

Requirements:
- Use wouter for routing
- Import all page components
- Set up proper route structure
- Include navigation/header component
- Add 404 handling
- Use TypeScript
- Include proper document title management

Generate ONLY the App.tsx code.
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [
      {
        role: "system",
        content: "You are an expert React developer. Generate the main App component with routing."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    temperature: 0.1
  });

  return {
    name: 'App',
    filename: 'App.tsx',
    code: response.choices[0].message.content || '',
    type: 'component',
    dependencies: extractDependencies(response.choices[0].message.content || '')
  };
}

function generatePackageJson(prdTitle: string, dependencies: string[]): any {
  const baseDependencies = {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    "wouter": "^3.0.0",
    "@tanstack/react-query": "^5.0.0",
    "lucide-react": "^0.400.0",
    "tailwindcss": "^3.3.0"
  };

  const additionalDeps = dependencies.reduce((acc, dep) => {
    acc[dep] = "latest";
    return acc;
  }, {} as Record<string, string>);

  return {
    name: prdTitle.toLowerCase().replace(/\s+/g, '-'),
    version: "1.0.0",
    type: "module",
    scripts: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview"
    },
    dependencies: {
      ...baseDependencies,
      ...additionalDeps
    },
    devDependencies: {
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0",
      "vite": "^5.0.0",
      "@vitejs/plugin-react": "^4.0.0"
    }
  };
}

function generateReadme(prdTitle: string, epics: any[], components: GeneratedComponent[]): string {
  return `# ${prdTitle}

## Overview
This application was automatically generated from product requirements and user stories.

## Features
${epics.map(epic => `- **${epic.title}**: ${epic.description}`).join('\n')}

## Generated Components
${components.map(comp => `- \`${comp.filename}\` - ${comp.type}`).join('\n')}

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Start development server:
\`\`\`bash
npm run dev
\`\`\`

3. Build for production:
\`\`\`bash
npm run build
\`\`\`

## Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Icons**: Lucide React

Generated by Beanstalk AI Code Generator
`;
}

function extractDependencies(code: string): string[] {
  const deps: string[] = [];
  const importRegex = /import.*from\s+['"]([^'"]+)['"]/g;
  let match;
  
  while ((match = importRegex.exec(code)) !== null) {
    const importPath = match[1];
    if (!importPath.startsWith('.') && !importPath.startsWith('/')) {
      deps.push(importPath);
    }
  }
  
  return Array.from(new Set(deps));
}