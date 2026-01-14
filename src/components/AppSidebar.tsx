import { LayoutDashboard, BookOpen, Settings, LogOut, Mail, User } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState } from "react";
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
import { useAuth } from "@/hooks/use-auth";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

const navItems = [
  {
    icon: BookOpen,
    label: "Subjects",
    href: "/subjects",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [userInfo, setUserInfo] = useState({
    emoji: "🎓",
    name: localStorage.getItem("userName") || "Student",
    branch: localStorage.getItem("userBranch") || "Computer Science",
    year: localStorage.getItem("userYear") || "3rd Year",
  });
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [tempInfo, setTempInfo] = useState(userInfo);

  const handleSave = () => {
    setUserInfo(tempInfo);
    localStorage.setItem("userName", tempInfo.name);
    localStorage.setItem("userBranch", tempInfo.branch);
    localStorage.setItem("userYear", tempInfo.year);
    setIsEditOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      setIsEditOpen(false);
      navigate("/auth");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Failed to log out");
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
            title={`${userInfo.name} - ${userInfo.branch}`}
          >
            {userInfo.emoji}
          </motion.button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Account Info */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] flex items-center justify-center text-2xl">
                  {userInfo.emoji}
                </div>
                <div className="flex-1">
                  <div className="font-semibold flex items-center gap-2">
                    <User size={14} className="text-muted-foreground" />
                    {userInfo.name}
                  </div>
                  {user?.email && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <Mail size={14} />
                      {user.email}
                    </div>
                  )}
                </div>
              </div>
              <Separator />
              <div className="text-sm space-y-1">
                <div className="text-muted-foreground">
                  <span className="font-medium">Branch:</span> {userInfo.branch}
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium">Year:</span> {userInfo.year}
                </div>
              </div>
            </div>

            <Separator />

            {/* Edit Profile Fields */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold">Edit Profile Info</h3>
              <div>
                <Label htmlFor="emoji" className="text-xs">Emoji</Label>
                <Input
                  id="emoji"
                  value={tempInfo.emoji}
                  onChange={(e) => setTempInfo({ ...tempInfo, emoji: e.target.value })}
                  placeholder="🎓"
                  maxLength={2}
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="name" className="text-xs">Name</Label>
                <Input
                  id="name"
                  value={tempInfo.name}
                  onChange={(e) => setTempInfo({ ...tempInfo, name: e.target.value })}
                  placeholder="Your Name"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="branch" className="text-xs">Branch/Course</Label>
                <Input
                  id="branch"
                  value={tempInfo.branch}
                  onChange={(e) => setTempInfo({ ...tempInfo, branch: e.target.value })}
                  placeholder="Computer Science"
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="year" className="text-xs">Year</Label>
                <Input
                  id="year"
                  value={tempInfo.year}
                  onChange={(e) => setTempInfo({ ...tempInfo, year: e.target.value })}
                  placeholder="3rd Year"
                  className="h-9"
                />
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <div className="flex gap-2">
                <Button onClick={handleSave} className="flex-1" size="sm">
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setTempInfo(userInfo);
                    setIsEditOpen(false);
                  }}
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full"
                size="sm"
              >
                <LogOut size={16} className="mr-2" />
                Log Out
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
    </motion.aside>
  );
}
