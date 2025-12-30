"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { showError, showSuccess } from "@/utils/toast";
import { FileText, UploadCloud, XCircle } from "lucide-react";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";

interface PdfUploadProps {
  onExtractionComplete: (text: string, processingTime?: number) => void;
  onProcessingStart: (fileName: string) => void;
  onProcessingError: (error: string) => void;
}

const PdfUpload: React.FC<PdfUploadProps> = ({
  onExtractionComplete,
  onProcessingStart,
  onProcessingError,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const uploadFile = useCallback(
    async (selectedFile: File) => {
      setProcessing(true);
      setProgress(0);
      onProcessingStart(selectedFile.name);

      const token = localStorage.getItem("token");
      if (!token) {
        showError("You must be logged in to upload files.");
        setProcessing(false);
        setFile(null);
        navigate("/login");
        return;
      }

      const formData = new FormData();
      formData.append("file", selectedFile);

      // Fake progress for better UX since fetch doesn't support progress easily
      let currentProgress = 0;
      const progressInterval = setInterval(() => {
        currentProgress += 5;
        if (currentProgress < 90) {
          setProgress(currentProgress);
        }
      }, 200);

      try {
        const response = await fetch("/api/v1/extraction/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        clearInterval(progressInterval);

        if (response.status === 401 || response.status === 403) {
          showError("Session expired or invalid. Please login again.");
          navigate("/login");
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Upload failed");
        }

        const data = await response.json();
        setProgress(100);
        showSuccess("Text extraction complete!");
        onExtractionComplete(data.extracted_text, data.processing_time);
      } catch (error: any) {
        clearInterval(progressInterval);
        setProgress(0);
        const errorMessage = error.message || "An error occurred during upload.";
        showError(errorMessage);
        onProcessingError(errorMessage);
      } finally {
        setProcessing(false);
        setFile(null);
      }
    },
    [onExtractionComplete, onProcessingStart, onProcessingError, navigate]
  );

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        const selectedFile = acceptedFiles[0];
        if (selectedFile.type === "application/pdf") {
          setFile(selectedFile);
          uploadFile(selectedFile);
        } else {
          showError("Please upload a valid PDF file.");
          onProcessingError("Invalid file type. Please upload a PDF.");
        }
      }
    },
    [uploadFile, onProcessingError],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const selectedFile = event.target.files[0];
      if (selectedFile.type === "application/pdf") {
        setFile(selectedFile);
        uploadFile(selectedFile);
      } else {
        showError("Please upload a valid PDF file.");
        onProcessingError("Invalid file type. Please upload a PDF.");
      }
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">PDF Text Extractor</CardTitle>
        <CardDescription>
          Upload a PDF to extract its text content.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <UploadCloud className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          {isDragActive ? (
            <p className="text-gray-600">Drop the PDF file here ...</p>
          ) : (
            <p className="text-gray-600">
              Drag 'n' drop a PDF file here, or click to select one
            </p>
          )}
          <p className="text-sm text-gray-500 mt-2">
            (Max file size: 300+ pages simulated)
          </p>
        </div>

        {file && (
          <div className="mt-6 p-4 border rounded-md flex items-center justify-between bg-gray-50">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-blue-500 mr-3" />
              <span className="text-sm font-medium text-gray-700">
                {file.name}
              </span>
            </div>
            {!processing && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-gray-500 hover:text-red-500"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}

        {processing && (
          <div className="mt-6">
            <p className="text-center text-sm text-gray-600 mb-2">
              Processing "{file?.name || "your PDF"}"...
            </p>
            <Progress value={progress} className="w-full" />
            <p className="text-center text-xs text-gray-500 mt-1">
              (Extracting text and validating with Gemini LLM...)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PdfUpload;