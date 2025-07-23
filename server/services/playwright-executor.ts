import { WebSocketServer, WebSocket } from "ws";
import { storage } from "../storage";
import { Project, ExecutionSession, TestScenario } from "@shared/schema";

export class PlaywrightExecutor {
  private activeSessions: Map<number, { 
    session: ExecutionSession, 
    controller: AbortController 
  }> = new Map();

  async executeProject(
    project: Project, 
    session: ExecutionSession, 
    wss: WebSocketServer
  ): Promise<void> {
    const controller = new AbortController();
    this.activeSessions.set(session.id, { session, controller });

    try {
      const testScenario = project.jsonDefinition as TestScenario;
      const totalSteps = testScenario.scenarios.reduce(
        (total, scenario) => total + scenario.steps.length, 0
      );

      await storage.updateExecutionSession(session.id, { totalSteps });
      this.broadcastUpdate(wss, {
        type: 'execution_update',
        sessionId: session.id,
        status: 'running',
        currentStep: 0,
        totalSteps,
        message: 'Starting test execution...'
      });

      let currentStep = 0;

      for (const scenario of testScenario.scenarios) {
        if (controller.signal.aborted) break;

        for (const step of scenario.steps) {
          if (controller.signal.aborted) break;

          // Check if execution is paused
          const currentSession = await storage.getExecutionSession(session.id);
          if (currentSession?.status === 'paused') {
            await this.waitForResume(session.id);
          }

          currentStep++;
          await storage.updateExecutionSession(session.id, { currentStep });

          // Simulate step execution
          const stepMessage = this.getStepMessage(step);
          this.broadcastUpdate(wss, {
            type: 'execution_update',
            sessionId: session.id,
            status: 'running',
            currentStep,
            totalSteps,
            message: stepMessage
          });

          // Check for human verification
          if (step.humanVerification) {
            await storage.updateExecutionSession(session.id, { status: 'manual' });
            
            this.broadcastUpdate(wss, {
              type: 'manual_verification_required',
              sessionId: session.id,
              currentStep,
              totalSteps,
              message: 'Human verification required'
            });

            // Wait for manual verification completion
            await this.waitForManualVerification(session.id);
          }

          // Simulate step delay
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      if (!controller.signal.aborted) {
        await storage.updateExecutionSession(session.id, { status: 'completed' });
        this.broadcastUpdate(wss, {
          type: 'execution_complete',
          sessionId: session.id,
          currentStep: totalSteps,
          totalSteps,
          message: 'All tests completed successfully'
        });
      }

    } catch (error: any) {
      await storage.updateExecutionSession(session.id, { status: 'error' });
      this.broadcastUpdate(wss, {
        type: 'execution_error',
        sessionId: session.id,
        message: error.message
      });
    } finally {
      this.activeSessions.delete(session.id);
    }
  }

  async resumeAfterManualVerification(sessionId: number): Promise<void> {
    await storage.updateExecutionSession(sessionId, { status: 'running' });
  }

  private async waitForResume(sessionId: number): Promise<void> {
    while (true) {
      const session = await storage.getExecutionSession(sessionId);
      if (session?.status === 'running') break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private async waitForManualVerification(sessionId: number): Promise<void> {
    while (true) {
      const session = await storage.getExecutionSession(sessionId);
      if (session?.status === 'running') break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  private getStepMessage(step: any): string {
    switch (step.action) {
      case 'navigate':
        return `Navigating to ${step.url}`;
      case 'fill':
        return `Filling ${step.selector} field`;
      case 'click':
        return `Clicking ${step.selector}`;
      case 'waitForSelector':
        return `Waiting for ${step.selector}`;
      case 'expect':
        return `Verifying ${step.selector}`;
      default:
        return `Executing ${step.action}`;
    }
  }

  private broadcastUpdate(wss: WebSocketServer, data: any): void {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
