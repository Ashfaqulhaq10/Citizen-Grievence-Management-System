console.log("App.tsx is executing");
import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import OfficerLogin from "./pages/OfficerLogin";
import OfficerDashboard from "./pages/OfficerDashboard";

const queryClient = new QueryClient();

import SiteHeader from "@/components/layout/SiteHeader";
import { I18nProvider } from "@/i18n";

const App = () => (
  <I18nProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SiteHeader onStart={() => document.getElementById("complain")?.scrollIntoView({ behavior: "smooth" })} />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/officer-login" element={<OfficerLogin />} />
            <Route path="/officer-dashboard" element={<OfficerDashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </I18nProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
