import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Code, Download, FileText, Package, Zap, Clock, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface CodeGeneratorProps {
  prdId: number;
  prdTitle: string;
  hasEpics: boolean;
}

interface GeneratedComponent {
  name: string;
  filename: string;
  code: string;
  type: 'component' | 'page' | 'hook' | 'api';
  dependencies: string[];
}

interface CodeGenerationResult {
  components: GeneratedComponent[];
  packageJson: any;
  readme: string;
  processingTime: number;
}

export default function CodeGenerator({ prdId, prdTitle, hasEpics }: CodeGeneratorProps) {
  const [generatedCode, setGeneratedCode] = useState<CodeGenerationResult | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/prds/${prdId}/generate-code`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      setGeneratedCode(data);
      toast({
        title: "Frontend code generated successfully!",
        description: `Generated ${data.components.length} components in ${data.processingTime}ms`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating code",
        description: error.message || "Failed to generate frontend code",
        variant: "destructive",
      });
    },
  });

  const downloadProject = () => {
    if (!generatedCode) return;

    // Create a zip-like structure for download
    const projectFiles = {
      'package.json': JSON.stringify(generatedCode.packageJson, null, 2),
      'README.md': generatedCode.readme,
      ...generatedCode.components.reduce((acc, comp) => {
        acc[`src/${comp.filename}`] = comp.code;
        return acc;
      }, {} as Record<string, string>)
    };

    // Create downloadable content
    const content = Object.entries(projectFiles)
      .map(([filename, content]) => `=== ${filename} ===\n${content}\n`)
      .join('\n\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prdTitle.toLowerCase().replace(/\s+/g, '-')}-frontend-code.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getComponentTypeIcon = (type: string) => {
    switch (type) {
      case 'component': return <Code className="h-4 w-4" />;
      case 'page': return <FileText className="h-4 w-4" />;
      case 'hook': return <Zap className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getComponentTypeColor = (type: string) => {
    switch (type) {
      case 'component': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'page': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'hook': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
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
    <div className="space-y-6">
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
              onClick={() => generateCodeMutation.mutate()}
              disabled={generateCodeMutation.isPending}
              size="lg"
            >
              {generateCodeMutation.isPending ? (
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
            
            {generatedCode && (
              <Button onClick={downloadProject} variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Download Project
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {generatedCode && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generated Application: {prdTitle}
            </CardTitle>
            <CardDescription>
              Generated {generatedCode.components.length} files in {generatedCode.processingTime}ms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="components">Components</TabsTrigger>
                <TabsTrigger value="package">Package.json</TabsTrigger>
                <TabsTrigger value="readme">README</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {generatedCode.components.filter(c => c.type === 'component').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Components</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {generatedCode.components.filter(c => c.type === 'page').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Pages</div>
                  </div>
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {generatedCode.components.filter(c => c.type === 'hook').length}
                    </div>
                    <div className="text-sm text-muted-foreground">Custom Hooks</div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-semibold">Generated Files:</h4>
                  <div className="grid gap-2">
                    {generatedCode.components.map((component, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getComponentTypeIcon(component.type)}
                          <span className="font-mono text-sm">{component.filename}</span>
                          <Badge className={getComponentTypeColor(component.type)}>
                            {component.type}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {component.code.split('\n').length} lines
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="components" className="space-y-4">
                <div className="space-y-4">
                  {generatedCode.components.map((component, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          {getComponentTypeIcon(component.type)}
                          {component.filename}
                          <Badge className={getComponentTypeColor(component.type)}>
                            {component.type}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ScrollArea className="h-64 w-full border rounded-md">
                          <pre className="p-4 text-sm">
                            <code>{component.code}</code>
                          </pre>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="package" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>package.json</CardTitle>
                    <CardDescription>Project dependencies and configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full border rounded-md">
                      <pre className="p-4 text-sm">
                        <code>{JSON.stringify(generatedCode.packageJson, null, 2)}</code>
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="readme" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>README.md</CardTitle>
                    <CardDescription>Project documentation and setup instructions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-64 w-full border rounded-md">
                      <pre className="p-4 text-sm whitespace-pre-wrap">
                        {generatedCode.readme}
                      </pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}