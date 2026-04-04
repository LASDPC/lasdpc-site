import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
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
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
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
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
