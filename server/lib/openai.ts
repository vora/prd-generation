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

## REQUIRED PRD SECTIONS:
1. **Title**: A clear, descriptive title for the product/feature
2. **Purpose and Vision**: Clear statement of product purpose and long-term vision
3. **Scope**: What is explicitly in-scope and out-of-scope for this product/feature
4. **Target Users and Personas**: Detailed user segments with characteristics and needs
5. **Core Features**: Detailed feature specifications with priority levels (P0, P1, P2)
6. **UI/UX Aspirations**: Style, tone, and user experience goals (if mentioned in conversation)
7. **Non-Functional Requirements**: Performance, reliability, scalability, security requirements
8. **Assumptions**: Key assumptions being made about users, market, technology, etc.
9. **Dependencies**: Technical, business, or external dependencies that could impact delivery
10. **Risks and Mitigations**: Potential risks and proposed mitigation strategies
11. **Success Metrics**: Specific, measurable criteria for determining product success
12. **Future Roadmap**: Value-added features and enhancements for future releases

## ANALYSIS FOCUS:
- Extract actual user needs, pain points, and desired outcomes
- Identify core vs. nice-to-have features with clear prioritization
- Understand business goals, constraints, and success metrics
- Map out complete user workflows and edge cases
- Identify technical constraints, dependencies, and integration points
- Consider scalability, security, and maintainability requirements
- Anticipate future enhancements and extensibility needs

## QUALITY STANDARDS:
- Use only information from the conversation - no assumptions beyond what's discussed
- If anything is unclear or not mentioned, mark it with [NEEDS CLARITY]
- Features should be specific, actionable, and measurable
- All requirements should trace back to user value
- Format with proper headings and bullet points where appropriate
- Be comprehensive but concise

Respond with JSON in this exact format:
{
  "title": "Product/Feature Title",
  "content": {
    "purposeAndVision": "Clear statement of product purpose and long-term vision",
    "scope": {
      "inScope": ["What is included in this product/feature"],
      "outOfScope": ["What is explicitly excluded"]
    },
    "targetUsersAndPersonas": [
      {
        "name": "Persona Name",
        "description": "Detailed persona description",
        "characteristics": ["Key characteristics"],
        "needs": ["Primary needs and pain points"]
      }
    ],
    "coreFeatures": [
      {
        "name": "Feature Name",
        "description": "Detailed feature description including user value",
        "priority": "P0|P1|P2",
        "userStory": "As a [user], I want [capability] so that [benefit]"
      }
    ],
    "uiUxAspirations": {
      "style": "[NEEDS CLARITY] if not mentioned",
      "tone": "[NEEDS CLARITY] if not mentioned",
      "userExperience": "Description of desired user experience goals"
    },
    "nonFunctionalRequirements": [
      {
        "type": "Performance|Reliability|Scalability|Security",
        "requirement": "Specific requirement",
        "rationale": "Why this is needed"
      }
    ],
    "assumptions": ["Key assumptions about users, market, technology, etc."],
    "dependencies": [
      {
        "type": "Technical|Business|External",
        "dependency": "Description of dependency",
        "impact": "How this could affect delivery"
      }
    ],
    "risksAndMitigations": [
      {
        "risk": "Description of potential risk",
        "impact": "High|Medium|Low",
        "mitigation": "Proposed mitigation strategy"
      }
    ],
    "successMetrics": [
      {
        "metric": "Specific measurable metric",
        "target": "Target value or outcome",
        "timeframe": "When this should be achieved"
      }
    ],
    "futureRoadmap": [
      {
        "name": "Future feature name",
        "description": "Value-added capability for future releases",
        "businessValue": "Expected business impact",
        "timeframe": "Estimated timeline"
      }
    ]
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

export async function generateEpicsFromPRD(
  prdContent: PrdContent,
  prdTitle: string
): Promise<{ title: string; content: any; processingTime: number }> {
  const startTime = Date.now();
  
  const prompt = `As a product manager, analyze this PRD and generate comprehensive epics and user stories.

PRD Title: ${prdTitle}

PRD Content: ${JSON.stringify(prdContent, null, 2)}

Generate 3-5 epics that break down the work into manageable chunks. For each epic, include:
1. Title and description
2. Priority (high/medium/low)
3. Estimated effort (1-2 weeks, 2-4 weeks, etc.)
4. 3-5 user stories with:
   - Title and description
   - Priority (high/medium/low)
   - Status (todo/in-progress/done)
   - Acceptance criteria (3-5 items)
   - Estimated story points (1-13)

Return JSON in this exact format:
{
  "epics": [
    {
      "id": "epic-1",
      "title": "Epic Title",
      "description": "Epic description",
      "priority": "high",
      "estimatedEffort": "2-4 weeks",
      "goals": ["Goal 1", "Goal 2"],
      "userStories": [
        {
          "id": "story-1",
          "title": "User Story Title",
          "description": "As a [user], I want [goal] so that [benefit]",
          "priority": "high",
          "status": "todo",
          "acceptanceCriteria": ["Criteria 1", "Criteria 2"],
          "estimatedStoryPoints": 5
        }
      ]
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: "You are an expert product manager who creates detailed epics and user stories. Always respond with valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = JSON.parse(response.choices[0].message.content || "{}");
    const processingTime = Date.now() - startTime;

    return {
      title: `Epics for ${prdTitle}`,
      content,
      processingTime
    };
  } catch (error) {
    console.error("Error generating epics:", error);
    throw new Error("Failed to generate epics from PRD");
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
