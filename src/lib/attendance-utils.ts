import { format, addDays, startOfWeek, endOfWeek, isAfter, isBefore, parseISO } from "date-fns";

export interface AttendanceRecord {
  date: string;
  status: "present" | "absent";
}

export interface SubjectStats {
  present: number;
  absent: number;
  total: number;
  percentage: number;
  targetAttendance: number;
}

// Calculate attendance percentage
export function calculateAttendancePercentage(present: number, total: number): number {
  if (total === 0) return 0;
  return (present / total) * 100;
}

// Calculate how many more classes needed to reach target
export function calculateClassesNeeded(
  currentPresent: number,
  currentTotal: number,
  targetPercentage: number
): number {
  // Formula: (P + x) / (T + x) = target/100
  // Solving for x: x = (target * T - 100 * P) / (100 - target)

  if (targetPercentage >= 100) return 0;
  if (currentTotal === 0) return 0;

  const currentPercentage = (currentPresent / currentTotal) * 100;
  if (currentPercentage >= targetPercentage) return 0;

  const classesNeeded = Math.ceil(
    (targetPercentage * currentTotal - 100 * currentPresent) / (100 - targetPercentage)
  );

  return Math.max(0, classesNeeded);
}

// Calculate how many classes can be skipped while maintaining target
export function calculateClassesCanSkip(
  currentPresent: number,
  currentTotal: number,
  targetPercentage: number
): number {
  if (currentTotal === 0) return 0;

  const currentPercentage = (currentPresent / currentTotal) * 100;
  if (currentPercentage < targetPercentage) return 0;

  // Formula: (P) / (T + x) = target/100
  // Solving for x: x = (100 * P / target) - T

  const canSkip = Math.floor((100 * currentPresent) / targetPercentage - currentTotal);
  return Math.max(0, canSkip);
}

// Predict final attendance based on current pace
export function predictFinalAttendance(
  currentPresent: number,
  currentTotal: number,
  remainingClasses: number
): number {
  if (currentTotal === 0) return 0;

  const currentRate = currentPresent / currentTotal;
  const predictedPresent = currentPresent + remainingClasses * currentRate;
  const predictedTotal = currentTotal + remainingClasses;

  return (predictedPresent / predictedTotal) * 100;
}

// Check if subject will reach target based on current pace
export function willReachTarget(
  currentPresent: number,
  currentTotal: number,
  targetPercentage: number,
  remainingClasses: number
): { willReach: boolean; predicted: number } {
  const predicted = predictFinalAttendance(currentPresent, currentTotal, remainingClasses);
  return {
    willReach: predicted >= targetPercentage,
    predicted,
  };
}

// Calculate streak of consecutive present days
export function calculateStreak(records: AttendanceRecord[]): number {
  if (records.length === 0) return 0;

  // Sort by date descending
  const sorted = [...records].sort((a, b) => b.date.localeCompare(a.date));

  let streak = 0;
  for (const record of sorted) {
    if (record.status === "present") {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// Get current week dates (Sunday to Saturday)
export function getCurrentWeekDates(): Date[] {
  const today = new Date();
  const start = startOfWeek(today, { weekStartsOn: 0 }); // Sunday
  const dates: Date[] = [];

  for (let i = 0; i < 7; i++) {
    dates.push(addDays(start, i));
  }

  return dates;
}

// Format date to YYYY-MM-DD
export function formatDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

// Format date to display format
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "EEEE, MMMM do");
}

// Get day name
export function getDayName(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "EEEE");
}

// Get short day name
export function getShortDayName(date: Date | string): string {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  return format(dateObj, "EEE");
}

// Check if date is today
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === "string" ? parseISO(date) : date;
  const today = new Date();
  return formatDate(dateObj) === formatDate(today);
}

// Calculate remaining classes in semester
export function calculateRemainingClasses(
  semesterEndDate: string | undefined,
  classesPerWeek: number
): number {
  if (!semesterEndDate) return 20; // Default estimate

  const today = new Date();
  const endDate = parseISO(semesterEndDate);

  if (isBefore(endDate, today)) return 0;

  const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  const weeksRemaining = Math.ceil(daysRemaining / 7);

  return weeksRemaining * classesPerWeek;
}

// Get color class based on percentage and target
export function getAttendanceColorClass(percentage: number, target: number): string {
  if (percentage >= target) return "text-green-600";
  if (percentage >= target - 10) return "text-yellow-600";
  return "text-red-600";
}

// Get badge variant based on percentage and target
export function getAttendanceBadgeVariant(
  percentage: number,
  target: number
): "default" | "secondary" | "destructive" {
  if (percentage >= target) return "default";
  if (percentage >= target - 10) return "secondary";
  return "destructive";
}

// Convert 24-hour time to 12-hour format (e.g., "14:30" -> "02:30 PM")
export function convertTo12Hour(time24: string): string {
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for midnight
  return `${hours12.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")} ${period}`;
}

// Convert 12-hour time to 24-hour format (e.g., "02:30 PM" -> "14:30")
export function convertTo24Hour(time12: string): string {
  const [time, period] = time12.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}
