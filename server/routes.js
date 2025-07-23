import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage.js";
import { insertProjectSchema, TestScenarioSchema } from "../shared/schema.js";
import { PlaywrightExecutor } from "./services/playwright-executor.js";

export async function registerRoutes(app) {
  const httpServer = createServer(app);
  
  // WebSocket server for real-time execution updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  const executor = new PlaywrightExecutor();

  // Projects API
  app.get("/api/projects", async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/projects", async (req, res) => {
    try {
      const projectData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(projectData);
      res.json(project);
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('message', (message) => {
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

  function handleWebSocketMessage(ws, data) {
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

function generatePlaywrightCode(baseUrl, testScenario) {
  return `// Generated Playwright Test (JavaScript)
const { test, expect } = require('@playwright/test');

class ManualVerificationHandler {
  constructor(browser, context) {
    this.browser = browser;
    this.context = context;
  }
  
  async handleVerification(page) {
    // Open new tab for manual verification
    const verificationPage = await this.context.newPage();
    await verificationPage.goto(page.url());
    
    console.log('Manual verification required...');
    console.log('Please complete verification in new tab and press Enter in console');
    
    // Wait for verification completion
    await this.waitForVerificationComplete(verificationPage);
    await verificationPage.close();
  }
  
  async waitForVerificationComplete(page) {
    // Create a promise that resolves when user presses Enter
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      console.log('Press Enter after completing manual verification...');
      rl.question('', () => {
        rl.close();
        resolve();
      });
    });
  }
}

${testScenario.scenarios.map((scenario) => `
test('${scenario.name}', async ({ browser }) => {
  const context = await browser.newContext({
    // Keep browser open for manual intervention
    headless: false
  });
  const page = await context.newPage();
  const verificationHandler = new ManualVerificationHandler(browser, context);
  
  ${scenario.steps.map((step) => {
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
  // Check for human verification challenges
  try {
    // Wait briefly to see if automated flow continues
    await page.waitForSelector('${step.selector}', { timeout: 5000 });
  } catch (error) {
    console.log('Human verification may be required');
    await verificationHandler.handleVerification(page);
    // After manual intervention, wait for the expected element
    await page.waitForSelector('${step.selector}', { timeout: 30000 });
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