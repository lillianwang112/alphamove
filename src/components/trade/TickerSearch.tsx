import { useState, useEffect, useRef, useCallback } from 'react';
import { useMarketData } from '../../hooks/useMarketData';

interface SearchResult {
  symbol: string;
  description: string;
  type: string;
}

interface TickerSearchProps {
  onSelect: (symbol: string, name: string) => void;
}

export default function TickerSearch({ onSelect }: TickerSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { searchTicker } = useMarketData();

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 1) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const data = await searchTicker(q);
      setResults(data.slice(0, 8));
      setShowDropdown(true);
    } catch {
      setError('Search failed. Try again.');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchTicker]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, doSearch]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result.symbol, result.description);
    setQuery(result.symbol);
    setShowDropdown(false);
    setResults([]);
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Search input */}
      <div style={{ position: 'relative' }}>
        {/* Search icon */}
        <svg
          style={{
            position: 'absolute',
            left: '14px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
          <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value.toUpperCase())}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Search ticker or company..."
          className="input"
          style={{
            paddingLeft: '44px',
            paddingRight: loading ? '44px' : '16px',
            fontSize: '1rem',
            height: '52px',
            letterSpacing: '0.02em',
          }}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
        />

        {/* Loading spinner */}
        {loading && (
          <div
            style={{
              position: 'absolute',
              right: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '18px',
              height: '18px',
              border: '2px solid var(--border)',
              borderTopColor: 'var(--accent)',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px' }}>
          {error}
        </p>
      )}

      {/* Dropdown */}
      {showDropdown && results.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            background: 'var(--surface-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 50,
            overflow: 'hidden',
            animation: 'slideInUp 0.2s ease both',
          }}
        >
          {results.map((result, i) => (
            <button
              key={result.symbol}
              onMouseDown={() => handleSelect(result)}
              style={{
                width: '100%',
                background: 'none',
                border: 'none',
                borderBottom: i < results.length - 1 ? '1px solid var(--border)' : 'none',
                padding: '12px 16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
                WebkitTapHighlightColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-hover)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = 'none';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                {/* Ticker */}
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    color: 'var(--accent)',
                    background: 'var(--accent-light)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    flexShrink: 0,
                    minWidth: '52px',
                    textAlign: 'center',
                  }}
                >
                  {result.symbol}
                </span>
                {/* Company name */}
                <span
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {result.description}
                </span>
              </div>
              {/* Type */}
              {result.type && (
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    background: 'var(--surface)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    flexShrink: 0,
                    marginLeft: '8px',
                  }}
                >
                  {result.type}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
