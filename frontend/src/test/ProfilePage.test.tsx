import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { User } from "@/services/auth";

const mocks = vi.hoisted(() => ({
  profile: {} as User,
  updateUser: vi.fn(),
  refreshUser: vi.fn(),
  toastError: vi.fn(),
  uploadBanner: vi.fn(),
}));

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useParams: () => ({ userId: "member-1" }) };
});
vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => ({ user: { id: "member-1" }, refreshUser: mocks.refreshUser }) }));
vi.mock("@/contexts/LanguageContext", () => ({ useLang: () => ({ lang: "pt-BR", t: (key: string) => key }) }));
vi.mock("@/hooks/usePeople", () => ({
  useUser: () => ({ data: mocks.profile, isLoading: false }),
  useDocentes: () => ({ data: [] }),
  useStudents: () => ({ data: [] }),
}));
vi.mock("@/services/people", () => ({ peopleService: { updateUser: mocks.updateUser } }));
vi.mock("@/services/uploads", () => ({ uploadProfilePhoto: vi.fn(), uploadProfileBanner: mocks.uploadBanner }));
vi.mock("@/components/profile/ProfileTermPicker", () => ({ default: () => null }));
vi.mock("@/components/profile/AffiliationInput", () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) =>
    <input aria-label="Afiliação" value={value} onChange={(event) => onChange(event.target.value)} />,
}));
vi.mock("@/lib/media", () => ({ mediaUrl: (value: string) => value }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: mocks.toastError } }));

import ProfilePage from "@/pages/ProfilePage";

function renderProfile() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><ProfilePage /></MemoryRouter></QueryClientProvider>);
}

describe("ProfilePage validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.profile = {
      id: "member-1", email: "member@example.com", name: "Lab Member", initials: "LM",
      role: "aluno_ativo", is_admin: false, photo: "uploads/photo.jpg",
      level: "MSc", levelPt: null, lattes: "https://lattes.example/me",
      orcid: "https://orcid.example/me", scholar: "https://scholar.example/me",
      github: "https://github.example/me", lab_relationship_type: "academic_advisor",
      affiliation_name: "ICMC USP",
    };
    mocks.updateUser.mockImplementation(async (_id: string, payload: Partial<User>) => ({ ...mocks.profile, ...payload }));
    mocks.refreshUser.mockResolvedValue(undefined);
    mocks.uploadBanner.mockResolvedValue({ key: "banner/new-cover.webp" });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it("accepts an existing academic category and fills the missing translation when saving", async () => {
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: "Editar meu perfil" }));
    expect(screen.getByLabelText("Categoria acadêmica")).toHaveValue("MSc");
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith("member-1", expect.objectContaining({ level: "MSc", levelPt: "MSc" })));
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("saves when photo, academic category, affiliation, and other links are empty", async () => {
    mocks.profile = { ...mocks.profile, photo: null, level: null, levelPt: null, orcid: null, scholar: null, github: null, lab_relationship_type: null, affiliation_name: null };
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: "Editar meu perfil" }));
    expect(screen.getByLabelText("Relação com o laboratório")).toHaveValue("");
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith("member-1", expect.objectContaining({ lattes: "https://lattes.example/me" })));
    expect(mocks.toastError).not.toHaveBeenCalled();
  });

  it("identifies Lattes as the only missing required field", async () => {
    mocks.profile = { ...mocks.profile, lattes: null };
    renderProfile();
    fireEvent.click(screen.getByRole("button", { name: "Editar meu perfil" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() => expect(mocks.toastError).toHaveBeenCalledWith("Confira os campos pendentes: Lattes."));
    expect(mocks.updateUser).not.toHaveBeenCalled();
  });

  it("opens the file picker by clicking the profile photo", () => {
    renderProfile();
    const fileInput = screen.getByLabelText("Selecionar foto de perfil") as HTMLInputElement;
    const click = vi.spyOn(fileInput, "click");
    fireEvent.click(screen.getByRole("button", { name: "Alterar foto de perfil" }));
    expect(click).toHaveBeenCalledOnce();
  });

  it("uploads a new profile cover", async () => {
    renderProfile();
    const fileInput = screen.getByLabelText("Selecionar imagem de capa") as HTMLInputElement;
    const file = new File(["image"], "cover.webp", { type: "image/webp" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    await waitFor(() => expect(mocks.uploadBanner).toHaveBeenCalledWith(file));
    await waitFor(() => expect(mocks.updateUser).toHaveBeenCalledWith("member-1", { banner: "banner/new-cover.webp" }));
  });

  it("does not offer a copyable email link on the public profile", () => {
    renderProfile();
    const email = screen.getByText("member@example.com");
    expect(email.closest("a")).toBeNull();
    expect(email).toHaveClass("select-none");
    const copyEvent = new Event("copy", { bubbles: true, cancelable: true });
    email.dispatchEvent(copyEvent);
    expect(copyEvent.defaultPrevented).toBe(true);
  });
});
