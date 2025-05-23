import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePRDFromConversation, generateEpicsFromPRD } from "./lib/openai";
// Simple direct code generation without AI calls
function generateAppFromEpics(epics: any[], appTitle: string) {
  const appName = appTitle.toLowerCase().replace(/\s+/g, '-');
  
  return {
    components: epics.map((epic, index) => ({
      path: `src/components/${epic.title.replace(/\s+/g, '')}.tsx`,
      filename: `${epic.title.replace(/\s+/g, '')}.tsx`,
      content: generateComponentCode(epic),
      description: `Component for ${epic.title}`
    })),
    pages: epics.map((epic, index) => ({
      path: `src/pages/${epic.title.replace(/\s+/g, '')}Page.tsx`,
      filename: `${epic.title.replace(/\s+/g, '')}Page.tsx`,
      content: generatePageCode(epic),
      description: `Page for ${epic.title}`
    })),
    hooks: [{
      path: 'src/hooks/useApi.ts',
      filename: 'useApi.ts',
      content: generateApiHook(),
      description: 'API management hook'
    }],
    utils: [{
      path: 'src/utils/index.ts',
      filename: 'index.ts',
      content: generateUtilsCode(),
      description: 'Utility functions'
    }],
    config: [{
      path: 'vite.config.ts',
      filename: 'vite.config.ts',
      content: generateViteConfig(),
      description: 'Vite configuration'
    }],
    packageJson: generatePackageJson(appName),
    readme: generateReadmeContent(appTitle, epics),
    deployInstructions: generateDeployGuide(appTitle)
  };
}

function generateComponentCode(epic: any): string {
  const componentName = epic.title.replace(/\s+/g, '');
  const userStories = epic.userStories || [];
  
  return `import React, { useState, useEffect } from 'react';

interface ${componentName}Props {
  className?: string;
}

export default function ${componentName}({ className = '' }: ${componentName}Props) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Implement data loading logic here
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setData([
        { id: 1, name: 'Sample Item 1', status: 'Active' },
        { id: 2, name: 'Sample Item 2', status: 'Pending' },
        { id: 3, name: 'Sample Item 3', status: 'Complete' }
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredData = data.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={\`p-6 \${className}\`}>
      <h2 className="text-2xl font-bold mb-4">${epic.title}</h2>
      <p className="text-gray-600 mb-6">${epic.description}</p>
      
      {/* Search functionality */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg"
        />
      </div>

      {/* Data display */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredData.map(item => (
            <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-sm text-gray-600">Status: {item.status}</p>
            </div>
          ))}
        </div>
      )}

      {/* Action buttons based on user stories */}
      <div className="mt-6 flex gap-2">
        ${userStories.slice(0, 3).map((story: any) => `
        <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          ${story.title}
        </button>`).join('')}
      </div>
    </div>
  );
}`;
}

function generatePageCode(epic: any): string {
  const pageName = epic.title.replace(/\s+/g, '');
  const componentName = pageName;
  
  return `import React from 'react';
import ${componentName} from '../components/${componentName}';

export default function ${pageName}Page() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <h1 className="text-xl font-semibold text-gray-900">${epic.title}</h1>
            <nav className="flex space-x-4">
              <a href="/" className="text-gray-600 hover:text-gray-900">Home</a>
              <a href="/dashboard" className="text-gray-600 hover:text-gray-900">Dashboard</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <${componentName} />
      </main>
    </div>
  );
}`;
}

function generateApiHook(): string {
  return `import { useState, useEffect } from 'react';

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  return { data, loading, error };
}`;
}

function generateUtilsCode(): string {
  return `export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
}

export function exportToCSV(data: any[], filename: string): void {
  const csv = convertArrayToCSV(data);
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

function convertArrayToCSV(data: any[]): string {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  const csvRows = data.map(row => 
    headers.map(header => JSON.stringify(row[header] || '')).join(',')
  );
  
  return [csvHeaders, ...csvRows].join('\\n');
}`;
}

function generateViteConfig(): string {
  return `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
})`;
}

function generatePackageJson(appName: string): any {
  return {
    name: appName,
    private: true,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview"
    },
    dependencies: {
      react: "^18.2.0",
      "react-dom": "^18.2.0"
    },
    devDependencies: {
      "@types/react": "^18.2.15",
      "@types/react-dom": "^18.2.7",
      "@vitejs/plugin-react": "^4.0.3",
      typescript: "^5.0.2",
      vite: "^4.4.5",
      tailwindcss: "^3.3.0"
    }
  };
}

function generateReadmeContent(appTitle: string, epics: any[]): string {
  return \`# \${appTitle}

## Overview
Complete React application generated from your product requirements.

## Features
\${epics.map(epic => \`- **\${epic.title}**: \${epic.description}\`).join('\\n')}

## Getting Started
1. Install dependencies: \`npm install\`
2. Start development server: \`npm run dev\`
3. Open http://localhost:3000

## Build for Production
\`npm run build\`

---
Generated by Beanstalk AI\`;
}

function generateDeployGuide(appTitle: string): string {
  return \`# Deployment Guide for \${appTitle}

## Quick Deploy Options:
1. **Vercel**: Push to GitHub, connect to Vercel
2. **Netlify**: Build locally, upload dist folder
3. **Traditional**: Upload built files to any web server

Your app is ready for production!\`;
}
import OpenAI from "openai";
import { parseUploadedFile, validateFileType, validateFileSize } from "./lib/fileParser";
import { insertPrdSchema, prdContentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import { unlink } from "fs/promises";

const upload = multer({ dest: 'uploads/' });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Get all PRDs
  app.get("/api/prds", async (req, res) => {
    try {
      const prds = await storage.getAllPrds();
      res.json(prds);
    } catch (error) {
      console.error("Error fetching PRDs:", error);
      res.status(500).json({ error: "Failed to fetch PRDs" });
    }
  });

  // Generate epics from PRD
  app.post("/api/prds/:id/generate-epics", async (req, res) => {
    try {
      const prdId = parseInt(req.params.id);
      const prd = await storage.getPrd(prdId);
      
      if (!prd) {
        console.log(`PRD ${prdId} not found`);
        return res.status(404).json({ error: "PRD not found" });
      }

      console.log(`Found PRD: ${prd.title}`);

      // Always clear existing epics before generating new ones
      const existingEpics = await storage.getEpicsByPrdId(prdId);
      console.log(`Clearing ${existingEpics.length} existing epics for PRD ${prdId}`);
      
      for (const epic of existingEpics) {
        await storage.deleteEpic(epic.id);
        console.log(`Deleted epic ${epic.id}`);
      }

      const { generateEpicsFromPRD } = await import("./lib/openai");
      console.log("Starting epic generation...");
      const result = await generateEpicsFromPRD(prd.content as any, prd.title);
      console.log("Epic generation completed:", result);

      // Save epics to storage
      const epicRecord = await storage.createEpic({
        prdId,
        title: result.title,
        content: result.content,
        processingTime: result.processingTime,
      });

      res.json(epicRecord);
    } catch (error) {
      console.error("Error generating epics:", error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate epics" 
      });
    }
  });

  // Get epics for a PRD
  app.get("/api/prds/:id/epics", async (req, res) => {
    try {
      const prdId = parseInt(req.params.id);
      const epics = await storage.getEpicsByPrdId(prdId);
      res.json(epics);
    } catch (error) {
      console.error("Error fetching epics:", error);
      res.status(500).json({ error: "Failed to fetch epics" });
    }
  });

  // Delete epic
  app.delete("/api/epics/:id", async (req, res) => {
    try {
      const epicId = parseInt(req.params.id);
      const success = await storage.deleteEpic(epicId);
      
      if (!success) {
        return res.status(404).json({ error: "Epic not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting epic:", error);
      res.status(500).json({ error: "Failed to delete epic" });
    }
  });

  // Get specific PRD
  app.get("/api/prds/:id", async (req, res) => {
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

  // Delete PRD
  app.delete("/api/prds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const deleted = await storage.deletePrd(id);
      if (!deleted) {
        return res.status(404).json({ error: "PRD not found" });
      }

      res.json({ success: true, message: "PRD deleted successfully" });
    } catch (error) {
      console.error("Error deleting PRD:", error);
      res.status(500).json({ error: "Failed to delete PRD" });
    }
  });

  // Upload file and generate PRD
  app.post("/api/prds/generate", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Validate file type and size
      if (!validateFileType(req.file.mimetype, req.file.originalname || '')) {
        await unlink(req.file.path);
        return res.status(400).json({ 
          error: "Unsupported file type. Please upload TXT, PDF, or DOCX files." 
        });
      }

      if (!validateFileSize(req.file.size)) {
        await unlink(req.file.path);
        return res.status(400).json({ 
          error: "File too large. Maximum size is 10MB." 
        });
      }

      // Parse processing options
      const options = {
        extractPersonas: req.body.extractPersonas === 'true',
        identifyFeatures: req.body.identifyFeatures === 'true',
        generateAcceptanceCriteria: req.body.generateAcceptanceCriteria === 'true',
      };

      // Parse the uploaded file
      const parsedFile = await parseUploadedFile(req.file.path, req.file.originalname || '');
      
      // Clean up uploaded file
      await unlink(req.file.path);

      // Generate PRD using OpenAI
      const { title, content, processingTime } = await generatePRDFromConversation(
        parsedFile.content,
        options
      );

      // Validate the generated content
      const validatedContent = prdContentSchema.parse(content);

      // Save to storage
      const prdData = insertPrdSchema.parse({
        title,
        content: validatedContent,
        status: "complete",
        originalFileName: parsedFile.filename,
        processingTime,
      });

      const savedPrd = await storage.createPrd(prdData);

      res.json({
        success: true,
        prd: savedPrd,
        message: `PRD generated successfully in ${processingTime} seconds`,
      });

    } catch (error) {
      console.error("Error generating PRD:", error);
      
      // Clean up file if it exists
      if (req.file?.path) {
        try {
          await unlink(req.file.path);
        } catch (unlinkError) {
          console.error("Error cleaning up file:", unlinkError);
        }
      }

      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid file or processing options",
          details: error.errors 
        });
      }

      res.status(500).json({ 
        error: error instanceof Error ? error.message : "Failed to generate PRD" 
      });
    }
  });

  // Update PRD
  app.patch("/api/prds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const updates = req.body;
      
      // Validate updates if content is being modified
      if (updates.content) {
        updates.content = prdContentSchema.parse(updates.content);
      }

      const updatedPrd = await storage.updatePrd(id, updates);
      if (!updatedPrd) {
        return res.status(404).json({ error: "PRD not found" });
      }

      res.json(updatedPrd);
    } catch (error) {
      console.error("Error updating PRD:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          error: "Invalid update data",
          details: error.errors 
        });
      }

      res.status(500).json({ error: "Failed to update PRD" });
    }
  });

  // Delete PRD
  app.delete("/api/prds/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const deleted = await storage.deletePrd(id);
      if (!deleted) {
        return res.status(404).json({ error: "PRD not found" });
      }

      res.json({ success: true, message: "PRD deleted successfully" });
    } catch (error) {
      console.error("Error deleting PRD:", error);
      res.status(500).json({ error: "Failed to delete PRD" });
    }
  });

  // Add user story to epic
  app.post("/api/epics/:epicId/add-story", async (req, res) => {
    try {
      const epicIdParam = req.params.epicId;
      const { prompt } = req.body;

      console.log(`=== ADD STORY REQUEST ===`);
      console.log(`Epic ID: ${epicIdParam}`);
      console.log(`Prompt: ${prompt}`);

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Find the epic in the PRD structure since epics are stored there
      const allPrds = await storage.getAllPrds();
      let epic = null;
      let foundPrdId = null;
      
      console.log(`Looking for epic ${epicIdParam} in ${allPrds.length} PRDs`);
      
      // Search through all PRDs to find the epic
      for (const prd of allPrds) {
        console.log(`Checking PRD ${prd.id}, has content: ${!!prd.content}`);
        if (prd.content && (prd.content as any).epics) {
          const content = prd.content as any;
          console.log(`PRD ${prd.id} has ${content.epics.length} epics`);
          const foundEpic = content.epics.find((e: any) => e.id === epicIdParam);
          if (foundEpic) {
            epic = foundEpic;
            foundPrdId = prd.id;
            console.log(`Found epic ${epicIdParam} in PRD ${prd.id}`);
            break;
          }
        }
      }
      
      if (!epic || !foundPrdId) {
        console.log(`Epic ${epicIdParam} not found in any PRD`);
        return res.status(404).json({ error: "Epic not found" });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

      // Generate a new user story using AI
      const startTime = Date.now();
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: `You are a product management expert. Generate a single user story based on the provided prompt. The user story should fit within the existing epic context and follow best practices.

Return your response as JSON with this exact structure:
{
  "userStory": {
    "id": "story_${Date.now()}",
    "title": "Story title",
    "description": "As a [user], I want [goal] so that [benefit]",
    "priority": "High|Medium|Low",
    "estimatedStoryPoints": number_between_1_and_13,
    "acceptanceCriteria": ["criteria1", "criteria2", "criteria3"]
  }
}

Epic Context: ${epic.title}
Epic Description: ${epic.content?.description || 'No description available'}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
      });

      const processingTime = Date.now() - startTime;
      const result = JSON.parse(response.choices[0].message.content || '{}');
      
      if (!result.userStory) {
        throw new Error("Invalid response format from AI");
      }

      // Add the new user story to the epic's existing user stories
      const currentContent = epic.content || { userStories: [] };
      const updatedUserStories = [...(currentContent.userStories || []), result.userStory];
      
      const updatedContent = {
        ...currentContent,
        userStories: updatedUserStories
      };

      // Update the epic with the new user story
      await storage.updateEpic(epic.id, { 
        content: updatedContent,
        processingTime 
      });

      // Update the PRD epic list to add the new user story
      const targetPrd = await storage.getPrd(foundPrdId);
      if (targetPrd && targetPrd.content && (targetPrd.content as any).epics) {
        const content = targetPrd.content as any;
        const epicIndex = content.epics.findIndex((e: any) => e.id === epicIdParam);
        
        if (epicIndex !== -1) {
          if (!content.epics[epicIndex].userStories) {
            content.epics[epicIndex].userStories = [];
          }
          content.epics[epicIndex].userStories.push(result.userStory);
          await storage.updatePrd(targetPrd.id, { content });
          console.log(`Added user story to epic ${epicIdParam} in PRD ${targetPrd.id}`);
        }
      }

      res.json({ 
        success: true, 
        userStory: result.userStory,
        processingTime 
      });
    } catch (error) {
      console.error("Error adding user story:", error);
      res.status(500).json({ error: "Failed to add user story" });
    }
  });

  // Generate frontend code from epics
  app.post('/api/prds/:id/generate-code', async (req, res) => {
    try {
      const prdId = parseInt(req.params.id);
      if (!prdId || isNaN(prdId)) {
        return res.status(400).json({ error: "Invalid PRD ID" });
      }

      const prd = await storage.getPrd(prdId);
      if (!prd) {
        return res.status(404).json({ error: "PRD not found" });
      }

      // Check if PRD has epics generated
      if (!prd.content || !(prd.content as any).epics) {
        return res.status(400).json({ error: "Please generate epics first before generating code" });
      }

      const epics = (prd.content as any).epics;
      console.log(`Generating complete application for PRD: ${prd.title}`);
      console.log(`Processing ${epics.length} epics with ${epics.reduce((acc: number, epic: any) => acc + (epic.userStories?.length || 0), 0)} user stories`);

      // Generate complete application directly from epics
      const appFiles = generateAppFromEpics(epics, prd.title);
      
      res.json({
        success: true,
        prdId,
        prdTitle: prd.title,
        appName: prd.title,
        components: appFiles.components,
        pages: appFiles.pages,
        hooks: appFiles.hooks,
        utils: appFiles.utils,
        config: appFiles.config,
        packageJson: appFiles.packageJson,
        readme: appFiles.readme,
        deployInstructions: appFiles.deployInstructions
      });

    } catch (error: any) {
      console.error("Error generating frontend code:", error);
      res.status(500).json({ 
        error: "Failed to generate frontend code",
        details: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
