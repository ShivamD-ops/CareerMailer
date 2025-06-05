import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Search, ArrowRight, Bot, Save } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface CampaignBuilderProps {
  onGenerateCoverLetter: (jobData: any) => void;
}

export default function CampaignBuilder({ onGenerateCoverLetter }: CampaignBuilderProps) {
  const [step, setStep] = useState(1);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsedJob, setParsedJob] = useState<any>(null);
  const { toast } = useToast();

  const parseJobMutation = useMutation({
    mutationFn: async (data: { jobDescription: string }) => {
      const response = await apiRequest("POST", "/api/parse-job", data);
      return response.json();
    },
    onSuccess: (data) => {
      setParsedJob(data);
      toast({
        title: "Job parsed successfully!",
        description: "AI has analyzed the job description.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to parse job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleParseJob = () => {
    if (!jobDescription.trim()) {
      toast({
        title: "Job description required",
        description: "Please enter a job description to parse.",
        variant: "destructive",
      });
      return;
    }
    parseJobMutation.mutate({ jobDescription });
  };

  const handleGenerateCoverLetter = () => {
    if (!parsedJob) {
      toast({
        title: "Parse job first",
        description: "Please parse the job description before generating a cover letter.",
        variant: "destructive",
      });
      return;
    }
    
    onGenerateCoverLetter({
      jobDescription,
      parsedJob,
    });
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Campaign</h2>
          <span className="text-sm text-muted-foreground">Step 1 of 4</span>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gmail-blue">Job Description</span>
            <span className="text-sm text-muted-foreground">Cover Letter</span>
            <span className="text-sm text-muted-foreground">Recipients</span>
            <span className="text-sm text-muted-foreground">Send</span>
          </div>
          <Progress value={25} className="h-2" />
        </div>

        {/* Job Description Input */}
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-foreground mb-2">Job Description URL or Text</Label>
            <div className="flex space-x-3">
              <Input
                type="url"
                placeholder="https://linkedin.com/jobs/..."
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={handleParseJob}
                disabled={parseJobMutation.isPending || !jobDescription.trim()}
                className="bg-gmail-blue text-white hover:bg-blue-600"
              >
                {parseJobMutation.isPending ? (
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                ) : (
                  <Search className="mr-2 h-4 w-4" />
                )}
                Parse
              </Button>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Label className="text-sm font-medium text-foreground mb-2">Or paste job description directly:</Label>
            <Textarea
              rows={8}
              className="w-full"
              placeholder="Paste the complete job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          {/* Parsed Job Info Preview */}
          {parsedJob && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium text-gmail-blue mb-2">
                <Bot className="inline mr-2 h-4 w-4" />
                AI Analysis Preview
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-foreground">Position:</p>
                  <p className="text-muted-foreground">{parsedJob.title}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Company:</p>
                  <p className="text-muted-foreground">{parsedJob.company}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Key Skills:</p>
                  <p className="text-muted-foreground">{parsedJob.skills?.join(", ")}</p>
                </div>
                <div>
                  <p className="font-medium text-foreground">Experience:</p>
                  <p className="text-muted-foreground">{parsedJob.experience}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <Button variant="outline">
              <Save className="mr-2 h-4 w-4" />
              Save Draft
            </Button>
            <Button
              onClick={handleGenerateCoverLetter}
              disabled={!parsedJob}
              className="bg-gmail-blue text-white hover:bg-blue-600"
            >
              Generate Cover Letter
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
