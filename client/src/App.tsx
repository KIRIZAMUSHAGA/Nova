import * as React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/HomePage";
import ThreadPage from "@/pages/ThreadPage";
import AboutPage from "@/pages/AboutPage";
import WelcomePage from "@/pages/WelcomePage";
import SignupPage from "@/pages/SignupPage";
import LoginPage from "@/pages/LoginPage";
import { Sidebar } from "@/components/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

function SplashScreen() {
  return (
    <motion.div 
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: "easeInOut" }}
      className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center gap-6"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          duration: 0.5,
          repeat: Infinity,
          repeatType: "reverse"
        }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center text-white shadow-2xl shadow-primary/40"
      >
        <Sparkles className="w-12 h-12" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h1 className="text-3xl font-display font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
          Nova AI
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">Initialisation de l'intelligence...</p>
      </motion.div>
    </motion.div>
  );
}

function PrivateRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return <div className="flex-1 flex items-center justify-center">Chargement...</div>;
  }

  if (!user) {
    return <Redirect to="/welcome" />;
  }

  return <Component />;
}

function Router() {
  const { user, isLoading } = useAuth();
  const [location] = useLocation();

  // Redirect to home if already logged in and trying to access auth pages
  if (!isLoading && user && ["/welcome", "/login", "/signup"].includes(location)) {
    return <Redirect to="/" />;
  }

  return (
    <div className="flex-1 relative overflow-hidden flex flex-col h-full">
      <Switch>
        {/* Auth Routes */}
        <Route path="/welcome" component={WelcomePage} />
        <Route path="/signup" component={SignupPage} />
        <Route path="/login" component={LoginPage} />

        {/* Protected Routes */}
        <Route path="/">
          {user ? <HomePage /> : <Redirect to="/welcome" />}
        </Route>
        <Route path="/thread/:id">
          {user ? <ThreadPage /> : <Redirect to="/welcome" />}
        </Route>
        <Route path="/about">
          {user ? <AboutPage /> : <Redirect to="/welcome" />}
        </Route>

        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AppLayout() {
  const [location] = useLocation();
  const [showSplash, setShowSplash] = React.useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const { user, isLoading } = useAuth();

  // Show splash only on first load, but dismiss it when auth is loaded or after 1.2 seconds
  React.useEffect(() => {
    if (!isLoading) {
      setShowSplash(false);
      return;
    }
    
    const timer = setTimeout(() => setShowSplash(false), 1200);
    return () => clearTimeout(timer);
  }, [isLoading]);

  // Hide sidebar for auth pages
  const isAuthPage = ["/welcome", "/login", "/signup"].includes(location);
  const showLayout = user && !isAuthPage;

  return (
    <>
      <AnimatePresence>
        {showSplash && <SplashScreen key="splash" />}
      </AnimatePresence>

      {showLayout ? (
        // App Layout (for authenticated users)
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden selection:bg-primary/20">
          <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

          <main className="flex-1 relative overflow-hidden flex flex-col h-full">
            <header className="h-14 border-b border-border/50 flex items-center px-4 md:hidden shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="hover-elevate"
              >
                {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </Button>
              <h1 className="ml-4 font-display font-bold text-lg">Nova AI</h1>
            </header>

            <div className="flex-1 overflow-hidden relative h-full">
              <Router />
            </div>
            <Toaster />
          </main>
        </div>
      ) : (
        // Auth Layout (for unauthenticated users)
        <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
          <Router />
          <Toaster />
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppLayout />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
