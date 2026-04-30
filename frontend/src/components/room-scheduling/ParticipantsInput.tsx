import type { KeyboardEvent } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";

import { usersService, type UserSuggestion } from "@/services/users";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
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

function labelForSuggestion(u: UserSuggestion) {
  if (u.email && u.name) return `${u.name} <${u.email}>`;
  return u.email || u.name || "";
}

export default function ParticipantsInput(props: Props) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
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

  const suggestions = useMemo(() => {
    const list = suggestionsQuery.data ?? [];
    const q = debounced.trim().toLowerCase();
    if (!q) return [];
    // Extra client-side prefix filter for safety.
    return list.filter((u) => {
      const email = (u.email || "").toLowerCase();
      const name = (u.name || "").toLowerCase();
      return email.startsWith(q) || name.startsWith(q);
    });
  }, [suggestionsQuery.data, debounced]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const addToken = (token: string) => {
    const next = uniqueTokens([...(props.value || []), token]);
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
        {props.value.map((p) => (
          <span
            key={p}
            className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-1 text-xs text-foreground"
            data-testid={`participant-chip-${p}`}
          >
            <span className="truncate max-w-[180px]">{p}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                removeToken(p);
              }}
              aria-label={`Remove ${p}`}
              disabled={props.disabled}
              data-testid={`participant-remove-${p}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}

        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={props.placeholder}
          className="border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[160px] px-1 h-8"
          disabled={props.disabled}
          data-testid="participants-input"
        />
      </div>

      {open && !props.disabled && debounced.trim().length > 0 ? (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md overflow-hidden">
          {suggestionsQuery.isLoading ? (
            <div className="p-2 text-xs text-muted-foreground">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No matches</div>
          ) : (
            <div className="max-h-60 overflow-auto">
              {suggestions.slice(0, 100).map((u) => {
                const label = labelForSuggestion(u);
                const token = u.email || u.name || "";
                if (!token) return null;
                return (
                  <button
                    key={u.id}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-secondary"
                    onClick={() => addToken(token)}
                    data-testid={`participant-suggest-${u.id}`}
                  >
                    <div className="font-medium text-foreground truncate">{label}</div>
                    {u.email && u.name ? (
                      <div className="text-xs text-muted-foreground truncate">{u.email}</div>
                    ) : null}
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
