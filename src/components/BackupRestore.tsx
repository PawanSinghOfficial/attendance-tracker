import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Download, Upload, Trash2, AlertTriangle, Loader2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function BackupRestore() {
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const userData = useQuery(api.backup.exportUserData);
  const importUserData = useMutation(api.backup.importUserData);
  const deleteAllUserData = useMutation(api.backup.deleteAllUserData);

  const handleExport = () => {
    if (!userData) {
      toast.error("No data to export");
      return;
    }

    try {
      const dataStr = JSON.stringify(userData, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `attendance-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validate the backup file structure
      if (!data.subjects || !Array.isArray(data.subjects)) {
        throw new Error("Invalid backup file format");
      }

      await importUserData({ data: JSON.stringify(data) });
      toast.success("Data imported successfully!");

      // Reset file input
      event.target.value = "";
    } catch (error: any) {
      console.error("Import error:", error);
      toast.error(error.message || "Failed to import data");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAllUserData();
      toast.success("All data deleted successfully");
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Backup & Restore</CardTitle>
        <CardDescription>
          Export your attendance data to a file or restore from a previous backup
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4">
          {/* Export Section */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <Download className="h-5 w-5 text-green-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium">Export Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your subjects, classes, and attendance records as a JSON file
              </p>
              <Button
                onClick={handleExport}
                disabled={!userData}
                className="mt-3"
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Backup
              </Button>
            </div>
          </div>

          {/* Import Section */}
          <div className="flex items-start gap-4 p-4 border rounded-lg">
            <Upload className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium">Import Data</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Restore your data from a previous backup file. This will add to your existing data.
              </p>
              <div className="mt-3">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  disabled={isImporting}
                  className="hidden"
                  id="import-file"
                />
                <label htmlFor="import-file">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isImporting}
                    onClick={() => document.getElementById("import-file")?.click()}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload Backup
                      </>
                    )}
                  </Button>
                </label>
              </div>
            </div>
          </div>

          {/* Delete Section */}
          <div className="flex items-start gap-4 p-4 border border-red-200 rounded-lg bg-red-50/50">
            <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-red-900">Danger Zone</h3>
              <p className="text-sm text-red-700 mt-1">
                Permanently delete all your attendance data. This action cannot be undone.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="mt-3" disabled={isDeleting}>
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete All Data
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete all your subjects, classes, attendance records,
                      holidays, and settings. This action cannot be undone. Make sure you have
                      exported your data if you want to keep it.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                      Yes, Delete Everything
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">How to migrate your data:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>First, export your data using the "Download Backup" button above</li>
            <li>Sign in with your email address</li>
            <li>After signing in, come back to this page and use "Upload Backup" to restore your data</li>
            <li>All your subjects, classes, and attendance will be linked to your email account</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}
