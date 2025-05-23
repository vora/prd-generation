import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Clock } from "lucide-react";

interface SimpleCodeGeneratorProps {
  prdId: number;
  prdTitle: string;
  hasEpics: boolean;
}

export default function SimpleCodeGenerator({ prdId, prdTitle, hasEpics }: SimpleCodeGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(`/api/prds/${prdId}/generate-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log("Generated code:", data);
        alert(`Successfully generated ${data.components?.length || 0} components!`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  if (!hasEpics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            Frontend Code Generator
          </CardTitle>
          <CardDescription>
            Generate working React application from your epics and user stories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-muted-foreground mb-4">
              Please generate epics first before creating frontend code
            </div>
            <div className="text-sm text-muted-foreground">
              Epics provide the structure needed to create meaningful components and pages
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Code className="h-5 w-5" />
          Frontend Code Generator
        </CardTitle>
        <CardDescription>
          Generate a complete React TypeScript application with real functionality
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleGenerate}
            disabled={isGenerating}
            size="lg"
          >
            {isGenerating ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Generating Code...
              </>
            ) : (
              <>
                <Code className="mr-2 h-4 w-4" />
                Generate Frontend Code
              </>
            )}
          </Button>
        </div>
        
        <div className="mt-4 text-sm text-muted-foreground">
          This will create a complete React application based on your epics and user stories:
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>React TypeScript components</li>
            <li>Complete pages with routing</li>
            <li>Real functionality (no mock data)</li>
            <li>Tailwind CSS styling</li>
            <li>Package.json with dependencies</li>
            <li>README with setup instructions</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}