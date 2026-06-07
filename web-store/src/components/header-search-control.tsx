"use client";

import { ArrowRight, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { formatRub } from "@/lib/format";

type Suggestion = {
  id: string;
  slug: string;
  name: string;
  vendor: string | null;
  price: number;
  image: string | null;
};

const POPULAR = ["холодильник", "стиральная машина", "Bosch", "до 50 000 ₽", "встраиваемая"];

type Props = {
  /** "embedded" — внутри десктоп-шапки (.header.glass).
   *  "mobile-sticky" — отдельная sticky-полоса под шапкой (только ≤760px). */
  variant?: "embedded" | "mobile-sticky";
};

export function HeaderSearchControl({ variant = "embedded" }: Props) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!searchOpen) return;
    const onClick = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSearchOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [searchOpen]);

  useEffect(() => {
    const trimmed = query.trim();
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (trimmed.length < 2) {
        setSuggestions([]);
        return;
      }
      fetch(`/api/search/suggest?q=${encodeURIComponent(trimmed)}`, { signal: controller.signal })
        .then((response) => (response.ok ? response.json() : { products: [] }))
        .then((data: { products?: Suggestion[] }) => {
          setSuggestions(data.products ?? []);
        })
        .catch(() => {
          /* aborted or network */
        });
    }, 220);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  function submitSearch() {
    const trimmed = query.trim();
    if (!trimmed) return;
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  function pickSuggestion(suggestion: Suggestion) {
    setSearchOpen(false);
    setQuery("");
    router.push(`/product/${suggestion.slug}`);
  }

  const wrapperClass = variant === "mobile-sticky" ? "hdr-mobile-search" : "hdr-search-wrap";

  return (
    <div className={wrapperClass} ref={searchRef}>
      <form
        action="/search"
        method="get"
        onSubmit={(event) => {
          event.preventDefault();
          submitSearch();
        }}
        role="search"
      >
        <div className={"hdr-search " + (searchOpen ? "open" : "")}>
          <button
            type="submit"
            aria-label="Найти"
            style={{
              background: 0,
              border: 0,
              padding: 0,
              color: "inherit",
              cursor: "pointer",
              display: "inline-flex",
            }}
          >
            <Search size={18} aria-hidden />
          </button>
          <input
            name="q"
            type="text"
            autoComplete="off"
            placeholder="Холодильник, Bosch, до 50 000 ₽…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={() => setSearchOpen(true)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSearch();
              }
            }}
          />
          {query && (
            <button
              type="button"
              className="hdr-search-clear"
              onClick={(event) => {
                event.stopPropagation();
                setQuery("");
              }}
              aria-label="Очистить"
            >
              <X size={14} aria-hidden />
            </button>
          )}
        </div>
      </form>
      {searchOpen && (
        <div className="hdr-suggest">
          {!query.trim() ? (
            <>
              <div className="sg-h">Популярные запросы</div>
              <div className="sg-tags">
                {POPULAR.map((popular) => (
                  <button
                    key={popular}
                    type="button"
                    className="sg-tag"
                    onClick={() => setQuery(popular)}
                  >
                    {popular}
                  </button>
                ))}
              </div>
            </>
          ) : suggestions.length > 0 ? (
            <>
              <div className="sg-h">Найдено {suggestions.length}</div>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  className="sg-item"
                  onClick={() => pickSuggestion(suggestion)}
                >
                  <span className="sg-item-art">
                    {suggestion.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={suggestion.image} alt="" />
                    ) : (
                      <Search size={18} aria-hidden style={{ opacity: 0.4 }} />
                    )}
                  </span>
                  <span className="sg-item-body">
                    <span className="sg-item-brand">{suggestion.vendor ?? ""}</span>
                    <span className="sg-item-name">{suggestion.name}</span>
                  </span>
                  <span className="sg-item-price">
                    {suggestion.price ? formatRub(suggestion.price) : ""}
                  </span>
                </button>
              ))}
              <button
                type="button"
                className="sg-all"
                onClick={() => {
                  setSearchOpen(false);
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
              >
                Показать все результаты <ArrowRight size={14} aria-hidden />
              </button>
            </>
          ) : (
            <div className="sg-empty">
              Ничего не нашли по «{query}»<br />
              <small>Попробуйте короче — например, «Bosch» или «холодильник»</small>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
