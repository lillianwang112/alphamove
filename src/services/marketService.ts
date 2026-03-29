import { FINNHUB_API_KEY, FINNHUB_BASE_URL } from '../config/finnhub';
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

  return {
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
}

export async function getCompanyNews(ticker: string, daysBack = 7): Promise<NewsEvent[]> {
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

  return data.slice(0, 10).map((item) => ({
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
}

// ─── Candle Data ──────────────────────────────────

export interface CandleResult {
  closes: number[];
  timestamps: number[];
  highs: number[];
  lows: number[];
}

export async function getStockCandles(ticker: string, days = 30): Promise<CandleResult> {
  const to = Math.floor(Date.now() / 1000);
  const from = to - days * 24 * 60 * 60;

  try {
    const data = await finnhubFetch<{
      c: number[];
      h: number[];
      l: number[];
      t: number[];
      s: string;
    }>(`/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${to}`);

    if (data.s !== 'ok' || !Array.isArray(data.c) || data.c.length === 0) {
      return { closes: [], timestamps: [], highs: [], lows: [] };
    }

    return {
      closes: data.c,
      timestamps: data.t,
      highs: data.h,
      lows: data.l,
    };
  } catch {
    return { closes: [], timestamps: [], highs: [], lows: [] };
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
