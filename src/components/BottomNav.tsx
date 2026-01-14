import { LayoutDashboard, BookOpen, Settings, CalendarDays } from "lucide-react";
import { Link, useLocation } from "react-router";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const navItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    href: "/dashboard",
  },
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

export function BottomNav() {
  const location = useLocation();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-border z-50 safe-area-pb"
    >
      <div className="flex items-center justify-around px-4 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href} className="flex-1">
              <motion.div
                whileTap={{ scale: 0.95 }}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 px-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground"
                )}
              >
                <div className="relative">
                  <Icon size={22} />
                  {isActive && (
                    <motion.div
                      layoutId="bottomNavIndicator"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </motion.nav>
  );
}
