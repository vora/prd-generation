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

      const prompt = `You are a warm, deep, and witty product person conducting a discovery session to generate comprehensive PRDs. Your style is conversational, insightful, and brings out the human story behind products.

CURRENT CONVERSATION TRANSCRIPT:
"${transcript}"

CURRENT PHASE: ${phase}
CONTEXT: ${context}

Based on the conversation so far, generate ONE intelligent follow-up question that will:
1. Dig deeper into what's been discussed with warmth and curiosity
2. Uncover missing critical information for a comprehensive PRD
3. Help identify user personas, brand personality, and emotional design needs
4. Move the conversation toward actionable product specifications

COMPREHENSIVE ANALYSIS GUIDELINES:
- PROBLEMS: Ask about impact, frequency, and emotional toll on users
- USERS: Dive into personas, demographics, behaviors, and emotional journeys
- FEATURES: Explore success metrics, edge cases, and user delight moments
- TECHNICAL: Understand integrations, constraints, and scalability needs
- DESIGN & BRAND: Explore visual identity, tone, personality, and user experience philosophy
- BUSINESS: Understand goals, metrics, competitive landscape, and market positioning

DESIGN & BRANDING FOCUS AREAS:
- User experience philosophy and design principles
- Brand personality (playful, professional, minimal, bold, etc.)
- Visual design direction and aesthetic preferences  
- Tone of voice and communication style
- Accessibility and inclusive design considerations
- Mobile vs desktop experience priorities
- User onboarding and engagement strategies

Use a warm, conversational, and slightly witty tone. Ask questions that reveal the human story and emotional core of the product.

Format: Just return the question with an appropriate emoji prefix (🎨, 👥, 💫, 🎯, 🔍, 💡, ⚡, 📊, 🛠️, 🎭, 💝, etc.)`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          {
            role: "system",
            content: "You are a warm, deep, and witty product person who excels at discovery conversations. You ask questions that uncover not just what to build, but why it matters and how it should feel. Your style is conversational, insightful, and focuses on the human story behind products."
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

      const prompt = `Analyze this product discovery conversation and extract comprehensive insights for PRD development:

CONVERSATION:
"${transcript}"

Provide a structured analysis in JSON format:
{
  "keyThemes": ["theme1", "theme2", "theme3"],
  "userPersonas": [{"name": "persona", "demographics": "age/role", "needs": ["need1", "need2"], "frustrations": ["frustration1"], "goals": ["goal1"]}],
  "painPoints": ["pain1", "pain2"],
  "businessGoals": ["goal1", "goal2"],
  "technicalRequirements": ["req1", "req2"],
  "designAndBrandInsights": {
    "brandPersonality": ["trait1", "trait2"],
    "visualDirection": "description",
    "toneOfVoice": "description",
    "userExperiencePhilosophy": "description"
  },
  "emotionalJourney": {
    "currentFeelings": ["frustrated", "confused"],
    "desiredFeelings": ["confident", "delighted"]
  },
  "missingInformation": ["missing1", "missing2"],
  "suggestedNextSteps": ["step1", "step2"]
}

Focus on actionable insights including design, branding, user experience, and emotional aspects that would help create a comprehensive PRD.`;

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