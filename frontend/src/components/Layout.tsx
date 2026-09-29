import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import VantaGlobeBackground from "./VantaGlobeBackground";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="site-shell relative isolate min-h-screen overflow-x-clip bg-background">
    <ScrollToTop />
    <VantaGlobeBackground />
    <a
      href="#main-content"
      className="fixed left-4 top-3 z-[100] -translate-y-24 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg transition-transform focus:translate-y-0"
    >
      Pular para o conteúdo
    </a>
    <div className="relative z-10 flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-20">{children}</main>
      <Footer />
    </div>
  </div>
);

export default Layout;
