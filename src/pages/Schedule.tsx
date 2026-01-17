import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Calendar, X as XIcon, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageTransition } from "@/components/PageTransition";
import { Id } from "@/convex/_generated/dataModel";
import { formatDate, convertTo12Hour } from "@/lib/attendance-utils";

export default function Schedule() {
  const holidays = useQuery(api.holidays.list);
  const subjects = useQuery(api.subjects.list);
  const classExceptions = useQuery(api.classExceptions.list);
  const weeklySchedule = useQuery(api.classes.getWeeklySchedule);

  const addHoliday = useMutation(api.holidays.create);
  const removeHoliday = useMutation(api.holidays.remove);
  const addClassException = useMutation(api.classExceptions.addClass);
  const cancelClass = useMutation(api.classExceptions.cancelClass);
  const removeException = useMutation(api.classExceptions.remove);

  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [holidayName, setHolidayName] = useState("");
  const [holidayDate, setHolidayDate] = useState("");

  const [isAddClassDialogOpen, setIsAddClassDialogOpen] = useState(false);
  const [addClass_date, setAddClass_date] = useState("");
  const [addClass_subjectId, setAddClass_subjectId] = useState<Id<"subjects"> | "">("");
  const [addClass_startTime, setAddClass_startTime] = useState("09:00");
  const [addClass_endTime, setAddClass_endTime] = useState("10:00");
  const [addClass_type, setAddClass_type] = useState("LECTURE");
  const [addClass_reason, setAddClass_reason] = useState("");

  const [isCancelClassDialogOpen, setIsCancelClassDialogOpen] = useState(false);
  const [cancelClass_date, setCancelClass_date] = useState("");
  const [cancelClass_classId, setCancelClass_classId] = useState<Id<"classes"> | "">("");
  const [cancelClass_reason, setCancelClass_reason] = useState("");

  const handleAddHoliday = async () => {
    if (!holidayName || !holidayDate) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await addHoliday({ name: holidayName, date: holidayDate });
      toast.success("Holiday added successfully");
      setIsHolidayDialogOpen(false);
      setHolidayName("");
      setHolidayDate("");
    } catch (error: any) {
      toast.error(error.message || "Failed to add holiday");
    }
  };

  const handleRemoveHoliday = async (id: Id<"holidays">) => {
    try {
      await removeHoliday({ id });
      toast.success("Holiday removed");
    } catch (error) {
      toast.error("Failed to remove holiday");
    }
  };

  const handleAddClass = async () => {
    if (!addClass_date || !addClass_subjectId || !addClass_startTime || !addClass_endTime) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      await addClassException({
        date: addClass_date,
        subjectId: addClass_subjectId,
        startTime: addClass_startTime,
        endTime: addClass_endTime,
        classType: addClass_type,
        reason: addClass_reason || undefined,
      });
      toast.success("Extra class added successfully");
      setIsAddClassDialogOpen(false);
      setAddClass_date("");
      setAddClass_subjectId("");
      setAddClass_startTime("09:00");
      setAddClass_endTime("10:00");
      setAddClass_type("LECTURE");
      setAddClass_reason("");
    } catch (error) {
      toast.error("Failed to add class");
    }
  };

  const handleCancelClass = async () => {
    if (!cancelClass_date || !cancelClass_classId) {
      toast.error("Please select a date and class");
      return;
    }

    try {
      // Get the class to find its subjectId
      const dayOfWeek = new Date(cancelClass_date + "T00:00:00").getDay();
      const dayClasses = weeklySchedule?.[dayOfWeek] || [];
      const selectedClass = dayClasses.find((c) => c._id === cancelClass_classId);

      if (!selectedClass) {
        toast.error("Class not found");
        return;
      }

      await cancelClass({
        date: cancelClass_date,
        subjectId: selectedClass.subjectId,
        classId: cancelClass_classId,
        reason: cancelClass_reason || undefined,
      });
      toast.success("Class cancelled successfully");
      setIsCancelClassDialogOpen(false);
      setCancelClass_date("");
      setCancelClass_classId("");
      setCancelClass_reason("");
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel class");
    }
  };

  const handleRemoveException = async (id: Id<"classExceptions">) => {
    try {
      await removeException({ id });
      toast.success("Exception removed");
    } catch (error) {
      toast.error("Failed to remove exception");
    }
  };

  // Get classes for the selected cancellation date
  const cancelClass_dayOfWeek = cancelClass_date
    ? new Date(cancelClass_date + "T00:00:00").getDay()
    : -1;
  const cancelClass_availableClasses =
    cancelClass_dayOfWeek >= 0 && weeklySchedule
      ? weeklySchedule[cancelClass_dayOfWeek] || []
      : [];

  if (!holidays || !subjects || !classExceptions) {
    return (
      <PageTransition>
        <AppLayout>
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-4xl font-bold">Schedule Management</h1>
              <p className="text-muted-foreground mt-1">Loading...</p>
            </div>
          </div>
        </AppLayout>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <AppLayout>
        <div className="max-w-6xl mx-auto space-y-8 fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] bg-clip-text text-transparent">
              Schedule Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage holidays and class exceptions
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Holidays */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Holidays</CardTitle>
                  <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus size={16} className="mr-1" />
                        Add Holiday
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Holiday</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="holiday-name">Holiday Name</Label>
                          <Input
                            id="holiday-name"
                            value={holidayName}
                            onChange={(e) => setHolidayName(e.target.value)}
                            placeholder="e.g., Christmas"
                          />
                        </div>
                        <div>
                          <Label htmlFor="holiday-date">Date</Label>
                          <Input
                            id="holiday-date"
                            type="date"
                            value={holidayDate}
                            onChange={(e) => setHolidayDate(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddHoliday}>Add Holiday</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {holidays.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No holidays added
                  </p>
                ) : (
                  holidays.map((holiday) => (
                    <div
                      key={holiday._id}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div>
                        <p className="font-medium">{holiday.name}</p>
                        <p className="text-sm text-muted-foreground">{holiday.date}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveHoliday(holiday._id)}
                      >
                        <Trash2 size={16} className="text-destructive" />
                      </Button>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Dialog open={isAddClassDialogOpen} onOpenChange={setIsAddClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Plus size={16} className="mr-2" />
                      Add Extra Class on Specific Day
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Extra Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="add-date">Date</Label>
                        <Input
                          id="add-date"
                          type="date"
                          value={addClass_date}
                          onChange={(e) => setAddClass_date(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="add-subject">Subject</Label>
                        <select
                          id="add-subject"
                          value={addClass_subjectId}
                          onChange={(e) => setAddClass_subjectId(e.target.value as Id<"subjects">)}
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
                          <Label htmlFor="add-start">Start Time</Label>
                          <Input
                            id="add-start"
                            type="time"
                            value={addClass_startTime}
                            onChange={(e) => setAddClass_startTime(e.target.value)}
                          />
                        </div>
                        <div>
                          <Label htmlFor="add-end">End Time</Label>
                          <Input
                            id="add-end"
                            type="time"
                            value={addClass_endTime}
                            onChange={(e) => setAddClass_endTime(e.target.value)}
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="add-type">Class Type</Label>
                        <select
                          id="add-type"
                          value={addClass_type}
                          onChange={(e) => setAddClass_type(e.target.value)}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="LECTURE">Lecture</option>
                          <option value="LAB">Lab</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="add-reason">Reason (Optional)</Label>
                        <Input
                          id="add-reason"
                          value={addClass_reason}
                          onChange={(e) => setAddClass_reason(e.target.value)}
                          placeholder="e.g., Makeup class"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsAddClassDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddClass}>Add Class</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <Dialog open={isCancelClassDialogOpen} onOpenChange={setIsCancelClassDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <XIcon size={16} className="mr-2" />
                      Cancel Class on Specific Day
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Class</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="cancel-date">Date</Label>
                        <Input
                          id="cancel-date"
                          type="date"
                          value={cancelClass_date}
                          onChange={(e) => setCancelClass_date(e.target.value)}
                        />
                      </div>
                      {cancelClass_date && (
                        <div>
                          <Label htmlFor="cancel-class">Select Class to Cancel</Label>
                          <select
                            id="cancel-class"
                            value={cancelClass_classId}
                            onChange={(e) => setCancelClass_classId(e.target.value as Id<"classes">)}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="">Select class</option>
                            {cancelClass_availableClasses.map((cls) => (
                              <option key={cls._id} value={cls._id}>
                                {cls.subject?.name} - {convertTo12Hour(cls.startTime)} to {convertTo12Hour(cls.endTime)} ({cls.type})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div>
                        <Label htmlFor="cancel-reason">Reason (Optional)</Label>
                        <Input
                          id="cancel-reason"
                          value={cancelClass_reason}
                          onChange={(e) => setCancelClass_reason(e.target.value)}
                          placeholder="e.g., Teacher unavailable"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsCancelClassDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCancelClass} variant="destructive">
                        Cancel Class
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          {/* Class Exceptions List */}
          <Card>
            <CardHeader>
              <CardTitle>Class Exceptions</CardTitle>
            </CardHeader>
            <CardContent>
              {classExceptions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No class exceptions
                </p>
              ) : (
                <div className="space-y-2">
                  {classExceptions.map((exception) => {
                    const subject = subjects.find((s) => s._id === exception.subjectId);
                    return (
                      <div
                        key={exception._id}
                        className="flex items-start justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={exception.type === "added" ? "default" : "destructive"}>
                              {exception.type === "added" ? "Added" : "Cancelled"}
                            </Badge>
                            <span className="font-medium">{subject?.name || "Unknown"}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {exception.date}
                            {exception.type === "added" &&
                              ` • ${convertTo12Hour(exception.startTime || "09:00")} - ${convertTo12Hour(exception.endTime || "10:00")} • ${exception.classType}`}
                          </p>
                          {exception.reason && (
                            <p className="text-sm text-muted-foreground italic mt-1">
                              {exception.reason}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveException(exception._id)}
                        >
                          <Trash2 size={16} className="text-destructive" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    </PageTransition>
  );
}
