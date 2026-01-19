import * as React from "react";
import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, MapPin, Calendar, Trash2, Check } from "lucide-react";
import { convertTo12Hour } from "@/lib/attendance-utils";

interface ClassEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classData: {
    _id: string;
    subjectId: string;
    subject?: {
      _id: string;
      name: string;
      code: string;
      color: string;
    };
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    type: string;
    room?: string;
    weekPattern?: number[];
  } | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CLASS_TYPES = ["LECTURE", "LAB", "TUTORIAL"];

export function ClassEditDialog({ open, onOpenChange, classData }: ClassEditDialogProps) {
  const [room, setRoom] = useState("");
  const [type, setType] = useState("LECTURE");
  const [weekPattern, setWeekPattern] = useState<number[]>([]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const updateClass = useMutation(api.classes.update);
  const deleteClass = useMutation(api.classes.remove);

  useEffect(() => {
    if (classData) {
      setRoom(classData.room || "");
      setType(classData.type || "LECTURE");
      setWeekPattern(classData.weekPattern || []);
      setStartTime(classData.startTime || "09:00");
      setEndTime(classData.endTime || "10:00");
    }
  }, [classData]);

  const handleSave = async () => {
    if (!classData) return;

    try {
      await updateClass({
        id: classData._id as Id<"classes">,
        room: room.trim() || undefined,
        type,
        weekPattern: weekPattern.length > 0 ? weekPattern : undefined,
        startTime,
        endTime,
      });

      toast.success(
        <div className="flex items-center gap-2">
          <Check className="text-green-600" size={18} />
          <span>Class updated successfully</span>
        </div>
      );
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to update class");
    }
  };

  const handleDelete = async () => {
    if (!classData) return;

    if (!confirm("Are you sure you want to delete this class? This action cannot be undone.")) {
      return;
    }

    try {
      await deleteClass({ id: classData._id as Id<"classes"> });
      toast.success("Class deleted successfully");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to delete class");
    }
  };

  const toggleWeek = (week: number) => {
    setWeekPattern((prev) =>
      prev.includes(week) ? prev.filter((w) => w !== week) : [...prev, week].sort()
    );
  };

  if (!classData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: classData.subject?.color || "#8b5cf6" }}
            />
            Edit Class Details
          </DialogTitle>
          <DialogDescription>
            {classData.subject?.name} ({classData.subject?.code})
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Day and Time Info */}
          <div className="bg-muted/50 p-3 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="font-medium">{DAYS[classData.dayOfWeek]}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-muted-foreground" />
              <span>
                {convertTo12Hour(classData.startTime)} - {convertTo12Hour(classData.endTime)}
              </span>
            </div>
          </div>

          {/* Time Edit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>
          </div>

          {/* Class Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Class Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CLASS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Room Number */}
          <div className="space-y-2">
            <Label htmlFor="room" className="flex items-center gap-2">
              <MapPin size={14} />
              Room Number
            </Label>
            <Input
              id="room"
              placeholder="e.g., Room 301, Lab A, etc."
              value={room}
              onChange={(e) => setRoom(e.target.value)}
            />
          </div>

          {/* Week Pattern */}
          <div className="space-y-2">
            <Label>Week Pattern (leave empty for every week)</Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((week) => (
                <Badge
                  key={week}
                  variant={weekPattern.includes(week) ? "default" : "outline"}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => toggleWeek(week)}
                >
                  Week {week}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              {weekPattern.length === 0
                ? "This class occurs every week"
                : `This class occurs only in week${weekPattern.length > 1 ? "s" : ""} ${weekPattern.join(", ")}`}
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={handleDelete} className="mr-auto">
            <Trash2 size={16} className="mr-2" />
            Delete
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
