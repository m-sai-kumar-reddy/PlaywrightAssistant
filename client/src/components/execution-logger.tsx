import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LogEntry {
  timestamp: Date;
  message: string;
  type: string;
}

interface ExecutionLoggerProps {
  logs: LogEntry[];
  isVisible: boolean;
  className?: string;
}

export function ExecutionLogger({ logs, isVisible, className }: ExecutionLoggerProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-green-600 dark:text-green-400';
      case 'warning':
        return 'text-orange-600 dark:text-orange-400';
      case 'error':
        return 'text-red-600 dark:text-red-400';
      case 'info':
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={logContainerRef}
      className={cn(
        "h-24 overflow-y-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs font-mono",
        className
      )}
    >
      {logs.length === 0 ? (
        <div className="text-gray-500 dark:text-gray-400">
          No logs yet...
        </div>
      ) : (
        logs.map((log, index) => (
          <div key={index} className={getLogColor(log.type)}>
            [{log.timestamp.toLocaleTimeString()}] {log.message}
          </div>
        ))
      )}
    </div>
  );
}
