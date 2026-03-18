import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/store/StoreContext";
import { initTheme } from "@/hooks/useTheme";
import LanguageSelect from "./pages/LanguageSelect";
import MenuTypeSelect from "./pages/MenuTypeSelect";
import MenuScreen from "./pages/MenuScreen";
import AdminPanel from "./pages/AdminPanel";
import OnlineOrder from "./pages/OnlineOrder";
import NotFound from "./pages/NotFound";
import DevPanel from "./pages/DevPanel";

const queryClient = new QueryClient();

// Apply saved theme on load
initTheme();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <StoreProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LanguageSelect />} />
            <Route path="/select" element={<MenuTypeSelect />} />
            <Route path="/menu" element={<MenuScreen />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/order" element={<OnlineOrder />} />
            <Route path="/dev" element={<DevPanel />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
