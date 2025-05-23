import OpenAI from "openai";
import { PrdContent } from "@shared/schema";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generatePRDFromConversation(
  conversationText: string,
  options: {
    extractPersonas?: boolean;
    identifyFeatures?: boolean;
    generateAcceptanceCriteria?: boolean;
  } = {}
): Promise<{ title: string; content: PrdContent; processingTime: number }> {
  const startTime = Date.now();

  const systemPrompt = `You are a senior product manager expert at analyzing conversations and generating comprehensive Product Requirements Documents (PRDs). 

Based on the conversation provided, extract key insights and generate a professional PRD with the following structure:

1. **Title**: A clear, descriptive title for the product/feature
2. **Overview**: A comprehensive summary of what was discussed and the main product vision
3. **Goals**: Specific, measurable objectives (3-5 goals)
4. **Features**: Key features with names and detailed descriptions
5. **Technical Requirements**: Technical constraints, platform requirements, security needs, etc.
${options.extractPersonas ? '6. **User Personas**: If mentioned, extract user types with their pain points' : ''}
${options.generateAcceptanceCriteria ? '7. **Acceptance Criteria**: If requested, generate specific acceptance criteria for features' : ''}

Focus on:
- Extracting actual user needs and pain points mentioned
- Identifying specific features or capabilities discussed
- Understanding business goals and success metrics
- Technical constraints or requirements mentioned
- User workflows and use cases

Respond with JSON in this exact format:
{
  "title": "Product/Feature Title",
  "content": {
    "overview": "Detailed overview text",
    "goals": ["Goal 1", "Goal 2", "Goal 3"],
    "features": [
      {
        "name": "Feature Name",
        "description": "Detailed feature description"
      }
    ],
    "technicalRequirements": ["Requirement 1", "Requirement 2"],
    ${options.extractPersonas ? '"userPersonas": [{"name": "Persona Name", "description": "Description", "painPoints": ["Pain 1", "Pain 2"]}],' : ''}
    ${options.generateAcceptanceCriteria ? '"acceptanceCriteria": ["Criteria 1", "Criteria 2"]' : ''}
  }
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: `Please analyze this conversation and generate a comprehensive PRD:\n\n${conversationText}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    const processingTime = Math.round((Date.now() - startTime) / 1000);

    return {
      title: result.title || "Generated PRD",
      content: result.content,
      processingTime,
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to generate PRD: " + (error as Error).message);
  }
}

export async function enhancePRDSection(
  sectionContent: string,
  sectionType: string,
  context: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a product management expert. Enhance the following ${sectionType} section of a PRD. Make it more detailed, professional, and actionable while maintaining the original intent. Context: ${context}`,
        },
        {
          role: "user",
          content: sectionContent,
        },
      ],
      temperature: 0.3,
    });

    return response.choices[0].message.content || sectionContent;
  } catch (error) {
    console.error("Error enhancing PRD section:", error);
    return sectionContent;
  }
}
