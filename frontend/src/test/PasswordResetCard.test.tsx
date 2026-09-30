import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import type { User } from "@/services/auth";

const mocks = vi.hoisted(() => ({ setPassword: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("@/services/users", () => ({ usersService: { setPassword: mocks.setPassword } }));
vi.mock("sonner", () => ({ toast: { success: mocks.success, error: mocks.error } }));

import PasswordResetCard from "@/components/admin/PasswordResetCard";

const member: User = {
  id: "member-1", name: "Lab Member", email: "member@example.com",
  initials: "LM", role: "aluno_ativo", is_admin: false,
};

describe("PasswordResetCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.setPassword.mockResolvedValue(undefined);
  });

  it("validates confirmation and saves a new password separately from the profile", async () => {
    render(<PasswordResetCard user={member} isPt />);
    fireEvent.change(screen.getByLabelText("Nova senha"), { target: { value: "long-password-123" } });
    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "different-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
    expect(screen.getByRole("alert")).toHaveTextContent("As senhas não coincidem.");
    expect(mocks.setPassword).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Confirmar senha"), { target: { value: "long-password-123" } });
    fireEvent.click(screen.getByRole("button", { name: "Alterar senha" }));
    await waitFor(() => expect(mocks.setPassword).toHaveBeenCalledWith("member-1", "long-password-123"));
    await waitFor(() => expect(screen.getByLabelText("Nova senha")).toHaveValue(""));
  });

  it("explains that the primary admin password comes from server configuration", () => {
    render(<PasswordResetCard user={{ ...member, is_bootstrap_admin: true }} isPt />);
    expect(screen.getByText(/ADMIN_PASSWORD/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Nova senha")).not.toBeInTheDocument();
  });
});
