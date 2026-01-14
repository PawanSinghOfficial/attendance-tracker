import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Plus, Trash2, BookOpen, Clock, Check, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate } from "@/lib/attendance-utils";
import { SubjectsSkeleton } from "@/components/LoadingSkeleton";
import { PageTransition } from "@/components/PageTransition";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const COLORS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#06b6d4", // Cyan
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
];

export default function Subjects() {
  const subjects = useQuery(api.subjects.list);
  const weeklySchedule = useQuery(api.classes.getWeeklySchedule);
  const allAttendance = useQuery(api.attendance.list);

  const createSubject = useMutation(api.subjects.create);
  const deleteSubject = useMutation(api.subjects.remove);
  const createClass = useMutation(api.classes.create);
  const deleteClass = useMutation(api.classes.remove);
  const markAttendance = useMutation(api.attendance.mark);

  const [selectedDay, setSelectedDay] = useState(1); // Monday by default
  const [isSubjectDialogOpen, setIsSubjectDialogOpen] = useState(false);
  const [isClassDialogOpen, setIsClassDialogOpen] = useState(false);

  // Subject form state
  const [subjectName, setSubjectName] = useState("");
  const [subjectCode, setSubjectCode] = useState("");
  const [targetAttendance, setTargetAttendance] = useState("75");
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  // Class form state
  const [selectedSubjectId, setSelectedSubjectId] = useState<Id<"subjects"> | "">("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [classType, setClassType] = useState("LECTURE");

  const handleCreateSubject = async () => {
    if (!subjectName || !subjectCode) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createSubject({
        name: subjectName,
        code: subjectCode,
        targetAttendance: parseInt(targetAttendance),
        color: selectedColor,
      });
      toast.success("Subject created");
      setIsSubjectDialogOpen(false);
      resetSubjectForm();
    } catch (error) {
      toast.error("Failed to create subject");
    }
  };

  const handleCreateClass = async () => {
    if (!selectedSubjectId || !startTime || !endTime) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await createClass({
        subjectId: selectedSubjectId as Id<"subjects">,
        dayOfWeek: selectedDay,
        startTime,
        endTime,
        type: classType,
      });
      toast.success("Class added");
      setIsClassDialogOpen(false);
      resetClassForm();
    } catch (error) {
      toast.error("Failed to add class");
    }
  };

  const handleDeleteSubject = async (id: Id<"subjects">) => {
    try {
      await deleteSubject({ id });
      toast.success("Subject deleted");
    } catch (error) {
      toast.error("Failed to delete subject");
    }
  };

  const handleDeleteClass = async (id: Id<"classes">) => {
    try {
      await deleteClass({ id });
      toast.success("Class deleted");
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  const handleMarkAttendance = async (
    subjectId: Id<"subjects">,
    classId: Id<"classes">,
    status: "present" | "absent"
  ) => {
    const today = formatDate(new Date());
    try {
      await markAttendance({
        subjectId,
        classId,
        date: today,
        status,
      });
      toast.success(`Marked as ${status}`);
    } catch (error) {
      toast.error("Failed to mark attendance");
    }
  };

  const resetSubjectForm = () => {
    setSubjectName("");
    setSubjectCode("");
    setTargetAttendance("75");
    setSelectedColor(COLORS[0]);
  };

  const resetClassForm = () => {
    setSelectedSubjectId("");
    setStartTime("09:00");
    setEndTime("10:00");
    setClassType("LECTURE");
  };

  if (!subjects || !weeklySchedule) {
    return (
      <PageTransition>
        <AppLayout>
          <SubjectsSkeleton />
        </AppLayout>
      </PageTransition>
    );
  }

  const selectedDayClasses = weeklySchedule[selectedDay] || [];
  const today = new Date();
  const todayStr = formatDate(today);

  return (
    <PageTransition>
      <AppLayout>
        <div className="max-w-7xl mx-auto space-y-8 fade-in">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] bg-clip-text text-transparent">
            Subjects & Schedule
          </h1>
          <p className="text-muted-foreground mt-1">Manage your subjects and weekly schedule</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - All Subjects */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>All Subjects</CardTitle>
                  <Dialog open={isSubjectDialogOpen} onOpenChange={setIsSubjectDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" variant="outline">
                        <Plus size={16} className="mr-1" />
                        Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Subject</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name">Subject Name</Label>
                          <Input
                            id="name"
                            value={subjectName}
                            onChange={(e) => setSubjectName(e.target.value)}
                            placeholder="e.g., Mathematics"
                          />
                        </div>
                        <div>
                          <Label htmlFor="code">Subject Code</Label>
                          <Input
                            id="code"
                            value={subjectCode}
                            onChange={(e) => setSubjectCode(e.target.value)}
                            placeholder="e.g., MATH101"
                          />
                        </div>
                        <div>
                          <Label htmlFor="target">Target Attendance (%)</Label>
                          <Input
                            id="target"
                            type="number"
                            min="0"
                            max="100"
                            value={targetAttendance}
                            onChange={(e) => setTargetAttendance(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label>Color</Label>
                          <div className="flex gap-2 mt-2">
                            {COLORS.map((color) => (
                              <button
                                key={color}
                                onClick={() => setSelectedColor(color)}
                                className={`w-8 h-8 rounded-full border-2 transition-all ${
                                  selectedColor === color
                                    ? "border-primary scale-110"
                                    : "border-transparent"
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsSubjectDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleCreateSubject}>Create Subject</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {subjects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No subjects yet
                  </p>
                ) : (
                  subjects.map((subject) => {
                    const subjectAttendance =
                      allAttendance?.filter((a) => a.subjectId === subject._id) || [];
                    const present = subjectAttendance.filter((a) => a.status === "present").length;
                    const total = subjectAttendance.length;
                    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

                    return (
                      <motion.div
                        key={subject._id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="p-3 bg-muted rounded-lg hover:bg-accent transition-colors group"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className="w-1 h-full rounded-full"
                            style={{ backgroundColor: subject.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{subject.name}</h3>
                            <p className="text-sm text-muted-foreground">{subject.code}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline" className="text-xs">
                                {percentage}%
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                Target: {subject.targetAttendance}%
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleDeleteSubject(subject._id)}
                          >
                            <Trash2 size={16} className="text-destructive" />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Weekly Schedule */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedDay.toString()} onValueChange={(v) => setSelectedDay(parseInt(v))}>
                  <TabsList className="grid grid-cols-7 w-full">
                    {DAYS.map((day, index) => (
                      <TabsTrigger key={day} value={index.toString()} className="text-xs px-1">
                        {day.slice(0, 3)}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {DAYS.map((day, dayIndex) => (
                    <TabsContent key={day} value={dayIndex.toString()} className="space-y-4 mt-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">{day}</h3>
                        <Dialog open={isClassDialogOpen} onOpenChange={setIsClassDialogOpen}>
                          <DialogTrigger asChild>
                            <Button size="sm">
                              <Plus size={16} className="mr-1" />
                              Add Class
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Add Class to {DAYS[selectedDay]}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="subject">Subject</Label>
                                <select
                                  id="subject"
                                  value={selectedSubjectId}
                                  onChange={(e) =>
                                    setSelectedSubjectId(e.target.value as Id<"subjects">)
                                  }
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="">Select subject</option>
                                  {subjects.map((subject) => (
                                    <option key={subject._id} value={subject._id}>
                                      {subject.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label htmlFor="startTime">Start Time</Label>
                                  <Input
                                    id="startTime"
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="endTime">End Time</Label>
                                  <Input
                                    id="endTime"
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                  />
                                </div>
                              </div>
                              <div>
                                <Label htmlFor="type">Type</Label>
                                <select
                                  id="type"
                                  value={classType}
                                  onChange={(e) => setClassType(e.target.value)}
                                  className="w-full p-2 border rounded-md"
                                >
                                  <option value="LECTURE">Lecture</option>
                                  <option value="LAB">Lab</option>
                                  <option value="TUTORIAL">Tutorial</option>
                                </select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setIsClassDialogOpen(false)}>
                                Cancel
                              </Button>
                              <Button onClick={handleCreateClass}>Add Class</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>

                      {selectedDayClasses.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                          <p>No classes scheduled for {day}</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {selectedDayClasses
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((cls) => {
                              const attendance = allAttendance?.find(
                                (a) => a.classId === cls._id && a.date === todayStr
                              );
                              const isToday = today.getDay() === selectedDay;

                              return (
                                <motion.div
                                  key={cls._id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="p-4 border rounded-lg hover-lift"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-semibold text-lg">
                                          {cls.subject?.name || "Unknown"}
                                        </h4>
                                        <Badge variant="secondary">{cls.type}</Badge>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Clock size={16} />
                                        <span>
                                          {cls.startTime} – {cls.endTime}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleDeleteClass(cls._id)}
                                    >
                                      <Trash2 size={16} className="text-destructive" />
                                    </Button>
                                  </div>

                                  {isToday && (
                                    <div className="mt-3 pt-3 border-t">
                                      {attendance ? (
                                        <div className="flex items-center justify-center gap-2 p-2 bg-muted rounded-lg">
                                          {attendance.status === "present" ? (
                                            <>
                                              <Check className="text-green-600" size={18} />
                                              <span className="text-sm font-medium">
                                                Marked Present
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <X className="text-red-600" size={18} />
                                              <span className="text-sm font-medium">
                                                Marked Absent
                                              </span>
                                            </>
                                          )}
                                        </div>
                                      ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              handleMarkAttendance(cls.subjectId, cls._id, "present")
                                            }
                                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                                          >
                                            <Check size={14} className="mr-1" />
                                            Present
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="destructive"
                                            onClick={() =>
                                              handleMarkAttendance(cls.subjectId, cls._id, "absent")
                                            }
                                          >
                                            <X size={14} className="mr-1" />
                                            Absent
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </motion.div>
                              );
                            })}
                        </div>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      </AppLayout>
    </PageTransition>
  );
}
