import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";
import { StoreProvider } from "@/store/StoreContext";
import { initTheme } from "@/hooks/useTheme";
import LanguageSelect from "./pages/LanguageSelect";
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
        <HashRouter>
          <Routes>
            <Route path="/" element={<LanguageSelect />} />
            <Route path="/menu" element={<MenuScreen />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/order" element={<OnlineOrder />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </HashRouter>
      </StoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
