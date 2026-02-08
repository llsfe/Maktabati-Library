import { Switch, Route, Router as WouterRouter } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import LibraryPage from "@/pages/LibraryPage";
import { useEffect, useState } from "react";
import { useHashLocation } from "./lib/hash-location";

function AppRouter() {
  return (
    <WouterRouter hook={useHashLocation}>
      <Switch>
        {/* Reading Now */}
        <Route path="/reading">
          {(props) => <LibraryPage {...props} statusFilter="reading" />}
        </Route>

        {/* History/Recently Opened */}
        <Route path="/history">
          {(props) => <LibraryPage {...props} statusFilter="history" />}
        </Route>

        {/* All books */}
        <Route path="/">{(props) => <LibraryPage {...props} />}</Route>

        <Route component={NotFound} />
      </Switch>
    </WouterRouter>
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
        <div
          dir="rtl"
          className="font-cairo min-h-screen bg-background text-foreground"
        >
          <AppRouter />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
