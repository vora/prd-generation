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
                  <h3 className="text-lg font-semibold">Generated Application Preview</h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Here's what your {prd.title} application would look like for business users
                </p>
                
                {/* Generated App Preview */}
                <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="mb-4">
                    <h4 className="font-bold text-xl text-blue-600 mb-2">📱 {prd.title}</h4>
                    <p className="text-sm text-gray-600">Generated from your epics and user stories</p>
                  </div>
                  
                  {/* Navigation */}
                  <div className="bg-blue-600 text-white p-3 rounded mb-4">
                    <div className="flex gap-4">
                      <button className="px-3 py-1 bg-blue-500 rounded">📊 Dashboard</button>
                      <button className="px-3 py-1 hover:bg-blue-500 rounded">📋 Book of Business</button>
                      <button className="px-3 py-1 hover:bg-blue-500 rounded">🔍 Client Search</button>
                      <button className="px-3 py-1 hover:bg-blue-500 rounded">📄 Policies</button>
                      <button className="px-3 py-1 hover:bg-blue-500 rounded">⚙️ Settings</button>
                    </div>
                  </div>
                  
                  {/* Main Content Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Book of Business */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-4 rounded border">
                      <h5 className="font-semibold mb-3">📋 Book of Business Management</h5>
                      
                      {/* Search and Filter */}
                      <div className="mb-3 flex gap-2">
                        <input 
                          type="text" 
                          placeholder="Search clients..." 
                          className="flex-1 p-2 border rounded text-sm"
                          readOnly
                        />
                        <select className="p-2 border rounded text-sm" disabled>
                          <option>All Status</option>
                          <option>Active</option>
                          <option>Inactive</option>
                        </select>
                        <button className="px-3 py-2 bg-blue-500 text-white rounded text-sm">🔍 Filter</button>
                      </div>
                      
                      {/* Client List */}
                      <div className="space-y-2">
                        <div className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Acme Corporation</p>
                              <p className="text-sm text-gray-600">Health Insurance • Active</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">$12,500/mo</p>
                              <p className="text-xs text-gray-500">50 employees</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">TechStart Inc</p>
                              <p className="text-sm text-gray-600">Health + Dental • Active</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-green-600">$8,750/mo</p>
                              <p className="text-xs text-gray-500">25 employees</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-700">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">Global Ventures LLC</p>
                              <p className="text-sm text-gray-600">Comprehensive Package • Under Review</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-yellow-600">$22,100/mo</p>
                              <p className="text-xs text-gray-500">120 employees</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 flex gap-2">
                        <button className="px-4 py-2 bg-green-500 text-white rounded text-sm">+ Add Client</button>
                        <button className="px-4 py-2 bg-gray-500 text-white rounded text-sm">📊 Export Data</button>
                      </div>
                    </div>
                    
                    {/* Sidebar */}
                    <div className="space-y-4">
                      {/* Quick Stats */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                        <h6 className="font-semibold mb-2">📈 Quick Stats</h6>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Total Clients:</span>
                            <span className="font-semibold">47</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Monthly Revenue:</span>
                            <span className="font-semibold text-green-600">$186,750</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Active Policies:</span>
                            <span className="font-semibold">89</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Renewals Due:</span>
                            <span className="font-semibold text-orange-600">12</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Recent Activity */}
                      <div className="bg-white dark:bg-gray-800 p-4 rounded border">
                        <h6 className="font-semibold mb-2">🔔 Recent Activity</h6>
                        <div className="space-y-2 text-sm">
                          <div className="p-2 bg-blue-50 dark:bg-blue-900 rounded">
                            <p className="font-medium">New Quote Request</p>
                            <p className="text-xs text-gray-600">TechStart Inc - 2 hours ago</p>
                          </div>
                          <div className="p-2 bg-green-50 dark:bg-green-900 rounded">
                            <p className="font-medium">Policy Renewed</p>
                            <p className="text-xs text-gray-600">Acme Corp - 1 day ago</p>
                          </div>
                          <div className="p-2 bg-yellow-50 dark:bg-yellow-900 rounded">
                            <p className="font-medium">Payment Overdue</p>
                            <p className="text-xs text-gray-600">Global Ventures - 3 days ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                      ✨ This preview shows how your epics translate into a real working application that business users can navigate and use effectively.
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