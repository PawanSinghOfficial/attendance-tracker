import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Check, XIcon, StickyNote, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { formatDate } from "@/lib/attendance-utils";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function QuickActionsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<"mark" | "note" | "bulk" | null>(null);
  const [selectedClass, setSelectedClass] = useState<{
    subjectId: Id<"subjects">;
    classId?: Id<"classes">;
    exceptionId?: Id<"classExceptions">;
    name: string;
  } | null>(null);
  const [note, setNote] = useState("");

  const today = new Date();
  const todayStr = formatDate(today);

  const todaySchedule = useQuery(api.classes.getScheduleForDate, {
    date: todayStr,
  });
  const allAttendance = useQuery(api.attendance.list);
  const markAttendance = useMutation(api.attendance.mark);

  // Get today's classes
  const todayClasses = (todaySchedule?.classes || []).map((cls) => ({
    ...cls,
    attendance: allAttendance?.find((a) => {
      if (cls.isException && cls.exceptionId) {
        return a.exceptionId === cls.exceptionId && a.date === todayStr;
      }

      return a.classId === cls._id && a.date === todayStr;
    }),
  }));

  const unmarkedClasses = todayClasses.filter((cls) => !cls.attendance);
  const getAttendanceTargetIds = (cls: {
    _id: string;
    isException?: boolean;
    exceptionId?: Id<"classExceptions">;
  }) => ({
    classId: cls.isException ? undefined : (cls._id as Id<"classes">),
    exceptionId: cls.isException ? cls.exceptionId : undefined,
  });

  const handleMarkAttendance = async (status: "present" | "absent") => {
    if (!selectedClass) return;

    try {
        await markAttendance({
          subjectId: selectedClass.subjectId,
          classId: selectedClass.classId,
          exceptionId: selectedClass.exceptionId,
          date: todayStr,
          status,
          note: note || undefined,
      });

      toast.success(
        <div className="flex items-center gap-2">
          {status === "present" ? (
            <Check className="text-green-600" size={18} />
          ) : (
            <XIcon className="text-red-600" size={18} />
          )}
          <span>Marked as {status}</span>
        </div>
      );

      setIsOpen(false);
      setSelectedAction(null);
      setSelectedClass(null);
      setNote("");
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <XIcon className="text-red-600" size={18} />
          <span>Failed to mark attendance</span>
        </div>
      );
    }
  };

  const handleBulkMarkAll = async (status: "present" | "absent") => {
    try {
      for (const cls of unmarkedClasses) {
        const targetIds = getAttendanceTargetIds(cls);
        await markAttendance({
          subjectId: cls.subjectId,
          classId: targetIds.classId,
          exceptionId: targetIds.exceptionId,
          date: todayStr,
          status,
        });
      }

      toast.success(
        <div className="flex items-center gap-2">
          <Zap className="text-blue-600" size={18} />
          <span>Marked all {unmarkedClasses.length} classes as {status}</span>
        </div>
      );

      setIsOpen(false);
      setSelectedAction(null);
    } catch (error) {
      toast.error(
        <div className="flex items-center gap-2">
          <XIcon className="text-red-600" size={18} />
          <span>Failed to mark attendance</span>
        </div>
      );
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-8 right-8 z-50 quick-actions-fab"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <Button
          size="lg"
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-lg bg-gradient-to-br from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] hover:shadow-xl transition-shadow ${unmarkedClasses.length > 0 ? "pulse-attention" : ""}`}
        >
          <motion.div
            animate={{ rotate: isOpen ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={24} />
          </motion.div>
        </Button>
      </motion.div>

      {/* Quick Actions Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 z-50"
          >
            <Card className="w-80 shadow-xl">
              <CardContent className="p-4">
                {!selectedAction ? (
                  <div className="space-y-2">
                    <h3 className="font-semibold mb-3">Quick Actions</h3>

                    {unmarkedClasses.length > 0 ? (
                      <>
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => setSelectedAction("mark")}
                        >
                          <Check size={18} className="mr-2" />
                          Mark Today's Attendance ({unmarkedClasses.length})
                        </Button>

                        {unmarkedClasses.length > 1 && (
                          <Button
                            variant="outline"
                            className="w-full justify-start"
                            onClick={() => setSelectedAction("bulk")}
                          >
                            <Zap size={18} className="mr-2" />
                            Mark All at Once
                          </Button>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        All classes marked for today!
                      </p>
                    )}
                  </div>
                ) : selectedAction === "bulk" ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Mark All Classes</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAction(null)}
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    <p className="text-sm text-muted-foreground mb-4">
                      Mark all {unmarkedClasses.length} classes as:
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        onClick={() => handleBulkMarkAll("present")}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Check size={16} className="mr-1" />
                        All Present
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleBulkMarkAll("absent")}
                      >
                        <XIcon size={16} className="mr-1" />
                        All Absent
                      </Button>
                    </div>
                  </div>
                ) : selectedAction === "mark" && !selectedClass ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">Select Class</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedAction(null)}
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    {unmarkedClasses.map((cls) => (
                      <Button
                        key={cls._id}
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => {
                          const targetIds = getAttendanceTargetIds(cls);
                          setSelectedClass({
                            subjectId: cls.subjectId,
                            classId: targetIds.classId,
                            exceptionId: targetIds.exceptionId,
                            name: cls.subject?.name || "Unknown",
                          });
                        }}
                      >
                        <div className="text-left flex-1">
                          <div className="font-medium">{cls.subject?.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {cls.startTime} - {cls.endTime}
                          </div>
                        </div>
                        <Badge variant="secondary">{cls.type}</Badge>
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{selectedClass?.name}</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedClass(null);
                          setNote("");
                        }}
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-2">
                        <StickyNote size={14} />
                        Add Note (Optional)
                      </label>
                      <Textarea
                        placeholder="e.g., Was sick, Emergency, etc."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="resize-none"
                        rows={2}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <Button
                        onClick={() => handleMarkAttendance("present")}
                        className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                      >
                        <Check size={16} className="mr-1" />
                        Present
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleMarkAttendance("absent")}
                      >
                        <XIcon size={16} className="mr-1" />
                        Absent
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
