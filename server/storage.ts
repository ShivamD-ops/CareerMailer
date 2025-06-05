import { 
  users, 
  jobApplications, 
  emailTemplates, 
  resumes, 
  emailAnalytics,
  type User, 
  type InsertUser,
  type JobApplication,
  type InsertJobApplication,
  type EmailTemplate,
  type InsertEmailTemplate,
  type Resume,
  type InsertResume,
  type EmailAnalytics,
  type InsertEmailAnalytics
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;

  // Job Application methods
  getJobApplications(userId: number): Promise<JobApplication[]>;
  getJobApplication(id: number): Promise<JobApplication | undefined>;
  createJobApplication(application: InsertJobApplication): Promise<JobApplication>;
  updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined>;
  deleteJobApplication(id: number): Promise<boolean>;

  // Email Template methods
  getEmailTemplates(userId: number): Promise<EmailTemplate[]>;
  getEmailTemplate(id: number): Promise<EmailTemplate | undefined>;
  createEmailTemplate(template: InsertEmailTemplate): Promise<EmailTemplate>;
  updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined>;
  deleteEmailTemplate(id: number): Promise<boolean>;

  // Resume methods
  getResumes(userId: number): Promise<Resume[]>;
  getDefaultResume(userId: number): Promise<Resume | undefined>;
  createResume(resume: InsertResume): Promise<Resume>;
  updateResume(id: number, updates: Partial<Resume>): Promise<Resume | undefined>;
  deleteResume(id: number): Promise<boolean>;

  // Analytics methods
  getEmailAnalytics(applicationId: number): Promise<EmailAnalytics[]>;
  createEmailAnalytics(analytics: InsertEmailAnalytics): Promise<EmailAnalytics>;
  getAnalyticsSummary(userId: number): Promise<{
    totalApplications: number;
    responseRate: number;
    interviewCount: number;
    deliveryRate: number;
    openRate: number;
    replyRate: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private jobApplications: Map<number, JobApplication>;
  private emailTemplates: Map<number, EmailTemplate>;
  private resumes: Map<number, Resume>;
  private emailAnalytics: Map<number, EmailAnalytics>;
  private currentUserId: number;
  private currentApplicationId: number;
  private currentTemplateId: number;
  private currentResumeId: number;
  private currentAnalyticsId: number;

  constructor() {
    this.users = new Map();
    this.jobApplications = new Map();
    this.emailTemplates = new Map();
    this.resumes = new Map();
    this.emailAnalytics = new Map();
    this.currentUserId = 1;
    this.currentApplicationId = 1;
    this.currentTemplateId = 1;
    this.currentResumeId = 1;
    this.currentAnalyticsId = 1;

    // Create default user
    this.createUser({
      username: "john_doe",
      password: "password123",
      email: "john.doe@gmail.com",
      name: "John Doe",
      gmailConnected: true,
      geminiApiKey: process.env.GEMINI_API_KEY || "",
      apollioApiKey: process.env.APOLLO_API_KEY || "",
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      gmailConnected: insertUser.gmailConnected ?? false,
      gmailToken: insertUser.gmailToken ?? null,
      apollioApiKey: insertUser.apollioApiKey ?? null,
      geminiApiKey: insertUser.geminiApiKey ?? null,
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getJobApplications(userId: number): Promise<JobApplication[]> {
    return Array.from(this.jobApplications.values())
      .filter(app => app.userId === userId)
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
  }

  async getJobApplication(id: number): Promise<JobApplication | undefined> {
    return this.jobApplications.get(id);
  }

  async createJobApplication(insertApplication: InsertJobApplication): Promise<JobApplication> {
    const id = this.currentApplicationId++;
    const application: JobApplication = {
      ...insertApplication,
      id,
      createdAt: new Date(),
      sentAt: null,
    };
    this.jobApplications.set(id, application);
    return application;
  }

  async updateJobApplication(id: number, updates: Partial<JobApplication>): Promise<JobApplication | undefined> {
    const application = this.jobApplications.get(id);
    if (!application) return undefined;
    
    const updatedApplication = { ...application, ...updates };
    this.jobApplications.set(id, updatedApplication);
    return updatedApplication;
  }

  async deleteJobApplication(id: number): Promise<boolean> {
    return this.jobApplications.delete(id);
  }

  async getEmailTemplates(userId: number): Promise<EmailTemplate[]> {
    return Array.from(this.emailTemplates.values())
      .filter(template => template.userId === userId);
  }

  async getEmailTemplate(id: number): Promise<EmailTemplate | undefined> {
    return this.emailTemplates.get(id);
  }

  async createEmailTemplate(insertTemplate: InsertEmailTemplate): Promise<EmailTemplate> {
    const id = this.currentTemplateId++;
    const template: EmailTemplate = {
      ...insertTemplate,
      id,
      createdAt: new Date(),
    };
    this.emailTemplates.set(id, template);
    return template;
  }

  async updateEmailTemplate(id: number, updates: Partial<EmailTemplate>): Promise<EmailTemplate | undefined> {
    const template = this.emailTemplates.get(id);
    if (!template) return undefined;
    
    const updatedTemplate = { ...template, ...updates };
    this.emailTemplates.set(id, updatedTemplate);
    return updatedTemplate;
  }

  async deleteEmailTemplate(id: number): Promise<boolean> {
    return this.emailTemplates.delete(id);
  }

  async getResumes(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values())
      .filter(resume => resume.userId === userId);
  }

  async getDefaultResume(userId: number): Promise<Resume | undefined> {
    return Array.from(this.resumes.values())
      .find(resume => resume.userId === userId && resume.isDefault);
  }

  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.currentResumeId++;
    const resume: Resume = {
      ...insertResume,
      id,
      createdAt: new Date(),
    };
    this.resumes.set(id, resume);
    return resume;
  }

  async updateResume(id: number, updates: Partial<Resume>): Promise<Resume | undefined> {
    const resume = this.resumes.get(id);
    if (!resume) return undefined;
    
    const updatedResume = { ...resume, ...updates };
    this.resumes.set(id, updatedResume);
    return updatedResume;
  }

  async deleteResume(id: number): Promise<boolean> {
    return this.resumes.delete(id);
  }

  async getEmailAnalytics(applicationId: number): Promise<EmailAnalytics[]> {
    return Array.from(this.emailAnalytics.values())
      .filter(analytics => analytics.applicationId === applicationId);
  }

  async createEmailAnalytics(insertAnalytics: InsertEmailAnalytics): Promise<EmailAnalytics> {
    const id = this.currentAnalyticsId++;
    const analytics: EmailAnalytics = {
      ...insertAnalytics,
      id,
      timestamp: new Date(),
    };
    this.emailAnalytics.set(id, analytics);
    return analytics;
  }

  async getAnalyticsSummary(userId: number): Promise<{
    totalApplications: number;
    responseRate: number;
    interviewCount: number;
    deliveryRate: number;
    openRate: number;
    replyRate: number;
  }> {
    const applications = await this.getJobApplications(userId);
    const totalApplications = applications.length;
    
    const sentApplications = applications.filter(app => app.status === "sent" || app.status === "delivered" || app.status === "opened" || app.status === "replied");
    const repliedApplications = applications.filter(app => app.status === "replied");
    const interviewCount = repliedApplications.length; // Simplified for demo
    
    // Simplified analytics calculation
    const deliveryRate = sentApplications.length > 0 ? (sentApplications.length / totalApplications) * 100 : 0;
    const openRate = sentApplications.length > 0 ? 68 : 0; // Mock data for demo
    const responseRate = sentApplications.length > 0 ? (repliedApplications.length / sentApplications.length) * 100 : 0;
    const replyRate = responseRate;

    return {
      totalApplications,
      responseRate: Math.round(responseRate),
      interviewCount,
      deliveryRate: Math.round(deliveryRate),
      openRate: Math.round(openRate),
      replyRate: Math.round(replyRate),
    };
  }
}

export const storage = new MemStorage();
