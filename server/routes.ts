import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  insertJobApplicationSchema,
  insertEmailTemplateSchema,
  insertResumeSchema,
} from "@shared/schema";
import { setupAuth, setupAuthRoutes, requireAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { google } from "googleapis";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
dotenv.config();
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

      // If both Gmail tokens are provided, mark Gmail as connected
      if (updates.gmailAccessToken && updates.gmailRefreshToken) {
        updates.gmailConnected = true;
      }

      const user = await storage.updateUser(req.session.userId!, updates);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("User updated:", user);
      res.json(user);
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  // Get job applications
  app.get("/api/applications", requireAuth, async (req, res) => {
    try {
      const applications = await storage.getJobApplications(
        req.session.userId!
      );
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

      if (!jobDescription) {
        return res.status(400).json({ message: "Job description is required" });
      }

      console.log("🔍 Received job description for parsing.");

      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        console.error("❌ User not found for session:", req.session.userId);
        return res.status(404).json({ message: "User not found" });
      }

      if (!user.geminiApiKey || !user.geminiApiKey.startsWith("AIza")) {
        console.warn("⚠️ Invalid or missing Gemini API key for user:", user.id);
        return res.status(400).json({ message: "Invalid Gemini API key" });
      }

      const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${user.geminiApiKey}`;

      console.log("✅ Calling Gemini API...");

      const geminiResponse = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
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
}`,
                },
              ],
            },
          ],
        }),
      });

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error(
          "❌ Gemini API failed:",
          geminiResponse.status,
          errorText
        );
        return res.status(502).json({
          message: "Gemini API error",
          error: `Gemini API error: ${geminiResponse.statusText}`,
          body: errorText,
        });
      }

      const geminiData = await geminiResponse.json();
      console.log(
        "📨 Gemini API raw response:",
        JSON.stringify(geminiData, null, 2)
      );

      const text = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.error("❌ Gemini response missing 'text' content.");
        return res
          .status(500)
          .json({ message: "No valid content from Gemini API" });
      }

      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error(
          "❌ Failed to extract JSON from Gemini response text:",
          text
        );
        return res
          .status(500)
          .json({ message: "Invalid JSON format in Gemini response" });
      }

      let parsedJob;
      try {
        parsedJob = JSON.parse(jsonMatch[0]);
      } catch (err) {
        console.error("❌ JSON parse error:", err);
        return res.status(500).json({
          message: "Failed to parse extracted JSON",
          error: String(err),
        });
      }

      console.log("✅ Successfully parsed job:", parsedJob);
      return res.json(parsedJob);
    } catch (error) {
      console.error("🔥 Internal error while parsing job:", error);
      res.status(500).json({
        message: "Failed to parse job description",
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error),
      });
    }
  });

  // Generate cover letter with AI
  app.post("/api/generate-cover-letter", requireAuth, async (req, res) => {
    try {
      const { jobDescription, parsedJob, userProfile } = req.body;
      const user = await storage.getUser(req.session.userId!);

      if (!user?.geminiApiKey || !user.geminiApiKey.startsWith("AIza")) {
        return res
          .status(400)
          .json({ message: "Gemini API key not configured or invalid" });
      }

      const model = "gemini-2.0-flash";
      const baseURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${user.geminiApiKey}`;

      const prompt = `
Generate a concise, one-paragraph professional cover letter for the following job:

Job Title: ${parsedJob.title}
Company: ${parsedJob.company}
Required Skills: ${parsedJob.skills?.join(", ")}
Experience: ${parsedJob.experience}
Location: ${parsedJob.location}
Sender Profile: ${userProfile.title}
Job Description:
${jobDescription}

The letter should:

Be addressed to the hiring manager (no specific name)

Express enthusiasm for the role and the company

Include no placeholders

Convey confidence and eagerness to contribute

Be formatted as a simple HTML <p> paragraph (no headers, no complex styling)

End with Regards, Shivam Devaser
`;

      const geminiResponse = await fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      });

      if (!geminiResponse.ok) {
        const errBody = await geminiResponse.text();
        throw new Error(
          `Gemini API error: ${geminiResponse.statusText}, ${errBody}`
        );
      }

      const geminiData = await geminiResponse.json();
      const coverLetter = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!coverLetter) {
        throw new Error("No response from Gemini API");
      }

      const analysisPrompt = `
Analyze this one-paragraph cover letter and provide improvement suggestions:

Cover Letter:
${coverLetter}

Job Skills:
${parsedJob.skills?.join(", ")}

Respond in pure JSON with:
{
  "strengths": [string],
  "suggestions": [string],
  "matchScore": number (0-100),
  "personalization": { "insight": string }
}
`;

      const analysisResponse = await fetch(baseURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
        }),
      });

      let analysis = {};
      if (analysisResponse.ok) {
        const analysisData = await analysisResponse.json();
        const analysisText =
          analysisData.candidates?.[0]?.content?.parts?.[0]?.text;
        try {
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            analysis = JSON.parse(jsonMatch[0]);
          }
        } catch (err) {
          console.error("❌ Failed to parse analysis JSON:", err);
        }
      } else {
        console.warn(
          "⚠️ Analysis API call failed:",
          await analysisResponse.text()
        );
      }

      res.json({
        coverLetter,
        analysis,
        subject: `Application for ${parsedJob.title} Position`,
      });
    } catch (error) {
      console.error("Error generating cover letter:", error);
      res.status(500).json({
        message: "Failed to generate cover letter",
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error),
      });
    }
  });

  // Find recruiter contacts (Apollo.io integration)
  app.post("/api/find-recruiter", requireAuth, async (req, res) => {
    try {
      const { company } = req.body;
      const user = await storage.getUser(req.session.userId!);

      if (!user?.apollioApiKey) {
        return res
          .status(400)
          .json({ message: "Apollo.io API key not configured" });
      }

      // Apollo.io API call to find recruiter contacts
      const apolloResponse = await fetch(
        "https://api.apollo.io/v1/mixed_people/search",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
            "X-Api-Key": user.apollioApiKey,
          },
          body: JSON.stringify({
            q_organization_name: company,
            person_titles: [
              "recruiter",
              "talent acquisition",
              "hr",
              "hiring manager",
            ],
            page: 1,
            per_page: 5,
          }),
        }
      );

      if (!apolloResponse.ok) {
        throw new Error(`Apollo API error: ${apolloResponse.statusText}`);
      }

      const apolloData = await apolloResponse.json();
      const contacts =
        apolloData.people?.map((person: any) => ({
          name: `${person.first_name} ${person.last_name}`,
          email: person.email,
          title: person.title,
          linkedinUrl: person.linkedin_url,
        })) || [];

      res.json({ contacts });
    } catch (error) {
      console.error("Error finding recruiter:", error);
      res.status(500).json({
        message: "Failed to find recruiter contacts",
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error),
      });
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
          sentAt: new Date(),
        });

        // Create analytics entry
        await storage.createEmailAnalytics({
          applicationId,
          event: "sent",
          metadata: { to, subject },
        });
      }

      res.json({ success: true, messageId: `mock-${Date.now()}` });
    } catch (error) {
      console.error("Error sending email:", error);
      res.status(500).json({
        message: "Failed to send email",
        error:
          typeof error === "object" && error !== null && "message" in error
            ? (error as any).message
            : String(error),
      });
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
  app.post(
    "/api/upload-resume",
    requireAuth,
    upload.single("resume"),
    async (req: any, res) => {
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
        res
          .status(500)
          .json({ message: "Failed to upload resume", error: error.message });
      }
    }
  );

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

  app.post("/api/send/mail", upload.single("resume"), async (req, res) => {
    const { subject, text, html, to } = req.body;
    const userId = req.session?.userId;

    if (!userId) return res.status(401).send({ error: "Unauthorized" });

    const user = await storage.getUser(userId);
    if (!user || !user.gmailConnected || !user.gmailRefreshToken)
      return res.status(400).send({ error: "Gmail not connected" });

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      process.env.GOOGLE_REDIRECT_URI!
    );

    oAuth2Client.setCredentials({ refresh_token: user.gmailRefreshToken });

    try {
      const accessToken = await oAuth2Client.getAccessToken();

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: user.email,
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          refreshToken: user.gmailRefreshToken,
          accessToken: accessToken.token!,
        },
      });
      const recipients = Array.isArray(to) ? to : JSON.parse(to);
      const cleanEmails = recipients.map((email: string) =>
        email.trim().replace(/[\[\]<>]/g, "")
      );

      const mailOptions = {
        from: `${user.name} <${user.email}>`,
        to: cleanEmails.join(", "),
        subject,
        text,
        html,
        attachments: req.file
          ? [
              {
                filename: req.file.originalname,
                path: req.file.path,
              },
            ]
          : [],
      };

      const info = await transporter.sendMail(mailOptions);
      res.send({ message: "Email sent", info });
    } catch (error) {
      console.error(error);
      res.status(500).send({ error: "Failed to send email" });
    } finally {
      // Clean up the uploaded file
      if (req.file) fs.unlinkSync(req.file.path);
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
// Gmail OAuth2 setup

// const oauth2Client = new google.auth.OAuth2(
//   process.env.GOOGLE_CLIENT_ID!,
//   process.env.GOOGLE_CLIENT_SECRET!,
//   process.env.GOOGLE_REDIRECT_URI!
// );

// // Step 1: Generate Auth URL
// app.get("/api/gmail/connect", requireAuth, (req, res) => {
//   const url = oauth2Client.generateAuthUrl({
//     access_type: "offline",
//     scope: [
//       "https://www.googleapis.com/auth/gmail.send",
//       "https://www.googleapis.com/auth/userinfo.email",
//     ],
//     prompt: "consent",
//   });
//   res.json({ url });
// });

// // Step 2: Callback endpoint to handle OAuth2 redirect
// app.get("/api/gmail/callback", async (req, res) => {
//   const code = req.query.code as string;

//   try {
//     const { tokens } = await oauth2Client.getToken(code);
//     oauth2Client.setCredentials(tokens);

//     const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
//     const { data } = await oauth2.userinfo.get();

//     const userEmail = data.email;
//     const user = await storage.findUserByEmail(userEmail!); // Make sure this is implemented

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     await storage.updateUser(user.id, {
//       gmailToken: tokens.access_token,
//       gmailRefreshToken: tokens.refresh_token,
//     });

//     res.send("Gmail successfully connected! You can now close this tab.");
//   } catch (error) {
//     console.error("Gmail OAuth2 error:", error);
//     res.status(500).json({ message: "Failed to connect Gmail" });
//   }
// });
