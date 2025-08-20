import {
  users,
  datasets,
  processingJobs,
  insights,
  reports,
  notifications,
  activityLogs,
  roles,
  type User,
  type UpsertUser,
  type Dataset,
  type InsertDataset,
  type ProcessingJob,
  type InsertProcessingJob,
  type Insight,
  type InsertInsight,
  type Report,
  type InsertReport,
  type Notification,
  type InsertNotification,
  type ActivityLog,
  type InsertActivityLog,
  type Role,
  type InsertRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, like, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  updateUserRole(userId: string, role: string): Promise<void>;
  updateUserStatus(userId: string, isActive: boolean): Promise<void>;

  // Role operations
  getAllRoles(): Promise<Role[]>;
  createRole(role: InsertRole): Promise<Role>;
  updateRole(id: number, role: Partial<InsertRole>): Promise<Role>;
  deleteRole(id: number): Promise<void>;

  // Dataset operations
  getAllDatasets(): Promise<Dataset[]>;
  getDatasetsByUser(userId: string): Promise<Dataset[]>;
  createDataset(dataset: InsertDataset): Promise<Dataset>;
  updateDatasetStatus(id: number, status: string): Promise<void>;
  deleteDataset(id: number): Promise<void>;

  // Processing job operations
  getAllProcessingJobs(): Promise<ProcessingJob[]>;
  createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob>;
  updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<void>;
  getActiveProcessingJobs(): Promise<ProcessingJob[]>;

  // Insight operations
  getAllInsights(): Promise<Insight[]>;
  getInsightsByDataset(datasetId: number): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;

  // Report operations
  getAllReports(): Promise<Report[]>;
  getReportsByUser(userId: string): Promise<Report[]>;
  createReport(report: InsertReport): Promise<Report>;

  // Notification operations
  getUserNotifications(userId: string): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<void>;
  getUnreadNotificationCount(userId: string): Promise<number>;

  // Activity log operations
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  getUserActivityLogs(userId: string): Promise<ActivityLog[]>;
  getAllActivityLogs(): Promise<ActivityLog[]>;

  // Dashboard metrics
  getDashboardMetrics(): Promise<{
    totalDatasets: number;
    activeJobs: number;
    totalInsights: number;
    storageUsed: string;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  async updateUserRole(userId: string, role: string): Promise<void> {
    await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserStatus(userId: string, isActive: boolean): Promise<void> {
    await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Role operations
  async getAllRoles(): Promise<Role[]> {
    return await db.select().from(roles).orderBy(roles.name);
  }

  async createRole(role: InsertRole): Promise<Role> {
    const [newRole] = await db.insert(roles).values(role).returning();
    return newRole;
  }

  async updateRole(id: number, roleData: Partial<InsertRole>): Promise<Role> {
    const [updatedRole] = await db
      .update(roles)
      .set({ ...roleData, updatedAt: new Date() })
      .where(eq(roles.id, id))
      .returning();
    return updatedRole;
  }

  async deleteRole(id: number): Promise<void> {
    await db.delete(roles).where(eq(roles.id, id));
  }

  // Dataset operations
  async getAllDatasets(): Promise<Dataset[]> {
    return await db.select().from(datasets).orderBy(desc(datasets.createdAt));
  }

  async getDatasetsByUser(userId: string): Promise<Dataset[]> {
    return await db
      .select()
      .from(datasets)
      .where(eq(datasets.uploadedBy, userId))
      .orderBy(desc(datasets.createdAt));
  }

  async createDataset(dataset: InsertDataset): Promise<Dataset> {
    const [newDataset] = await db.insert(datasets).values(dataset).returning();
    return newDataset;
  }

  async updateDatasetStatus(id: number, status: string): Promise<void> {
    await db
      .update(datasets)
      .set({ status, updatedAt: new Date() })
      .where(eq(datasets.id, id));
  }

  async deleteDataset(id: number): Promise<void> {
    await db.delete(datasets).where(eq(datasets.id, id));
  }

  // Processing job operations
  async getAllProcessingJobs(): Promise<ProcessingJob[]> {
    return await db
      .select()
      .from(processingJobs)
      .orderBy(desc(processingJobs.createdAt));
  }

  async createProcessingJob(job: InsertProcessingJob): Promise<ProcessingJob> {
    const [newJob] = await db.insert(processingJobs).values(job).returning();
    return newJob;
  }

  async updateProcessingJob(id: number, updates: Partial<ProcessingJob>): Promise<void> {
    await db
      .update(processingJobs)
      .set(updates)
      .where(eq(processingJobs.id, id));
  }

  async getActiveProcessingJobs(): Promise<ProcessingJob[]> {
    return await db
      .select()
      .from(processingJobs)
      .where(or(
        eq(processingJobs.status, "pending"),
        eq(processingJobs.status, "running")
      ))
      .orderBy(desc(processingJobs.createdAt));
  }

  // Insight operations
  async getAllInsights(): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .orderBy(desc(insights.createdAt));
  }

  async getInsightsByDataset(datasetId: number): Promise<Insight[]> {
    return await db
      .select()
      .from(insights)
      .where(eq(insights.datasetId, datasetId))
      .orderBy(desc(insights.createdAt));
  }

  async createInsight(insight: InsertInsight): Promise<Insight> {
    const [newInsight] = await db.insert(insights).values(insight).returning();
    return newInsight;
  }

  // Report operations
  async getAllReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(desc(reports.createdAt));
  }

  async getReportsByUser(userId: string): Promise<Report[]> {
    return await db
      .select()
      .from(reports)
      .where(eq(reports.generatedBy, userId))
      .orderBy(desc(reports.createdAt));
  }

  async createReport(report: InsertReport): Promise<Report> {
    const [newReport] = await db.insert(reports).values(report).returning();
    return newReport;
  }

  // Notification operations
  async getUserNotifications(userId: string): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(10);
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result.count;
  }

  // Activity log operations
  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [newLog] = await db.insert(activityLogs).values(log).returning();
    return newLog;
  }

  async getUserActivityLogs(userId: string): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.userId, userId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(20);
  }

  async getAllActivityLogs(): Promise<ActivityLog[]> {
    return await db
      .select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(50);
  }

  // Dashboard metrics
  async getDashboardMetrics(): Promise<{
    totalDatasets: number;
    activeJobs: number;
    totalInsights: number;
    storageUsed: string;
  }> {
    const [datasetCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(datasets);

    const [activeJobCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(processingJobs)
      .where(or(
        eq(processingJobs.status, "pending"),
        eq(processingJobs.status, "running")
      ));

    const [insightCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(insights);

    const [storageResult] = await db
      .select({ total: sql<number>`sum(file_size)` })
      .from(datasets);

    const totalBytes = storageResult.total || 0;
    const storageUsed = totalBytes > 0 ? `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB` : "0 GB";

    return {
      totalDatasets: datasetCount.count,
      activeJobs: activeJobCount.count,
      totalInsights: insightCount.count,
      storageUsed,
    };
  }
}

export const storage = new DatabaseStorage();
