import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import RequireAuth from "@/components/RequireAuth";
import Index from "./pages/Index.tsx";

const Admin = lazy(() => import("./pages/Admin.tsx"));
const Stats = lazy(() => import("./pages/Stats.tsx"));
const UsersPage = lazy(() => import("./pages/Users.tsx"));
const Login = lazy(() => import("./pages/Login.tsx"));
const FirstLogin = lazy(() => import("./pages/FirstLogin.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/first-login" element={<FirstLogin />} />
            <Route path="/admin" element={<RequireAuth><Admin /></RequireAuth>} />
            <Route path="/admin/estadisticas" element={<RequireAuth><Stats /></RequireAuth>} />
            <Route path="/admin/usuarios" element={<RequireAuth><UsersPage /></RequireAuth>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
