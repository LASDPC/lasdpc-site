import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ComponentProps, PropsWithChildren } from "react";

vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: PropsWithChildren<ComponentProps<"div">>) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock("@/contexts/LanguageContext", () => ({
  useLang: () => ({
    t: (key: string) => {
      const dict: Record<string, string> = {
        "history.title": "Historia",
        "history.subtitle": "Subtitle",
        "history.expand": "Ver mais",
        "history.collapse": "Ver menos",
        "history.todayLabel": "Hoje",
        "history.events.1990.title": "1990 Title",
        "history.events.1990.summary": "1990 Summary",
        "history.events.1990.p1": "1990 P1",
        "history.events.1990.p2": "1990 P2",
        "history.events.1990.p3": "1990 P3",
        "history.events.1990.imageCaption": "Cap",
        "history.events.gsdpc.title": "GSDPC Title",
        "history.events.gsdpc.summary": "GSDPC Summary",
        "history.events.gsdpc.p1": "GSDPC P1",
        "history.events.gsdpc.p2": "GSDPC P2",
        "history.events.gsdpc.p3": "GSDPC P3",
        "history.events.gsdpc.imageCaption": "Cap",
        "history.events.evolution.title": "Evolution Title",
        "history.events.evolution.summary": "Evolution Summary",
        "history.events.evolution.p1": "Evolution P1",
        "history.events.evolution.p2": "Evolution P2",
        "history.events.evolution.p3": "Evolution P3",
        "history.events.evolution.imageCaption": "Cap",
        "history.events.training.title": "Training Title",
        "history.events.training.summary": "Training Summary",
        "history.events.training.p1": "Training P1",
        "history.events.training.p2": "Training P2",
        "history.events.training.p3": "Training P3",
        "history.events.training.imageCaption": "Cap",
        "history.events.today.title": "Today Title",
        "history.events.today.summary": "Today Summary",
        "history.events.today.p1": "Today P1",
        "history.events.today.p2": "Today P2",
        "history.events.today.p3": "Today P3",
        "history.events.today.imageCaption": "Cap",
      };
      return dict[key] || key;
    },
    lang: "pt-BR",
    setLang: vi.fn(),
  }),
}));

vi.mock("@/assets/lasdpc-logo.png", () => ({ default: "logo.png" }));

import HistoriaPage from "@/pages/HistoriaPage";

describe("HistoriaPage", () => {
  it("renders title/subtitle and timeline items", () => {
    render(
      <MemoryRouter>
        <HistoriaPage />
      </MemoryRouter>
    );
    expect(screen.getByTestId("history-title")).toBeInTheDocument();
    expect(screen.getByTestId("history-subtitle")).toBeInTheDocument();
    expect(screen.getByTestId("history-item-1990")).toBeInTheDocument();
    expect(screen.getByTestId("history-item-gsdpc")).toBeInTheDocument();
  });

  it("expands and collapses an item", () => {
    render(
      <MemoryRouter>
        <HistoriaPage />
      </MemoryRouter>
    );
    const toggle = screen.getByTestId("history-toggle-1990");
    fireEvent.click(toggle);
    expect(screen.getByTestId("history-expanded-1990")).toBeInTheDocument();
    fireEvent.click(toggle);
    expect(screen.queryByTestId("history-expanded-1990")).not.toBeInTheDocument();
  });
});
