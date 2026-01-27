import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LibraryPage from "@/pages/LibraryPage";
import { useEffect, useState } from "react";

function Router() {
  return (
    <Switch>
      {/* All books */}
      <Route path="/" component={LibraryPage} />
      
      {/* Reading Now */}
      <Route path="/reading">
        {() => <LibraryPage statusFilter="reading" />}
      </Route>
      
      {/* History/Completed */}
      <Route path="/history">
        {() => <LibraryPage statusFilter="completed" />}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("theme") as "light" | "dark") || "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div dir="rtl" className="font-cairo min-h-screen bg-background text-foreground">
          <Router />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
