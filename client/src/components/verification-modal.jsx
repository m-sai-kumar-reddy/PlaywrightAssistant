import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, HandMetal } from "lucide-react";

export function VerificationModal({ isOpen, onClose, onOpenTab, onSkip }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader className="flex flex-row items-center gap-3">
          <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
            <HandMetal className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <DialogTitle>Manual Verification Required</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            A human verification challenge has been detected. The generated JavaScript code will open a browser window where you can complete the verification manually.
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <Clock className="w-4 h-4 mr-1" />
              Browser will stay open for manual verification
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={onSkip}
                className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500"
              >
                Skip
              </Button>
              <Button
                onClick={onOpenTab}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}