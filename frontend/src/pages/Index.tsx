"use client";

import ExtractedTextDisplay from "@/components/ExtractedTextDisplay";
import { MadeWithDyad } from "@/components/made-with-dyad";
import PdfUpload from "@/components/PdfUpload";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const Index = () => {
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [processingTime, setProcessingTime] = useState<number | undefined>(undefined);
  const [processingStatus, setProcessingStatus] = useState<
    "idle" | "uploading" | "processing" | "complete" | "error"
  >("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleExtractionComplete = (text: string, time?: number) => {
    setExtractedText(text);
    setProcessingTime(time);
    setProcessingStatus("complete");
    setErrorMessage(null);
  };

  const handleProcessingStart = (name: string) => {
    setFileName(name);
    setProcessingStatus("processing");
    setExtractedText(null);
    setProcessingTime(undefined);
    setErrorMessage(null);
  };

  const handleProcessingError = (error: string) => {
    setErrorMessage(error);
    setProcessingStatus("error");
    setExtractedText(null);
    setProcessingTime(undefined);
    setFileName(null);
  };

  const handleReset = () => {
    setExtractedText(null);
    setProcessingTime(undefined);
    setProcessingStatus("idle");
    setFileName(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-50">
      <h1 className="text-4xl font-bold mb-8 text-center">
        High-Performance PDF Text Extractor
      </h1>

      {extractedText ? (
        <ExtractedTextDisplay
          text={extractedText}
          processingTime={processingTime}
          onReset={handleReset}
        />
      ) : (
        <PdfUpload
          onExtractionComplete={handleExtractionComplete}
          onProcessingStart={handleProcessingStart}
          onProcessingError={handleProcessingError}
        />
      )}

      {errorMessage && (
        <div className="mt-4 text-red-500 text-center">
          <p>{errorMessage}</p>
          <Button variant="link" onClick={handleReset} className="mt-2">
            Try Again
          </Button>
        </div>
      )}
      <MadeWithDyad />
    </div>
  );
};

export default Index;