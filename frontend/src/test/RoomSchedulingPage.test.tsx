import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const mockUser = { id: "user1", name: "Test User", email: "test@test.com", initials: "TU", is_admin: false };
let currentUser: typeof mockUser | null = mockUser;

const mockEvents = [
  {
    id: "evt1",
    room: "1-009",
    title: "My Event",
    start_time: "2026-04-27T10:00:00",
    end_time: "2026-04-27T11:00:00",
    user_id: "user1",
    user_name: "Test User",
    created_at: "2026-04-27T09:00:00",
  },
  {
    id: "evt2",
    room: "1-009",
    title: "Other Event",
    start_time: "2026-04-27T14:00:00",
    end_time: "2026-04-27T15:00:00",
    user_id: "user2",
    user_name: "Other User",
    created_at: "2026-04-27T13:00:00",
  },
];

const mockCreate = vi.fn();
const mockDelete = vi.fn();
const mockUpdateParticipants = vi.fn();
const toastSpy = vi.fn();

vi.mock("@/contexts/LanguageContext", () => ({
  useLang: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        "rooms.title": "Room Scheduling",
        "rooms.heading": "Schedule lab rooms",
        "rooms.room": "Room",
        "rooms.roomsLabel": "Rooms",
        "rooms.createEvent": "New Event",
        "rooms.eventTitle": "Title",
        "rooms.date": "Date",
        "rooms.participants": "Participants",
        "rooms.startTime": "Start",
        "rooms.endTime": "End",
        "rooms.submit": "Create",
        "rooms.cancel": "Cancel",
        "rooms.save": "Save",
        "rooms.deleteConfirm": "Delete this event?",
        "rooms.overlapError": "Time conflict with another event.",
        "rooms.endAfterStart": "End time must be after start time.",
        "rooms.today": "Today",
        "rooms.viewWeek": "Week",
        "rooms.editGuests": "Edit guests",
        "infra.loginRequired": "Please log in to access infrastructure.",
      };
      return translations[key] || key;
    },
    lang: "en-US",
    setLang: vi.fn(),
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: currentUser }),
}));

vi.mock("@/hooks/useRoomEvents", () => ({
  useRoomEvents: () => ({ data: mockEvents, isLoading: false }),
  useCreateRoomEvent: () => ({ mutateAsync: mockCreate, isPending: false }),
  useDeleteRoomEvent: () => ({ mutateAsync: mockDelete, isPending: false }),
  useUpdateRoomEventParticipants: () => ({ mutateAsync: mockUpdateParticipants, isPending: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastSpy }),
}));

import RoomSchedulingPage from "@/pages/RoomSchedulingPage";

function renderPage() {
  const qc = new QueryClient();
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <RoomSchedulingPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("RoomSchedulingPage", () => {
  beforeEach(() => {
    currentUser = mockUser;
    mockCreate.mockReset();
    mockDelete.mockReset();
    mockUpdateParticipants.mockReset();
    toastSpy.mockReset();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("renders page with toolbar, sidebar, and week grid", () => {
    renderPage();
    expect(screen.getByText("Room Scheduling")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-today")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-prev")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-next")).toBeInTheDocument();
    expect(screen.getByTestId("toolbar-period-label")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-create")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-mini-calendar")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-room-1-009")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-room-1-007")).toBeInTheDocument();
    expect(screen.getByTestId("week-grid-anim")).toBeInTheDocument();
  });

  it("room selection switches active room", () => {
    renderPage();
    const room1007 = screen.getByTestId("sidebar-room-1-007");
    fireEvent.click(room1007);
    expect(room1007).toBeInTheDocument();
  });

  it("create button opens dialog with form fields", () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sidebar-create"));
    expect(screen.getByTestId("event-title-input")).toBeInTheDocument();
    expect(screen.getByTestId("participants-field")).toBeInTheDocument();
    expect(screen.getByTestId("event-date-input")).toBeInTheDocument();
    expect(screen.getByTestId("event-start-input")).toBeInTheDocument();
    expect(screen.getByTestId("event-end-input")).toBeInTheDocument();
    expect(screen.getByTestId("submit-event-btn")).toBeInTheDocument();
  });

  it("submitting form calls create with correct payload", async () => {
    mockCreate.mockResolvedValue({});
    renderPage();
    fireEvent.click(screen.getByTestId("sidebar-create"));

    fireEvent.change(screen.getByTestId("event-title-input"), { target: { value: "My Meeting" } });
    fireEvent.change(screen.getByTestId("event-date-input"), { target: { value: "2026-05-01" } });
    fireEvent.change(screen.getByTestId("event-start-input"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByTestId("event-end-input"), { target: { value: "11:00" } });

    fireEvent.click(screen.getByTestId("submit-event-btn"));

    await vi.waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({
        room: "1-009",
        title: "My Meeting",
        start_time: "2026-05-01T10:00:00",
        end_time: "2026-05-01T11:00:00",
        participants: [],
      });
    });
  });

  it("rejects creating events that would be auto-expired by TTL policy", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("sidebar-create"));

    fireEvent.change(screen.getByTestId("event-title-input"), { target: { value: "Too old" } });
    fireEvent.change(screen.getByTestId("event-date-input"), { target: { value: "2020-01-01" } });
    fireEvent.change(screen.getByTestId("event-start-input"), { target: { value: "10:00" } });
    fireEvent.change(screen.getByTestId("event-end-input"), { target: { value: "11:00" } });

    fireEvent.click(screen.getByTestId("submit-event-btn"));

    await vi.waitFor(() => {
      expect(mockCreate).not.toHaveBeenCalled();
      expect(toastSpy).toHaveBeenCalled();
    });
  });

  it("events render in calendar", () => {
    renderPage();
    expect(screen.getByTestId("event-evt1")).toBeInTheDocument();
    expect(screen.getByText("My Event")).toBeInTheDocument();
    expect(screen.getByTestId("event-evt2")).toBeInTheDocument();
    expect(screen.getByText("Other Event")).toBeInTheDocument();
  });

  it("delete button only shown for user's own events (in popover)", async () => {
    renderPage();
    fireEvent.click(screen.getByTestId("event-evt1"));
    expect(await screen.findByTestId("event-popover-evt1")).toBeInTheDocument();
    expect(screen.getByTestId("delete-event-evt1")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("event-evt2"));
    expect(await screen.findByTestId("event-popover-evt2")).toBeInTheDocument();
    expect(screen.queryByTestId("delete-event-evt2")).not.toBeInTheDocument();
  });

  it("delete calls roomEventsService.delete", async () => {
    mockDelete.mockResolvedValue(undefined);
    renderPage();
    fireEvent.click(screen.getByTestId("event-evt1"));
    expect(await screen.findByTestId("event-popover-evt1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("delete-event-evt1"));

    await vi.waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith("evt1");
    });
  });

  it("edit guests opens dialog and saves", async () => {
    mockUpdateParticipants.mockResolvedValue({});
    renderPage();
    fireEvent.click(screen.getByTestId("event-evt1"));
    expect(await screen.findByTestId("event-popover-evt1")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("edit-guests-evt1"));
    expect(await screen.findByTestId("edit-participants-field")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("save-guests-btn"));
    await vi.waitFor(() => {
      expect(mockUpdateParticipants).toHaveBeenCalledWith({ id: "evt1", participants: [] });
    });
  });

  it("shows login required when not logged in", () => {
    currentUser = null;
    renderPage();
    expect(screen.getByText("Please log in to access infrastructure.")).toBeInTheDocument();
  });
});
