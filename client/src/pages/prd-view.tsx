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
  const [generatedApp, setGeneratedApp] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  
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
                  <h3 className="text-lg font-semibold">Complete Application Generator</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Generate a fully functional React application from your {prd.title} epics and user stories
                </p>
                
                <div className="flex gap-4 mb-6">
                  <button 
                    onClick={() => {
                      setGeneratedApp(null);
                      setShowPreview(false);
                      fetch(`/api/prds/${prd.id}/generate-app`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({})
                      })
                      .then(response => response.json())
                      .then(data => {
                        if (data.success) {
                          setGeneratedApp(data);
                          setShowPreview(true);
                          alert(`🎉 SUCCESS! Built "${data.appName}" application!\n\nClick "Preview Your App" to see it in action!`);
                        } else {
                          alert(`Error: ${data.error || 'Failed to generate application'}`);
                        }
                      })
                      .catch(() => {
                        alert('Failed to build application');
                      });
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                  >
                    🚀 Build Complete App
                  </button>

                  {generatedApp && (
                    <button 
                      onClick={() => setShowPreview(!showPreview)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-lg font-medium text-lg transition-colors"
                    >
                      {showPreview ? '📋 Back to PRD' : '👀 Preview Your App'}
                    </button>
                  )}

                  {generatedApp && (
                    <button 
                      onClick={() => {
                        const allFiles = generatedApp.appFiles.allFiles;
                        const zipContent = allFiles.map(file => 
                          `=== ${file.filename} ===\n${file.content}\n`
                        ).join('\n\n');
                        
                        const blob = new Blob([zipContent], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${generatedApp.appName.toLowerCase().replace(/\s+/g, '-')}-complete-app.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        
                        alert(`📦 Downloaded ${generatedApp.filesGenerated} files for your development team!`);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-4 rounded-lg font-medium transition-colors"
                    >
                      📦 Download Code
                    </button>
                  )}
                </div>
                
                <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900 dark:to-green-900 rounded-lg p-6 border">
                  <h4 className="text-xl font-bold mb-4">🏗️ What You'll Get</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-semibold mb-2 text-green-700 dark:text-green-300">📄 Complete Pages</h5>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>✓ Book of Business management</li>
                        <li>✓ Client search and filtering</li>  
                        <li>✓ Policy management interface</li>
                        <li>✓ Dashboard with real metrics</li>
                        <li>✓ User authentication flows</li>
                      </ul>
                    </div>
                    <div>
                      <h5 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">⚙️ Technical Features</h5>
                      <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                        <li>✓ TypeScript + React 18</li>
                        <li>✓ Responsive Tailwind CSS</li>
                        <li>✓ Real state management</li>
                        <li>✓ API integration ready</li>
                        <li>✓ Production deployment guide</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border">
                    <p className="text-sm">
                      <strong>🎯 Perfect for:</strong> Taking directly to your development team, deploying immediately, 
                      or using as the foundation for your production application. Every component is built from 
                      your actual user stories with working functionality.
                    </p>
                  </div>
                </div>
                
                <div className="mt-6 text-sm text-gray-600 dark:text-gray-400">
                  <h4 className="font-medium mb-2">Generated from your user stories:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>"View Book of Business" → Client management interface</li>
                    <li>"Filter Clients" → Search and filtering functionality</li>
                    <li>"Export Client Data" → Export capabilities</li>
                    <li>"Policy Management" → Policy tracking system</li>
                    <li>"Dashboard Overview" → Real-time statistics display</li>
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