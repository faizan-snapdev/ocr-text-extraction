"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { showError, showSuccess } from "@/utils/toast";
import { Clock, Copy, RefreshCw } from "lucide-react";
import React from "react";

interface ExtractedTextDisplayProps {
  text: string;
  processingTime?: number;
  onReset: () => void;
}

const ExtractedTextDisplay: React.FC<ExtractedTextDisplayProps> = ({
  text,
  processingTime,
  onReset,
}) => {
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      showSuccess("Text copied to clipboard!");
    } catch (err) {
      console.error("Failed to copy text: ", err);
      showError("Failed to copy text.");
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex flex-col gap-1">
            <CardTitle className="text-2xl">Extracted Text</CardTitle>
            {processingTime && (
                <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-1 h-3 w-3" />
                    Extraction complete in {processingTime.toFixed(2)} seconds
                </div>
            )}
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleCopy}>
            <Copy className="mr-2 h-4 w-4" /> Copy Text
          </Button>
          <Button variant="outline" size="sm" onClick={onReset}>
            <RefreshCw className="mr-2 h-4 w-4" /> New Extraction
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          value={text}
          readOnly
          className="min-h-[300px] font-mono text-sm resize-y"
        />
      </CardContent>
    </Card>
  );
};

export default ExtractedTextDisplay;