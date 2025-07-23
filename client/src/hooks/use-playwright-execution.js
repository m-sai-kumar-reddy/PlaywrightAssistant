import { useState, useCallback } from "react";
import { useWebSocket } from "./use-websocket.js";
import { apiRequest } from "../lib/queryClient.js";
import { useToast } from "./use-toast.js";

export function usePlaywrightExecution() {
  const { toast } = useToast();
  const [executionState, setExecutionState] = useState({
    sessionId: null,
    status: "idle",
    currentStep: 0,
    totalSteps: 0,
    logs: [],
    requiresManualIntervention: false
  });

  const addLog = useCallback((message, type = "info") => {
    setExecutionState(prev => ({
      ...prev,
      logs: [...prev.logs, { timestamp: new Date(), message, type }]
    }));
  }, []);

  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (message) => {
      switch (message.type) {
        case 'execution_update':
          setExecutionState(prev => ({
            ...prev,
            status: message.status || prev.status,
            currentStep: message.currentStep || prev.currentStep,
            totalSteps: message.totalSteps || prev.totalSteps
          }));
          if (message.message) {
            addLog(message.message, "info");
          }
          break;

        case 'manual_verification_required':
          setExecutionState(prev => ({
            ...prev,
            status: "manual",
            requiresManualIntervention: true
          }));
          addLog("Human verification required - pausing automation", "warning");
          break;

        case 'execution_complete':
          setExecutionState(prev => ({
            ...prev,
            status: "completed",
            sessionId: null,
            requiresManualIntervention: false
          }));
          addLog("All tests completed successfully", "success");
          toast({
            title: "Execution Complete",
            description: "All tests have been executed successfully.",
          });
          break;

        case 'execution_error':
          setExecutionState(prev => ({
            ...prev,
            status: "error",
            sessionId: null,
            requiresManualIntervention: false
          }));
          addLog(`Execution error: ${message.message}`, "error");
          toast({
            title: "Execution Error",
            description: message.message,
            variant: "destructive"
          });
          break;
      }
    },
    onOpen: () => {
      addLog("Connected to execution server", "success");
    },
    onClose: () => {
      addLog("Disconnected from execution server", "warning");
    }
  });

  const executeProject = useCallback(async (projectId) => {
    try {
      setExecutionState(prev => ({
        ...prev,
        status: "running",
        currentStep: 0,
        totalSteps: 0,
        logs: [],
        requiresManualIntervention: false
      }));

      const response = await apiRequest("POST", `/api/projects/${projectId}/execute`);
      const { sessionId } = await response.json();
      
      setExecutionState(prev => ({
        ...prev,
        sessionId
      }));

      addLog("Starting test execution...", "success");
    } catch (error) {
      setExecutionState(prev => ({
        ...prev,
        status: "error"
      }));
      addLog(`Failed to start execution: ${error.message}`, "error");
      toast({
        title: "Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [addLog, toast]);

  const pauseExecution = useCallback(async () => {
    if (!executionState.sessionId) return;

    try {
      await apiRequest("POST", `/api/sessions/${executionState.sessionId}/pause`);
      setExecutionState(prev => ({
        ...prev,
        status: "paused"
      }));
      addLog("Execution paused by user", "warning");
    } catch (error) {
      toast({
        title: "Failed to pause",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [executionState.sessionId, addLog, toast]);

  const resumeExecution = useCallback(async () => {
    if (!executionState.sessionId) return;

    try {
      await apiRequest("POST", `/api/sessions/${executionState.sessionId}/resume`);
      setExecutionState(prev => ({
        ...prev,
        status: "running",
        requiresManualIntervention: false
      }));
      addLog("Execution resumed", "success");
    } catch (error) {
      toast({
        title: "Failed to resume",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [executionState.sessionId, addLog, toast]);

  const stopExecution = useCallback(async () => {
    if (!executionState.sessionId) return;

    try {
      await apiRequest("POST", `/api/sessions/${executionState.sessionId}/stop`);
      setExecutionState(prev => ({
        ...prev,
        status: "idle",
        sessionId: null,
        requiresManualIntervention: false
      }));
      addLog("Execution stopped by user", "error");
    } catch (error) {
      toast({
        title: "Failed to stop",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [executionState.sessionId, addLog, toast]);

  const completeManualVerification = useCallback(() => {
    if (executionState.sessionId) {
      sendMessage({
        type: 'manual_verification_complete',
        sessionId: executionState.sessionId
      });
      addLog("Manual verification completed", "success");
    }
  }, [executionState.sessionId, sendMessage, addLog]);

  const openVerificationTab = useCallback(() => {
    // Open a new tab for manual verification
    const newTab = window.open('about:blank', '_blank');
    if (newTab) {
      addLog("Opening new tab for manual verification...", "info");
      // Focus the new tab
      newTab.focus();
    } else {
      toast({
        title: "Failed to open tab",
        description: "Please allow pop-ups for this site",
        variant: "destructive"
      });
    }
  }, [addLog, toast]);

  return {
    executionState,
    isConnected,
    executeProject,
    pauseExecution,
    resumeExecution,
    stopExecution,
    completeManualVerification,
    openVerificationTab
  };
}