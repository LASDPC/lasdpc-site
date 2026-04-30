import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { usersService, type UserSuggestion } from "@/services/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ParticipantDisplay = {
  token: string;
  id?: string | null;
  email?: string | null;
  name?: string | null;
  initials?: string | null;
  photo?: string | null;
  avatar?: string | null;
  usp_number?: string | null;
};

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  knownParticipants?: Record<string, ParticipantDisplay>;
  "data-testid"?: string;
};

function normalizeToken(s: string) {
  return s.trim();
}

function uniqueTokens(tokens: string[]) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of tokens) {
    const n = normalizeToken(t);
    if (!n) continue;
    const key = n.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(n);
  }
  return out;
}

function tokenForSuggestion(u: UserSuggestion) {
  return `user:${u.id}`;
}

function displayForSuggestion(u: UserSuggestion): ParticipantDisplay {
  return {
    token: tokenForSuggestion(u),
    id: u.id,
    email: u.email,
    name: u.name,
    initials: u.initials,
    photo: u.photo,
    avatar: u.avatar,
    usp_number: u.usp_number,
  };
}

function fallbackInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase() || "?";
}

function displayLabel(display: ParticipantDisplay | undefined, token: string) {
  if (display?.name) return display.name;
  if (display?.email) return display.email;
  if (token.startsWith("user:")) return display?.usp_number || token.replace("user:", "");
  return token;
}

function displayDetail(display: ParticipantDisplay | undefined) {
  const parts = [display?.email, display?.usp_number ? `USP ${display.usp_number}` : null].filter(Boolean);
  return parts.join(" · ");
}

function matchesSuggestion(u: UserSuggestion, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  return [u.email, u.name, u.usp_number].some((value) => (value || "").toLowerCase().includes(q));
}

export default function ParticipantsInput(props: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedDisplay, setSelectedDisplay] = useState<Record<string, ParticipantDisplay>>({});
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  const suggestionsQuery = useQuery({
    queryKey: ["user-suggest", debounced],
    queryFn: () => usersService.suggest(debounced, 100),
    enabled: debounced.trim().length > 0 && !props.disabled,
    staleTime: 60_000,
  });

  const knownParticipants = props.knownParticipants ?? {};
  const selectedTokens = useMemo(() => new Set((props.value || []).map((token) => token.toLowerCase())), [props.value]);

  const suggestions = useMemo(() => {
    const list = suggestionsQuery.data ?? [];
    const q = debounced.trim();
    if (!q) return [];
    return list.filter((u) => matchesSuggestion(u, q) && !selectedTokens.has(tokenForSuggestion(u).toLowerCase()));
  }, [suggestionsQuery.data, debounced, selectedTokens]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const addToken = (token: string, display?: ParticipantDisplay) => {
    const next = uniqueTokens([...(props.value || []), token]);
    if (display) setSelectedDisplay((prev) => ({ ...prev, [token]: display }));
    props.onChange(next);
    setQuery("");
    setDebounced("");
    setOpen(false);
  };

  const removeToken = (token: string) => {
    const key = token.toLowerCase();
    props.onChange((props.value || []).filter((t) => t.toLowerCase() !== key));
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const token = normalizeToken(query.replace(/,$/, ""));
      if (token) addToken(token);
    }
    if (e.key === "Backspace" && !query && props.value.length > 0) {
      removeToken(props.value[props.value.length - 1]);
    }
  };

  return (
    <div ref={rootRef} className="relative" data-testid={props["data-testid"]}>
      <div
        className={cn(
          "min-h-10 w-full rounded-md border border-input bg-background px-2 py-1 flex flex-wrap gap-1 items-center",
          props.disabled && "opacity-60"
        )}
        onClick={() => !props.disabled && setOpen(true)}
      >
        {props.value.map((token) => {
          const display = selectedDisplay[token] || knownParticipants[token];
          const label = displayLabel(display, token);
          const image = display?.photo || display?.avatar || undefined;
          return (
            <span
              key={token}
              className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-secondary px-2 py-1 text-xs text-foreground"
              data-testid={`participant-chip-${token}`}
            >
              <Avatar className="h-5 w-5">
                {image && <AvatarImage src={image} alt={label} />}
                <AvatarFallback className="text-[10px]">{display?.initials || fallbackInitials(label)}</AvatarFallback>
              </Avatar>
              <span className="truncate max-w-[180px]">{label}</span>
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  removeToken(token);
                }}
                aria-label={`Remove ${label}`}
                disabled={props.disabled}
                data-testid={`participant-remove-${token}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          );
        })}

        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={props.placeholder}
          className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[180px] px-1 h-8"
          disabled={props.disabled}
          data-testid="participants-input"
        />
      </div>

      {open && !props.disabled && debounced.trim().length > 0 ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {suggestionsQuery.isLoading ? (
            <div className="p-2 text-xs text-muted-foreground">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No matches</div>
          ) : (
            <div className="max-h-60 overflow-auto">
              {suggestions.slice(0, 100).map((u) => {
                const display = displayForSuggestion(u);
                const label = displayLabel(display, display.token);
                const detail = displayDetail(display);
                const image = display.photo || display.avatar || undefined;
                return (
                  <button
                    key={u.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                    onClick={() => addToken(display.token, display)}
                    data-testid={`participant-suggest-${u.id}`}
                  >
                    <Avatar className="h-8 w-8">
                      {image && <AvatarImage src={image} alt={label} />}
                      <AvatarFallback className="text-xs">{display.initials || fallbackInitials(label)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="truncate font-medium text-foreground">{label}</div>
                      {detail ? <div className="truncate text-xs text-muted-foreground">{detail}</div> : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
