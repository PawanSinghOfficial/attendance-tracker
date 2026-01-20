import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Bell, Calendar, LogOut, Database } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAuthActions } from "@convex-dev/auth/react";
import { SettingsSkeleton } from "@/components/LoadingSkeleton";
import { PageTransition } from "@/components/PageTransition";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { SemesterSettings } from "@/components/settings/SemesterSettings";
import { HolidaySettings } from "@/components/settings/HolidaySettings";
import { BackupRestore } from "@/components/BackupRestore";

export default function Settings() {
  const { signOut } = useAuthActions();
  const settings = useQuery(api.settings.get);
  const holidays = useQuery(api.holidays.list);
  const subjects = useQuery(api.subjects.list);
  const allAttendance = useQuery(api.attendance.list);

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
      <PageTransition>
        <AppLayout>
          <SettingsSkeleton />
        </AppLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AppLayout>
        <div className="max-w-4xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] bg-clip-text text-transparent">
              Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure your attendance tracking preferences
            </p>
          </div>
          <Button variant="destructive" size="sm" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>

        <Tabs defaultValue="notifications" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
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
            <TabsTrigger value="backup">
              <Database size={16} className="mr-2" />
              Backup
            </TabsTrigger>
          </TabsList>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <NotificationSettings onExport={handleExportData} />
            </motion.div>
          </TabsContent>

          {/* Semester Tab */}
          <TabsContent value="semester">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <SemesterSettings onExport={handleExportData} />
            </motion.div>
          </TabsContent>

          {/* Holidays Tab */}
          <TabsContent value="holidays">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <HolidaySettings onExport={handleExportData} />
            </motion.div>
          </TabsContent>

          {/* Backup Tab */}
          <TabsContent value="backup">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <BackupRestore />
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
      </AppLayout>
    </PageTransition>
  );
}