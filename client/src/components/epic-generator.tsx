import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Target, Users, CheckCircle, ChevronDown, Trash2, MoreVertical, CheckSquare, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EpicGeneratorProps {
  prdId: number;
  prdTitle: string;
}

export default function EpicGenerator({ prdId, prdTitle }: EpicGeneratorProps) {
  const [deleteEpicId, setDeleteEpicId] = useState<number | null>(null);
  const [isAddStoryDialogOpen, setIsAddStoryDialogOpen] = useState(false);
  const [storyPrompt, setStoryPrompt] = useState("");
  const [selectedEpicId, setSelectedEpicId] = useState<string>("");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for existing epics
  const { data: epicsData = [], isLoading: isLoadingEpics } = useQuery({
    queryKey: [`/api/prds/${prdId}/epics`],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/prds/${prdId}/epics`, undefined);
      return response.json();
    },
    enabled: true,
  });

  // Generate epics mutation
  const generateEpicsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/prds/${prdId}/generate-epics`, {});
      return response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Epics generated successfully!",
        description: `Generated epics in ${data?.processingTime || 0}ms`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/epics', prdId] });
    },
    onError: (error: any) => {
      toast({
        title: "Error generating epics",
        description: error.message || "Failed to generate epics",
        variant: "destructive",
      });
    },
  });

  // Add user story mutation
  const addStoryMutation = useMutation({
    mutationFn: async ({ epicId, prompt }: { epicId: string; prompt: string }) => {
      const response = await apiRequest('POST', `/api/epics/${epicId}/add-story`, { prompt });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "User story added successfully!",
        description: "New user story has been generated and added to the epic",
      });
      // Clear cache and refetch data
      queryClient.removeQueries({ queryKey: [`/api/prds/${prdId}/epics`] });
      // Small delay before refetch to ensure backend update is complete
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: [`/api/prds/${prdId}/epics`] });
      }, 500);
    },
    onError: (error: any) => {
      toast({
        title: "Error adding story",
        description: error.message || "Failed to add user story",
        variant: "destructive",
      });
    },
  });

  // Delete epic mutation
  const deleteEpicMutation = useMutation({
    mutationFn: async (epicId: number) => {
      await apiRequest('DELETE', `/api/epics/${epicId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Epic deleted",
        description: "Epic has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/epics', prdId] });
      setDeleteEpicId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error deleting epic",
        description: error.message || "Failed to delete epic",
        variant: "destructive",
      });
    },
  });

  const handleGenerateEpics = () => {
    generateEpicsMutation.mutate();
  };

  const handleDeleteEpic = () => {
    if (deleteEpicId) {
      deleteEpicMutation.mutate(deleteEpicId);
    }
  };

  const handleAddStory = (epicId: string) => {
    setSelectedEpicId(epicId);
    setIsAddStoryDialogOpen(true);
  };

  const handleSubmitStory = () => {
    if (selectedEpicId && storyPrompt.trim()) {
      addStoryMutation.mutate({ epicId: selectedEpicId, prompt: storyPrompt.trim() });
    }
  };

  const hasEpics = Array.isArray(epicsData) && epicsData.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Epics & User Stories</h3>
          <p className="text-sm text-gray-600 mt-1">
            Generate epics and user stories from your PRD using AI
          </p>
        </div>
        <Button
          onClick={handleGenerateEpics}
          disabled={generateEpicsMutation.isPending}
          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        >
          {generateEpicsMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {generateEpicsMutation.isPending ? 'Generating...' : 'Generate Epics'}
        </Button>
      </div>

      {/* Loading State */}
      {isLoadingEpics && (
        <Card>
          <CardContent className="py-8">
            <div className="flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span className="text-gray-600">Loading epics...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Progress */}
      {generateEpicsMutation.isPending && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-6">
            <div className="flex items-center">
              <Loader2 className="w-5 h-5 animate-spin mr-3 text-blue-600" />
              <div>
                <p className="text-blue-900 font-medium">Generating epics with AI...</p>
                <p className="text-blue-700 text-sm">This may take a few moments while we analyze your PRD</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Epics State */}
      {!isLoadingEpics && !hasEpics && !generateEpicsMutation.isPending && (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No epics generated yet</h4>
            <p className="text-gray-600 mb-6">
              Generate epics and user stories from your PRD to break down the work into manageable tasks
            </p>
            <Button 
              onClick={handleGenerateEpics} 
              disabled={generateEpicsMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Epics
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Epics Display */}
      {hasEpics && (
        <div className="space-y-6">
          {epicsData.map((epicRecord: any) => {
            const epics = epicRecord.content?.epics || [];
            
            return (
              <div key={epicRecord.id} className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-semibold">Generated Epics</h4>
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs">
                      Generated in {epicRecord?.processingTime || 0}ms
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteEpicId(epicRecord.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {epics.map((epic: any, epicIndex: number) => (
                  <Card key={`${epicRecord.id}-${epicIndex}`} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold">{epic.title}</h3>
                        <Badge variant="outline" className="mt-2">
                          {epic.priority || 'Medium'} Priority
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4">{epic.description || 'No description available'}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <h4 className="font-medium mb-2">Goals</h4>
                        <ul className="text-sm text-gray-600 space-y-1">
                          {epic.goals?.map((goal: string, index: number) => (
                            <li key={index}>• {goal}</li>
                          )) || <li>No goals specified</li>}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-2">Estimated Effort</h4>
                        <p className="text-sm text-gray-600">{epic.estimatedEffort || 'Not specified'}</p>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium">User Stories</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddStory(epic.id)}
                          className="text-blue-600 hover:text-blue-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Story
                        </Button>
                      </div>
                      <div className="space-y-3">
                        {epic.userStories?.map((story: any) => (
                          <Card key={story.id} className="p-4 bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-medium">{story.title}</h5>
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="text-xs">
                                  {story.priority} priority
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {story.estimatedStoryPoints} pts
                                </Badge>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{story.description}</p>
                            <div>
                              <h6 className="text-sm font-medium mb-2">Acceptance Criteria:</h6>
                              <ul className="text-sm text-gray-600 space-y-1">
                                {story.acceptanceCriteria?.map((criteria: string, index: number) => (
                                  <li key={index}>✓ {criteria}</li>
                                )) || <li>No criteria specified</li>}
                              </ul>
                            </div>
                          </Card>
                        )) || <p className="text-gray-500">No user stories available</p>}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Add Story Dialog */}
      <Dialog open={isAddStoryDialogOpen} onOpenChange={setIsAddStoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom User Story</DialogTitle>
            <DialogDescription>
              Describe what user story you'd like to add and AI will generate it with acceptance criteria and story points.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="story-prompt">Story Description</Label>
              <Textarea
                id="story-prompt"
                placeholder="e.g., As a broker, I want to be able to export client data to Excel format so that I can create custom reports..."
                value={storyPrompt}
                onChange={(e) => setStoryPrompt(e.target.value)}
                className="mt-2"
                rows={4}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddStoryDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitStory}
                disabled={!storyPrompt.trim() || addStoryMutation.isPending}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                {addStoryMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Story
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              onClick={handleDeleteEpic}
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteEpicMutation.isPending}
            >
              {deleteEpicMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4 mr-2" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}