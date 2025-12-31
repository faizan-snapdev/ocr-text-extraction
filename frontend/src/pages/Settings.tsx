import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess } from "@/utils/toast";
import { CheckCircle2, Key, Loader2, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";

const Settings = () => {
  const [apiKey, setApiKey] = useState("");
  const [currentKeyMasked, setCurrentKeyMasked] = useState<string | null>(null);
  const [isKeySet, setIsKeySet] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/v1/config/gemini-key");

      if (!response.ok) {
        throw new Error("Failed to fetch API key status");
      }

      const data = await response.json();
      setIsKeySet(data.is_set);
      setCurrentKeyMasked(data.key);
    } catch (error) {
      console.error("Error fetching key status:", error);
      showError("Failed to load settings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      showError("Please enter a valid API key");
      return;
    }

    try {
      setIsSaving(true);
      const headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      const response = await fetch("/api/v1/config/gemini-key", {
        method: "POST",
        headers,
        body: JSON.stringify({ key: apiKey }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Failed to update API key");
      }

      const data = await response.json();
      showSuccess(data.message || "API Key updated successfully");
      
      // Clear input and refresh status
      setApiKey("");
      await fetchKeyStatus();
      
    } catch (error: any) {
      console.error("Error updating key:", error);
      showError(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 bg-gray-50 dark:bg-gray-950">
      <div className="w-full max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">Settings</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your application configuration and preferences.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Gemini API Configuration
            </CardTitle>
            <CardDescription>
              Configure the Google Gemini API key used for text extraction and processing.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Status Section */}
            <div className="rounded-lg border p-4 bg-gray-50 dark:bg-gray-900">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Current Status
                </span>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
                ) : isKeySet ? (
                  <span className="flex items-center gap-1 text-sm font-medium text-green-600 dark:text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                    Configured
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-sm font-medium text-amber-600 dark:text-amber-500">
                    <XCircle className="h-4 w-4" />
                    Not Set
                  </span>
                )}
              </div>
              
              {!isLoading && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 font-mono">
                  {isKeySet ? (
                    <>
                      <span>Key:</span>
                      <span className="bg-gray-200 dark:bg-gray-800 px-2 py-0.5 rounded">
                        {currentKeyMasked}
                      </span>
                    </>
                  ) : (
                    <span className="italic">No API key is currently configured.</span>
                  )}
                </div>
              )}
            </div>

            {/* Update Form */}
            <form onSubmit={handleUpdateKey} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="apiKey">Update API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  placeholder="Enter your new Gemini API key"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500">
                  Your key will be stored securely in the server's environment configuration.
                  Updating this will restart the backend server.
                </p>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || !apiKey.trim()}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Save Configuration"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;