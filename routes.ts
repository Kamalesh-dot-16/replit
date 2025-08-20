import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertDatasetSchema, insertReportSchema } from "@shared/schema";
import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ❌ Removed authentication setup
  // await setupAuth(app);

  // Optional middleware to fake a user if needed
  app.use((req, res, next) => {
    req.user = { sub: 'anonymous' }; // Simulate a logged-in user
    next();
  });

  // Example landing page redirect (optional)
  app.get('/', (req, res) => {
    res.redirect('/dashboard'); // Change to your desired default page
  });

  app.get('/api/auth/user', async (req: any, res) => {
    try {
      const userId = req.user.sub || 'anonymous';
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.get('/api/dashboard/metrics', async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  app.get('/api/dashboard/recent-activity', async (req: any, res) => {
    try {
      const userId = req.user.sub || 'anonymous';
      const activities = await storage.getUserActivityLogs(userId);
      res.json(activities);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
      res.status(500).json({ message: "Failed to fetch recent activity" });
    }
  });

  app.get('/api/datasets', async (req: any, res) => {
    try {
      const userId = req.user.sub || 'anonymous';
      const user = await storage.getUser(userId);

      let datasets;
      if (user?.role === 'admin') {
        datasets = await storage.getAllDatasets();
      } else {
        datasets = await storage.getDatasetsByUser(userId);
      }

      res.json(datasets);
    } catch (error) {
      console.error("Error fetching datasets:", error);
      res.status(500).json({ message: "Failed to fetch datasets" });
    }
  });

  app.post('/api/datasets', upload.single('file'), async (req: any, res) => {
    try {
      const userId = req.user.sub || 'anonymous';
      const file = req.file;

      if (!file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const datasetData = insertDatasetSchema.parse({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        fileName: file.originalname,
        fileSize: file.size,
        fileType: file.mimetype,
        uploadedBy: userId,
      });

      const dataset = await storage.createDataset(datasetData);

      await storage.createActivityLog({
        userId,
        action: "upload_dataset",
        resource: "dataset",
        resourceId: dataset.id,
        metadata: { fileName: file.originalname, fileSize: file.size },
      });

      await storage.createNotification({
        userId,
        title: "Dataset uploaded",
        message: `Your dataset "${dataset.name}" has been uploaded successfully`,
        type: "success",
      });

      res.json(dataset);
    } catch (error) {
      console.error("Error uploading dataset:", error);
      res.status(500).json({ message: "Failed to upload dataset" });
    }
  });

  // Final step: create and return the HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
