import type { Express, Request, Response } from "express";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export function registerConversationRoutes(app: Express) {
  // Analyze conversation and generate contextual prompts
  app.post('/api/conversation/analyze-prompt', async (req: Request, res: Response) => {
    try {
      const { transcript, phase, context } = req.body;

      if (!transcript || transcript.trim().length < 20) {
        return res.status(400).json({ error: "Transcript too short for analysis" });
      }

      console.log(`🧠 Analyzing conversation (${phase} phase) for contextual prompts...`);

      const prompt = `You are an expert product manager conducting a discovery session to generate comprehensive PRDs. 

CURRENT CONVERSATION TRANSCRIPT:
"${transcript}"

CURRENT PHASE: ${phase}
CONTEXT: ${context}

Based on the conversation so far, generate ONE intelligent follow-up question that will:
1. Dig deeper into what's been discussed
2. Uncover missing critical information for a comprehensive PRD
3. Help identify specific user needs, pain points, or technical requirements
4. Move the conversation toward actionable product specifications

ANALYSIS GUIDELINES:
- If they mentioned a problem, ask about impact and frequency
- If they described users, ask about specific workflows and frustrations  
- If they talked about features, ask about success metrics and edge cases
- If they discussed technical aspects, ask about integrations and constraints
- Look for gaps in: user personas, success criteria, technical requirements, business goals

Respond with a single, specific, actionable question that builds on what they've already shared. Make it conversational and natural.

Format: Just return the question with an appropriate emoji prefix (🎯, 🔍, 💡, ⚡, 📊, 🛠️, 👥, etc.)`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert product discovery facilitator. Generate intelligent, contextual questions that drive comprehensive PRD development."
          },
          {
            role: "user", 
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      const generatedPrompt = response.choices[0].message.content?.trim();
      
      if (!generatedPrompt) {
        throw new Error("Failed to generate prompt");
      }

      console.log(`✅ Generated contextual prompt: ${generatedPrompt}`);

      res.json({ 
        prompt: generatedPrompt,
        analysis: {
          phase,
          transcriptLength: transcript.length,
          wordCount: transcript.split(' ').length
        }
      });

    } catch (error: any) {
      console.error("❌ Error generating contextual prompt:", error);
      res.status(500).json({ 
        error: "Failed to generate contextual prompt",
        details: error.message 
      });
    }
  });

  // Analyze conversation for insights and themes
  app.post('/api/conversation/analyze-insights', async (req: Request, res: Response) => {
    try {
      const { transcript } = req.body;

      if (!transcript || transcript.trim().length < 100) {
        return res.status(400).json({ error: "Transcript too short for insights analysis" });
      }

      console.log(`🔍 Analyzing conversation for insights and themes...`);

      const prompt = `Analyze this product discovery conversation and extract key insights:

CONVERSATION:
"${transcript}"

Provide a structured analysis in JSON format:
{
  "keyThemes": ["theme1", "theme2", "theme3"],
  "userPersonas": [{"name": "persona", "needs": ["need1", "need2"]}],
  "painPoints": ["pain1", "pain2"],
  "businessGoals": ["goal1", "goal2"],
  "technicalRequirements": ["req1", "req2"],
  "missingInformation": ["missing1", "missing2"],
  "suggestedNextSteps": ["step1", "step2"]
}

Focus on actionable insights that would help create a comprehensive PRD.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are an expert at analyzing product discovery conversations. Extract structured insights that help build comprehensive PRDs."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 800,
        temperature: 0.3
      });

      const insights = JSON.parse(response.choices[0].message.content || "{}");
      
      console.log(`✅ Generated conversation insights`);

      res.json({ 
        insights,
        metadata: {
          transcriptLength: transcript.length,
          wordCount: transcript.split(' ').length,
          analysisTimestamp: new Date().toISOString()
        }
      });

    } catch (error: any) {
      console.error("❌ Error analyzing conversation insights:", error);
      res.status(500).json({ 
        error: "Failed to analyze conversation insights",
        details: error.message 
      });
    }
  });
}