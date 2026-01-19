import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { ArrowRight, Calendar, CheckCircle, Clock, BarChart3 } from "lucide-react";
import { useConvexAuth } from "convex/react";

export default function Landing() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
              <Calendar size={20} />
            </div>
            <span>AttendanceTracker</span>
          </div>
          <nav className="flex items-center gap-4">
            {isLoading ? (
               <div className="w-20 h-9 bg-muted animate-pulse rounded-md" />
            ) : isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <Button onClick={() => navigate("/auth")}>
                Sign In
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 md:py-32 px-4 md:px-6 text-center space-y-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tighter bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Master Your Schedule, <br /> Track Your Success
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              The ultimate attendance tracker for students. Keep track of your classes, monitor your attendance percentage, and never miss a lecture again.
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Button size="lg" className="h-12 px-8 text-lg gap-2" onClick={() => navigate(isAuthenticated ? "/dashboard" : "/auth")}>
              {isAuthenticated ? "Go to Dashboard" : "Get Started Now"} <ArrowRight size={18} />
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
              Learn More
            </Button>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container px-4 md:px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to stay on track</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Simple, powerful features designed to help you maintain your target attendance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <FeatureCard 
                icon={<Clock className="text-blue-500" size={32} />}
                title="Smart Scheduling"
                description="Visualize your weekly timetable with ease. Know exactly when and where your next class is."
                delay={0.1}
              />
              <FeatureCard 
                icon={<BarChart3 className="text-green-500" size={32} />}
                title="Attendance Analytics"
                description="Track your attendance percentage in real-time. Get insights on which subjects need attention."
                delay={0.2}
              />
              <FeatureCard 
                icon={<CheckCircle className="text-purple-500" size={32} />}
                title="Goal Tracking"
                description="Set target attendance goals for each subject. We'll tell you how many classes you can afford to miss."
                delay={0.3}
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container px-4 md:px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AttendanceTracker. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5 }}
      className="bg-background p-8 rounded-xl shadow-sm border hover:shadow-md transition-shadow"
    >
      <div className="mb-4 p-3 bg-muted/50 rounded-lg w-fit">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </motion.div>
  );
}
