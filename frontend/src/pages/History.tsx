import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { showError, showSuccess } from "@/utils/toast";
import { Calendar, Clock, FileText, HardDrive, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Extraction {
  id: number;
  filename: string;
  file_size: number;
  extracted_text: string;
  created_at: string;
  processing_time?: number;
  page_count?: number;
}

const History = () => {
  const [history, setHistory] = useState<Extraction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExtraction, setSelectedExtraction] = useState<Extraction | null>(
    null
  );

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await fetch("/api/v1/extraction/history");

      if (!response.ok) {
        throw new Error("Failed to fetch history");
      }

      const data = await response.json();
      setHistory(data);
    } catch (error) {
      console.error(error);
      showError("Could not load extraction history");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click or other events
    if (!confirm("Are you sure you want to delete this extraction?")) return;

    try {
        const response = await fetch(`/api/v1/extraction/history/${id}`, {
            method: "DELETE",
        });

        if (!response.ok) {
            throw new Error("Failed to delete extraction");
        }

        setHistory(history.filter(item => item.id !== id));
        showSuccess("Extraction deleted successfully");
    } catch (error) {
        console.error(error);
        showError("Failed to delete extraction");
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Extraction History</h1>

      {loading ? (
        <div className="text-center py-8">Loading history...</div>
      ) : history.length === 0 ? (
        <Card>
            <CardContent className="pt-6 text-center text-muted-foreground">
                No extraction history found.
            </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Past Extractions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Filename</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Pages</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-blue-500" />
                        {item.filename}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            {new Date(item.created_at).toLocaleDateString()}
                        </div>
                        {item.processing_time && (
                             <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                Processed in {item.processing_time.toFixed(2)}s
                             </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                        {item.page_count ? `${item.page_count} pages` : "N/A"}
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-gray-400" />
                        {formatFileSize(item.file_size)}
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedExtraction(item)}
                        >
                            View Text
                        </Button>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => handleDelete(item.id, e)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedExtraction}
        onOpenChange={(open) => !open && setSelectedExtraction(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{selectedExtraction?.filename}</DialogTitle>
            <DialogDescription>
              Extracted on {selectedExtraction && new Date(selectedExtraction.created_at).toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 border rounded-md bg-muted/50 mt-2">
            <pre className="whitespace-pre-wrap font-mono text-sm">
              {selectedExtraction?.extracted_text}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default History;