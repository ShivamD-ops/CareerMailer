import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertJobApplicationSchema, insertEmailTemplateSchema, insertResumeSchema } from "@shared/schema";
import { setupAuth, setupAuthRoutes, requireAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Ensure uploads directory exists
  if (!fs.existsSync("uploads")) {
    fs.mkdirSync("uploads");
  }

  // Setup authentication
  setupAuth(app);
  await setupAuthRoutes(app);

  // Update user settings
  app.patch("/api/user", requireAuth, async (req, res) => {
    try {
      const updates = req.body;
      const user = await storage.updateUser(req.session.userId!, updates);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get job applications
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const applications = await storage.getJobApplications(req.session.userId!);
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: "Failed to get applications" });
    }
  });

  // Create job application
  app.post("/api/applications", requireAuth, async (req, res) => {
    try {
      const validatedData = insertJobApplicationSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });
      const application = await storage.createJobApplication(validatedData);
      res.status(201).json(application);
    } catch (error) {
      res.status(400).json({ message: "Invalid application data", error });
    }
  });

  // Update job application
  app.patch("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const application = await storage.updateJobApplication(id, updates);
      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.json(application);
    } catch (error) {
      res.status(500).json({ message: "Failed to update application" });
    }
  });

  // Delete job application
  app.delete("/api/applications/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteJobApplication(id);
      if (!deleted) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete application" });
    }
  });

  // Parse job description with AI
  app.post("/api/parse-job", requireAuth, async (req, res) => {
    try {
      const { jobDescription } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.geminiApiKey) {
        return res.status(400).json({ message: "Gemini API key not configured" });
      }

      // Call Google Gemini API to parse job description
      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${user.geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Parse the following job description and extract key information in JSON format:
              
Job Description:
${jobDescription}

Please extract and return ONLY a valid JSON object with these fields:
- title: job title
- company: company name
- skills: array of required skills
- experience: years of experience required
- location: job location
- salary: salary range if mentioned
- requirements: array of key requirements

Example format:
{
  "title": "Software Engineer",
  "company": "Tech Corp",
  "skills": ["React", "Node.js", "TypeScript"],
  "experience": "3+ years",
  "location": "San Francisco, CA",
  "salary": "$100k-120k",
  "requirements": ["Bachelor's degree", "Problem solving skills"]
}`
            }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      }

      const geminiData = await geminiResponse.json();
      const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("No response from Gemini API");
      }

      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Could not extract JSON from Gemini response");
      }

      const parsedJob = JSON.parse(jsonMatch[0]);
      res.json(parsedJob);
    } catch (error) {
      console.error("Error parsing job:", error);
      res.status(500).json({ message: "Failed to parse job description", error: error.message });
    }
  });

  // Generate cover letter with AI
  app.post("/api/generate-cover-letter", requireAuth, async (req, res) => {
    try {
      const { jobDescription, parsedJob, userProfile } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.geminiApiKey) {
        return res.status(400).json({ message: "Gemini API key not configured" });
      }

      const prompt = `Generate a personalized cover letter for this job application:

Job Details:
- Company: ${parsedJob.company}
- Position: ${parsedJob.title}
- Required Skills: ${parsedJob.skills?.join(", ")}
- Experience Required: ${parsedJob.experience}
- Location: ${parsedJob.location}

User Profile:
- Name: ${user.name}
- Email: ${user.email}

Job Description:
${jobDescription}

Please generate a professional, personalized cover letter that:
1. Addresses the hiring manager professionally
2. Shows enthusiasm for the specific company and role
3. Highlights relevant skills and experience
4. Demonstrates knowledge of the company
5. Includes a strong call to action
6. Is concise but impactful (2-3 paragraphs)

Format as plain text, suitable for email body.`;

      const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${user.geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!geminiResponse.ok) {
        throw new Error(`Gemini API error: ${geminiResponse.statusText}`);
      }

      const geminiData = await geminiResponse.json();
      const coverLetter = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!coverLetter) {
        throw new Error("No response from Gemini API");
      }

      // Generate suggestions and analysis
      const analysisPrompt = `Analyze this cover letter and provide optimization suggestions:

Cover Letter:
${coverLetter}

Job Requirements:
${parsedJob.skills?.join(", ")}

Provide a JSON response with:
- strengths: array of 3-4 strengths identified
- suggestions: array of 3-4 optimization suggestions
- matchScore: number from 0-100 representing how well the letter matches the job
- personalization: object with recruiter insights if available

Format as valid JSON only.`;

      const analysisResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${user.geminiApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: analysisPrompt
            }]
          }]
        })
      });

      let analysis = {};
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const analysisText = analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (analysisText) {
          try {
            const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              analysis = JSON.parse(jsonMatch[0]);
            }
          } catch (e) {
            console.error("Failed to parse analysis JSON:", e);
          }
        }
      }

      res.json({
        coverLetter,
        analysis,
        subject: `Application for ${parsedJob.title} Position`
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({ message: "Failed to generate cover letter", error: error.message });
    }
  });

  // Find recruiter contacts (Apollo.io integration)
  app.post("/api/find-recruiter", requireAuth, async (req, res) => {
    try {
      const { company } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.apollioApiKey) {
        return res.status(400).json({ message: "Apollo.io API key not configured" });
      }

      // Apollo.io API call to find recruiter contacts
      const apolloResponse = await fetch("https://api.apollo.io/v1/mixed_people/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
          "X-Api-Key": user.apollioApiKey,
        },
        body: JSON.stringify({
          q_organization_name: company,
          person_titles: ["recruiter", "talent acquisition", "hr", "hiring manager"],
          page: 1,
          per_page: 5
        })
      });

      if (!apolloResponse.ok) {
        throw new Error(`Apollo API error: ${apolloResponse.statusText}`);
      }

      const apolloData = await apolloResponse.json();
      const contacts = apolloData.people?.map((person: any) => ({
        name: `${person.first_name} ${person.last_name}`,
        email: person.email,
        title: person.title,
        linkedinUrl: person.linkedin_url
      })) || [];

      res.json({ contacts });
    } catch (error) {
      console.error("Error finding recruiter:", error);
      res.status(500).json({ message: "Failed to find recruiter contacts", error: error.message });
    }
  });

  // Send email via Gmail API
  app.post("/api/send-email", requireAuth, async (req, res) => {
    try {
      const { to, subject, body, applicationId } = req.body;
      const user = await storage.getUser(req.session.userId!);
      
      if (!user?.gmailToken) {
        return res.status(400).json({ message: "Gmail not connected" });
      }

      // Simplified email sending - in production, use Gmail API
      // For now, just update the application status
      if (applicationId) {
        await storage.updateJobApplication(applicationId, {
          status: "sent",
          sentAt: new Date()
        });

        // Create analytics entry
        await storage.createEmailAnalytics({
          applicationId,
          event: "sent",
          metadata: { to, subject }
        });
      }

      res.json({ success: true, messageId: `mock-${Date.now()}` });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({ message: "Failed to send email", error: error.message });
    }
  });

  // Get email templates
  app.get("/api/templates", requireAuth, async (req, res) => {
    try {
      const templates = await storage.getEmailTemplates(req.session.userId!);
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to get templates" });
    }
  });

  // Create email template
  app.post("/api/templates", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEmailTemplateSchema.parse({
        ...req.body,
        userId: req.session.userId!,
      });
      const template = await storage.createEmailTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data", error });
    }
  });

  // Upload resume
  app.post("/api/upload-resume", requireAuth, upload.single("resume"), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const resume = await storage.createResume({
        userId: req.session.userId!,
        fileName: req.file.originalname,
        filePath: req.file.path,
        isDefault: req.body.isDefault === "true",
      });

      res.status(201).json(resume);
    } catch (error: any) {
      res.status(500).json({ message: "Failed to upload resume", error: error.message });
    }
  });

  // Get resumes
  app.get("/api/resumes", requireAuth, async (req, res) => {
    try {
      const resumes = await storage.getResumes(req.session.userId!);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Failed to get resumes" });
    }
  });

  // Get analytics summary
  app.get("/api/analytics", requireAuth, async (req, res) => {
    try {
      const analytics = await storage.getAnalyticsSummary(req.session.userId!);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to get analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
