import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CloudUpload, FileText, X, AlertCircle, Loader2 } from "lucide-react";
import { cn, formatFileSize } from "@/lib/utils";

interface UploadedFile extends File {
  id: string;
}

interface FileUploadProps {
  onPRDGenerated: (prd: any) => void;
}

export default function FileUpload({ onPRDGenerated }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingOptions, setProcessingOptions] = useState({
    extractPersonas: true,
    identifyFeatures: true,
    generateAcceptanceCriteria: false,
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      ...file,
      id: Math.random().toString(36).substr(2, 9),
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    setError(null);
  }, []);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false, // For simplicity, allow only one file at a time
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const generatePRD = async () => {
    if (uploadedFiles.length === 0) {
      setError("Please upload at least one file before generating PRD");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', uploadedFiles[0]);
      formData.append('extractPersonas', processingOptions.extractPersonas.toString());
      formData.append('identifyFeatures', processingOptions.identifyFeatures.toString());
      formData.append('generateAcceptanceCriteria', processingOptions.generateAcceptanceCriteria.toString());

      const response = await fetch('/api/prds/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate PRD');
      }

      const result = await response.json();
      onPRDGenerated(result.prd);
      
      // Clear uploaded files after successful generation
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error generating PRD:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate PRD');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
      <CardContent className="p-8">
        <div className="mb-8">
          <h3 className="text-3xl font-bold text-foreground mb-3 tracking-tight">Upload Conversation</h3>
          <p className="text-muted-foreground text-lg">Support for TXT, PDF, and DOCX formats up to 10MB</p>
        </div>

        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer backdrop-blur-sm",
            isDragActive 
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
              : "border-border hover:border-primary/50 hover:bg-card/30",
            isProcessing && "pointer-events-none opacity-50"
          )}
        >
          <input {...getInputProps()} />
          <div className="mb-6">
            <CloudUpload className="w-16 h-16 text-muted-foreground mx-auto" />
          </div>
          <h4 className="text-2xl font-bold text-foreground mb-3">
            {isDragActive ? "Drop your files here" : "Drop your files here"}
          </h4>
          <p className="text-muted-foreground mb-6 text-lg">or click to browse</p>
          <Button variant="outline" disabled={isProcessing} className="bg-card/50 border-border hover:bg-card/80 hover:border-primary/50">
            <FileText className="w-5 h-5 mr-2" />
            Choose Files
          </Button>
        </div>

        {/* File Rejections */}
        {fileRejections.length > 0 && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              {fileRejections[0].errors[0].message}
            </AlertDescription>
          </Alert>
        )}

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Uploaded Files List */}
        {uploadedFiles.length > 0 && (
          <div className="mt-6 space-y-3">
            {uploadedFiles.map((file) => (
              <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-slate-800">{file.name}</p>
                    <p className="text-sm text-slate-600">{formatFileSize(file.size)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Ready
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    disabled={isProcessing}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processing Options */}
        <div className="mt-10 space-y-6">
          <h4 className="font-bold text-foreground text-xl">Processing Options</h4>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="extractPersonas"
                checked={processingOptions.extractPersonas}
                onCheckedChange={(checked) => 
                  setProcessingOptions(prev => ({ ...prev, extractPersonas: !!checked }))
                }
                disabled={isProcessing}
              />
              <label htmlFor="extractPersonas" className="text-foreground cursor-pointer font-medium">
                Extract user personas and pain points
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="identifyFeatures"
                checked={processingOptions.identifyFeatures}
                onCheckedChange={(checked) => 
                  setProcessingOptions(prev => ({ ...prev, identifyFeatures: !!checked }))
                }
                disabled={isProcessing}
              />
              <label htmlFor="identifyFeatures" className="text-foreground cursor-pointer font-medium">
                Identify feature requirements
              </label>
            </div>
            <div className="flex items-center space-x-3">
              <Checkbox
                id="generateAcceptanceCriteria"
                checked={processingOptions.generateAcceptanceCriteria}
                onCheckedChange={(checked) => 
                  setProcessingOptions(prev => ({ ...prev, generateAcceptanceCriteria: !!checked }))
                }
                disabled={isProcessing}
              />
              <label htmlFor="generateAcceptanceCriteria" className="text-foreground cursor-pointer font-medium">
                Generate acceptance criteria
              </label>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button 
          className="w-full mt-10 bg-primary hover:bg-primary/90 text-primary-foreground py-6 text-xl font-bold rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
          onClick={generatePRD}
          disabled={isProcessing || uploadedFiles.length === 0}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Generating PRD...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5 mr-2" />
              Generate PRD
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
