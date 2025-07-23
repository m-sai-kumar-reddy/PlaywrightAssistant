import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertProjectSchema, TestScenarioSchema } from "@shared/schema";
import { PlaywrightExecutor } from "./services/playwright-executor";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time execution updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const executor = new PlaywrightExecutor();

  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.patch("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const project = await storage.updateProject(id, updates);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/projects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteProject(id);
      if (!deleted) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Code generation API
  app.post("/api/projects/:id/generate", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Validate JSON definition
      const testScenario = TestScenarioSchema.parse(project.jsonDefinition);
      
      // Generate Playwright code
      const generatedCode = generatePlaywrightCode(project.baseUrl, testScenario);
      
      // Update project with generated code
      await storage.updateProject(id, { generatedCode });
      
      res.json({ code: generatedCode });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  // Execution API
  app.post("/api/projects/:id/execute", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check for existing active session
      const existingSession = await storage.getActiveExecutionSession(id);
      if (existingSession) {
        return res.status(400).json({ message: "Execution already in progress" });
      }

      // Create execution session
      const session = await storage.createExecutionSession({
        projectId: id,
        status: "running",
        currentStep: 0,
        totalSteps: 0,
        logs: []
      });

      // Start execution in background
      executor.executeProject(project, session, wss).catch(console.error);

      res.json({ sessionId: session.id });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sessions/:id/pause", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.updateExecutionSession(id, { status: "paused" });
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sessions/:id/resume", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.updateExecutionSession(id, { status: "running" });
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/sessions/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const session = await storage.updateExecutionSession(id, { status: "completed" });
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws: WebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message);
        // Handle client messages (manual verification completion, etc.)
        handleWebSocketMessage(ws, data);
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  function handleWebSocketMessage(ws: WebSocket, data: any) {
    switch (data.type) {
      case 'manual_verification_complete':
        // Handle manual verification completion
        executor.resumeAfterManualVerification(data.sessionId);
        break;
      case 'ping':
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'pong' }));
        }
        break;
    }
  }

  return httpServer;
}

function generatePlaywrightCode(baseUrl: string, testScenario: any): string {
  return `// Generated Playwright Test
import { test, expect, Browser, BrowserContext, Page } from '@playwright/test';

class ManualVerificationHandler {
  private browser: Browser;
  private context: BrowserContext;
  
  constructor(browser: Browser, context: BrowserContext) {
    this.browser = browser;
    this.context = context;
  }
  
  async handleVerification(page: Page): Promise<void> {
    // Open new tab for manual verification
    const verificationPage = await this.context.newPage();
    await verificationPage.goto(page.url());
    
    console.log('Manual verification required...');
    console.log('Please complete verification in new tab');
    
    // Wait for verification completion
    await this.waitForVerificationComplete(verificationPage);
    await verificationPage.close();
  }
  
  private async waitForVerificationComplete(page: Page): Promise<void> {
    // Wait for manual verification completion signal
    await page.waitForSelector('[data-verified="true"]', { 
      timeout: 300000 
    });
  }
}

${testScenario.scenarios.map((scenario: any) => `
test('${scenario.name}', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const verificationHandler = new ManualVerificationHandler(browser, context);
  
  ${scenario.steps.map((step: any) => {
    switch (step.action) {
      case 'navigate':
        return `  await page.goto('${baseUrl}${step.url}');`;
      case 'fill':
        return `  await page.fill('${step.selector}', '${step.value}');`;
      case 'click':
        return `  await page.click('${step.selector}');`;
      case 'waitForSelector':
        const verificationCheck = step.humanVerification 
          ? `
  // Check for human verification
  const captchaPresent = await page.locator('[data-captcha]').isVisible();
  if (captchaPresent) {
    await verificationHandler.handleVerification(page);
  }`
          : '';
        return `  await page.waitForSelector('${step.selector}');${verificationCheck}`;
      case 'expect':
        return `  await expect(page.locator('${step.selector}')).toBeVisible();`;
      default:
        return `  // Unknown action: ${step.action}`;
    }
  }).join('\n')}
  
  await context.close();
});`).join('\n')}`;
}
