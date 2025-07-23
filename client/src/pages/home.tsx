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
import { useTheme } from "@/components/theme-provider";
import { usePlaywrightExecution } from "@/hooks/use-playwright-execution";
import { ExecutionLogger } from "@/components/execution-logger";
import { VerificationModal } from "@/components/verification-modal";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Project, TestScenario, TestScenarioSchema } from "@shared/schema";
import { generatePlaywrightCode } from "@/lib/playwright-generator";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [jsonInput, setJsonInput] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [manualModeEnabled, setManualModeEnabled] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [jsonValidationError, setJsonValidationError] = useState<string | null>(null);

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
    mutationFn: async (projectData: { name: string; baseUrl: string; jsonDefinition: any }) => {
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
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Project> }) => {
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
    mutationFn: async (projectId: number) => {
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
    } catch (error: any) {
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
    } catch (error: any) {
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
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleGenerateCode = () => {
    if (!selectedProject) return;
    generateCodeMutation.mutate(selectedProject.id);
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
    const blob = new Blob([generatedCode], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedProject?.name || 'test'}.spec.ts`;
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
            projects.map((project: Project) => (
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
                Playwright Code Generator
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
                {isConnected ? 'Browser Connected' : 'Browser Disconnected'}
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
              <div className="flex-1 relative">
                <Textarea
                  placeholder="Enter your test scenarios in JSON format here..."
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  className="h-full resize-none font-mono text-sm bg-white dark:bg-gray-700"
                />
                {/* JSON Validation Indicator */}
                <div className="absolute top-2 right-2 flex items-center gap-1">
                  {isJsonValid ? (
                    <>
                      <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                      <span className="text-xs text-green-600 dark:text-green-400">Valid JSON</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-2 h-2 fill-red-500 text-red-500" />
                      <span className="text-xs text-red-600 dark:text-red-400">Invalid JSON</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Code Execution Panel */}
          <div className="w-1/2 flex flex-col">
            {/* Code Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Generated Playwright Code
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    TypeScript
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateCode}
                    disabled={!selectedProject || generateCodeMutation.isPending}
                  >
                    Generate
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={copyToClipboard}
                    disabled={!generatedCode}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadCode}
                    disabled={!generatedCode}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Generated Code */}
            <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800">
              <pre className="h-full overflow-auto p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-mono text-gray-800 dark:text-gray-200">
                <code>
                  {generatedCode || "// Generated code will appear here after clicking Generate..."}
                </code>
              </pre>
            </div>
          </div>
        </div>

        {/* Execution Control Panel */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Execution Controls */}
              <Button
                onClick={handleExecute}
                disabled={!selectedProject || executionState.status === 'running'}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Play className="w-4 h-4 mr-2" />
                Execute Tests
              </Button>
              
              <Button
                onClick={pauseExecution}
                disabled={executionState.status !== 'running'}
                variant="outline"
                className="bg-yellow-600 hover:bg-yellow-700 text-white border-yellow-600"
              >
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </Button>
              
              <Button
                onClick={stopExecution}
                disabled={executionState.status === 'idle'}
                variant="outline"
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </Button>
              
              {/* Manual Intervention Controls */}
              {executionState.requiresManualIntervention && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-700"
                  >
                    <HandMetal className="w-3 h-3 mr-2 animate-pulse" />
                    Manual intervention required
                  </Badge>
                  <Button
                    onClick={completeManualVerification}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Resume Automation
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {/* Progress Indicator */}
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>Progress:</span>
                <div className="w-32 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <Progress 
                    value={progressPercentage} 
                    className="h-full bg-blue-600" 
                  />
                </div>
                <span>{executionState.currentStep}/{executionState.totalSteps}</span>
              </div>
              
              {/* Project Actions */}
              <Button
                onClick={handleSaveProject}
                disabled={!selectedProject || updateProjectMutation.isPending}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Project
              </Button>
            </div>
          </div>
          
          {/* Execution Log */}
          <ExecutionLogger
            logs={executionState.logs}
            isVisible={executionState.logs.length > 0}
            className="mt-4"
          />
        </div>
      </div>

      {/* Verification Modal */}
      <VerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        onOpenTab={() => {
          openVerificationTab();
          setShowVerificationModal(false);
        }}
        onSkip={() => {
          setShowVerificationModal(false);
          completeManualVerification();
        }}
      />
    </div>
  );
}
