import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps, PropsWithChildren } from "react";

const mockUser = { id: "1", name: "Test", email: "t@t.com", initials: "T" };
let currentUser: typeof mockUser | null = mockUser;

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<ComponentProps<"div">>) => <div {...props}>{children}</div>,
    nav: ({ children, ...props }: PropsWithChildren<ComponentProps<"nav">>) => <nav {...props}>{children}</nav>,
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock("@/contexts/ThemeContext", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: vi.fn(),
    fontSize: "normal",
    setFontSize: vi.fn(),
    toggleHighContrast: vi.fn(),
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLang: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "nav.home": "Inicio",
        "nav.history": "Historia",
        "nav.people": "Pessoas",
        "nav.research": "Pesquisa",
        "nav.blog": "Blog",
        "nav.contact": "Contato",
        "nav.reserva": "Reserva",
        "nav.docs": "Docs",
        "nav.infrastructure": "Infraestrutura",
      };
      return translations[key] || key;
    },
    lang: "pt-BR",
    setLang: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock("@/components/UserAvatarButton", () => ({
  default: () => <div data-testid="user-avatar-button" />,
}));

vi.mock("@/assets/lasdpc-logo.png", () => ({ default: "logo.png" }));

import Header from "@/components/Header";

describe("Header - authenticated user", () => {
  beforeEach(() => {
    currentUser = mockUser;
  });

  it("shows Reserva link in nav when authenticated", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const reservaLinks = screen.getAllByText("Reserva");
    expect(reservaLinks.length).toBeGreaterThan(0);
  });

  it("Reserva link points to /reserva", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const reservaLinks = screen.getAllByText("Reserva");
    const link = reservaLinks.find((el) => el.closest("a"));
    expect(link?.closest("a")).toHaveAttribute("href", "/reserva");
  });

  it("does NOT show Infraestrutura as a top-level nav item", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    const infraLinks = screen.queryAllByText("Infraestrutura");
    expect(infraLinks.length).toBe(0);
  });
});

describe("Header - unauthenticated user", () => {
  beforeEach(() => {
    currentUser = null;
  });

  it("does not show Reserva when not logged in", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );
    expect(screen.queryByText("Reserva")).not.toBeInTheDocument();
  });

  it("shows Historia link right after Inicio", () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    );

    const inicio = screen.getAllByText("Inicio").find((el) => el.closest("a"))?.closest("a");
    const historia = screen.getAllByText("Historia").find((el) => el.closest("a"))?.closest("a");
    expect(inicio).toHaveAttribute("href", "/");
    expect(historia).toHaveAttribute("href", "/historia");

    // Nav order: Inicio then Historia
    const nav = historia?.closest("nav");
    const links = nav ? Array.from(nav.querySelectorAll("a")).map((a) => a.getAttribute("href")) : [];
    expect(links.indexOf("/")).toBeLessThan(links.indexOf("/historia"));
  });
});
