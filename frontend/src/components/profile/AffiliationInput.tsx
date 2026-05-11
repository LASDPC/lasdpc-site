import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Input } from "@/components/ui/input";
import { profileTermsService } from "@/services/profileTerms";

type AffiliationInputProps = {
  value: string;
  onChange: (value: string) => void;
  relationshipType?: string;
  placeholder?: string;
};

export default function AffiliationInput({
  value,
  onChange,
  relationshipType,
  placeholder,
}: AffiliationInputProps) {
  const id = useId();
  const [focused, setFocused] = useState(false);
  const { data: suggestions = [] } = useQuery({
    queryKey: ["profile-terms", "affiliation", value, relationshipType],
    queryFn: () => profileTermsService.list("affiliation", value, relationshipType),
    enabled: !!relationshipType,
  });

  return (
    <div className="relative">
      <Input
        list={id}
        value={value}
        onFocus={() => setFocused(true)}
        onBlur={() => window.setTimeout(() => setFocused(false), 120)}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
      <datalist id={id}>
        {suggestions.map((term) => (
          <option key={term.id} value={term.value} />
        ))}
      </datalist>
      {focused && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-52 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
          {suggestions.map((term) => (
            <button
              key={term.id}
              type="button"
              className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent"
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(term.value);
                setFocused(false);
              }}
            >
              {term.value}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
