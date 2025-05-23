import { useState } from "react";
import { Brain, Rocket, Settings, FileText, Users, Code, Figma, Zap, ArrowRight } from "lucide-react";
import FileUpload from "@/components/file-upload";
import PRDPreview from "@/components/prd-preview-new";
import RecentPRDs from "@/components/recent-prds";
import ConversationRecorder from "@/components/conversation-recorder";
import { Card, CardContent } from "@/components/ui/card";
import { queryClient } from "@/lib/queryClient";
import type { Prd } from "@shared/schema";

export default function Home() {
  const [selectedPRD, setSelectedPRD] = useState<Prd | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('record');

  const handlePRDGenerated = (prd: Prd) => {
    setSelectedPRD(prd);
    // Invalidate the PRDs query to refresh the recent PRDs list
    queryClient.invalidateQueries({ queryKey: ['/api/prds'] });
  };

  const handlePRDSelect = (prd: Prd) => {
    setSelectedPRD(prd);
  };

  const handleConversationComplete = (transcript: string) => {
    // Create a blob with the transcript and trigger file upload processing
    const blob = new Blob([transcript], { type: 'text/plain' });
    const file = new File([blob], `conversation-${Date.now()}.txt`, { type: 'text/plain' });
    
    // Trigger the same PRD generation process as file upload
    const formData = new FormData();
    formData.append('file', file);
    
    fetch('/api/prds/generate', {
      method: 'POST',
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        handlePRDGenerated(data.prd);
      }
    })
    .catch(error => {
      console.error('Error generating PRD from conversation:', error);
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card/50 backdrop-blur-xl border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">B</span>
              </div>
              <h1 className="text-xl font-bold text-foreground tracking-tight">Beanstalk</h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#" className="text-muted-foreground hover:text-foreground font-medium transition-colors">Dashboard</a>
              <a href="#" className="text-muted-foreground hover:text-foreground font-medium transition-colors">History</a>
              <a href="#" className="text-muted-foreground hover:text-foreground font-medium transition-colors">Settings</a>
              <button className="bg-primary text-primary-foreground px-6 py-2.5 rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/25 hover:shadow-primary/40">
                <svg className="w-4 h-4 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                Account
              </button>
            </nav>
            <button className="md:hidden text-muted-foreground hover:text-foreground">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary font-medium text-sm mb-6">
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
            </svg>
            AI-Powered PRD Generation
          </div>
          <h2 className="text-5xl lg:text-6xl font-bold text-foreground mb-6 tracking-tight">
            From Conversation to{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Code
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI-powered, end-to-end product development platform that transforms stakeholder conversations 
            into fully functional UI prototypes and frontend code. Bridge the gap between business intent and execution.
          </p>
        </div>

        {/* Core Features Preview */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-white/60 backdrop-blur-sm border-border hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <FileText className="w-10 h-10 text-blue-600 mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">Conversation-to-PRD</h3>
              <p className="text-sm text-muted-foreground">Transform meetings into structured requirements</p>
            </CardContent>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-border hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Users className="w-10 h-10 text-purple-600 mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">User Story Generation</h3>
              <p className="text-sm text-muted-foreground">Automated epics with acceptance criteria</p>
            </CardContent>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-border hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Figma className="w-10 h-10 text-green-600 mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">UI Specification</h3>
              <p className="text-sm text-muted-foreground">Figma-ready designs with navigation logic</p>
            </CardContent>
          </Card>
          <Card className="bg-white/60 backdrop-blur-sm border-border hover:bg-white/80 transition-all duration-300">
            <CardContent className="p-6 text-center">
              <Code className="w-10 h-10 text-orange-600 mx-auto mb-4" />
              <h3 className="font-bold text-foreground mb-2">Frontend Code Export</h3>
              <p className="text-sm text-muted-foreground">React, React Native, and web frameworks</p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('record')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'record'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Record Conversation
            </button>
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'upload'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Upload File
            </button>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Dynamic Content Section */}
          <div>
            {activeTab === 'record' ? (
              <ConversationRecorder onConversationComplete={handleConversationComplete} />
            ) : (
              <FileUpload onPRDGenerated={handlePRDGenerated} />
            )}
          </div>

          {/* Preview Section */}
          <PRDPreview prd={selectedPRD} />
        </div>

        {/* Recent PRDs Section */}
        <RecentPRDs onPRDSelect={handlePRDSelect} />

        {/* Features Section */}
        <div className="mt-24 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-accent/10 border border-accent/20 rounded-full text-accent font-medium text-sm mb-6">
            <Settings className="w-4 h-4 mr-2" />
            Enterprise Features
          </div>
          <h3 className="text-4xl lg:text-5xl font-bold text-foreground mb-6 tracking-tight">The Problem Beanstalk Solves</h3>
          <p className="text-xl text-muted-foreground mb-16 max-w-3xl mx-auto leading-relaxed">
            Building digital products at scale is slower and messier than it should be. Despite modern tooling, most organizations struggle with speed, alignment, and efficiency.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 bg-card/50 backdrop-blur-sm border border-border rounded-2xl hover:bg-card/80 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/25 group-hover:shadow-blue-500/40 transition-all">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Speed to Market</h4>
              <p className="text-muted-foreground leading-relaxed">
                Move from ideas to testable prototypes in hours, not weeks. It takes weeks or months for ideas to become visual, testable, and build-ready.
              </p>
            </div>
            
            <div className="group p-8 bg-card/50 backdrop-blur-sm border border-border rounded-2xl hover:bg-card/80 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-purple-500/25 group-hover:shadow-purple-500/40 transition-all">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Team Alignment</h4>
              <p className="text-muted-foreground leading-relaxed">
                Bridge product, design, and engineering teams. Each team reinterprets the last team's work, leading to costly rework and scope creep.
              </p>
            </div>
            
            <div className="group p-8 bg-card/50 backdrop-blur-sm border border-border rounded-2xl hover:bg-card/80 transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/25 group-hover:shadow-green-500/40 transition-all">
                <ArrowRight className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold text-foreground mb-4">Efficient Collaboration</h4>
              <p className="text-muted-foreground leading-relaxed">
                Central source of truth from day one. Stakeholder feedback is scattered across meetings, notes, and emails without structure.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card/30 backdrop-blur-xl border-t border-border mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <h4 className="text-2xl font-bold text-foreground">Beanstalk</h4>
              </div>
              <p className="text-muted-foreground mb-6 leading-relaxed max-w-md">
                End-to-end product development platform that transforms stakeholder conversations into fully functional UI prototypes and frontend code.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                  </svg>
                </a>
                <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h5 className="font-bold text-foreground mb-6">Product</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-bold text-foreground mb-6">Support</h5>
              <ul className="space-y-3 text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-border mt-12 pt-8 text-center text-muted-foreground">
            <p>&copy; 2025 Beanstalk. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
