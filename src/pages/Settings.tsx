import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Bell, Calendar, Trash2, Download, Save } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { SettingsSkeleton } from "@/components/LoadingSkeleton";
import { PageTransition } from "@/components/PageTransition";

export default function Settings() {
  const settings = useQuery(api.settings.get);
  const holidays = useQuery(api.holidays.list);
  const subjects = useQuery(api.subjects.list);
  const allAttendance = useQuery(api.attendance.list);

  const updateSettings = useMutation(api.settings.update);
  const createHoliday = useMutation(api.holidays.create);
  const deleteHoliday = useMutation(api.holidays.remove);

  // Notification settings
  const [preClassPrompts, setPreClassPrompts] = useState(true);
  const [promptOffset, setPromptOffset] = useState([10]);
  const [browserNotifications, setBrowserNotifications] = useState(true);
  const [notificationSound, setNotificationSound] = useState(true);

  // Semester settings
  const [semesterStart, setSemesterStart] = useState("");
  const [semesterEnd, setSemesterEnd] = useState("");
  const [defaultTarget, setDefaultTarget] = useState("75");

  // Holiday settings
  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");

  // Load settings when they're available
  useEffect(() => {
    if (settings) {
      setPreClassPrompts(settings.preClassPrompts);
      setPromptOffset([settings.promptOffsetMinutes]);
      setBrowserNotifications(settings.browserNotifications);
      setNotificationSound(settings.notificationSound);
      setSemesterStart(settings.semesterStartDate || "");
      setSemesterEnd(settings.semesterEndDate || "");
      setDefaultTarget(settings.defaultTargetAttendance.toString());
    }
  }, [settings]);

  const handleSaveNotifications = async () => {
    try {
      await updateSettings({
        preClassPrompts,
        promptOffsetMinutes: promptOffset[0],
        browserNotifications,
        notificationSound,
      });
      toast.success("Notification settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
    }
  };

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

  const handleAddHoliday = async () => {
    if (!holidayDate || !holidayName) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createHoliday({
        name: holidayName,
        date: holidayDate,
      });
      toast.success("Holiday added");
      setHolidayDate("");
      setHolidayName("");
    } catch (error) {
      toast.error("Failed to add holiday");
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteHoliday({ id: id as any });
      toast.success("Holiday deleted");
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  const handleExportData = () => {
    const data = {
      subjects: subjects || [],
      attendance: allAttendance || [],
      holidays: holidays || [],
      settings: settings || {},
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-data-${format(new Date(), "yyyy-MM-dd")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully");
  };

  if (!settings) {
    return (
      <AppLayout>
        <SettingsSkeleton />
      </AppLayout>
    );
  }

  return (
    <PageTransition>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your attendance tracking preferences
          </p>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="notifications">
              <Bell size={16} className="mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="semester">
              <Calendar size={16} className="mr-2" />
              Semester
            </TabsTrigger>
            <TabsTrigger value="holidays">
              <Calendar size={16} className="mr-2" />
              Holidays
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure how and when you receive attendance reminders
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Pre-class Prompts */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="preclass">Pre-class Prompts</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminded before your classes start
                      </p>
                    </div>
                    <Switch
                      id="preclass"
                      checked={preClassPrompts}
                      onCheckedChange={setPreClassPrompts}
                    />
                  </div>

                  {/* Prompt Offset */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="offset">Prompt Offset</Label>
                      <span className="text-sm font-medium">{promptOffset[0]} minutes</span>
                    </div>
                    <Slider
                      id="offset"
                      value={promptOffset}
                      onValueChange={setPromptOffset}
                      min={5}
                      max={60}
                      step={5}
                      disabled={!preClassPrompts}
                    />
                    <p className="text-xs text-muted-foreground">
                      Get notified {promptOffset[0]} minutes before class
                    </p>
                  </div>

                  {/* Browser Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="browser">Browser Notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable desktop notifications
                      </p>
                    </div>
                    <Switch
                      id="browser"
                      checked={browserNotifications}
                      onCheckedChange={setBrowserNotifications}
                    />
                  </div>

                  {/* Notification Sound */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="sound">Notification Sound</Label>
                      <p className="text-sm text-muted-foreground">
                        Play a sound with notifications
                      </p>
                    </div>
                    <Switch
                      id="sound"
                      checked={notificationSound}
                      onCheckedChange={setNotificationSound}
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleSaveNotifications} className="flex-1">
                      <Save size={16} className="mr-2" />
                      Save Changes
                    </Button>
                    <Button onClick={handleExportData} variant="outline">
                      <Download size={16} className="mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Semester Tab */}
          <TabsContent value="semester">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                    <Button onClick={handleExportData} variant="outline">
                      <Download size={16} className="mr-2" />
                      Export Data
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Add Holiday Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Add Holiday</CardTitle>
                  <CardDescription>
                    Mark dates as holidays to exclude them from attendance calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="holidayDate">Date</Label>
                      <Input
                        id="holidayDate"
                        type="date"
                        value={holidayDate}
                        onChange={(e) => setHolidayDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="holidayName">Holiday Name</Label>
                      <Input
                        id="holidayName"
                        value={holidayName}
                        onChange={(e) => setHolidayName(e.target.value)}
                        placeholder="e.g., Christmas"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddHoliday} className="w-full">
                    Add Holiday
                  </Button>
                </CardContent>
              </Card>

              {/* Holidays List Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Marked Holidays</CardTitle>
                </CardHeader>
                <CardContent>
                  {!holidays || holidays.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      No holidays marked yet
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {holidays
                        .sort((a, b) => a.date.localeCompare(b.date))
                        .map((holiday, index) => (
                          <motion.div
                            key={holiday._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-accent transition-colors group"
                          >
                            <div>
                              <p className="font-medium">{holiday.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {format(parseISO(holiday.date), "EEEE, MMMM do, yyyy")}
                              </p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleDeleteHoliday(holiday._id)}
                            >
                              <Trash2 size={16} className="text-destructive" />
                            </Button>
                          </motion.div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Export Button */}
              <div className="flex justify-end">
                <Button onClick={handleExportData} variant="outline">
                  <Download size={16} className="mr-2" />
                  Export Data
                </Button>
              </div>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      </AppLayout>
    </PageTransition>
  );
}
