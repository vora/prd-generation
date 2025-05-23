import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, MoreHorizontal, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Prd } from "@shared/schema";

interface RecentPRDsProps {
  onPRDSelect: (prd: Prd) => void;
}

export default function RecentPRDs({ onPRDSelect }: RecentPRDsProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { data: prds, isLoading, error } = useQuery<Prd[]>({
    queryKey: ['/api/prds'],
  });

  const deletePrdMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/prds/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete PRD');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/prds'] });
      toast({
        title: "PRD deleted",
        description: "The PRD has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete PRD. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeletePrd = (id: number, title: string) => {
    deletePrdMutation.mutate(id);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'draft':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'complete':
        return 'Complete';
      case 'in_review':
        return 'In Review';
      case 'draft':
        return 'Draft';
      default:
        return status;
    }
  };

  if (isLoading) {
    return (
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6">Recent PRDs</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-between items-center">
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6">Recent PRDs</h3>
        <Card className="p-6 text-center">
          <p className="text-red-600">Error loading PRDs: {(error as Error).message}</p>
        </Card>
      </div>
    );
  }

  const recentPRDs = prds?.slice(0, 6) || [];

  if (recentPRDs.length === 0) {
    return (
      <div className="mt-12">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6">Recent PRDs</h3>
        <Card className="p-12 text-center">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-slate-800 mb-2">No PRDs Yet</h4>
          <p className="text-slate-600">Upload your first conversation file to get started</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mt-12">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-semibold text-slate-800">Recent PRDs</h3>
        <Button variant="link" className="text-blue-600 hover:text-blue-700 font-medium">
          View all
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recentPRDs.map((prd) => (
          <Card 
            key={prd.id} 
            className="hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 bg-card/50 backdrop-blur-sm border-border hover:bg-card/80"
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => setLocation(`/prd/${prd.id}`)}
                >
                  <h4 className="font-bold text-foreground mb-2 line-clamp-2 text-lg">
                    {prd.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Created {formatDate(prd.createdAt)}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getStatusColor(prd.status)} border text-xs`}>
                    {getStatusText(prd.status)}
                  </Badge>
                  <AlertDialog>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1"
                        >
                          <MoreHorizontal className="w-4 h-4 text-slate-600" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <AlertDialogTrigger asChild>
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete PRD
                          </DropdownMenuItem>
                        </AlertDialogTrigger>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete PRD</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{prd.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={() => handleDeletePrd(prd.id, prd.title)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
              
              <div onClick={() => setLocation(`/prd/${prd.id}`)} className="cursor-pointer">
                <p className="text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {typeof prd.content === 'object' && prd.content && 'purposeAndVision' in prd.content
                    ? (prd.content.purposeAndVision as string).substring(0, 120) + '...'
                    : 'No description available'
                  }
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <FileText className="w-4 h-4" />
                    <span>
                      {typeof prd.content === 'object' && prd.content
                        ? Object.keys(prd.content).length
                        : 0
                      } sections
                    </span>
                  </div>
                  <Button 
                    size="sm" 
                    variant="link" 
                    className="text-primary hover:text-primary/80 font-semibold p-0"
                  >
                    Open PRD
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
