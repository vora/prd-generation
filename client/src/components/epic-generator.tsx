import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Target, Users, CheckCircle, ChevronDown, Trash2, MoreVertical, CheckSquare } from "lucide-react";
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

interface EpicGeneratorProps {
  prdId: number;
  prdTitle: string;
}

export default function EpicGenerator({ prdId, prdTitle }: EpicGeneratorProps) {
  const [deleteEpicId, setDeleteEpicId] = useState<number | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Query for existing epics
  const { data: epicsData = [], isLoading: isLoadingEpics } = useQuery({
    queryKey: ['/api/epics', prdId],
    enabled: true,
  });

  // Generate epics mutation
  const generateEpicsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest(`/api/prds/${prdId}/generate-epics`, 'POST', {});
      return response;
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

  // Delete epic mutation
  const deleteEpicMutation = useMutation({
    mutationFn: async (epicId: number) => {
      await apiRequest(`/api/epics/${epicId}`, 'DELETE', {});
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
        <div className="space-y-4">
          {epicsData.map((epicRecord: any) => (
            <Card key={epicRecord.id} className="border border-border">
              <CardHeader>
                <CardTitle>Generated Epics for {prdTitle}</CardTitle>
                <CardDescription>
                  Processing time: {epicRecord?.processingTime || 0}ms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <pre className="whitespace-pre-wrap text-sm bg-gray-50 p-4 rounded">
                  {JSON.stringify(epicRecord.content, null, 2)}
                </pre>
              </CardContent>
            </Card>
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