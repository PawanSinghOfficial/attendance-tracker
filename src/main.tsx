import { Toaster } from "@/components/ui/sonner";
import { VlyToolbar } from "../vly-toolbar-readonly.tsx";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient, ConvexProvider } from "convex/react";
import { StrictMode, useEffect, lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import "./index.css";
import "./types/global.d.ts";

// Lazy load route components for better code splitting
const Landing = lazy(() => import("./pages/Landing.tsx"));
const AuthPage = lazy(() => import("./pages/Auth.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Dashboard = lazy(() => import("./pages/Dashboard.tsx"));
const Subjects = lazy(() => import("./pages/Subjects.tsx"));
const Settings = lazy(() => import("./pages/Settings.tsx"));
const Schedule = lazy(() => import("./pages/Schedule.tsx"));
const Backup = lazy(() => import("./pages/Backup.tsx"));

// Simple loading fallback for route transitions
function RouteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

function MissingEnvScreen() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="max-w-2xl w-full rounded-2xl border bg-card p-8 space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">Setup Required</h1>
        <p className="text-muted-foreground">
          The app could not start because <code>VITE_CONVEX_URL</code> is not set
          in your local environment.
        </p>
        <div className="rounded-xl bg-muted p-4 text-sm space-y-2">
          <p>Add a <code>.env.local</code> file in the project root with:</p>
          <pre className="whitespace-pre-wrap break-all">
VITE_CONVEX_URL=https://your-deployment.convex.cloud
          </pre>
        </div>
        <p className="text-sm text-muted-foreground">
          After saving the file, restart the dev server.
        </p>
      </div>
    </div>
  );
}

const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null;



function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Landing />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/subjects" element={<Subjects />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VlyToolbar />
    <InstrumentationProvider>
      {convex ? (
        <ConvexProvider client={convex}>
          <ConvexAuthProvider client={convex}>
            <BrowserRouter>
              <RouteSyncer />
              <Suspense fallback={<RouteLoading />}>
                <AnimatedRoutes />
              </Suspense>
            </BrowserRouter>
            <Toaster />
          </ConvexAuthProvider>
        </ConvexProvider>
      ) : (
        <>
          <MissingEnvScreen />
          <Toaster />
        </>
      )}
    </InstrumentationProvider>
  </StrictMode>,
);
