import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Layout } from "@/components/Layout";
import Index from "./pages/Index";
import Education from "./pages/Education";
import Family from "./pages/Family";
import Salary from "./pages/Salary";
import Medical from "./pages/Medical";
import Leave from "./pages/Leave";
import Others from "./pages/Others";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/education" element={<Education />} />
            <Route path="/family" element={<Family />} />
            <Route path="/salary" element={<Salary />} />
            <Route path="/medical" element={<Medical />} />
            <Route path="/leave" element={<Leave />} />
            <Route path="/others" element={<Others />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
