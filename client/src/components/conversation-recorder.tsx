import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Play, Download, MessageSquare, Lightbulb, Users, Target, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob } from '@/lib/utils';

interface ConversationRecorderProps {
  onConversationComplete: (transcript: string) => void;
}

export default function ConversationRecorder({ onConversationComplete }: ConversationRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [aiPrompt, setAiPrompt] = useState("Start with: 'Tell me about the problem you're trying to solve'");
  const [duration, setDuration] = useState(0);
  const [conversationPhase, setConversationPhase] = useState<'intro' | 'discovery' | 'details' | 'validation'>('intro');
  const [isGeneratingPrompt, setIsGeneratingPrompt] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // AI-powered conversation prompts based on phase
  const conversationPrompts = {
    intro: [
      "🎯 Start with: 'Tell me about the problem you're trying to solve'",
      "🏢 Ask: 'Who are your target users and what do they currently struggle with?'",
      "💡 Explore: 'What would success look like for this project?'"
    ],
    discovery: [
      "📋 Deep dive: 'Walk me through a typical user workflow step by step'",
      "🔍 Understand pain points: 'What are the biggest frustrations in the current process?'",
      "⚡ Identify priorities: 'If you could only solve one problem, what would it be?'",
      "🎨 Explore features: 'What features do you envision users needing most?'",
      "📊 Discuss data: 'What information do users need to see or track?'"
    ],
    details: [
      "🛠️ Technical requirements: 'Are there any existing systems this needs to integrate with?'",
      "👥 User personas: 'Can you describe your different types of users?'",
      "📱 Platform preferences: 'Do you need this on mobile, web, or both?'",
      "🔒 Security & compliance: 'Are there any security or regulatory requirements?'",
      "📈 Scale & performance: 'How many users do you expect to have?'"
    ],
    validation: [
      "✅ Confirm understanding: 'Let me summarize what I heard - does this sound right?'",
      "🎯 Validate priorities: 'What's most important to get right in version 1?'",
      "⏰ Timeline discussion: 'When do you need this delivered?'",
      "💰 Budget & resources: 'What constraints should I be aware of?'",
      "🚀 Next steps: 'What happens after we build this?'"
    ]
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up MediaRecorder for audio
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      // Set up Speech Recognition for live transcript
      if ('webkitSpeechRecognition' in window) {
        recognitionRef.current = new (window as any).webkitSpeechRecognition();
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            setTranscript(prev => prev + finalTranscript);
            updateConversationPhase(transcript + finalTranscript);
          }
        };

        recognitionRef.current.start();
      }

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
      
      // Start timer
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording started!",
        description: "Start asking discovery questions to build a comprehensive PRD",
      });

    } catch (error) {
      toast({
        title: "Recording failed",
        description: "Please check your microphone permissions",
        variant: "destructive",
      });
    }
  };

  const updateConversationPhase = async (currentTranscript: string) => {
    const wordCount = currentTranscript.split(' ').length;
    
    // Update phase based on word count
    let newPhase: 'intro' | 'discovery' | 'details' | 'validation' = 'intro';
    if (wordCount < 50) {
      newPhase = 'intro';
    } else if (wordCount < 200) {
      newPhase = 'discovery';
    } else if (wordCount < 400) {
      newPhase = 'details';
    } else {
      newPhase = 'validation';
    }
    
    setConversationPhase(newPhase);

    // Generate AI-powered prompt based on actual conversation content
    if (wordCount > 20 && !isRecording) { // Only generate when we have enough context and not actively recording
      await generateContextualPrompt(currentTranscript, newPhase);
    }
  };

  const generateContextualPrompt = async (transcript: string, phase: string) => {
    if (isGeneratingPrompt) return; // Prevent multiple simultaneous calls
    
    setIsGeneratingPrompt(true);
    
    try {
      const response = await fetch('/api/conversation/analyze-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          transcript, 
          phase,
          context: 'PRD_generation'
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Clean any emojis and special characters from the response
        const cleanPrompt = data.prompt.replace(/[👥🎯🔍💡⚡📊🛠️🎨💫🎭💝]/g, '').trim();
        setAiPrompt(cleanPrompt);
      } else {
        // Fallback to static prompts if API fails
        const fallbackPrompts = conversationPrompts[phase as keyof typeof conversationPrompts];
        setAiPrompt(fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]);
      }
    } catch (error) {
      console.error('Error generating contextual prompt:', error);
      // Fallback to static prompts
      const fallbackPrompts = conversationPrompts[phase as keyof typeof conversationPrompts];
      setAiPrompt(fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)]);
    } finally {
      setIsGeneratingPrompt(false);
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        recognitionRef.current?.start();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        recognitionRef.current?.stop();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Clean up media stream
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      toast({
        title: "Recording completed!",
        description: `Captured ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')} of conversation`,
      });
    }
  };

  const downloadTranscript = () => {
    const content = `# CONVERSATION TRANSCRIPT
Date: ${new Date().toLocaleDateString()}
Duration: ${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}
Phase: ${conversationPhase.toUpperCase()}

## CONVERSATION CONTENT
${transcript}

## SUMMARY
- Total words: ${transcript.split(' ').length}
- Conversation phase reached: ${conversationPhase}
- Ready for PRD generation: ${transcript.split(' ').length > 100 ? 'Yes' : 'No'}

Generated by Beanstalk AI Conversation Recorder`;

    const blob = new Blob([content], { type: 'text/plain' });
    downloadBlob(blob, `conversation-transcript-${Date.now()}.txt`);
    
    toast({
      title: "Transcript downloaded!",
      description: "Ready to upload for PRD generation",
    });
  };

  const generatePRDFromTranscript = () => {
    if (transcript.trim().length < 50) {
      toast({
        title: "Conversation too short",
        description: "Please record more conversation for a detailed PRD",
        variant: "destructive",
      });
      return;
    }

    onConversationComplete(transcript);
    toast({
      title: "Processing conversation...",
      description: "Generating PRD from your recorded conversation",
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'intro': return 'bg-blue-100 text-blue-800';
      case 'discovery': return 'bg-purple-100 text-purple-800';
      case 'details': return 'bg-orange-100 text-orange-800';
      case 'validation': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Recording Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Live Conversation Recorder
          </CardTitle>
          <CardDescription>
            Record customer conversations with AI-powered question prompts for comprehensive PRD generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium">
                  {isRecording ? (isPaused ? 'Paused' : 'Recording') : 'Ready'}
                </span>
              </div>
              <Badge className={getPhaseColor(conversationPhase)}>
                {conversationPhase.toUpperCase()} PHASE
              </Badge>
              <span className="text-sm text-gray-600">
                Duration: {formatDuration(duration)}
              </span>
            </div>

            <div className="flex gap-2">
              {!isRecording ? (
                <Button onClick={startRecording} className="bg-red-600 hover:bg-red-700">
                  <Mic className="w-4 h-4 mr-2" />
                  Start Recording
                </Button>
              ) : (
                <>
                  <Button onClick={pauseRecording} variant="outline">
                    {isPaused ? <Play className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
                    {isPaused ? 'Resume' : 'Pause'}
                  </Button>
                  <Button onClick={stopRecording} variant="destructive">
                    <Square className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Question Prompts */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Lightbulb className="w-5 h-5" />
            AI-Powered Question Prompts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="text-lg font-medium text-blue-900 flex-1">
                {isGeneratingPrompt ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Analyzing conversation to generate next question...
                  </div>
                ) : (
                  aiPrompt
                )}
              </div>
              {!isGeneratingPrompt && (
                <Badge className="bg-gradient-to-r from-purple-100 to-blue-100 text-purple-800 text-xs flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  AI Insights
                </Badge>
              )}
            </div>
            <div className="text-sm text-blue-700">
              <strong>Focus Area:</strong> {conversationPhase === 'intro' && 'Understanding the human problem'} 
              {conversationPhase === 'discovery' && 'Exploring user personas & emotions'}
              {conversationPhase === 'details' && 'Defining experience & brand identity'}
              {conversationPhase === 'validation' && 'Validating vision & delight moments'}
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={() => generateContextualPrompt(transcript, conversationPhase)}
                variant="outline" 
                size="sm"
                className="border-purple-300 text-purple-700 hover:bg-purple-50 flex items-center gap-1"
                disabled={isGeneratingPrompt || transcript.split(' ').length < 20}
              >
                <Zap className="w-3 h-3" />
                {isGeneratingPrompt ? 'Analyzing...' : 'Get Deeper Question'}
              </Button>
              
              {transcript.split(' ').length > 50 && (
                <Badge variant="outline" className="text-xs">
                  {transcript.split(' ').length < 100 ? 'Building context' : 
                   transcript.split(' ').length < 200 ? 'Ready for design questions' : 
                   'Deep discovery mode'}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live Transcript */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Live Transcript
            <Badge variant="outline">
              {transcript.split(' ').length} words
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg min-h-[200px] max-h-[400px] overflow-y-auto">
            {transcript ? (
              <p className="text-gray-800 whitespace-pre-wrap">{transcript}</p>
            ) : (
              <p className="text-gray-500 italic">
                Start recording to see live transcript...
              </p>
            )}
          </div>

          {transcript && (
            <div className="flex gap-3 mt-4">
              <Button onClick={downloadTranscript} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Transcript
              </Button>
              <Button onClick={generatePRDFromTranscript} className="bg-green-600 hover:bg-green-700">
                <Zap className="w-4 h-4 mr-2" />
                Generate PRD from Conversation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversation Tips */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-900">
            <Users className="w-5 h-5" />
            Conversation Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-green-800">
            <div>
              <h4 className="font-semibold mb-2">🎯 Discovery Questions</h4>
              <ul className="space-y-1">
                <li>• Ask open-ended "how" and "why" questions</li>
                <li>• Focus on user pain points and workflows</li>
                <li>• Understand current vs. desired state</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📋 PRD Requirements</h4>
              <ul className="space-y-1">
                <li>• Capture specific user personas</li>
                <li>• Define clear success metrics</li>
                <li>• Document technical constraints</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}