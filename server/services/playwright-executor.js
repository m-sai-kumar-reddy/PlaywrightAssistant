import { WebSocket } from "ws";
import { storage } from "../storage.js";

export class PlaywrightExecutor {
  constructor() {
    this.activeSessions = new Map();
  }

  async executeProject(project, session, wss) {
    const controller = new AbortController();
    this.activeSessions.set(session.id, { session, controller });

    try {
      const testScenario = project.jsonDefinition;
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

    } catch (error) {
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

  async resumeAfterManualVerification(sessionId) {
    await storage.updateExecutionSession(sessionId, { status: 'running' });
  }

  async waitForResume(sessionId) {
    while (true) {
      const session = await storage.getExecutionSession(sessionId);
      if (session?.status === 'running') break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  async waitForManualVerification(sessionId) {
    while (true) {
      const session = await storage.getExecutionSession(sessionId);
      if (session?.status === 'running') break;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  getStepMessage(step) {
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

  broadcastUpdate(wss, data) {
    const message = JSON.stringify(data);
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}