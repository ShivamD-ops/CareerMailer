import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, RefreshCw, Save, Clock, Send, User, Lightbulb, Target, Bot, CheckCircle } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EmailTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobData?: any;
}

export default function EmailTemplateModal({ isOpen, onClose, jobData }: EmailTemplateModalProps) {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const { data: user } = useQuery({
    queryKey: ["/api/user"],
  });

  const generateCoverLetterMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/generate-cover-letter", data);
      return response.json();
    },
    onSuccess: (data) => {
      setEmailContent(data.coverLetter);
      setEmailSubject(data.subject);
      setAnalysis(data.analysis);
      toast({
        title: "Cover letter generated!",
        description: "AI has created a personalized cover letter for you.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate cover letter",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const findRecruiterMutation = useMutation({
    mutationFn: async (company: string) => {
      const response = await apiRequest("POST", "/api/find-recruiter", { company });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.contacts && data.contacts.length > 0) {
        setRecipientInfo(data.contacts[0]);
      }
    },
    onError: (error: any) => {
      console.error("Failed to find recruiter:", error);
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/send-email", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Email sent successfully!",
        description: "Your application has been sent to the recruiter.",
      });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to send email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (isOpen && jobData) {
      generateCoverLetterMutation.mutate({
        jobDescription: jobData.jobDescription,
        parsedJob: jobData.parsedJob,
        userProfile: { name: user?.name, email: user?.email },
      });

      if (jobData.parsedJob?.company) {
        findRecruiterMutation.mutate(jobData.parsedJob.company);
      }
    }
  }, [isOpen, jobData, user]);

  const handleSendEmail = () => {
    if (!recipientInfo?.email) {
      toast({
        title: "No recipient found",
        description: "Please add a recipient email address.",
        variant: "destructive",
      });
      return;
    }

    sendEmailMutation.mutate({
      to: recipientInfo.email,
      subject: emailSubject,
      body: emailContent,
    });
  };

  const handleRegenerateWithAI = () => {
    if (jobData) {
      generateCoverLetterMutation.mutate({
        jobDescription: jobData.jobDescription,
        parsedJob: jobData.parsedJob,
        userProfile: { name: user?.name, email: user?.email },
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>AI-Generated Cover Letter</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Email Composition */}
          <div>
            <h4 className="font-semibold mb-4">Email Composition</h4>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2">Subject Line</Label>
                <Input
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Application for Position"
                />
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2">Recipient</Label>
                {recipientInfo ? (
                  <div className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{recipientInfo.name}</p>
                      <p className="text-sm text-muted-foreground">{recipientInfo.email}</p>
                      <p className="text-xs text-muted-foreground">{recipientInfo.title}</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-muted rounded-lg text-center text-muted-foreground">
                    {findRecruiterMutation.isPending ? "Finding recruiter..." : "No recruiter found"}
                  </div>
                )}
              </div>
              
              <div>
                <Label className="text-sm font-medium mb-2">Cover Letter</Label>
                <Textarea
                  rows={12}
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder="Your cover letter will appear here..."
                  disabled={generateCoverLetterMutation.isPending}
                />
                {generateCoverLetterMutation.isPending && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-2 border-gmail-blue border-t-transparent rounded-full mr-2" />
                    <span>Generating personalized cover letter...</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* AI Analysis & Suggestions */}
          <div>
            <h4 className="font-semibold mb-4">AI Analysis & Suggestions</h4>
            <div className="space-y-4">
              {analysis?.strengths && (
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-green-700 mb-2">
                      <CheckCircle className="inline mr-2 h-4 w-4" />
                      Strengths Identified
                    </h5>
                    <ul className="text-sm space-y-1">
                      {analysis.strengths.map((strength: string, index: number) => (
                        <li key={index}>• {strength}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {analysis?.suggestions && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-gmail-blue mb-2">
                      <Lightbulb className="inline mr-2 h-4 w-4" />
                      Optimization Suggestions
                    </h5>
                    <ul className="text-sm space-y-1">
                      {analysis.suggestions.map((suggestion: string, index: number) => (
                        <li key={index}>• {suggestion}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
              
              {analysis?.matchScore && (
                <Card className="border-yellow-200 bg-yellow-50">
                  <CardContent className="p-4">
                    <h5 className="font-medium text-yellow-600 mb-2">
                      <Target className="inline mr-2 h-4 w-4" />
                      Match Score: {analysis.matchScore}%
                    </h5>
                    <p className="text-sm">Your background strongly aligns with the job requirements.</p>
                  </CardContent>
                </Card>
              )}
              
              <Card>
                <CardContent className="p-4">
                  <h5 className="font-medium mb-2">
                    <Bot className="inline mr-2 h-4 w-4" />
                    AI Personalization
                  </h5>
                  <p className="text-sm text-muted-foreground mb-2">Based on recruiter's profile:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Professional with 5+ years in tech recruiting</li>
                    <li>• Experience at leading technology companies</li>
                    <li>• Focus on finding top engineering talent</li>
                    <li>• Active in tech community networking</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-6 border-t border-border">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleRegenerateWithAI}
              disabled={generateCoverLetterMutation.isPending}
              className="text-gmail-blue border-gmail-blue hover:bg-blue-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Regenerate with AI
            </Button>
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save as Template
            </Button>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline">
              <Clock className="mr-2 h-4 w-4" />
              Schedule Send
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isPending || !emailContent.trim()}
              className="bg-gmail-blue text-white hover:bg-blue-600"
            >
              {sendEmailMutation.isPending ? (
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Send Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
