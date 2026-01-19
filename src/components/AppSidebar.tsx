import { LayoutDashboard, BookOpen, Settings, CalendarDays, HelpCircle } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const navItems = [
  {
    icon: BookOpen,
    label: "Subjects",
    href: "/subjects",
  },
  {
    icon: CalendarDays,
    label: "Schedule",
    href: "/schedule",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const [userInfo, setUserInfo] = useState({
    emoji: "🎓",
    name: localStorage.getItem("userName") || "Student",
    branch: localStorage.getItem("userBranch") || "Computer Science",
    year: localStorage.getItem("userYear") || "3rd Year",
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempInfo, setTempInfo] = useState(userInfo);
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const tourSeen = localStorage.getItem("attendanceTrackerTourSeen");
    setHasSeenTour(!!tourSeen);
  }, []);

  const handleSave = () => {
    setUserInfo(tempInfo);
    localStorage.setItem("userName", tempInfo.name);
    localStorage.setItem("userBranch", tempInfo.branch);
    localStorage.setItem("userYear", tempInfo.year);
    setIsEditOpen(false);
  };

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-white border-r border-border flex-col items-center py-6 z-50"
    >
      {/* User Profile Avatar */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogTrigger asChild>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mb-4 w-12 h-12 rounded-full bg-gradient-to-br from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] flex items-center justify-center text-2xl shadow-lg cursor-pointer hover:shadow-xl transition-shadow"
            title={`${userInfo.name} - ${userInfo.branch}`}
          >
            {userInfo.emoji}
          </motion.button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="emoji">Emoji</Label>
              <Input
                id="emoji"
                value={tempInfo.emoji}
                onChange={(e) => setTempInfo({ ...tempInfo, emoji: e.target.value })}
                placeholder="🎓"
                maxLength={2}
              />
            </div>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={tempInfo.name}
                onChange={(e) => setTempInfo({ ...tempInfo, name: e.target.value })}
                placeholder="Your Name"
              />
            </div>
            <div>
              <Label htmlFor="branch">Branch/Course</Label>
              <Input
                id="branch"
                value={tempInfo.branch}
                onChange={(e) => setTempInfo({ ...tempInfo, branch: e.target.value })}
                placeholder="Computer Science"
              />
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={tempInfo.year}
                onChange={(e) => setTempInfo({ ...tempInfo, year: e.target.value })}
                placeholder="3rd Year"
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button onClick={handleSave} className="flex-1">
                Save
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setTempInfo(userInfo);
                  setIsEditOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dashboard Icon - Separate from navigation */}
      <Link to="/dashboard" className="mb-8">
        <motion.div
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
            location.pathname === "/dashboard"
              ? "bg-gradient-to-br from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] text-white shadow-lg"
              : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          )}
          title="Dashboard"
        >
          <LayoutDashboard size={22} />
        </motion.div>
      </Link>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href}>
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "bg-gradient-to-br from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] text-white shadow-lg"
                    : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
                title={item.label}
              >
                <Icon size={22} />
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* Help/Feature Tour Button - At bottom */}
      <motion.button
        onClick={() => {
          // Trigger the tour by dispatching a custom event
          window.dispatchEvent(new CustomEvent('openFeatureTour'));
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-lg transition-all duration-200 hover:shadow-xl relative mb-4"
        title="Feature Guide"
      >
        <HelpCircle size={22} strokeWidth={2.5} />
        {!hasSeenTour && (
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"
          />
        )}
      </motion.button>
    </motion.aside>
  );
}
