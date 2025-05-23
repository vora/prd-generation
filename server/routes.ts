import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generatePRDFromConversation } from "./lib/openai";
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

  const httpServer = createServer(app);
  return httpServer;
}
