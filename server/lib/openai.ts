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

Based on the conversation provided, extract key insights and generate a professional, detailed PRD with the following comprehensive structure:

## CORE SECTIONS:
1. **Title**: A clear, descriptive title for the product/feature
2. **Overview**: Executive summary of the product vision, business context, and key value proposition
3. **Goals & Success Metrics**: Specific, measurable business objectives with KPIs where possible
4. **Core Features**: Detailed feature specifications with priority levels (P0, P1, P2)
5. **Technical Requirements**: Architecture, platform, security, performance, scalability needs
6. **User Experience & Workflows**: Key user journeys and interaction patterns
7. **Acceptance Criteria**: Specific, testable criteria for each core feature
8. **Non-Functional Requirements**: Performance, security, accessibility, compliance standards
9. **Future Roadmap**: Value-added features and enhancements for future releases
${options.extractPersonas ? '10. **User Personas**: User segments with needs, pain points, and behaviors' : ''}

## ANALYSIS FOCUS:
- Extract actual user needs, pain points, and desired outcomes
- Identify core vs. nice-to-have features with clear prioritization
- Understand business goals, constraints, and success metrics
- Map out complete user workflows and edge cases
- Identify technical constraints, dependencies, and integration points
- Consider scalability, security, and maintainability requirements
- Anticipate future enhancements and extensibility needs

## QUALITY STANDARDS:
- Features should be specific, actionable, and measurable
- Acceptance criteria should be testable and unambiguous  
- Technical requirements should address scalability and security
- Future features should align with core product vision
- All requirements should trace back to user value

Respond with JSON in this exact format:
{
  "title": "Product/Feature Title",
  "content": {
    "overview": "Comprehensive executive summary including business context, target users, and core value proposition",
    "goals": [
      {
        "objective": "Specific business goal",
        "metric": "How success will be measured",
        "target": "Specific target value or outcome"
      }
    ],
    "features": [
      {
        "name": "Feature Name",
        "description": "Detailed feature description including user value",
        "priority": "P0|P1|P2",
        "userStory": "As a [user], I want [capability] so that [benefit]"
      }
    ],
    "technicalRequirements": [
      {
        "category": "Architecture|Platform|Security|Performance|Integration",
        "requirement": "Specific technical need",
        "rationale": "Why this is needed"
      }
    ],
    "userWorkflows": [
      {
        "workflow": "Workflow name",
        "steps": ["Step 1", "Step 2", "Step 3"],
        "painPoints": ["Current pain point addressed"]
      }
    ],
    "acceptanceCriteria": [
      {
        "feature": "Feature name",
        "criteria": ["Given [context], when [action], then [outcome]"]
      }
    ],
    "nonFunctionalRequirements": [
      {
        "type": "Performance|Security|Accessibility|Compliance",
        "requirement": "Specific requirement",
        "standard": "Measurable standard or benchmark"
      }
    ],
    "futureEnhancements": [
      {
        "name": "Future feature name",
        "description": "Value-added capability for future releases",
        "businessValue": "Expected business impact",
        "timeframe": "Estimated timeline (Phase 2, Q2 2025, etc.)"
      }
    ]${options.extractPersonas ? ',\n    "userPersonas": [{"name": "Persona Name", "description": "Detailed persona description", "painPoints": ["Pain 1", "Pain 2"], "goals": ["Goal 1", "Goal 2"], "behaviors": ["Behavior 1", "Behavior 2"]}]' : ''}
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
