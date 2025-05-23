import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { Prd } from "@shared/schema";
import { generatePDF, downloadBlob } from "@/lib/utils";

interface PRDPreviewProps {
  prd: Prd | null;
}

export default function PRDPreview({ prd }: PRDPreviewProps) {
  if (!prd) {
    return (
      <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
        <CardContent className="p-8 text-center">
          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-foreground mb-3">No PRD Generated</h3>
          <p className="text-muted-foreground text-lg">Upload a conversation file to generate a Product Requirements Document</p>
        </CardContent>
      </Card>
    );
  }

  const handleDownload = () => {
    const content = generatePRDText(prd.title, prd.content);
    const blob = generatePDF(content, prd.title);
    downloadBlob(blob, `${prd.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`);
  };

  return (
    <Card className="w-full bg-card/50 backdrop-blur-sm border-border">
      <CardHeader className="border-b border-border bg-card/30">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-foreground">{prd.title}</CardTitle>
            <p className="text-muted-foreground mt-2">Generated PRD with comprehensive analysis</p>
          </div>
          <Button onClick={handleDownload} className="bg-primary hover:bg-primary/90">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-8">
        <div className="prose prose-lg max-w-none space-y-8">
          {/* Purpose and Vision */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Purpose and Vision</h2>
            <p className="text-foreground/80 leading-relaxed">{prd.content.purposeAndVision}</p>
          </section>

          {/* Scope */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Scope</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-lg mb-3 text-green-700">In Scope</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {prd.content.scope.inScope.map((item, index) => (
                    <li key={index} className="text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg mb-3 text-red-700">Out of Scope</h3>
                <ul className="list-disc pl-6 space-y-1">
                  {prd.content.scope.outOfScope.map((item, index) => (
                    <li key={index} className="text-muted-foreground">{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Target Users and Personas */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Target Users and Personas</h2>
            <div className="space-y-6">
              {prd.content.targetUsersAndPersonas.map((persona, index) => (
                <Card key={index} className="bg-muted/50">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2 text-foreground">{persona.name}</h3>
                    <p className="text-foreground/80 mb-4">{persona.description}</p>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-medium mb-2 text-foreground">Characteristics:</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          {persona.characteristics.map((char, charIndex) => (
                            <li key={charIndex} className="text-foreground/75 text-sm">{char}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2 text-foreground">Needs:</h4>
                        <ul className="list-disc pl-6 space-y-1">
                          {persona.needs.map((need, needIndex) => (
                            <li key={needIndex} className="text-foreground/75 text-sm">{need}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Core Features */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Core Features</h2>
            <div className="space-y-4">
              {prd.content.coreFeatures.map((feature, index) => (
                <Card key={index} className="border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-foreground">{feature.name}</h3>
                      <Badge variant={
                        feature.priority === 'P0' ? 'destructive' :
                        feature.priority === 'P1' ? 'default' : 'secondary'
                      }>
                        {feature.priority}
                      </Badge>
                    </div>
                    <p className="text-foreground/80 mb-3">{feature.description}</p>
                    <p className="text-sm text-primary italic">{feature.userStory}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* UI/UX Aspirations */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">UI/UX Aspirations</h2>
            <Card className="bg-accent/10">
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Style:</h4>
                    <p className="text-foreground/80">{prd.content.uiUxAspirations.style}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">Tone:</h4>
                    <p className="text-foreground/80">{prd.content.uiUxAspirations.tone}</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2 text-foreground">User Experience:</h4>
                    <p className="text-foreground/80">{prd.content.uiUxAspirations.userExperience}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Non-Functional Requirements */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Non-Functional Requirements</h2>
            <div className="space-y-4">
              {prd.content.nonFunctionalRequirements.map((req, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="outline">{req.type}</Badge>
                    </div>
                    <p className="text-foreground/80 mb-2">{req.requirement}</p>
                    <p className="text-sm text-foreground/70 italic">Rationale: {req.rationale}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Assumptions */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Assumptions</h2>
            <ul className="list-disc pl-6 space-y-2">
              {prd.content.assumptions.map((assumption, index) => (
                <li key={index} className="text-foreground/75">{assumption}</li>
              ))}
            </ul>
          </section>

          {/* Dependencies */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Dependencies</h2>
            <div className="space-y-4">
              {prd.content.dependencies.map((dep, index) => (
                <Card key={index} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{dep.type}</Badge>
                    </div>
                    <p className="text-foreground/80 mb-2">{dep.dependency}</p>
                    <p className="text-sm text-orange-600">Impact: {dep.impact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Risks and Mitigations */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Risks and Mitigations</h2>
            <div className="space-y-4">
              {prd.content.risksAndMitigations.map((risk, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={
                        risk.impact === 'High' ? 'destructive' :
                        risk.impact === 'Medium' ? 'default' : 'secondary'
                      }>
                        {risk.impact} Impact
                      </Badge>
                    </div>
                    <p className="text-foreground/80 mb-2"><strong>Risk:</strong> {risk.risk}</p>
                    <p className="text-sm text-foreground/70"><strong>Mitigation:</strong> {risk.mitigation}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Success Metrics */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Success Metrics</h2>
            <div className="space-y-4">
              {prd.content.successMetrics.map((metric, index) => (
                <Card key={index} className="border-l-4 border-l-green-500">
                  <CardContent className="p-6">
                    <p className="text-foreground/80 mb-1"><strong>Metric:</strong> {metric.metric}</p>
                    <p className="text-foreground/80 mb-1"><strong>Target:</strong> {metric.target}</p>
                    <p className="text-sm text-green-600"><strong>Timeframe:</strong> {metric.timeframe}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Future Roadmap */}
          <section>
            <h2 className="text-2xl font-bold mb-4 text-foreground">Future Roadmap</h2>
            <div className="space-y-4">
              {prd.content.futureRoadmap.map((item, index) => (
                <Card key={index} className="bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg text-foreground">{item.name}</h3>
                      <Badge variant="outline">{item.timeframe}</Badge>
                    </div>
                    <p className="text-foreground/80 mb-2">{item.description}</p>
                    <p className="text-sm text-primary">Business Value: {item.businessValue}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  );
}

function generatePRDText(title: string, content: any): string {
  let text = `${title}\n${'='.repeat(title.length)}\n\n`;
  
  text += `Purpose and Vision\n${'-'.repeat(18)}\n${content.purposeAndVision}\n\n`;
  
  text += `Scope\n${'-'.repeat(5)}\n`;
  text += `In Scope:\n${content.scope.inScope.map((item: string) => `• ${item}`).join('\n')}\n\n`;
  text += `Out of Scope:\n${content.scope.outOfScope.map((item: string) => `• ${item}`).join('\n')}\n\n`;
  
  text += `Target Users and Personas\n${'-'.repeat(24)}\n`;
  content.targetUsersAndPersonas.forEach((persona: any) => {
    text += `${persona.name}\n${persona.description}\n`;
    text += `Characteristics: ${persona.characteristics.join(', ')}\n`;
    text += `Needs: ${persona.needs.join(', ')}\n\n`;
  });
  
  text += `Core Features\n${'-'.repeat(13)}\n`;
  content.coreFeatures.forEach((feature: any) => {
    text += `${feature.name} (${feature.priority})\n${feature.description}\n${feature.userStory}\n\n`;
  });
  
  return text;
}