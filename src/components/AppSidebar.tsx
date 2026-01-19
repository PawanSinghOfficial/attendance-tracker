import { LayoutDashboard, BookOpen, Settings, CalendarDays, HelpCircle, LogOut } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { useAuthActions } from "@convex-dev/auth/react";
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
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";

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
  const { signOut } = useAuthActions();
  const location = useLocation();
  const user = useQuery(api.users.currentUser);
  const updateProfile = useMutation(api.users.updateProfile);
  
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempInfo, setTempInfo] = useState({
    emoji: "🎓",
    name: "Student",
    branch: "Computer Science",
    year: "3rd Year",
  });
  const [hasSeenTour, setHasSeenTour] = useState(true);

  useEffect(() => {
    const tourSeen = localStorage.getItem("attendanceTrackerTourSeen");
    setHasSeenTour(!!tourSeen);
  }, []);

  useEffect(() => {
    if (user) {
      setTempInfo({
        emoji: user.emoji || "🎓",
        name: user.name || "Student",
        branch: user.branch || "Computer Science",
        year: user.year || "3rd Year",
      });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      await updateProfile({
        name: tempInfo.name,
        emoji: tempInfo.emoji,
        branch: tempInfo.branch,
        year: tempInfo.year,
      });
      setIsEditOpen(false);
      toast.success("Profile updated");
    } catch (error) {
      toast.error("Failed to update profile");
    }
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
            title={`${tempInfo.name} - ${tempInfo.branch}`}
          >
            {tempInfo.emoji}
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
                  if (user) {
                    setTempInfo({
                      emoji: user.emoji || "🎓",
                      name: user.name || "Student",
                      branch: user.branch || "Computer Science",
                      year: user.year || "3rd Year",
                    });
                  }
                  setIsEditOpen(false);
                }}
              >
                Cancel
              </Button>
            </div>
            <div className="pt-2 border-t mt-2">
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
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
        className="w-12 h-12 rounded-xl flex items-center justify-center bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 relative mb-4"
        title="Feature Guide"
      >
        <HelpCircle size={22} />
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