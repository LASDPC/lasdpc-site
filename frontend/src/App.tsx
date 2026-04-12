import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import PeoplePage from "@/pages/PeoplePage";
import ResearchPage from "@/pages/ResearchPage";
import InfrastructurePage from "@/pages/InfrastructurePage";
import BlogPage from "@/pages/BlogPage";
import BlogPostPage from "@/pages/BlogPostPage";
import ContactPage from "@/pages/ContactPage";
import DocsPage from "@/pages/DocsPage";
import LoginPage from "@/pages/LoginPage";
import ProjectPage from "@/pages/ProjectPage";
import AdminEditPage from "@/pages/AdminEditPage";
import ProfilePage from "@/pages/ProfilePage";
import RegisterPage from "@/pages/RegisterPage";
import PendingUsersPage from "@/pages/PendingUsersPage";
import ComingSoonPage from "@/pages/ComingSoonPage";
import NotFound from "./pages/NotFound.tsx";

const MAINTENANCE_MODE = import.meta.env.VITE_MAINTENANCE_MODE === "true";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const MaintenanceGate = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!MAINTENANCE_MODE) return <>{children}</>;
  if (user?.is_admin) return <>{children}</>;
  if (location.pathname === "/login" || location.pathname === "/register") {
    return (
      <Layout>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Layout>
    );
  }

  return <ComingSoonPage />;
};

const AppRoutes = () => (
  <Layout>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/people" element={<PeoplePage />} />
      <Route path="/research" element={<ResearchPage />} />
      <Route path="/infrastructure" element={<InfrastructurePage />} />
      <Route path="/blog" element={<BlogPage />} />
      <Route path="/blog/:id" element={<BlogPostPage />} />
      <Route path="/research/:id" element={<ProjectPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/docs" element={<DocsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile/:userId" element={<ProfilePage />} />
      <Route path="/admin/pending" element={<PendingUsersPage />} />
      <Route path="/admin/edit/:resource" element={<AdminEditPage />} />
      <Route path="/admin/edit/:resource/:id" element={<AdminEditPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Layout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <MaintenanceGate>
                <AppRoutes />
              </MaintenanceGate>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
