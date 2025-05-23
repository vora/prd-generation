import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePRDFromConversation, generateEpicsFromPRD } from "./lib/openai";
import { generateCompleteApp } from "./lib/realCodeGenerator";
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

      const result = await generateCompleteApp(epics, prd.title);

      res.json({
        success: true,
        prdId,
        prdTitle: prd.title,
        ...result
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
