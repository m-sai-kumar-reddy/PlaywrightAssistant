import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Moon, 
  Sun, 
  Plus, 
  Play, 
  Pause, 
  Square, 
  Copy, 
  Download, 
  Save,
  HandMetal,
  CheckCircle,
  Circle,
  AlertCircle
} from "lucide-react";
import { useTheme } from "@/components/theme-provider.jsx";
import { usePlaywrightExecution } from "@/hooks/use-playwright-execution.js";
import { ExecutionLogger } from "@/components/execution-logger.jsx";
import { VerificationModal } from "@/components/verification-modal.jsx";
import { apiRequest } from "@/lib/queryClient.js";
import { useToast } from "@/hooks/use-toast.js";
import { TestScenarioSchema } from "@shared/schema.js";
import { generatePlaywrightCode } from "@/lib/playwright-generator.js";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState(null);
  const [jsonInput, setJsonInput] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [manualModeEnabled, setManualModeEnabled] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [jsonValidationError, setJsonValidationError] = useState(null);

  const {
    executionState,
    isConnected,
    executeProject,
    pauseExecution,
    resumeExecution,
    stopExecution,
    completeManualVerification,
    openVerificationTab
  } = usePlaywrightExecution();

  // Fetch projects
  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  // Create project mutation
  const createProjectMutation = useMutation({
    mutationFn: async (projectData) => {
      const response = await apiRequest("POST", "/api/projects", projectData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Created",
        description: "New project has been created successfully.",
      });
    }
  });

  // Update project mutation
  const updateProjectMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const response = await apiRequest("PATCH", `/api/projects/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project Updated",
        description: "Project has been saved successfully.",
      });
    }
  });

  // Generate code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async (projectId) => {
      const response = await apiRequest("POST", `/api/projects/${projectId}/generate`);
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.code);
    }
  });

  // Load selected project
  useEffect(() => {
    if (selectedProject) {
      setBaseUrl(selectedProject.baseUrl);
      setJsonInput(JSON.stringify(selectedProject.jsonDefinition, null, 2));
      setGeneratedCode(selectedProject.generatedCode || "");
    }
  }, [selectedProject]);

  // Show verification modal when manual intervention is needed
  useEffect(() => {
    if (executionState.requiresManualIntervention) {
      setShowVerificationModal(true);
    }
  }, [executionState.requiresManualIntervention]);

  // Load first project by default
  useEffect(() => {
    if (projects.length > 0 && !selectedProject) {
      setSelectedProject(projects[0]);
    }
  }, [projects, selectedProject]);

  const validateJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      TestScenarioSchema.parse(parsed);
      setJsonValidationError(null);
      toast({
        title: "Valid JSON",
        description: "JSON structure is valid and ready to use.",
      });
      return true;
    } catch (error) {
      setJsonValidationError(error.message);
      toast({
        title: "Invalid JSON",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const formatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      toast({
        title: "JSON Formatted",
        description: "JSON has been formatted successfully.",
      });
    } catch (error) {
      toast({
        title: "Invalid JSON",
        description: "Cannot format invalid JSON.",
        variant: "destructive"
      });
    }
  };

  const handleCreateProject = () => {
    const name = prompt("Enter project name:");
    if (name) {
      createProjectMutation.mutate({
        name,
        baseUrl: "https://www.example.com",
        jsonDefinition: {
          scenarios: [{
            name: "Sample Test",
            steps: [
              { action: "navigate", url: "/" },
              { action: "waitForSelector", selector: "body" }
            ]
          }]
        }
      });
    }
  };

  const handleSaveProject = () => {
    if (!selectedProject) return;

    if (!validateJson()) return;

    try {
      const jsonDefinition = JSON.parse(jsonInput);
      updateProjectMutation.mutate({
        id: selectedProject.id,
        updates: {
          baseUrl,
          jsonDefinition,
          generatedCode
        }
      });
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleGenerateCode = () => {
    if (!selectedProject) return;
    
    // Validate JSON first
    if (!validateJson()) return;

    // Generate code locally using the client-side generator
    try {
      const testScenario = JSON.parse(jsonInput);
      const code = generatePlaywrightCode(baseUrl, testScenario);
      setGeneratedCode(code);
      
      toast({
        title: "Code Generated",
        description: "JavaScript Playwright code has been generated successfully.",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleExecute = () => {
    if (!selectedProject) return;
    executeProject(selectedProject.id);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedCode);
      toast({
        title: "Copied!",
        description: "Code has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy code to clipboard.",
        variant: "destructive"
      });
    }
  };

  const downloadCode = () => {
    const blob = new Blob([generatedCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject?.name || 'test'}.spec.js`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIndicator = () => {
    switch (executionState.status) {
      case 'running':
        return <Circle className="w-2 h-2 fill-blue-500 text-blue-500 animate-pulse" />;
      case 'paused':
        return <Circle className="w-2 h-2 fill-yellow-500 text-yellow-500" />;
      case 'manual':
        return <Circle className="w-2 h-2 fill-orange-500 text-orange-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-2 h-2 fill-green-500 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-2 h-2 fill-red-500 text-red-500" />;
      default:
        return <Circle className="w-2 h-2 fill-gray-400 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (executionState.status) {
      case 'running': return 'Running';
      case 'paused': return 'Paused';
      case 'manual': return 'Manual verification required';
      case 'completed': return 'Completed';
      case 'error': return 'Error';
      default: return 'Ready';
    }
  };

  const isJsonValid = !jsonValidationError && jsonInput.trim() !== "";
  const progressPercentage = executionState.totalSteps > 0 
    ? (executionState.currentStep / executionState.totalSteps) * 100 
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Projects</h1>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              className="h-8 w-8 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400" />
              ) : (
                <Moon className="h-4 w-4 text-gray-600" />
              )}
            </Button>
          </div>
          <Button
            onClick={handleCreateProject}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={createProjectMutation.isPending}
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>
        
        {/* Project List */}
        <div className="flex-1 overflow-y-auto p-4">
          {projectsLoading ? (
            <div className="text-center text-gray-500">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="text-center text-gray-500">No projects yet</div>
          ) : (
            projects.map((project) => (
              <Card
                key={project.id}
                className={`mb-3 cursor-pointer transition-colors ${
                  selectedProject?.id === project.id
                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
                onClick={() => setSelectedProject(project)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                        {project.baseUrl}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Implement duplicate functionality
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="mt-2 flex items-center text-xs text-gray-500 dark:text-gray-400">
                    <span>ID: {project.id}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                JavaScript Playwright Generator
              </h2>
              <div className="flex items-center gap-2">
                {getStatusIndicator()}
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {getStatusText()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Browser Connection Status */}
              <Badge
                variant="outline"
                className={`${
                  isConnected
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700'
                }`}
              >
                <Circle className="w-2 h-2 mr-2 fill-current" />
                {isConnected ? 'Server Connected' : 'Server Disconnected'}
              </Badge>
              
              {/* Manual Mode Toggle */}
              <Button
                variant="outline"
                onClick={() => setManualModeEnabled(!manualModeEnabled)}
                className={`${
                  manualModeEnabled
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50'
                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                }`}
              >
                <HandMetal className="w-4 h-4 mr-2" />
                Manual Mode: {manualModeEnabled ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Configuration Panel */}
          <div className="w-1/2 border-r border-gray-200 dark:border-gray-700 flex flex-col">
            {/* Base URL Section */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Base URL
              </label>
              <Input
                type="text"
                placeholder="e.g. https://www.example.com"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="bg-white dark:bg-gray-700"
              />
            </div>
            
            {/* JSON Test Definition */}
            <div className="flex-1 flex flex-col p-6">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  JSON Test Definition
                </label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={validateJson}
                    className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-900/50"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Validate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={formatJson}
                    className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-900/50"
                  >
                    Format
                  </Button>
                </div>
              </div>
              <Textarea
                placeholder="Enter your test scenarios in JSON format here..."
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                className="flex-1 font-mono text-xs bg-white dark:bg-gray-700 json-editor"
              />
              {jsonValidationError && (
                <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded text-xs text-red-600 dark:text-red-400">
                  {jsonValidationError}
                </div>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-3">
                <Button
                  onClick={handleSaveProject}
                  disabled={!selectedProject || updateProjectMutation.isPending}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Project
                </Button>
                <Button
                  onClick={handleGenerateCode}
                  disabled={!selectedProject || !isJsonValid}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Generate Code
                </Button>
              </div>
            </div>
          </div>

          {/* Generated Code Panel */}
          <div className="w-1/2 flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Generated JavaScript Code
                </label>
                <div className="flex gap-2">
                  {generatedCode && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={copyToClipboard}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={downloadCode}
                        className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </Button>
                    </>
                  )}
                </div>
              </div>
              
              {/* Execution Controls */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <Button
                    onClick={handleExecute}
                    disabled={!selectedProject || executionState.status === 'running'}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Run Tests
                  </Button>
                  
                  {executionState.status === 'running' && (
                    <Button
                      onClick={pauseExecution}
                      variant="outline"
                      className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-700"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  
                  {executionState.status === 'paused' && (
                    <Button
                      onClick={resumeExecution}
                      variant="outline"
                      className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200 dark:border-green-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  
                  {(executionState.status === 'running' || executionState.status === 'paused') && (
                    <Button
                      onClick={stopExecution}
                      variant="outline"
                      className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-700"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  )}
                </div>
                
                {/* Progress */}
                {executionState.totalSteps > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{executionState.currentStep}/{executionState.totalSteps}</span>
                    <Progress value={progressPercentage} className="w-24" />
                  </div>
                )}
              </div>
            </div>
            
            {/* Code Display Area */}
            <div className="flex-1 p-6">
              <Textarea
                value={generatedCode}
                onChange={(e) => setGeneratedCode(e.target.value)}
                placeholder="Generated JavaScript code will appear here..."
                className="h-full font-mono text-xs bg-white dark:bg-gray-700 resize-none"
                readOnly={false}
              />
              
              {generatedCode && (
                <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                  Note: This JavaScript code is designed to run with a visible browser for manual verification.
                  The browser will pause during verification challenges and wait for your input.
                </div>
              )}
            </div>
            
            {/* Execution Logger */}
            <ExecutionLogger
              logs={executionState.logs}
              isVisible={executionState.status !== 'idle'}
              className="mx-6 mb-6"
            />
          </div>
        </div>
      </div>

      {/* Manual Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onOpenTab={() => {
          openVerificationTab();
          completeManualVerification();
          setShowVerificationModal(false);
        }}
        onSkip={() => {
          completeManualVerification();
          setShowVerificationModal(false);
        }}
      />
    </div>
  );
}