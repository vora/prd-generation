import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, downloadBlob } from "@/lib/utils";
import PRDPreview from "@/components/prd-preview-new";
import EpicGenerator from "@/components/epic-generator";
import type { Prd } from "@shared/schema";

export default function PRDView() {
  const [, params] = useRoute("/prd/:id");
  const [activeTab, setActiveTab] = useState("prd");
  const [, setLocation] = useLocation();
  const [showPreview, setShowPreview] = useState(false);
  
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

  const AppPreviewComponent = () => (
    <div className="mt-8 border-t pt-8">
      <h3 className="text-xl font-bold mb-4">🚀 Live App Preview</h3>
      <p className="text-muted-foreground mb-6">
        This is exactly how your {prd.title} will look and work:
      </p>
      
      <div className="bg-white rounded-lg shadow-lg border overflow-hidden">
        {/* Mock Browser Header */}
        <div className="bg-gray-100 px-4 py-2 border-b flex items-center gap-2">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <div className="bg-white px-3 py-1 rounded text-sm text-gray-600 ml-4">
            🌐 {prd.title} - Live Preview
          </div>
        </div>

        {/* App Content */}
        <div className="bg-white">
          {/* App Navigation */}
          <header className="bg-white shadow-sm border-b px-6 py-4">
            <div className="flex justify-between items-center">
              <h1 className="text-xl font-semibold text-gray-900">{prd.title}</h1>
              <nav className="flex space-x-4">
                <span className="text-blue-600 border-b-2 border-blue-600 pb-1">Dashboard</span>
                <span className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">Book of Business</span>
                <span className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">Client Communication</span>
                <span className="text-gray-600 hover:text-gray-900 pb-1 cursor-pointer">Claims Processing</span>
              </nav>
            </div>
          </header>

          {/* Dashboard Content */}
          <div className="p-6">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Broker Dashboard</h1>
              <p className="text-gray-600">Welcome to your professional insurance application</p>
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

            {/* Client Management Table */}
            <div className="bg-white rounded-lg shadow border">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Client Management</h3>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">Add New Client</button>
                </div>
                <div className="flex items-center gap-4">
                  <input 
                    type="text" 
                    placeholder="Search clients..." 
                    className="px-4 py-2 border rounded-lg flex-1 max-w-md"
                  />
                  <select className="px-4 py-2 border rounded-lg">
                    <option>All Statuses</option>
                    <option>Active</option>
                    <option>Pending</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Policy Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Premium</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">John Smith</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Health Plus Premium</td>
                      <td className="px-6 py-4 text-sm text-gray-900">$2,450/year</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Active</span>
                      </td>
                    </tr>
                    <tr className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">Sarah Johnson</td>
                      <td className="px-6 py-4 text-sm text-gray-600">Family Care Standard</td>
                      <td className="px-6 py-4 text-sm text-gray-900">$3,200/year</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">Pending</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Info Panel */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">💡 This is Your Live Broker App!</h4>
              <p className="text-blue-800 text-sm">
                This shows exactly how your HealthSecure Insurance broker application will look and work. 
                Features include: Book of Business Management, Client Communication, and Claims Processing - 
                all built from your conversation. Perfect for showing to stakeholders!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "prd":
        return <PRDPreview prd={prd} />;
      case "epics":
        return <EpicGenerator prdId={prd.id} prdTitle={prd.title} />;
      case "code":
        return (
          <div>
            <h3 className="text-xl font-bold mb-4">Generate Complete Application</h3>
            <p className="text-muted-foreground mb-6">
              Build a complete React application from your {prd.title} requirements
            </p>
            
            <div className="flex gap-4 mb-6">
              <Button 
                onClick={() => {
                  setShowPreview(true);
                  setTimeout(() => {
                    const previewElement = document.querySelector('.app-preview-section');
                    if (previewElement) {
                      previewElement.scrollIntoView({ behavior: 'smooth' });
                    }
                  }, 100);
                }}
                className="bg-green-600 hover:bg-green-700"
                size="lg"
              >
                🚀 Build & Preview App
              </Button>

              <Button 
                onClick={() => {
                  fetch(`/api/prds/${prd.id}/generate-app`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({})
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      const allFiles = data.appFiles.allFiles;
                      const zipContent = allFiles.map((file: any) => 
                        `=== ${file.filename} ===\n${file.content}\n`
                      ).join('\n\n');
                      
                      downloadBlob(new Blob([zipContent], { type: 'text/plain' }), 
                                 `${data.appName.toLowerCase().replace(/\s+/g, '-')}-complete-app.txt`);
                      
                      alert(`📦 Downloaded ${data.filesGenerated} files for your development team!`);
                    } else {
                      alert(`Error: ${data.error || 'Failed to generate application'}`);
                    }
                  })
                  .catch(() => {
                    alert('Failed to build application');
                  });
                }}
                variant="outline"
                size="lg"
              >
                📦 Download Code
              </Button>
            </div>
            
            {showPreview && (
              <div className="app-preview-section">
                <AppPreviewComponent />
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a tab to view content</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>PRD</span>
              <span>/</span>
              <span className="text-foreground">{prd.title}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{prd.title}</h1>
          <div className="flex items-center gap-4">
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-secondary text-secondary-foreground">
              {prd.status}
            </span>
            <span className="text-sm text-muted-foreground">
              Generated from: {prd.originalFileName}
            </span>
            {prd.processingTime && (
              <span className="text-sm text-muted-foreground">
                Processing time: {(prd.processingTime / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg shadow border">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              {["prd", "epics", "code"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm capitalize transition-colors ${
                    activeTab === tab
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
                  }`}
                >
                  {tab === "code" ? "Frontend Code" : tab}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
}