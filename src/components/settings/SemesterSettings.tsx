import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

interface SemesterSettingsProps {
  onExport: () => void;
}

export function SemesterSettings({ onExport }: SemesterSettingsProps) {
  const settings = useQuery(api.settings.get);
  const updateSettings = useMutation(api.settings.update);

  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");
  const [defaultTarget, setDefaultTarget] = useState("75");

  useEffect(() => {
    if (settings) {
      setSemesterStart(settings.semesterStartDate || "");
      setSemesterEnd(settings.semesterEndDate || "");
      setDefaultTarget(settings.defaultTargetAttendance.toString());
    }
  }, [settings]);

  const handleSaveSemester = async () => {
    try {
      await updateSettings({
        semesterStartDate: semesterStart || undefined,
        semesterEndDate: semesterEnd || undefined,
        defaultTargetAttendance: parseInt(defaultTarget),
      });
      toast.success("Semester settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Semester Settings</CardTitle>
        <CardDescription>
          Set your semester dates and default attendance target
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Semester Start */}
        <div className="space-y-2">
          <Label htmlFor="start">Semester Start Date</Label>
          <Input
            id="start"
            type="date"
            value={semesterStart}
            onChange={(e) => setSemesterStart(e.target.value)}
          />
        </div>

        {/* Semester End */}
        <div className="space-y-2">
          <Label htmlFor="end">Semester End Date</Label>
          <Input
            id="end"
            type="date"
            value={semesterEnd}
            onChange={(e) => setSemesterEnd(e.target.value)}
          />
        </div>

        {/* Default Target */}
        <div className="space-y-2">
          <Label htmlFor="target">Default Target Attendance (%)</Label>
          <Input
            id="target"
            type="number"
            min="0"
            max="100"
            value={defaultTarget}
            onChange={(e) => setDefaultTarget(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            This will be the default target for new subjects
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button onClick={handleSaveSemester} className="flex-1">
            <Save size={16} className="mr-2" />
            Save Changes
          </Button>
          <Button onClick={onExport} variant="outline">
            <Download size={16} className="mr-2" />
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
