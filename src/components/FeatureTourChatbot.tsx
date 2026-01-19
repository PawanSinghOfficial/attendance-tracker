import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  RotateCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  message: string;
  highlightSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
  action?: string;
}

const tourSteps: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to Attendance Tracker! 👋",
    message:
      "Hi! I'm your guide. I'll walk you through every feature of this app step by step. Let's start the tour!",
  },
  {
    id: "dashboard-header",
    title: "Dashboard Overview",
    message:
      "This is your main dashboard. Here you can see today's date and quick access to important features. The weekly summary badge shows your attendance percentage for the current week.",
    highlightSelector: ".dashboard-header",
  },
  {
    id: "overall-attendance",
    title: "Overall Attendance Widget",
    message:
      "This widget shows your overall attendance across all subjects. You can see total classes attended vs total classes, and your overall percentage.",
    highlightSelector: ".overall-summary",
  },
  {
    id: "today-schedule",
    title: "Today's Schedule",
    message:
      "Here you'll see all classes scheduled for today. You can quickly mark attendance as Present or Absent by clicking the buttons on each class card.",
    highlightSelector: ".today-schedule",
    action: "Mark attendance directly from these cards",
  },
  {
    id: "mark-attendance",
    title: "Marking Attendance",
    message:
      "Each class card shows the subject name, time, and type (Lecture/Lab). Click the green 'Present' button if you attended, or red 'Absent' if you missed the class.",
    highlightSelector: ".today-schedule",
  },
  {
    id: "upcoming-days",
    title: "Upcoming Days View",
    message:
      "Click on 'Upcoming Days' to expand and see classes for the next 6 days. You can mark attendance in advance or update past classes.",
    highlightSelector: ".upcoming-days",
  },
  {
    id: "weekly-schedule",
    title: "Weekly Schedule View",
    message:
      "This section shows your entire week's schedule. You can toggle between 'Cards' view and 'Timetable' view using the buttons at the top right.",
    highlightSelector: ".weekly-schedule",
  },
  {
    id: "timetable-view",
    title: "Timetable Grid View",
    message:
      "In timetable view, you get a visual grid showing all classes across the week. Each class is color-coded by subject. Click on any class box to edit its details!",
    highlightSelector: ".weekly-schedule",
    action: "Try clicking on a class in the timetable",
  },
  {
    id: "class-edit",
    title: "Edit Class Details",
    message:
      "When you click a class in the timetable, you can edit room numbers, change class times, switch between Lecture/Lab/Tutorial, and set week patterns for rotating schedules.",
    action: "Perfect for Saturday classes with different schedules each week!",
  },
  {
    id: "week-pattern",
    title: "Week Pattern Feature",
    message:
      "Week patterns let you handle rotating schedules! For example, if your Saturday afternoon classes change weekly (Week 1, 2, 3, 4), you can set which weeks each class occurs.",
    action: "Just click Week 1, 2, 3, or 4 badges in the edit dialog",
  },
  {
    id: "subject-cards",
    title: "Subject Statistics Cards",
    message:
      "Each subject has its own detailed card showing: attendance percentage, progress ring, present/absent counts, and predictions if you'll reach your target.",
    highlightSelector: ".subjects-section",
  },
  {
    id: "progress-ring",
    title: "Visual Progress Tracking",
    message:
      "The circular progress ring changes color based on your performance. Green means you're meeting your target, red means you need to improve. Very visual and easy to understand!",
    highlightSelector: ".subjects-section",
  },
  {
    id: "attendance-prediction",
    title: "Smart Predictions",
    message:
      "The app predicts your final attendance percentage if you maintain your current pace. It considers remaining weeks in the semester and your attendance pattern.",
  },
  {
    id: "lecture-lab-split",
    title: "Separate Lecture/Lab Tracking",
    message:
      "Each subject tracks Lectures and Labs separately! Expand a subject card to see individual attendance percentages for lectures vs labs.",
    highlightSelector: ".subjects-section",
  },
  {
    id: "streak-counter",
    title: "Attendance Streaks 🔥",
    message:
      "When you attend all classes for a subject, you'll see a streak counter! Keep the flame alive by maintaining 100% attendance.",
  },
  {
    id: "smart-suggestions",
    title: "Smart Suggestions",
    message:
      "The app alerts you about subjects needing attention (close to target) and subjects that may not reach target. It tells you exactly how many more classes you need to attend!",
    highlightSelector: ".smart-suggestions",
  },
  {
    id: "calendar-view",
    title: "Calendar View",
    message:
      "Click 'Show Calendar' at the top to see a monthly calendar view of your attendance. Days are color-coded: green for attended, red for missed, gray for no classes.",
    highlightSelector: ".calendar-button",
    action: "Great for seeing attendance patterns over time",
  },
  {
    id: "quick-actions",
    title: "Quick Actions Button",
    message:
      "The floating Quick Actions button (usually at the bottom right) gives you fast access to add subjects, classes, holidays, and view settings.",
    highlightSelector: ".quick-actions-fab",
  },
  {
    id: "view-toggle",
    title: "View Toggle Buttons",
    message:
      "Switch between Cards view and Timetable view using these toggle buttons. Each view has its advantages - cards show more details, timetable shows the week at a glance.",
    highlightSelector: ".view-toggle",
  },
  {
    id: "weekly-badge",
    title: "Weekly Summary Badge",
    message:
      "This badge at the top right shows your attendance percentage for the current week. It updates in real-time as you mark attendance!",
    highlightSelector: ".weekly-summary-badge",
  },
  {
    id: "reset-feature",
    title: "Reset Attendance",
    message:
      "The 'Reset All' button lets you start fresh if needed. Use this at the beginning of a new semester. Warning: This deletes all attendance records!",
    highlightSelector: ".reset-button",
  },
  {
    id: "navigation",
    title: "Navigation Menu",
    message:
      "Use the navigation menu to access different pages: Dashboard (home), Subjects (manage courses), Schedule (manage timetable), and Settings (customize app).",
    highlightSelector: "nav",
  },
  {
    id: "responsive-design",
    title: "Mobile Friendly",
    message:
      "This app works great on mobile! All features are accessible on phones and tablets. The timetable adapts to smaller screens for easy viewing anywhere.",
  },
  {
    id: "tour-complete",
    title: "You're All Set! 🎉",
    message:
      "That's everything! You now know how to use all features. Feel free to restart this tour anytime by clicking the chat button. Happy tracking!",
    action: "Click 'Finish Tour' to close",
  },
];

export function FeatureTourChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);

  useEffect(() => {
    // Check if user has seen the tour
    const tourSeen = localStorage.getItem("attendanceTrackerTourSeen");
    if (!tourSeen) {
      // Auto-open tour for first-time users after 2 seconds
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
    setHasSeenTour(true);
  }, []);

  useEffect(() => {
    if (isOpen && currentStep > 0) {
      const step = tourSteps[currentStep];
      if (step.highlightSelector) {
        highlightElement(step.highlightSelector);
      }
    } else {
      removeHighlight();
    }

    return () => removeHighlight();
  }, [currentStep, isOpen]);

  const highlightElement = (selector: string) => {
    removeHighlight();

    const elements = document.querySelectorAll(selector);
    elements.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.position = "relative";
        element.style.zIndex = "1000";
        element.style.outline = "3px solid #8b5cf6";
        element.style.outlineOffset = "4px";
        element.style.borderRadius = "8px";
        element.style.boxShadow = "0 0 0 9999px rgba(0, 0, 0, 0.5)";
        element.classList.add("tour-highlight");

        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  };

  const removeHighlight = () => {
    const highlighted = document.querySelectorAll(".tour-highlight");
    highlighted.forEach((element) => {
      if (element instanceof HTMLElement) {
        element.style.position = "";
        element.style.zIndex = "";
        element.style.outline = "";
        element.style.outlineOffset = "";
        element.style.borderRadius = "";
        element.style.boxShadow = "";
        element.classList.remove("tour-highlight");
      }
    });
  };

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    removeHighlight();
    if (!hasSeenTour) {
      localStorage.setItem("attendanceTrackerTourSeen", "true");
      setHasSeenTour(true);
    }
  };

  const handleRestart = () => {
    setCurrentStep(0);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setCurrentStep(0);
  };

  const currentStepData = tourSteps[currentStep];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  return (
    <>
      {/* Floating Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-28 right-6 z-50"
          >
            <Button
              onClick={handleOpen}
              size="lg"
              className="rounded-full h-14 w-14 shadow-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <MessageCircle size={24} />
            </Button>
            {!hasSeenTour && (
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chatbot Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop overlay for highlighting */}
            {currentStep > 0 && currentStepData.highlightSelector && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[999] pointer-events-none"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
              />
            )}

            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="fixed bottom-6 right-6 z-[1001] w-96 max-w-[calc(100vw-3rem)]"
            >
              <Card className="shadow-2xl border-2 border-purple-200 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-4 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={20} />
                      <h3 className="font-bold">Feature Guide</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X size={18} />
                    </Button>
                  </div>
                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Step {currentStep + 1} of {tourSteps.length}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-1.5">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="bg-white h-1.5 rounded-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Content */}
                <CardContent className="p-4 space-y-4">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                  >
                    <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
                      {currentStepData.title}
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentStepData.message}
                    </p>
                    {currentStepData.action && (
                      <Badge variant="secondary" className="mt-3">
                        💡 {currentStepData.action}
                      </Badge>
                    )}
                  </motion.div>

                  {/* Navigation Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRestart}
                      className="gap-2"
                    >
                      <RotateCw size={14} />
                      Restart
                    </Button>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevious}
                        disabled={currentStep === 0}
                      >
                        <ChevronLeft size={16} />
                      </Button>
                      {currentStep === tourSteps.length - 1 ? (
                        <Button
                          onClick={handleClose}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-blue-500"
                        >
                          Finish Tour
                        </Button>
                      ) : (
                        <Button
                          onClick={handleNext}
                          size="sm"
                          className="bg-gradient-to-r from-purple-500 to-blue-500 gap-1"
                        >
                          Next
                          <ChevronRight size={16} />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Skip Tour */}
                  {currentStep === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClose}
                      className="w-full text-xs"
                    >
                      Skip Tour
                    </Button>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
