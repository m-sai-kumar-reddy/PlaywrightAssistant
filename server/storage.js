import { 
  users, 
  projects, 
  executionSessions,
  insertUserSchema,
  insertProjectSchema,
  insertExecutionSessionSchema
} from "../shared/schema.js";

export class MemStorage {
  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.executionSessions = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentSessionId = 1;
    
    // Initialize with sample project
    const sampleProject = {
      id: 1,
      name: "Schneider Login E2E",
      baseUrl: "https://portal.schneider-energy-access.expertcit.app",
      jsonDefinition: {
        scenarios: [{
          name: "User Login Flow",
          steps: [
            { action: "navigate", url: "/login" },
            { action: "fill", selector: "#username", value: "testuser" },
            { action: "fill", selector: "#password", value: "password123" },
            { action: "click", selector: "#login-button" },
            { action: "waitForSelector", selector: ".dashboard", humanVerification: true }
          ]
        }]
      },
      generatedCode: null,
      lastModified: new Date(),
      userId: null
    };
    this.projects.set(1, sampleProject);
    this.currentProjectId = 2;
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser) {
    const id = this.currentUserId++;
    const user = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProjects() {
    return Array.from(this.projects.values());
  }

  async getProject(id) {
    return this.projects.get(id);
  }

  async createProject(insertProject) {
    const id = this.currentProjectId++;
    const project = { 
      ...insertProject, 
      id, 
      lastModified: new Date(),
      generatedCode: null
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id, updates) {
    const project = this.projects.get(id);
    if (project) {
      const updatedProject = { 
        ...project, 
        ...updates, 
        lastModified: new Date() 
      };
      this.projects.set(id, updatedProject);
      return updatedProject;
    }
    return undefined;
  }

  async deleteProject(id) {
    return this.projects.delete(id);
  }

  async getExecutionSession(id) {
    return this.executionSessions.get(id);
  }

  async createExecutionSession(insertSession) {
    const id = this.currentSessionId++;
    const session = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: null,
      status: insertSession.status || "idle",
      currentStep: insertSession.currentStep || 0,
      totalSteps: insertSession.totalSteps || 0,
      logs: insertSession.logs || []
    };
    this.executionSessions.set(id, session);
    return session;
  }

  async updateExecutionSession(id, updates) {
    const session = this.executionSessions.get(id);
    if (session) {
      const updatedSession = { ...session, ...updates };
      if (updates.status === 'completed' || updates.status === 'error') {
        updatedSession.completedAt = new Date();
      }
      this.executionSessions.set(id, updatedSession);
      return updatedSession;
    }
    return undefined;
  }

  async getActiveExecutionSession(projectId) {
    return Array.from(this.executionSessions.values()).find(
      session => session.projectId === projectId && 
                 (session.status === 'running' || session.status === 'paused' || session.status === 'manual')
    );
  }
}

export const storage = new MemStorage();