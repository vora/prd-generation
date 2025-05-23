import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Zap, ChevronDown, ChevronUp, Trash2, Users, Target, CheckSquare } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { UserStory, EpicRecord } from "@shared/schema";

interface EpicGeneratorProps {
  prdId: number;
  prdTitle: string;
}

export default function EpicGenerator({ prdId, prdTitle }: EpicGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedEpics, setExpandedEpics] = useState<Set<string>>(new Set());
  const [deleteEpicId, setDeleteEpicId] = useState<number | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing epics
  const { data: epicsData, isLoading } = useQuery({
    queryKey: ['/api/prds', prdId, 'epics'],
    queryFn: async () => {
      const response = await fetch(`/api/prds/${prdId}/epics`);
      if (!response.ok) throw new Error('Failed to fetch epics');
      return response.json() as Promise<EpicRecord[]>;
    },
  });

  // Generate epics mutation
  const generateEpicsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/prds/${prdId}/generate-epics`, {
        method: 'POST',
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prds', prdId, 'epics'] });
      toast({
        title: "Epics Generated Successfully",
        description: "Your epics and user stories are ready for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate epics. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete epic mutation
  const deleteEpicMutation = useMutation({
    mutationFn: async (epicId: number) => {
      await apiRequest(`/api/epics/${epicId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prds', prdId, 'epics'] });
      toast({
        title: "Epic Deleted",
        description: "The epic and its user stories have been removed.",
      });
      setDeleteEpicId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete epic.",
        variant: "destructive",
      });
    },
  });

  const handleGenerateEpics = async () => {
    setIsGenerating(true);
    try {
      await generateEpicsMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleEpicExpansion = (epicId: string) => {
    const newExpanded = new Set(expandedEpics);
    if (newExpanded.has(epicId)) {
      newExpanded.delete(epicId);
    } else {
      newExpanded.add(epicId);
    }
    setExpandedEpics(newExpanded);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Loading epics...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasEpics = epicsData && epicsData.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Epics & User Stories</h2>
          <p className="text-muted-foreground">Generated from: {prdTitle}</p>
        </div>
        
        {!hasEpics && (
          <Button
            onClick={handleGenerateEpics}
            disabled={isGenerating}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate Epics
              </>
            )}
          </Button>
        )}
      </div>

      {/* Empty State */}
      {!hasEpics && !isGenerating && (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mb-2">No Epics Generated Yet</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Transform your PRD into actionable epics and user stories. Our AI will analyze your requirements 
              and create a comprehensive backlog ready for development.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground max-w-2xl mx-auto">
              <div className="flex items-center">
                <Target className="w-4 h-4 mr-2 text-purple-600" />
                Strategic Epics
              </div>
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2 text-purple-600" />
                User Stories
              </div>
              <div className="flex items-center">
                <CheckSquare className="w-4 h-4 mr-2 text-purple-600" />
                Acceptance Criteria
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Epics Display */}
      {hasEpics && (
        <div className="space-y-4">
          {epicsData.map((epicRecord) => (
            <div key={epicRecord.id} className="space-y-4">
              {(epicRecord.content as Epic[]).map((epic) => (
                <Card key={epic.id} className="border border-border">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{epic.title}</CardTitle>
                          <Badge className={`${getPriorityColor(epic.priority)} border`}>
                            {epic.priority} priority
                          </Badge>
                        </div>
                        <CardDescription className="text-base leading-relaxed">
                          {epic.description}
                        </CardDescription>
                        
                        {epic.goals.length > 0 && (
                          <div className="mt-4">
                            <h4 className="font-semibold text-sm text-foreground mb-2">Goals:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                              {epic.goals.map((goal, index) => (
                                <li key={index}>{goal}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteEpicId(epicRecord.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          onClick={() => toggleEpicExpansion(epic.id)}
                        >
                          <span>View {epic.userStories.length} User Stories</span>
                          {expandedEpics.has(epic.id) ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      
                      <CollapsibleContent className="mt-4">
                        <div className="space-y-4">
                          {epic.userStories.map((story, index) => (
                            <div key={story.id}>
                              {index > 0 && <Separator className="my-4" />}
                              <div className="space-y-3">
                                <div className="flex items-start justify-between">
                                  <h4 className="font-semibold text-foreground">{story.title}</h4>
                                  <div className="flex items-center gap-2 ml-4">
                                    <Badge className={`${getPriorityColor(story.priority)} border text-xs`}>
                                      {story.priority}
                                    </Badge>
                                    {story.storyPoints && (
                                      <Badge variant="outline" className="text-xs">
                                        {story.storyPoints} pts
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                
                                <p className="text-muted-foreground leading-relaxed">
                                  {story.description}
                                </p>
                                
                                <div>
                                  <h5 className="font-medium text-sm text-foreground mb-2">Acceptance Criteria:</h5>
                                  <ul className="space-y-1">
                                    {story.acceptanceCriteria.map((criteria, criteriaIndex) => (
                                      <li key={criteriaIndex} className="flex items-start text-sm text-muted-foreground">
                                        <CheckSquare className="w-4 h-4 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                                        {criteria}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteEpicId !== null} onOpenChange={() => setDeleteEpicId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Epic</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this epic and all its user stories? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEpicId && deleteEpicMutation.mutate(deleteEpicId)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Epic
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}