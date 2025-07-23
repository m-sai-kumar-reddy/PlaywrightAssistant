import { 
  users, 
  projects, 
  executionSessions,
  type User, 
  type InsertUser,
  type Project,
  type InsertProject,
  type ExecutionSession,
  type InsertExecutionSession
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  getExecutionSession(id: number): Promise<ExecutionSession | undefined>;
  createExecutionSession(session: InsertExecutionSession): Promise<ExecutionSession>;
  updateExecutionSession(id: number, updates: Partial<InsertExecutionSession>): Promise<ExecutionSession | undefined>;
  getActiveExecutionSession(projectId: number): Promise<ExecutionSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private projects: Map<number, Project>;
  private executionSessions: Map<number, ExecutionSession>;
  private currentUserId: number;
  private currentProjectId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.projects = new Map();
    this.executionSessions = new Map();
    this.currentUserId = 1;
    this.currentProjectId = 1;
    this.currentSessionId = 1;
    
    // Initialize with sample project
    const sampleProject: Project = {
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

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(insertProject: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    const project: Project = { 
      ...insertProject, 
      id, 
      lastModified: new Date() 
    };
    this.projects.set(id, project);
    return project;
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project | undefined> {
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

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  async getExecutionSession(id: number): Promise<ExecutionSession | undefined> {
    return this.executionSessions.get(id);
  }

  async createExecutionSession(insertSession: InsertExecutionSession): Promise<ExecutionSession> {
    const id = this.currentSessionId++;
    const session: ExecutionSession = {
      ...insertSession,
      id,
      startedAt: new Date(),
      completedAt: null
    };
    this.executionSessions.set(id, session);
    return session;
  }

  async updateExecutionSession(id: number, updates: Partial<InsertExecutionSession>): Promise<ExecutionSession | undefined> {
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

  async getActiveExecutionSession(projectId: number): Promise<ExecutionSession | undefined> {
    return Array.from(this.executionSessions.values()).find(
      session => session.projectId === projectId && 
                 (session.status === 'running' || session.status === 'paused' || session.status === 'manual')
    );
  }
}

export const storage = new MemStorage();
