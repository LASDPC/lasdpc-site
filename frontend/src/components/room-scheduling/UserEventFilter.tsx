import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { usersService, type UserSuggestion } from "@/services/users";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLang } from "@/contexts/LanguageContext";

type Props = {
  value: UserSuggestion | null;
  onChange: (user: UserSuggestion | null) => void;
};

function fallbackInitials(label: string) {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  return label.slice(0, 2).toUpperCase() || "?";
}

function matchesSuggestion(u: UserSuggestion, query: string) {
  const q = query.trim().toLowerCase();
  return [u.name, u.email, u.usp_number].some((value) => (value || "").toLowerCase().includes(q));
}

export default function UserEventFilter({ value, onChange }: Props) {
  const { t } = useLang();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(query), 150);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const onDocClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const suggestionsQuery = useQuery({
    queryKey: ["user-suggest", "calendar-filter", debounced],
    queryFn: () => usersService.suggest(debounced, 100),
    enabled: debounced.trim().length > 0,
    staleTime: 60_000,
  });

  const suggestions = useMemo(() => {
    const q = debounced.trim();
    if (!q) return [];
    return (suggestionsQuery.data ?? []).filter((user) => matchesSuggestion(user, q));
  }, [suggestionsQuery.data, debounced]);

  return (
    <div ref={rootRef} className="relative">
      <div className="text-xs font-semibold text-muted-foreground mb-2">
        {t("rooms.userFilter")}
      </div>

      {value ? (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-2 py-2">
          <Avatar className="h-7 w-7">
            {(value.photo || value.avatar) && <AvatarImage src={value.photo || value.avatar || ""} alt={value.name || value.email || ""} />}
            <AvatarFallback className="text-xs">{value.initials || fallbackInitials(value.name || value.email || "")}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">{value.name || value.email}</p>
            <p className="truncate text-xs text-muted-foreground">{value.email || value.usp_number}</p>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onChange(null)} aria-label={t("rooms.clearUserFilter")}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={t("rooms.userFilterPlaceholder")}
            className="pl-8"
            data-testid="calendar-user-filter"
          />
        </div>
      )}

      {open && !value && debounced.trim().length > 0 ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border border-border bg-popover shadow-md">
          {suggestionsQuery.isLoading ? (
            <div className="p-2 text-xs text-muted-foreground">Loading...</div>
          ) : suggestions.length === 0 ? (
            <div className="p-2 text-xs text-muted-foreground">No matches</div>
          ) : (
            <div className="max-h-60 overflow-auto">
              {suggestions.map((user) => {
                const label = user.name || user.email || "";
                const detail = [user.email, user.usp_number ? `USP ${user.usp_number}` : null].filter(Boolean).join(" · ");
                return (
                  <button
                    key={user.id}
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-secondary"
                    onClick={() => {
                      onChange(user);
                      setQuery("");
                      setDebounced("");
                      setOpen(false);
                    }}
                  >
                    <Avatar className="h-8 w-8">
                      {(user.photo || user.avatar) && <AvatarImage src={user.photo || user.avatar || ""} alt={label} />}
                      <AvatarFallback className="text-xs">{user.initials || fallbackInitials(label)}</AvatarFallback>
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
