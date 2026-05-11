import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

const mockUser = { id: "1", name: "Test User", email: "test@test.com", initials: "TU" };
let currentUser: typeof mockUser | null = mockUser;

vi.mock("@/contexts/LanguageContext", () => ({
  useLang: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "reserva.heading": "Reserve salas ou infraestrutura computacional",
        "reserva.infraButton": "Infraestrutura",
        "reserva.roomButton": "Reserva de Salas",
        "infra.loginRequired": "Faca login para acessar a infraestrutura.",
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

import ReservaPage from "@/pages/ReservaPage";

describe("ReservaPage", () => {
  beforeEach(() => {
    currentUser = mockUser;
  });

  it("renders the heading text", () => {
    render(
      <MemoryRouter>
        <ReservaPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Reservas")).toBeInTheDocument();
  });

  it("renders the infrastructure button", () => {
    render(
      <MemoryRouter>
        <ReservaPage />
      </MemoryRouter>
    );
    expect(screen.getByText("Infraestrutura")).toBeInTheDocument();
  });

  it("infrastructure button links to /infrastructure", () => {
    render(
      <MemoryRouter>
        <ReservaPage />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /infraestrutura/i });
    expect(link).toHaveAttribute("href", "/infrastructure");
  });

  it("renders room scheduling button linking to /room-scheduling", () => {
    render(
      <MemoryRouter>
        <ReservaPage />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /reserva de salas/i });
    expect(link).toHaveAttribute("href", "/room-scheduling");
  });

  it("shows login required message when user is not logged in", () => {
    currentUser = null;
    render(
      <MemoryRouter>
        <ReservaPage />
      </MemoryRouter>
    );
    expect(
      screen.getByText("Faca login para acessar a infraestrutura.")
    ).toBeInTheDocument();
  });
});
