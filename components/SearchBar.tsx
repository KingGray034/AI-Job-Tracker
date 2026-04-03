"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type SearchBarProps = {
  onSearch: (value: string) => void;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "PENDING",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "Remote",
  "New York",
  "San Francisco",
  "Software Engineer",
];

// ─── Component ────────────────────────────────────────────────────────────────

function SearchBar({ onSearch }: SearchBarProps) {
  const [searchInput, setSearchInput] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const handleInputChange = (value: string) => {
    setSearchInput(value);
    if (value.length > 0) {
      setSuggestions(
        SUGGESTIONS.filter((s) =>
          s.toLowerCase().includes(value.toLowerCase()),
        ),
      );
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSearch = (value = searchInput) => {
    onSearch(value);
    setShowSuggestions(false);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchInput(suggestion);
    handleSearch(suggestion);
  };

  const handleClear = () => {
    setSearchInput("");
    onSearch("");
    setShowSuggestions(false);
  };

  return (
    <div className="w-full flex justify-end mb-8">
      <div className="relative w-full max-w-md flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by company, position, location, status, or ID..."
            className="w-full h-10 px-4 bg-white border-2 border-retro-border focus:ring-0 focus:border-primary outline-none text-sm"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border-2 border-retro-border retro-card-shadow z-50 max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-4 py-2 hover:bg-retro-yellow/30 text-sm border-b border-retro-border/20 last:border-b-0"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {searchInput && (
          <button
            onClick={handleClear}
            className="h-10 px-3 bg-white border-2 border-retro-border font-bold retro-button-shadow text-retro-border hover:bg-retro-red/20 transition-colors"
            title="Clear search"
          >
            &times;
          </button>
        )}

        <button
          onClick={() => handleSearch()}
          className="h-10 px-4 bg-primary text-white border-2 border-retro-border font-bold retro-button-shadow hover:bg-primary/90 transition-all text-sm uppercase tracking-wider"
          title="Search"
        >
          Search
        </button>
      </div>
    </div>
  );
}

export { SearchBar };
