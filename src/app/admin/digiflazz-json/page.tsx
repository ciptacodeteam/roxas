"use client";

import { useState } from "react";
import { Loader2, Download, Copy, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppSidebar } from "@/components/app-sidebar";
import { AdminHeader } from "@/components/admin-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DigiflazzJsonPage() {
  const [cmd, setCmd] = useState<"prepaid" | "pasca" | "full">("prepaid");
  const [jsonData, setJsonData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleFetchJson = async () => {
    setIsLoading(true);
    setJsonData(null);
    setCopied(false);
    
    try {
      // Direct API call to Digiflazz without any utilities
      const response = await fetch(`/api/admin/digiflazz-direct?cmd=${cmd}`);
      const result = await response.json();
      
      if (result.success) {
        const jsonString = JSON.stringify(result.data, null, 2);
        setJsonData(jsonString);
        toast.success("Price list fetched successfully from Digiflazz API");
      } else {
        toast.error("Failed to fetch price list", {
          description: result.message || "Please try again",
        });
      }
    } catch (error) {
      toast.error("Failed to fetch price list", {
        description: error instanceof Error ? error.message : "Please try again",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyJson = async () => {
    if (jsonData) {
      try {
        await navigator.clipboard.writeText(jsonData);
        setCopied(true);
        toast.success("JSON copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        toast.error("Failed to copy JSON");
      }
    }
  };

  const handleDownloadJson = () => {
    if (jsonData) {
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `digiflazz-price-list-${cmd}-${Date.now()}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("JSON file downloaded");
    }
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="container mx-auto px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold">Digiflazz Price List JSON</h1>
                  <p className="mt-2 text-gray-400">
                    Fetch and view raw JSON data from Digiflazz API
                  </p>
                </div>

                <Card className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <CardTitle>Fetch Price List</CardTitle>
                    <CardDescription>
                      Select the type of price list you want to fetch from Digiflazz
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <label className="text-sm font-medium mb-2 block">Price List Type</label>
                        <Select value={cmd} onValueChange={(value) => setCmd(value as "prepaid" | "pasca" | "full")}>
                          <SelectTrigger className="bg-gray-800 text-gray-100 border-gray-700">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-800 text-gray-100 border-gray-700">
                            <SelectItem value="prepaid" className="hover:bg-gray-700">Prepaid</SelectItem>
                            <SelectItem value="pasca" className="hover:bg-gray-700">Pascabayar</SelectItem>
                            <SelectItem value="full" className="hover:bg-gray-700">Full (Both)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleFetchJson}
                          disabled={isLoading}
                          size="lg"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Fetching...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Fetch JSON
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {jsonData && (
                  <Card className="bg-gray-900 border-gray-800 mt-6">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>JSON Data</CardTitle>
                          <CardDescription>
                            Raw price list data from Digiflazz API ({cmd})
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleCopyJson}
                            variant="outline"
                            size="sm"
                          >
                            {copied ? (
                              <>
                                <Check className="mr-2 h-4 w-4" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Copy className="mr-2 h-4 w-4" />
                                Copy JSON
                              </>
                            )}
                          </Button>
                          <Button
                            onClick={handleDownloadJson}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="relative">
                        <pre className="bg-gray-950 p-4 rounded-lg overflow-auto max-h-[calc(100vh-400px)] text-sm font-mono border border-gray-800">
                          <code className="text-gray-300">{jsonData}</code>
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {!jsonData && !isLoading && (
                  <Card className="bg-gray-900 border-gray-800 mt-6">
                    <CardContent className="py-12">
                      <div className="text-center text-gray-400">
                        <p className="text-lg mb-2">No data loaded</p>
                        <p className="text-sm">Click "Fetch JSON" to load the price list from Digiflazz</p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

