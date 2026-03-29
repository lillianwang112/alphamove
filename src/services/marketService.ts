import { FINNHUB_API_KEY, FINNHUB_BASE_URL } from '../config/finnhub';

const FMP_API_KEY = import.meta.env.VITE_FMP_API_KEY || '';
const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';
import { Timestamp } from 'firebase/firestore';
import type { NewsEvent } from '../types';

// ─── Types ────────────────────────────────────────

export interface QuoteResult {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

export interface TickerSearchResult {
  symbol: string;
  description: string;
  type: string;
}

export interface CompanyProfileResult {
  name: string;
  ticker: string;
  logo: string;
  industry: string;
  marketCap: number;
  weburl: string;
  description?: string;
  exchange?: string;
  ipo?: string;
}

// ─── Helpers ──────────────────────────────────────

async function finnhubFetch<T>(path: string): Promise<T> {
  const separator = path.includes('?') ? '&' : '?';
  const url = `${FINNHUB_BASE_URL}${path}${separator}token=${FINNHUB_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Finnhub request failed: ${res.status} ${res.statusText} for ${path}`);
  }
  return res.json() as Promise<T>;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0]; // YYYY-MM-DD
}

// ─── In-memory demo cache ─────────────────────────
const _profileCache = new Map<string, CompanyProfileResult>();
const _metricsCache = new Map<string, StockMetrics>();
const _candleCache = new Map<string, { result: CandleResult; exp: number }>();
const _newsCache = new Map<string, { result: NewsEvent[]; exp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ─── Market Service Functions ─────────────────────

export async function getQuote(ticker: string): Promise<QuoteResult> {
  const data = await finnhubFetch<{
    c: number;  // current price
    d: number;  // change
    dp: number; // percent change
    h: number;  // high
    l: number;  // low
    o: number;  // open
    pc: number; // previous close
  }>(`/quote?symbol=${encodeURIComponent(ticker)}`);

  return {
    price: data.c,
    change: data.d,
    changePct: data.dp / 100, // convert percentage to decimal
    high: data.h,
    low: data.l,
    open: data.o,
    prevClose: data.pc,
  };
}

export async function searchTicker(query: string): Promise<TickerSearchResult[]> {
  const data = await finnhubFetch<{
    count: number;
    result: Array<{
      description: string;
      displaySymbol: string;
      symbol: string;
      type: string;
    }>;
  }>(`/search?q=${encodeURIComponent(query)}`);

  if (!data.result) return [];

  return data.result
    .filter((item) => item.type === 'Common Stock' || item.type === 'ETP')
    .slice(0, 10)
    .map((item) => ({
      symbol: item.symbol,
      description: item.description,
      type: item.type,
    }));
}

export async function getCompanyProfile(ticker: string): Promise<CompanyProfileResult> {
  const cached = _profileCache.get(ticker);
  if (cached) return cached;

  const data = await finnhubFetch<{
    name: string;
    ticker: string;
    logo: string;
    finnhubIndustry: string;
    marketCapitalization: number;
    weburl: string;
    description?: string;
    exchange?: string;
    ipo?: string;
  }>(`/stock/profile2?symbol=${encodeURIComponent(ticker)}`);

  const result: CompanyProfileResult = {
    name: data.name || ticker,
    ticker: data.ticker || ticker,
    logo: data.logo || '',
    industry: data.finnhubIndustry || 'Unknown',
    marketCap: data.marketCapitalization || 0,
    weburl: data.weburl || '',
    description: data.description || '',
    exchange: data.exchange || '',
    ipo: data.ipo || '',
  };
  _profileCache.set(ticker, result);
  return result;
}

export async function getCompanyNews(ticker: string, daysBack = 7): Promise<NewsEvent[]> {
  const cacheKey = `${ticker}-${daysBack}`;
  const hit = _newsCache.get(cacheKey);
  if (hit && Date.now() < hit.exp) return hit.result;

  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);

  const data = await finnhubFetch<Array<{
    id: number;
    headline: string;
    summary: string;
    source: string;
    url: string;
    related: string;
    datetime: number; // unix timestamp
  }>>(`/company-news?symbol=${encodeURIComponent(ticker)}&from=${formatDate(from)}&to=${formatDate(to)}`);

  if (!Array.isArray(data)) return [];

  const result = data.slice(0, 10).map((item) => ({
    id: String(item.id),
    headline: item.headline || '',
    summary: item.summary || '',
    source: item.source || '',
    url: item.url || '',
    relatedTickers: item.related ? item.related.split(',').map((t) => t.trim()) : [ticker],
    publishedAt: Timestamp.fromDate(new Date(item.datetime * 1000)),
    mentorAnalysis: '',         // filled by AI
    impactOnPortfolio: '',      // filled by AI
  }));
  _newsCache.set(cacheKey, { result, exp: Date.now() + CACHE_TTL });
  return result;
}

// ─── Candle Data ──────────────────────────────────

export interface CandleResult {
  closes: number[];
  timestamps: number[];
  highs: number[];
  lows: number[];
}

export async function getStockCandles(ticker: string, days = 30): Promise<CandleResult> {
  const cacheKey = `${ticker}-${days}`;
  const hit = _candleCache.get(cacheKey);
  if (hit && Date.now() < hit.exp) return hit.result;

  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  // Primary: Financial Modeling Prep (free tier includes historical OHLCV)
  if (FMP_API_KEY) {
    try {
      const url = `${FMP_BASE_URL}/historical-price-full/${encodeURIComponent(ticker)}?from=${formatDate(fromDate)}&to=${formatDate(toDate)}&apikey=${FMP_API_KEY}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json() as {
          symbol: string;
          historical: Array<{ date: string; open: number; high: number; low: number; close: number }>;
        };
        if (data.historical && data.historical.length >= 5) {
          // FMP returns newest-first — reverse to chronological
          const rows = [...data.historical].reverse();
          const result: CandleResult = {
            closes: rows.map((r) => r.close),
            timestamps: rows.map((r) => Math.floor(new Date(r.date).getTime() / 1000)),
            highs: rows.map((r) => r.high),
            lows: rows.map((r) => r.low),
          };
          _candleCache.set(cacheKey, { result, exp: Date.now() + CACHE_TTL });
          return result;
        }
      }
    } catch {
      // fall through to empty
    }
  }

  return { closes: [], timestamps: [], highs: [], lows: [] };
}

// ─── Stock Metrics ────────────────────────────────

export interface StockMetrics {
  peRatio: number | null;
  beta: number | null;
  high52w: number | null;
  low52w: number | null;
  avgVolume10d: number | null;
  eps: number | null;
  dividendYield: number | null;
  returnYTD: number | null;
}

export async function getStockMetrics(ticker: string): Promise<StockMetrics> {
  const cached = _metricsCache.get(ticker);
  if (cached) return cached;

  try {
    const data = await finnhubFetch<{
      metric: {
        peBasicExclExtraTTM?: number;
        beta?: number;
        '52WeekHigh'?: number;
        '52WeekLow'?: number;
        '10DayAverageTradingVolume'?: number;
        epsBasicExclExtraItemsTTM?: number;
        dividendYieldIndicatedAnnual?: number;
        yearToDatePriceReturnDaily?: number;
      };
    }>(`/stock/metric?symbol=${encodeURIComponent(ticker)}&metric=all`);
    const m = data.metric || {};
    const result: StockMetrics = {
      peRatio: m.peBasicExclExtraTTM ?? null,
      beta: m.beta ?? null,
      high52w: m['52WeekHigh'] ?? null,
      low52w: m['52WeekLow'] ?? null,
      avgVolume10d: m['10DayAverageTradingVolume'] ?? null,
      eps: m.epsBasicExclExtraItemsTTM ?? null,
      dividendYield: m.dividendYieldIndicatedAnnual ?? null,
      returnYTD: m.yearToDatePriceReturnDaily ?? null,
    };
    _metricsCache.set(ticker, result);
    return result;
  } catch {
    return { peRatio: null, beta: null, high52w: null, low52w: null, avgVolume10d: null, eps: null, dividendYield: null, returnYTD: null };
  }
}

export async function getMarketNews(): Promise<NewsEvent[]> {
  const data = await finnhubFetch<Array<{
    id: number;
    headline: string;
    summary: string;
    source: string;
    url: string;
    related: string;
    datetime: number;
  }>>('/news?category=general');

  if (!Array.isArray(data)) return [];

  return data.slice(0, 10).map((item) => ({
    id: String(item.id),
    headline: item.headline || '',
    summary: item.summary || '',
    source: item.source || '',
    url: item.url || '',
    relatedTickers: item.related ? item.related.split(',').map((t) => t.trim()) : [],
    publishedAt: Timestamp.fromDate(new Date(item.datetime * 1000)),
    mentorAnalysis: '',
    impactOnPortfolio: '',
  }));
}
