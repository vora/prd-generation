import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, downloadBlob, generatePDF } from "@/lib/utils";
import PRDPreview from "@/components/prd-preview-new";
import EpicGenerator from "@/components/epic-generator";
import SimpleCodeGenerator from "@/components/simple-code-generator";
import type { Prd } from "@shared/schema";

export default function PRDView() {
  const [, params] = useRoute("/prd/:id");
  const [activeTab, setActiveTab] = useState("prd");
  const [, setLocation] = useLocation();
  
  const { data: prds, isLoading } = useQuery<Prd[]>({
    queryKey: ['/api/prds'],
  });
  
  const prd = prds?.find(p => p.id.toString() === params?.id);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading PRD...</p>
        </div>
      </div>
    );
  }
  
  if (!prd) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">PRD Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested PRD could not be found.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => setLocation("/")}
            className="mb-0"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
      
      {/* Content with tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-8">
          <div className="flex items-center space-x-4 mb-6">
            <Button
              variant={activeTab === "prd" ? "default" : "outline"}
              onClick={() => setActiveTab("prd")}
            >
              PRD Overview
            </Button>
            <Button
              variant={activeTab === "epics" ? "default" : "outline"}
              onClick={() => setActiveTab("epics")}
            >
              Epics & User Stories
            </Button>
            <Button
              variant={activeTab === "code" ? "default" : "outline"}
              onClick={() => setActiveTab("code")}
            >
              Frontend Code
            </Button>
          </div>

          {activeTab === "prd" && <PRDPreview prd={prd} />}
          {activeTab === "epics" && (
            <EpicGenerator prdId={prd.id} prdTitle={prd.title} />
          )}
          {activeTab === "code" && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-5 w-5 bg-blue-500 rounded"></div>
                  <h3 className="text-lg font-semibold">Frontend Code Generator</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Generate a complete React TypeScript application from your epics and user stories
                </p>
                
                {true ? (
                  <button 
                    onClick={async () => {
                      try {
                        const response = await fetch(`/api/prds/${prd.id}/generate-code`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({})
                        });
                        
                        const data = await response.json();
                        if (response.ok && data.success) {
                          alert(`🎉 Success! Generated ${data.components?.length || 0} components for your ${data.prdTitle} application!\n\nComponents created:\n${data.components?.map(c => `- ${c.filename}`).join('\n') || 'Multiple components'}`);
                        } else {
                          alert(`Error: ${data.error || 'Unknown error occurred'}`);
                        }
                      } catch (error) {
                        alert('Failed to generate code. Please try again.');
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    🚀 Generate Frontend Code
                  </button>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p className="mb-2">Please generate epics first</p>
                    <p className="text-sm">Epics provide the structure needed to create meaningful components</p>
                  </div>
                )}
                
                <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                  <h4 className="font-medium mb-2">What you'll get:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Complete React TypeScript components</li>
                    <li>Pages with proper routing</li>
                    <li>Real functionality based on your user stories</li>
                    <li>Tailwind CSS styling</li>
                    <li>Package.json with all dependencies</li>
                    <li>README with setup instructions</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}