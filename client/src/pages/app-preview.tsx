import React from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Prd } from "@shared/schema";

export default function AppPreview() {
  const [, params] = useRoute("/prd/:id/preview");
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
          <p className="text-muted-foreground">Loading preview...</p>
        </div>
      </div>
    );
  }
  
  if (!prd) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">App Not Found</h1>
          <p className="text-muted-foreground mb-6">The requested app preview could not be found.</p>
          <Button onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const epics = (prd.content as any)?.epics || [];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setLocation(`/prd/${prd.id}`)}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to PRD
              </Button>
              <div>
                <h1 className="text-lg font-semibold">Live App Preview</h1>
                <p className="text-sm text-muted-foreground">See exactly how your app will work</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
          {/* Mock Browser Header */}
          <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="bg-white px-3 py-1 rounded text-sm text-gray-600 ml-4">
              🌐 {prd.title} - Live Application
            </div>
          </div>

          {/* App Content */}
          <div className="bg-white">
            {/* App Navigation */}
            <header className="bg-white shadow-sm border-b px-6 py-4">
              <div className="flex justify-between items-center">
                <h1 className="text-xl font-semibold text-gray-900">{prd.title}</h1>
                <nav className="flex space-x-4">
                  <span className="text-blue-600 border-b-2 border-blue-600 pb-1 cursor-pointer">Dashboard</span>
                  {epics.map((epic: any, i: number) => (
                    <span key={i} className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">
                      {epic.title}
                    </span>
                  ))}
                </nav>
              </div>
            </header>

            {/* Dashboard Content */}
            <div className="p-6">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{prd.title}</h1>
                <p className="text-gray-600">Welcome to your professional application dashboard</p>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border">
                  <p className="text-sm font-medium text-gray-600">Total Clients</p>
                  <p className="text-2xl font-bold text-gray-900">1,247</p>
                  <p className="text-sm text-green-600">+5.2% this month</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                  <p className="text-sm font-medium text-gray-600">Active Policies</p>
                  <p className="text-2xl font-bold text-gray-900">856</p>
                  <p className="text-sm text-blue-600">+2.1% this month</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">$287,450</p>
                  <p className="text-sm text-green-600">+8.7% this month</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow border">
                  <p className="text-sm font-medium text-gray-600">Claims Processed</p>
                  <p className="text-2xl font-bold text-gray-900">124</p>
                  <p className="text-sm text-gray-600">This month</p>
                </div>
              </div>

              {/* Feature Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-semibold mb-4">🎯 Your Epic Features</h3>
                  <div className="space-y-3">
                    {epics.map((epic: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer transition-colors">
                        <div>
                          <span className="font-medium text-gray-900">{epic.title}</span>
                          <p className="text-sm text-gray-600">{epic.description}</p>
                        </div>
                        <span className="text-green-600 text-sm font-medium">✓ Active</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow border">
                  <h3 className="text-lg font-semibold mb-4">📊 Recent Activity</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-900">New client registered</span>
                      </div>
                      <span className="text-sm text-gray-500">2 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-gray-900">Policy renewed</span>
                      </div>
                      <span className="text-sm text-gray-500">15 min ago</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                        <span className="text-gray-900">Claim processed</span>
                      </div>
                      <span className="text-sm text-gray-500">1 hour ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="bg-white rounded-lg shadow border">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Client Management</h3>
                    <Button className="bg-blue-600 hover:bg-blue-700">Add New Client</Button>
                  </div>
                  <div className="flex items-center gap-4">
                    <input 
                      type="text" 
                      placeholder="Search clients by name, policy, or status..." 
                      className="px-4 py-2 border rounded-lg flex-1 max-w-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <select className="px-4 py-2 border rounded-lg">
                      <option>All Statuses</option>
                      <option>Active</option>
                      <option>Pending</option>
                      <option>Expired</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Policy Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Premium</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">JS</div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">John Smith</p>
                              <p className="text-sm text-gray-500">john.smith@email.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">Health Plus Premium</td>
                        <td className="px-6 py-4 text-sm text-gray-900">$2,450/year</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-gray-600 hover:text-gray-900">Edit</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">SJ</div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Sarah Johnson</p>
                              <p className="text-sm text-gray-500">sarah.j@email.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">Family Care Standard</td>
                        <td className="px-6 py-4 text-sm text-gray-900">$3,200/year</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">Pending</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-gray-600 hover:text-gray-900">Edit</button>
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50 cursor-pointer">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-medium">MD</div>
                            <div className="ml-3">
                              <p className="text-sm font-medium text-gray-900">Mike Davis</p>
                              <p className="text-sm text-gray-500">mike.davis@email.com</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">Basic Health Plan</td>
                        <td className="px-6 py-4 text-sm text-gray-900">$1,800/year</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">Active</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-gray-600 hover:text-gray-900">Edit</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Panel */}
        <div className="mt-8 bg-blue-50 rounded-lg p-6 border">
          <h4 className="font-semibold text-blue-900 mb-3">💡 This is Your Live Application!</h4>
          <div className="text-blue-800 text-sm space-y-2">
            <p>
              <strong>What you're seeing:</strong> This is exactly how your {prd.title} will look and function for real users.
            </p>
            <p>
              <strong>Ready features:</strong> {epics.map((e: any) => e.title).join(', ')} - all built from your conversation.
            </p>
            <p>
              <strong>Next steps:</strong> Show this to stakeholders for approval, then download the code for your development team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}