import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Edit, Share2, Check, FileText } from "lucide-react";
import { formatDate, generatePDF, downloadBlob } from "@/lib/utils";
import type { Prd, PrdContent } from "@shared/schema";

interface PRDPreviewProps {
  prd: Prd | null;
}

export default function PRDPreview({ prd }: PRDPreviewProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (!prd) {
    return (
      <Card className="w-full h-96 flex items-center justify-center bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="text-center">
          <div className="text-muted-foreground mb-6">
            <FileText className="w-20 h-20 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-3">No PRD Generated</h3>
          <p className="text-muted-foreground text-lg">Upload a conversation file to generate your first PRD</p>
        </CardContent>
      </Card>
    );
  }

  const content = prd.content as PrdContent;

  const handleDownload = () => {
    const prdText = generatePRDText(prd.title, content);
    const blob = generatePDF(prdText, prd.title);
    downloadBlob(blob, `${prd.title.toLowerCase().replace(/\s+/g, '-')}-prd.txt`);
  };

  const handleEdit = () => {
    setIsEditing(!isEditing);
    // In a real app, this would open an editor modal or inline editing
    alert('PRD editor would open here');
  };

  const handleShare = () => {
    // In a real app, this would open share options
    alert('Share options would open here');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-semibold text-slate-800 mb-2">Generated PRD</h3>
          <div className="flex items-center space-x-4">
            <Badge className={`${getStatusColor(prd.status)} border-0`}>
              <Check className="w-3 h-3 mr-1" />
              {prd.status.charAt(0).toUpperCase() + prd.status.slice(1)}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Generated in {prd.processingTime || 0} seconds
            </span>
          </div>
        </div>

        {/* PRD Document */}
        <Card className="border border-border bg-card/30 backdrop-blur-sm">
          <ScrollArea className="h-96">
            {/* PRD Header */}
            <div className="p-6 border-b border-border">
              <h4 className="text-2xl font-bold text-foreground mb-3">{prd.title}</h4>
              <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
                <span>Created: {formatDate(prd.createdAt)}</span>
                <span>• Version: 1.0</span>
                <span>• Status: {prd.status}</span>
                {prd.originalFileName && (
                  <span>• Source: {prd.originalFileName}</span>
                )}
              </div>
            </div>

            {/* PRD Sections */}
            <div className="p-6 space-y-6">
              {/* Overview */}
              <section>
                <h5 className="font-bold text-foreground mb-3 text-lg">Overview</h5>
                <p className="text-muted-foreground leading-relaxed">
                  {content.overview}
                </p>
              </section>

              {/* Goals */}
              <section>
                <h5 className="font-bold text-foreground mb-3 text-lg">Goals</h5>
                <ul className="text-muted-foreground space-y-2">
                  {content.goals.map((goal, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-primary mr-2">•</span>
                      {goal}
                    </li>
                  ))}
                </ul>
              </section>

              {/* Key Features */}
              <section>
                <h5 className="font-bold text-foreground mb-3 text-lg">Key Features</h5>
                <div className="space-y-3">
                  {content.features.map((feature, index) => (
                    <div key={index} className="p-4 bg-muted/30 rounded-xl border border-border">
                      <h6 className="font-semibold text-foreground mb-1">{feature.name}</h6>
                      <p className="text-muted-foreground">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Technical Requirements */}
              <section>
                <h5 className="font-bold text-foreground mb-3 text-lg">Technical Requirements</h5>
                <ul className="text-muted-foreground space-y-2">
                  {content.technicalRequirements.map((req, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-accent mr-2">•</span>
                      {req}
                    </li>
                  ))}
                </ul>
              </section>

              {/* User Personas (if available) */}
              {content.userPersonas && content.userPersonas.length > 0 && (
                <section>
                  <h5 className="font-semibold text-slate-800 mb-2">User Personas</h5>
                  <div className="space-y-3">
                    {content.userPersonas.map((persona, index) => (
                      <div key={index} className="p-3 bg-blue-50 rounded">
                        <h6 className="font-medium text-slate-700">{persona.name}</h6>
                        <p className="text-sm text-slate-600 mb-2">{persona.description}</p>
                        {persona.painPoints && persona.painPoints.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-slate-700 mb-1">Pain Points:</p>
                            <ul className="text-xs text-slate-600">
                              {persona.painPoints.map((pain, painIndex) => (
                                <li key={painIndex}>• {pain}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Acceptance Criteria (if available) */}
              {content.acceptanceCriteria && content.acceptanceCriteria.length > 0 && (
                <section>
                  <h5 className="font-semibold text-slate-800 mb-2">Acceptance Criteria</h5>
                  <ul className="text-slate-600 text-sm space-y-1">
                    {content.acceptanceCriteria.map((criteria, index) => (
                      <li key={index}>• {criteria}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button 
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download PRD
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 font-semibold py-3 rounded-xl bg-card/50 border-border hover:bg-card/80 hover:border-primary/50"
            onClick={handleEdit}
          >
            <Edit className="w-5 h-5 mr-2" />
            Edit PRD
          </Button>
          <Button 
            variant="outline"
            className="py-3 rounded-xl bg-card/50 border-border hover:bg-card/80 hover:border-primary/50"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function generatePRDText(title: string, content: PrdContent): string {
  let text = `${title}\n${'='.repeat(title.length)}\n\n`;
  
  text += `Overview\n--------\n${content.overview}\n\n`;
  
  text += `Goals\n-----\n`;
  content.goals.forEach(goal => {
    text += `• ${goal}\n`;
  });
  text += '\n';
  
  text += `Key Features\n------------\n`;
  content.features.forEach(feature => {
    text += `${feature.name}\n${feature.description}\n\n`;
  });
  
  text += `Technical Requirements\n---------------------\n`;
  content.technicalRequirements.forEach(req => {
    text += `• ${req}\n`;
  });
  text += '\n';
  
  if (content.userPersonas && content.userPersonas.length > 0) {
    text += `User Personas\n-------------\n`;
    content.userPersonas.forEach(persona => {
      text += `${persona.name}\n${persona.description}\n`;
      if (persona.painPoints && persona.painPoints.length > 0) {
        text += 'Pain Points:\n';
        persona.painPoints.forEach(pain => {
          text += `• ${pain}\n`;
        });
      }
      text += '\n';
    });
  }
  
  if (content.acceptanceCriteria && content.acceptanceCriteria.length > 0) {
    text += `Acceptance Criteria\n------------------\n`;
    content.acceptanceCriteria.forEach(criteria => {
      text += `• ${criteria}\n`;
    });
  }
  
  return text;
}
