import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AuthUser } from "@/lib/api";

const updateProfile = vi.fn();
const updateUser = vi.fn();

vi.mock("@/lib/api", () => ({
  api: { updateProfile: (form: FormData) => updateProfile(form) },
}));

const user: AuthUser = {
  id: 1,
  email: "sam@example.com",
  first_name: "Sam",
  last_name: "Lee",
  language: "en-US",
  avatarURL: null,
};

vi.mock("@/lib/auth", () => ({
  useAuth: () => ({ user, updateUser, isAuthenticated: true }),
}));

import { SettingsPage } from "./settings";

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <SettingsPage />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  updateProfile.mockReset();
  updateUser.mockReset();
});

describe("SettingsPage", () => {
  it("prefills the form from the current user", () => {
    renderPage();
    expect(screen.getByLabelText(/first name/i)).toHaveValue("Sam");
    expect(screen.getByLabelText(/last name/i)).toHaveValue("Lee");
  });

  it("submits changes (including names) to updateProfile and updates the user", async () => {
    updateProfile.mockResolvedValue({ ...user, first_name: "Samuel" });
    const u = userEvent.setup();
    renderPage();

    const first = screen.getByLabelText(/first name/i);
    await u.clear(first);
    await u.type(first, "Samuel");
    await u.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => expect(updateProfile).toHaveBeenCalledTimes(1));
    const form = updateProfile.mock.calls[0][0] as FormData;
    expect(form.get("first_name")).toBe("Samuel");
    expect(form.get("language")).toBe("en-US");
    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ ...user, first_name: "Samuel" }));
  });
});
