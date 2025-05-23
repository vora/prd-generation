import { insertPrdSchema, prdContentSchema } from "@shared/schema";
import type { Express, Request, Response } from "express";
import { unlink } from "fs/promises";
import { createServer, type Server } from "http";
import multer from "multer";
import {
  parseUploadedFile,
  validateFileSize,
  validateFileType,
} from "./lib/fileParser";
import {
  generateEpicsFromPRD,
  generatePRDFromConversation,
} from "./lib/openai";
import { storage } from "./storage";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all PRDs
  app.get("/api/prds", async (_req: Request, res: Response) => {
    try {
      const prds = await storage.getAllPrds();
      res.json(prds);
    } catch (error) {
      console.error("Error fetching PRDs:", error);
      res.status(500).json({ error: "Failed to fetch PRDs" });
    }
  });

  // Get specific PRD
  app.get("/api/prds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const prd = await storage.getPrd(id);
      if (!prd) {
        return res.status(404).json({ error: "PRD not found" });
      }

      res.json(prd);
    } catch (error) {
      console.error("Error fetching PRD:", error);
      res.status(500).json({ error: "Failed to fetch PRD" });
    }
  });

  // Upload conversation and generate PRD
  app.post(
    "/api/prds/generate",
    upload.single("file"),
    async (req: Request, res: Response) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file uploaded" });
        }

        // Validate file
        if (!validateFileType(req.file.mimetype, req.file.originalname)) {
          await unlink(req.file.path);
          return res.status(400).json({
            error: "Invalid file type. Please upload TXT or DOCX files.",
          });
        }

        if (!validateFileSize(req.file.size)) {
          await unlink(req.file.path);
          return res
            .status(400)
            .json({ error: "File too large. Maximum size is 10MB." });
        }

        // Parse file content
        const parsedFile = await parseUploadedFile({
          path: req.file.path,
          mimeType: req.file.mimetype,
          originalName: req.file.originalname,
        });

        // Clean up uploaded file
        await unlink(req.file.path);

        if (!parsedFile.content || parsedFile.content.trim().length === 0) {
          return res
            .status(400)
            .json({ error: "File appears to be empty or could not be read" });
        }

        // Generate PRD using OpenAI
        console.log(`Generating PRD from file: ${parsedFile.filename}`);
        const result = await generatePRDFromConversation(parsedFile.content);

        // Validate PRD content
        const validatedContent = prdContentSchema.parse(result.content);

        // Create PRD record
        const prdData = {
          title: result.title,
          content: validatedContent,
          status: "draft" as const,
          originalFileName: parsedFile.filename,
          processingTime: result.processingTime,
        };

        const validatedPrd = insertPrdSchema.parse(prdData);
        const prd = await storage.createPrd(validatedPrd);

        res.json({
          success: true,
          prd,
          processingTime: result.processingTime,
        });
      } catch (error: any) {
        console.error("Error generating PRD:", error);

        // Clean up file if it still exists
        if (req.file?.path) {
          try {
            await unlink(req.file.path);
          } catch (unlinkError) {
            console.error("Error cleaning up file:", unlinkError);
          }
        }

        if (error.name === "ZodError") {
          return res.status(400).json({
            error: "Invalid PRD format generated",
            details: error.errors,
          });
        }

        res.status(500).json({
          error: "Failed to generate PRD",
          details: error.message,
        });
      }
    }
  );

  // Generate epics from PRD
  app.post(
    "/api/prds/:id/generate-epics",
    async (req: Request, res: Response) => {
      try {
        const prdId = parseInt(req.params.id);
        if (isNaN(prdId)) {
          return res.status(400).json({ error: "Invalid PRD ID" });
        }

        const prd = await storage.getPrd(prdId);
        if (!prd) {
          return res.status(404).json({ error: "PRD not found" });
        }

        console.log(`Found PRD: ${prd.title}`);

        // Get existing epics for this PRD
        const existingEpics = await storage.getEpicsByPrdId(prdId);
        console.log(
          `Clearing ${existingEpics.length} existing epics for PRD ${prdId}`
        );

        // Clear existing epics
        for (const epic of existingEpics) {
          await storage.deleteEpic(epic.id);
        }

        console.log("Starting epic generation...");
        const result = await generateEpicsFromPRD(prd.content, prd.title);
        console.log("Epic generation completed:", {
          title: result.title,
          content: {
            epics: result.content.epics.map((e: any) => ({
              ...e,
              userStories: `${e.userStories?.length || 0} stories`,
            })),
          },
          processingTime: result.processingTime,
        });

        // Store the epic result in the PRD content
        const updatedContent = {
          ...prd.content,
          epics: result.content.epics,
        };

        await storage.updatePrd(prdId, {
          content: updatedContent,
          processingTime: result.processingTime,
        });

        res.json({
          prdId,
          title: result.title,
          content: result.content,
          processingTime: result.processingTime,
        });
      } catch (error: any) {
        console.error("Error generating epics:", error);
        res.status(500).json({
          error: "Failed to generate epics",
          details: error.message,
        });
      }
    }
  );

  // Get epics for a PRD
  app.get("/api/prds/:id/epics", async (req: Request, res: Response) => {
    try {
      const prdId = parseInt(req.params.id);
      if (isNaN(prdId)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const prd = await storage.getPrd(prdId);
      if (!prd) {
        return res.status(404).json({ error: "PRD not found" });
      }

      // Check if PRD has epics in its content
      if (prd.content && (prd.content as any).epics) {
        const epicsContent = (prd.content as any).epics;
        res.json([
          {
            prdId: prd.id,
            title: `Epics for ${prd.title}`,
            content: { epics: epicsContent },
          },
        ]);
      } else {
        res.json([]);
      }
    } catch (error) {
      console.error("Error fetching epics:", error);
      res.status(500).json({ error: "Failed to fetch epics" });
    }
  });

  // Delete PRD
  app.delete("/api/prds/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const success = await storage.deletePrd(id);
      if (!success) {
        return res.status(404).json({ error: "PRD not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting PRD:", error);
      res.status(500).json({ error: "Failed to delete PRD" });
    }
  });

  // Generate complete application from PRD
  app.post(
    "/api/prds/:id/generate-app",
    async (req: Request, res: Response) => {
      try {
        const prdId = parseInt(req.params.id);
        if (isNaN(prdId)) {
          return res.status(400).json({ error: "Invalid PRD ID" });
        }

        const prd = await storage.getPrd(prdId);
        if (!prd) {
          return res.status(404).json({ error: "PRD not found" });
        }

        console.log(`🚀 Building complete application: ${prd.title}`);

        // Extract features and requirements from PRD content
        const prdContent = prd.content as any;
        const features = prdContent.features || [];
        const overview = prdContent.overview || "";
        const goals = prdContent.goals || [];

        // Also get epics if they exist
        const epics = prdContent.epics || [];

        console.log(
          `📋 Found ${features.length} features, ${epics.length} epics`
        );

        // Generate complete application files
        const appFiles = generateCompleteAppFromPRD(
          prd.title,
          prdContent,
          epics
        );

        res.json({
          success: true,
          message: `🎉 Successfully built ${prd.title}!`,
          appName: prd.title,
          filesGenerated: appFiles.allFiles.length,
          appFiles,
        });
      } catch (error: any) {
        console.error("❌ Error building application:", error);
        res.status(500).json({
          error: "Failed to build application",
          details: error.message,
        });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}

// Generate complete application from PRD content
function generateCompleteAppFromPRD(
  appTitle: string,
  prdContent: any,
  epics: any[]
) {
  const appName = appTitle.toLowerCase().replace(/\s+/g, "-");
  const features = prdContent.features || [];
  const overview = prdContent.overview || "";

  // Generate App.tsx
  const appComponent = generateMainApp(appTitle, features, epics);

  // Generate pages based on features and epics
  const pages = [];

  // Main dashboard
  pages.push(generateDashboardPage(appTitle, features));

  // Feature-based pages
  features.forEach((feature: any, index: number) => {
    pages.push(generateFeaturePage(feature, index));
  });

  // Epic-based pages
  epics.forEach((epic: any) => {
    pages.push(generateEpicPage(epic));
  });

  // Generate components
  const components = [
    generateNavigation(appTitle, features, epics),
    generateDataTable(),
    generateSearchBar(),
    generateStatsCard(),
    generateFormModal(),
  ];

  // Generate configuration files
  const configFiles = [
    {
      filename: "package.json",
      content: JSON.stringify(generatePackageJson(appName), null, 2),
    },
    {
      filename: "vite.config.ts",
      content: generateViteConfig(),
    },
    {
      filename: "tailwind.config.js",
      content: generateTailwindConfig(),
    },
    {
      filename: "tsconfig.json",
      content: JSON.stringify(generateTSConfig(), null, 2),
    },
    {
      filename: "index.html",
      content: generateIndexHTML(appTitle),
    },
  ];

  // Generate utils and hooks
  const utils = [
    {
      filename: "src/utils/api.ts",
      content: generateApiUtils(),
    },
    {
      filename: "src/hooks/useData.ts",
      content: generateDataHook(),
    },
  ];

  // Generate README
  const readme = {
    filename: "README.md",
    content: generateREADME(appTitle, prdContent, features, epics),
  };

  const allFiles = [
    appComponent,
    ...pages,
    ...components,
    ...configFiles,
    ...utils,
    readme,
  ];

  return {
    appComponent,
    pages,
    components,
    configFiles,
    utils,
    readme,
    allFiles,
    summary: {
      totalFiles: allFiles.length,
      pages: pages.length,
      components: components.length,
      features: features.length,
      epics: epics.length,
    },
  };
}

function generateMainApp(appTitle: string, features: any[], epics: any[]) {
  return {
    filename: "src/App.tsx",
    content: `import React from 'react';
import { Router, Route, Switch } from 'wouter';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
${features
  .map(
    (_, i) => `import Feature${i + 1}Page from './pages/Feature${i + 1}Page';`
  )
  .join("\n")}
${epics
  .map(
    (epic: any) =>
      `import ${epic.title.replace(
        /\s+/g,
        ""
      )}Page from './pages/${epic.title.replace(/\s+/g, "")}Page';`
  )
  .join("\n")}

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <Router>
        <Switch>
          <Route path="/" component={Dashboard} />
          ${features
            .map(
              (_, i) =>
                `<Route path="/feature-${i + 1}" component={Feature${
                  i + 1
                }Page} />`
            )
            .join("\n          ")}
          ${epics
            .map(
              (epic: any) =>
                `<Route path="/${epic.title
                  .toLowerCase()
                  .replace(/\s+/g, "-")}" component={${epic.title.replace(
                  /\s+/g,
                  ""
                )}Page} />`
            )
            .join("\n          ")}
        </Switch>
      </Router>
    </div>
  );
}

export default App;`,
  };
}

function generateDashboardPage(appTitle: string, features: any[]) {
  return {
    filename: "src/pages/Dashboard.tsx",
    content: `import React from 'react';
import StatsCard from '../components/StatsCard';

export default function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">${appTitle}</h1>
        <p className="mt-2 text-gray-600">Welcome to your application dashboard</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatsCard title="Total Users" value="1,234" />
        <StatsCard title="Active Sessions" value="56" />
        <StatsCard title="Revenue" value="$12,345" />
        <StatsCard title="Growth" value="+23%" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Features</h3>
          <div className="space-y-3">
            ${features
              .map(
                (feature: any, i: number) => `
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <span>${feature.title || `Feature ${i + 1}`}</span>
              <span className="text-green-600 text-sm">Active</span>
            </div>`
              )
              .join("")}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
              <span>System Updated</span>
              <span className="text-sm text-gray-500">2 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded">
              <span>New User Registered</span>
              <span className="text-sm text-gray-500">4 hours ago</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
              <span>Maintenance Scheduled</span>
              <span className="text-sm text-gray-500">1 day ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  };
}

function generateFeaturePage(feature: any, index: number) {
  return {
    filename: `src/pages/Feature${index + 1}Page.tsx`,
    content: `import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';

export default function Feature${index + 1}Page() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">${
          feature.title || `Feature ${index + 1}`
        }</h1>
        <p className="mt-2 text-gray-600">${
          feature.description ||
          `Manage and track ${feature.title || "feature"} data`
        }</p>
      </div>

      <div className="bg-white shadow rounded-lg">
        <div className="p-6 border-b border-gray-200">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search ${feature.title || "items"}..."
          />
        </div>
        
        <DataTable 
          data={[
            { id: 1, name: 'Sample Item 1', status: 'Active', date: '2024-01-15' },
            { id: 2, name: 'Sample Item 2', status: 'Pending', date: '2024-01-14' },
            { id: 3, name: 'Sample Item 3', status: 'Complete', date: '2024-01-13' }
          ]}
          searchTerm={searchTerm}
        />
      </div>
    </div>
  );
}`,
  };
}

function generateEpicPage(epic: any) {
  const pageName = epic.title.replace(/\s+/g, "");
  return {
    filename: `src/pages/${pageName}Page.tsx`,
    content: `import React, { useState } from 'react';
import DataTable from '../components/DataTable';
import SearchBar from '../components/SearchBar';

export default function ${pageName}Page() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">${epic.title}</h1>
        <p className="mt-2 text-gray-600">${epic.description}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg">
            <div className="p-6 border-b border-gray-200">
              <SearchBar 
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search..."
              />
            </div>
            
            <DataTable 
              data={[
                { id: 1, name: 'Item 1', status: 'Active', priority: 'High' },
                { id: 2, name: 'Item 2', status: 'Pending', priority: 'Medium' },
                { id: 3, name: 'Item 3', status: 'Complete', priority: 'Low' }
              ]}
              searchTerm={searchTerm}
            />
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">User Stories</h3>
            <div className="space-y-3">
              ${(epic.userStories || [])
                .slice(0, 3)
                .map(
                  (story: any) => `
              <div className="p-3 bg-gray-50 rounded">
                <p className="font-medium text-sm">${story.title}</p>
                <p className="text-xs text-gray-600 mt-1">${story.description}</p>
              </div>`
                )
                .join("")}
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Goals</h3>
            <ul className="space-y-2">
              ${(epic.goals || [])
                .map(
                  (goal: string) => `
              <li className="flex items-center text-sm">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                ${goal}
              </li>`
                )
                .join("")}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}`,
  };
}

function generateNavigation(appTitle: string, features: any[], epics: any[]) {
  return {
    filename: "src/components/Navigation.tsx",
    content: `import React from 'react';
import { Link, useLocation } from 'wouter';

export default function Navigation() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    ${features
      .map(
        (feature: any, i: number) => `
    { path: '/feature-${i + 1}', label: '${
          feature.title || `Feature ${i + 1}`
        }' },`
      )
      .join("")}
    ${epics
      .map(
        (epic: any) => `
    { path: '/${epic.title.toLowerCase().replace(/\s+/g, "-")}', label: '${
          epic.title
        }' },`
      )
      .join("")}
  ];

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <Link href="/">
            <a className="text-xl font-bold text-gray-900">${appTitle}</a>
          </Link>
          
          <div className="flex space-x-6">
            {navItems.map(item => (
              <Link key={item.path} href={item.path}>
                <a className={\`\${location === item.path ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600 hover:text-gray-900'} pb-1 transition-colors\`}>
                  {item.label}
                </a>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}`,
  };
}

function generateDataTable() {
  return {
    filename: "src/components/DataTable.tsx",
    content: `import React from 'react';

interface DataTableProps {
  data: any[];
  searchTerm?: string;
}

export default function DataTable({ data, searchTerm = '' }: DataTableProps) {
  const filteredData = data.filter(item => 
    Object.values(item).some(value => 
      String(value).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  if (!data.length) {
    return (
      <div className="p-8 text-center text-gray-500">
        No data available
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map(column => (
              <th key={column} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.map((row, index) => (
            <tr key={index} className="hover:bg-gray-50">
              {columns.map(column => (
                <td key={column} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {row[column]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredData.length === 0 && searchTerm && (
        <div className="p-8 text-center text-gray-500">
          No results found for "{searchTerm}"
        </div>
      )}
    </div>
  );
}`,
  };
}

function generateSearchBar() {
  return {
    filename: "src/components/SearchBar.tsx",
    content: `import React from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchBar({ value, onChange, placeholder = 'Search...' }: SearchBarProps) {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        placeholder={placeholder}
      />
    </div>
  );
}`,
  };
}

function generateStatsCard() {
  return {
    filename: "src/components/StatsCard.tsx",
    content: `import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatsCard({ title, value, change, trend = 'neutral' }: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        {change && (
          <div className={\`text-sm \${trendColors[trend]}\`}>
            {change}
          </div>
        )}
      </div>
    </div>
  );
}`,
  };
}

function generateFormModal() {
  return {
    filename: "src/components/FormModal.tsx",
    content: `import React, { useState } from 'react';

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function FormModal({ isOpen, onClose, title, children }: FormModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="fixed inset-0 bg-black opacity-30" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg max-w-md w-full mx-auto shadow-xl">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}`,
  };
}

function generatePackageJson(appName: string) {
  return {
    name: appName,
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0",
      wouter: "^3.0.0",
    },
    devDependencies: {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@vitejs/plugin-react": "^4.0.3",
      typescript: "^5.0.2",
      vite: "^4.4.5",
      tailwindcss: "^3.3.0",
      autoprefixer: "^10.4.14",
      postcss: "^8.4.24",
    },
  };
}

function generateViteConfig() {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})`;
}

function generateTailwindConfig() {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
}

function generateTSConfig() {
  return {
    compilerOptions: {
      target: "ES2020",
      useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: true,
      noUnusedParameters: true,
      noFallthroughCasesInSwitch: true,
    },
    include: ["src"],
    references: [{ path: "./tsconfig.node.json" }],
  };
}

function generateIndexHTML(appTitle: string) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${appTitle}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
}

function generateApiUtils() {
  return `export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(\`API call failed: \${response.statusText}\`);
  }

  return response.json();
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}`;
}

function generateDataHook() {
  return `import { useState, useEffect } from 'react';

export function useData<T>(initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addItem = (item: T) => {
    setData(prev => [...prev, item]);
  };

  const removeItem = (index: number) => {
    setData(prev => prev.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, updatedItem: T) => {
    setData(prev => prev.map((item, i) => i === index ? updatedItem : item));
  };

  return {
    data,
    loading,
    error,
    setData,
    addItem,
    removeItem,
    updateItem
  };
}`;
}

function generateREADME(
  appTitle: string,
  prdContent: any,
  features: any[],
  epics: any[]
) {
  return `# ${appTitle}

🚀 **Complete React Application - Generated by Beanstalk AI**

## Overview
${
  prdContent.overview ||
  "Modern web application built from your product requirements."
}

## Features
${features
  .map(
    (feature: any) =>
      `- **${feature.title}**: ${
        feature.description || "Feature implementation"
      }`
  )
  .join("\n")}

## Epics Implemented
${epics
  .map((epic: any) => `- **${epic.title}**: ${epic.description}`)
  .join("\n")}

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation
1. Extract the generated files to a new directory
2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open http://localhost:3000

### Build for Production
\`\`\`bash
npm run build
\`\`\`

## Project Structure
- \`src/App.tsx\` - Main application component with routing
- \`src/pages/\` - Application pages
- \`src/components/\` - Reusable UI components
- \`src/hooks/\` - Custom React hooks
- \`src/utils/\` - Utility functions

## Technology Stack
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 🛣️ Wouter for routing
- ⚡ Vite for build tooling

## Deployment Options
- **Vercel**: Connect GitHub repo to Vercel for automatic deployments
- **Netlify**: Upload \`dist\` folder after running \`npm run build\`
- **Traditional Hosting**: Upload built files to any web server

## Support
This application was generated automatically from your PRD. All components include:
- ✅ TypeScript support
- ✅ Responsive design
- ✅ Modern React patterns
- ✅ Production-ready code

---
*Generated by Beanstalk AI - From Conversation to Code*
`;
}
