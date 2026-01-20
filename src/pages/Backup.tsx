import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageTransition } from "@/components/PageTransition";
import { toast } from "sonner";
import { Download, Upload, Trash2, AlertTriangle, Loader2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";

export default function Backup() {
  const navigate = useNavigate();
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

      if (!data.subjects || !Array.isArray(data.subjects)) {
        throw new Error("Invalid backup file format");
      }

      await importUserData({ data: JSON.stringify(data) });
      toast.success("Data imported successfully!");

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
      setShowDeleteConfirm(false);
    } catch (error: any) {
      console.error("Delete error:", error);
      toast.error(error.message || "Failed to delete data");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageTransition>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] bg-clip-text text-transparent">
                Backup & Restore
              </h1>
              <p className="text-muted-foreground mt-1">
                Export your attendance data or restore from a previous backup
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Settings
            </Button>
          </div>

          <div className="space-y-6">
            {/* Export Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5 text-green-600" />
                  Export Data
                </CardTitle>
                <CardDescription>
                  Download all your subjects, classes, and attendance records as a JSON file
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleExport} disabled={!userData}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </Button>
              </CardContent>
            </Card>

            {/* Import Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-blue-600" />
                  Import Data
                </CardTitle>
                <CardDescription>
                  Restore your data from a previous backup file. This will add to your existing data.
                </CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>

            {/* Delete Section */}
            <Card className="border-red-200 bg-red-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-900">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-red-700">
                  Permanently delete all your attendance data. This action cannot be undone.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!showDeleteConfirm ? (
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteConfirm(true)}
                    disabled={isDeleting}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete All Data
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                      <p className="text-sm font-medium text-red-900">
                        Are you absolutely sure?
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        This will permanently delete all your subjects, classes, attendance records,
                        holidays, and settings. This action cannot be undone.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isDeleting}
                      >
                        {isDeleting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          "Yes, Delete Everything"
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowDeleteConfirm(false)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <Card>
              <CardHeader>
                <CardTitle>How to migrate your data</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                  <li>First, export your data using the "Download Backup" button above</li>
                  <li>Sign in with your email address (if you haven't already)</li>
                  <li>After signing in, come back to this page and use "Upload Backup" to restore your data</li>
                  <li>All your subjects, classes, and attendance will be linked to your email account</li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </AppLayout>
    </PageTransition>
  );
}
