import { describe, it, expect, vi, beforeEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Notification } from "@/services/notifications";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  logout: vi.fn(),
  listNotifications: vi.fn(),
  dismissNotification: vi.fn(),
  currentUser: {
    id: "1",
    name: "Test User",
    email: "test@example.com",
    initials: "TU",
    role: "aluno_ativo",
    is_admin: false,
  },
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    user: mocks.currentUser,
    isAdmin: mocks.currentUser?.is_admin ?? false,
    logout: mocks.logout,
  }),
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLang: () => ({
    lang: "pt-BR",
    t: (key: string) => {
      const translations: Record<string, string> = {
        "auth.login": "Entrar",
        "notif.title": "Notificações",
        "notif.description": "Todas as notificações do usuário.",
        "notif.empty": "Nenhuma notificação.",
        "notif.approved": "Sua solicitação para o cluster {cluster} foi aprovada! Período: {start} a {end}.",
        "notif.rejected": "Sua solicitação para o cluster {cluster} foi recusada. Período: {start} a {end}.",
        "notif.revoked": "Seu acesso ao cluster {cluster} foi revogado. Período: {start} a {end}.",
        "notif.roomEventInvite": "{actor} convidou você para \"{title}\" na sala {room}. Início: {start}.",
        "notif.dismiss": "Dispensar",
        "menu.profile": "Meu Perfil",
        "menu.settings": "Configurações",
        "menu.logout": "Sair",
        "menu.adminPanel": "Painel Administrativo",
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock("@/services/notifications", () => ({
  notificationsService: {
    list: mocks.listNotifications,
    dismiss: mocks.dismissNotification,
  },
}));

vi.mock("@/lib/media", () => ({
  mediaUrl: (path?: string) => path || "",
}));

import UserAvatarButton from "@/components/UserAvatarButton";

function renderButton() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <UserAvatarButton />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function notification(id: string): Notification {
  return {
    id,
    type: "cluster_approved",
    cluster_name: "Cluster A",
    start_date: "2026-05-01",
    end_date: "2026-05-02",
    created_at: "2026-05-01T00:00:00Z",
  };
}

describe("UserAvatarButton notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.currentUser = {
      id: "1",
      name: "Test User",
      email: "test@example.com",
      initials: "TU",
      role: "aluno_ativo",
      is_admin: false,
    };
  });

  it("shows a 99+ badge on the avatar when notification count exceeds the limit", async () => {
    mocks.listNotifications.mockResolvedValue(Array.from({ length: 100 }, (_, index) => notification(String(index))));

    renderButton();

    expect(await screen.findByText("99+")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /99\+ Notificações/ })).toBeInTheDocument();
  });

  it("opens the notifications modal from the bell item inside the avatar menu", async () => {
    mocks.listNotifications.mockResolvedValue([notification("1")]);

    renderButton();

    const trigger = await screen.findByRole("button", { name: /1 Notificações/ });
    trigger.focus();
    fireEvent.keyDown(trigger, { key: "Enter", code: "Enter" });

    const menuItem = await screen.findByRole("menuitem", { name: /Notificações/ });
    fireEvent.click(menuItem);

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText(/Cluster A/)).toBeInTheDocument();
  });
});
