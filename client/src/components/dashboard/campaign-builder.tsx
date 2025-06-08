import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Search, ArrowRight, Bot, Save, Plus, X, Mail } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function CampaignBuilder() {
  const [step, setStep] = useState(1);
  const [jobUrl, setJobUrl] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [parsedJob, setParsedJob] = useState<any>(null);
  const [recruiterEmails, setRecruiterEmails] = useState<string[]>([""]);
  const [userProfile, setUserProfile] = useState({
    name: "shivam",
    email: "shivam.devaser2@gmail.com",
    title: "",
  });
  const [resume, setResume] = useState<File | null>(null);
  const [coverLetter, setCoverLetter] = useState<string>("");
  const [emailSubject, setEmailSubject] = useState<string>("");
  const { toast } = useToast();

  const parseJobMutation = useMutation({
    mutationFn: async (data: { jobDescription: string }) => {
      const response = await apiRequest("POST", "/api/parse-job", data);
      return response.json();
    },
    onSuccess: (data) => {
      setParsedJob(data);
      toast({ title: "Job parsed successfully!" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to parse job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateCoverLetterMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/generate-cover-letter", {
        jobDescription,
        parsedJob,
        userProfile,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setCoverLetter(data.coverLetter);
      setEmailSubject(data.subject);
      setStep(6);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to generate cover letter",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleNext = () => {
    if (step === 1 && parsedJob) setStep(2);
    else if (
      step === 2 &&
      recruiterEmails.every((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim()))
    )
      setStep(3);
    else if (step === 3 && userProfile.name && userProfile.email) setStep(4);
    else if (step === 4 && resume) setStep(5);
    else if (step === 5) generateCoverLetterMutation.mutate();
  };

  const stepLabels = ["Job", "Emails", "Profile", "Resume", "Generate", "Send"];
const sendEmails = async () => {
  if (!resume) {
    toast({ title: "Resume is required", variant: "destructive" });
    return;
  }

  for (let i = 0; i < recruiterEmails.length; i++) {
    const email = recruiterEmails[i].trim();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: `Invalid email: ${email}`,
        variant: "destructive",
      });
      continue;
    }

    const formData = new FormData();
    formData.append("subject", emailSubject);
    formData.append("text", coverLetter);
    formData.append("html", coverLetter);
    formData.append("to", JSON.stringify([email])); // 🔧 wrap in array
    formData.append("resume", resume);

    try {
      const res = await fetch("/api/send/mail", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        toast({ title: `Email sent to ${email}` });
      } else {
        throw new Error(data.error || "Unknown error");
      }
    } catch (err: any) {
      toast({
        title: `Failed to send to ${email}`,
        description: err.message,
        variant: "destructive",
      });
    }

    // Add 10 second gap before next email (except last)
    if (i < recruiterEmails.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
    }
  }
};

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create New Campaign</h2>
          <span className="text-sm text-muted-foreground">
            Step {step} of 6
          </span>
        </div>
        <div className="mb-6">
          <div className="flex justify-between text-sm mb-2">
            {stepLabels.map((label, i) => (
              <span
                key={i}
                className={
                  step === i + 1
                    ? "font-medium text-gmail-blue"
                    : "text-muted-foreground"
                }
              >
                {label}
              </span>
            ))}
          </div>
          <Progress value={(step / 6) * 100} className="h-2" />
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Label>Job Description</Label>
            <Textarea
              rows={6}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
            />
            <Button
              onClick={() => parseJobMutation.mutate({ jobDescription })}
              disabled={parseJobMutation.isPending}
            >
              Parse
            </Button>
            {parsedJob && (
              <pre className="bg-muted p-4 rounded text-sm">
                {JSON.stringify(parsedJob, null, 2)}
              </pre>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label>Recruiter Emails</Label>
            {recruiterEmails.map((email, idx) => (
              <div key={idx} className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) =>
                    setRecruiterEmails((prev) =>
                      prev.map((v, i) => (i === idx ? e.target.value : v))
                    )
                  }
                />
                <Button
                  onClick={() =>
                    setRecruiterEmails((prev) =>
                      prev.filter((_, i) => i !== idx)
                    )
                  }
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
            <Button onClick={() => setRecruiterEmails((prev) => [...prev, ""])}>
              <Plus size={16} className="mr-2" />
              Add
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Label>Describe yourself</Label>
            <Input
              value={userProfile.title}
              onChange={(e) =>
                setUserProfile({ ...userProfile, title: e.target.value })
              }
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Label>Upload Resume</Label>
            <Input
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => setResume(e.target.files?.[0] ?? null)}
            />
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <p>Generating cover letter...</p>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <Label>Email Preview</Label>
            <p className="font-medium">Subject: {emailSubject}</p>
            <Textarea
              rows={10}
              value={coverLetter}
              readOnly
              className="bg-muted"
            />
            <Button onClick={sendEmails}>
              <Mail className="mr-2 h-4 w-4" />
              Send Emails
            </Button>
          </div>
        )}

        {step < 6 && (
          <div className="mt-6 flex justify-end">
            <Button onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
