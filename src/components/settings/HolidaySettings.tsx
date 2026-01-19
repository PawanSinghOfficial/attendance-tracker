import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";

interface HolidaySettingsProps {
  onExport: () => void;
}

export function HolidaySettings({ onExport }: HolidaySettingsProps) {
  const holidays = useQuery(api.holidays.list);
  const createHoliday = useMutation(api.holidays.create);
  const deleteHoliday = useMutation(api.holidays.remove);

  const [holidayDate, setHolidayDate] = useState("");
  const [holidayName, setHolidayName] = useState("");

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

  return (
    <div className="space-y-6">
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
        <Button onClick={onExport} variant="outline">
          <Download size={16} className="mr-2" />
          Export Data
        </Button>
      </div>
    </div>
  );
}
