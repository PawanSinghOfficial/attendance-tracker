import { LayoutDashboard, BookOpen, Settings, User } from "lucide-react";
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
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export function AppSidebar() {
  const location = useLocation();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed left-0 top-0 h-screen w-20 bg-white border-r border-border flex flex-col items-center py-6 z-50"
    >
      {/* User Avatar */}
      <div className="mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[oklch(var(--gradient-2))] to-[oklch(var(--gradient-3))] flex items-center justify-center text-white font-semibold text-lg shadow-lg">
          <User size={24} />
        </div>
      </div>

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
