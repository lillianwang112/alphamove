import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStockCandles } from '../../services/marketService';
import { getCryptoCandles } from '../../services/cryptoService';
import { getCompanyNews, getStockMetrics } from '../../services/marketService';
import type { StockMetrics } from '../../services/marketService';
import PriceChart from './PriceChart';
import type { TimeRange } from './PriceChart';
import type { NewsEvent, AssetClass } from '../../types';

interface QuoteData {
  price: number;
  change: number;
  changePct: number;
  high: number;
  low: number;
  open: number;
  prevClose: number;
}

interface ProfileData {
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

interface StockDetailProps {
  ticker: string;
  companyName: string;
  quote: QuoteData;
  profile: ProfileData | null;
  assetClass?: AssetClass;
  onBuy: () => void;
  onSell: () => void;
}

function formatMarketCap(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

function formatVolume(value: number | null): string {
  if (value === null) return '—';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(0)}K`;
  return value.toFixed(0);
}

function generateSyntheticPrices(quote: QuoteData, count: number): number[] {
  const n = Math.min(count, 252);
  const start = quote.prevClose;
  const end = quote.price;
  const amplitude = (quote.high - quote.low) * 0.4;
  const prices: number[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / Math.max(n - 1, 1);
    const trend = start + (end - start) * t;
    const noise = amplitude * (Math.sin(i * 2.3 + 1) * 0.45 + Math.sin(i * 1.1 + 2) * 0.35 + Math.sin(i * 0.7) * 0.2);
    prices.push(Math.max(quote.low * 0.97, Math.min(quote.high * 1.03, trend + noise)));
  }
  return prices;
}

function timeAgo(ts: { seconds: number } | null): string {
  if (!ts) return '';
  const diff = Math.floor((Date.now() / 1000 - ts.seconds) / 3600);
  if (diff < 1) return 'Just now';
  if (diff < 24) return `${diff}h ago`;
  return `${Math.floor(diff / 24)}d ago`;
}

const RANGE_DAYS: Record<TimeRange, number> = {
  '1W': 7, '1M': 30, '3M': 90, '6M': 182, '1Y': 365,
};

export default function StockDetail({
  ticker, companyName, quote, profile, assetClass = 'stock', onBuy, onSell,
}: StockDetailProps) {
  const navigate = useNavigate();
  const [prices, setPrices] = useState<number[]>([]);
  const [timestamps, setTimestamps] = useState<number[]>([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [range, setRange] = useState<TimeRange>('1M');
  const [news, setNews] = useState<NewsEvent[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [descExpanded, setDescExpanded] = useState(false);
  const [metrics, setMetrics] = useState<StockMetrics | null>(null);

  const isPositive = quote.change >= 0;

  // Fetch chart data
  useEffect(() => {
    setChartLoading(true);
    setPrices([]);
    setTimestamps([]);
    const days = RANGE_DAYS[range];
    const fetch_ = assetClass === 'crypto'
      ? getCryptoCandles(ticker, days)
      : getStockCandles(ticker, days);

    fetch_.then((data) => {
      if (data.closes.length >= 5) {
        setPrices(data.closes);
        setTimestamps(data.timestamps ?? []);
      } else {
        setPrices(generateSyntheticPrices(quote, Math.max(7, Math.floor(days * 0.7))));
        setTimestamps([]);
      }
    }).catch(() => {
      setPrices(generateSyntheticPrices(quote, Math.max(7, Math.floor(days * 0.7))));
      setTimestamps([]);
    }).finally(() => setChartLoading(false));
  }, [ticker, range, assetClass]);

  // Fetch news
  useEffect(() => {
    if (assetClass === 'crypto') { setNewsLoading(false); return; }
    setNewsLoading(true);
    getCompanyNews(ticker, 14).then((data) => {
      setNews(data.slice(0, 6));
    }).catch(() => {}).finally(() => setNewsLoading(false));
  }, [ticker, assetClass]);

  // Fetch metrics (stocks only)
  useEffect(() => {
    if (assetClass === 'crypto') return;
    getStockMetrics(ticker).then(setMetrics).catch(() => {});
  }, [ticker, assetClass]);

  const displayName = profile?.name || companyName || ticker;
  const description = profile?.description || '';
  const descPreview = description.length > 160 ? description.slice(0, 160) + '…' : description;

  // Build stats grid — always show quote stats, add metrics when available
  const quoteStats = [
    { label: 'Open', value: `$${quote.open.toFixed(2)}` },
    { label: 'Prev Close', value: `$${quote.prevClose.toFixed(2)}` },
    { label: "Day High", value: `$${quote.high.toFixed(2)}`, color: 'var(--success)' },
    { label: "Day Low", value: `$${quote.low.toFixed(2)}`, color: 'var(--danger)' },
  ];

  const metricsStats = metrics ? [
    metrics.high52w !== null ? { label: '52W High', value: `$${metrics.high52w.toFixed(2)}`, color: '#22C55E' } : null,
    metrics.low52w !== null ? { label: '52W Low', value: `$${metrics.low52w.toFixed(2)}`, color: '#EF4444' } : null,
    metrics.peRatio !== null ? { label: 'P/E Ratio', value: metrics.peRatio.toFixed(1) } : null,
    metrics.beta !== null ? { label: 'Beta', value: metrics.beta.toFixed(2) } : null,
    metrics.eps !== null ? { label: 'EPS (TTM)', value: metrics.eps < 0 ? `-$${Math.abs(metrics.eps).toFixed(2)}` : `$${metrics.eps.toFixed(2)}` } : null,
    metrics.avgVolume10d !== null ? { label: 'Avg Vol (10D)', value: formatVolume(metrics.avgVolume10d * 1e6) } : null,
    metrics.dividendYield !== null && metrics.dividendYield > 0 ? { label: 'Div Yield', value: `${metrics.dividendYield.toFixed(2)}%` } : null,
    metrics.returnYTD !== null ? { label: 'YTD Return', value: `${metrics.returnYTD >= 0 ? '+' : ''}${metrics.returnYTD.toFixed(2)}%`, color: metrics.returnYTD >= 0 ? '#22C55E' : '#EF4444' } : null,
  ].filter(Boolean) as { label: string; value: string; color?: string }[] : [];

  const profileStats = [
    ...(profile?.marketCap ? [{ label: 'Mkt Cap', value: formatMarketCap(profile.marketCap) }] : []),
    ...(profile?.ipo ? [{ label: 'IPO Date', value: profile.ipo.slice(0, 7) }] : []),
  ];

  const allStats = [...quoteStats, ...metricsStats, ...profileStats];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0', animation: 'slideInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both' }}>

      {/* ── Header card ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden', marginBottom: '12px' }}>

        {/* Company identity */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--surface-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 }}>
            {profile?.logo ? (
              <img src={profile.logo} alt={displayName} style={{ width: '34px', height: '34px', objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            ) : (
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--accent)' }}>{ticker.charAt(0)}</span>
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </h3>
              <span style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'var(--font-mono)', border: '1px solid rgba(99,102,241,0.3)', flexShrink: 0 }}>
                {ticker}
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {profile?.industry && profile.industry}
              {profile?.exchange && ` · ${profile.exchange}`}
            </p>
          </div>
        </div>

        {/* Price hero */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4px' }}>Current Price</p>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '2.2rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
                ${quote.price < 1 ? quote.price.toFixed(4) : quote.price.toFixed(2)}
              </span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '999px', background: isPositive ? 'var(--success-light)' : 'var(--danger-light)', color: isPositive ? 'var(--success)' : 'var(--danger)', fontSize: '0.875rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                {isPositive ? '▲' : '▼'} {Math.abs(quote.changePct * 100).toFixed(2)}%
              </span>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: isPositive ? 'var(--success)' : 'var(--danger)', marginTop: '4px' }}>
                {isPositive ? '+' : ''}${quote.change.toFixed(2)} today
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Chart */}
        <div style={{ padding: '14px 20px 18px', borderBottom: '1px solid var(--border)' }}>
          <PriceChart
            prices={prices}
            timestamps={timestamps.length > 0 ? timestamps : undefined}
            isPositive={isPositive}
            loading={chartLoading}
            height={120}
            range={range}
            onRangeChange={setRange}
            firstPrice={prices[0]}
          />
        </div>

        {/* Full stats grid — Yahoo Finance style */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px' }}>
            Key Statistics
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0' }}>
            {allStats.map((stat, i) => (
              <div
                key={stat.label}
                style={{
                  padding: '8px 0',
                  borderBottom: i < allStats.length - 2 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  borderRight: i % 2 === 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  paddingRight: i % 2 === 0 ? '16px' : '0',
                  paddingLeft: i % 2 === 1 ? '16px' : '0',
                }}
              >
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', fontWeight: 600 }}>{stat.label}</p>
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: (stat as { color?: string }).color || 'var(--text-primary)' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company description */}
        {description && (
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
              About {displayName}
            </p>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
              {descExpanded ? description : descPreview}
              {description.length > 160 && (
                <button onClick={() => setDescExpanded(!descExpanded)} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', padding: '0 4px' }}>
                  {descExpanded ? 'Show less' : 'Read more'}
                </button>
              )}
            </p>
          </div>
        )}

        {/* Ask Alpha button */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => navigate('/mentor', {
              state: {
                suggestedPrompt: `Tell me about ${ticker} (${displayName}). What does this company actually do, what drives its stock price, and is it a reasonable pick for a beginner right now?`,
              },
            })}
            className="btn btn-ghost btn-full"
            style={{ fontSize: '0.85rem', padding: '11px' }}
          >
            ♟ Ask Alpha about {ticker}
          </button>
        </div>

        {/* Action buttons */}
        <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={onBuy} className="btn btn-success" style={{ fontSize: '1rem', height: '50px' }}>
            ↗ Buy
          </button>
          <button onClick={onSell} className="btn btn-danger" style={{ fontSize: '1rem', height: '50px' }}>
            ↙ Sell
          </button>
        </div>
      </div>

      {/* ── News card ── */}
      {assetClass !== 'crypto' && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)' }}>
            <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent News</p>
          </div>
          {newsLoading ? (
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '56px', borderRadius: '10px' }} />)}
            </div>
          ) : news.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>No recent news found</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {news.map((item, i) => (
                <a
                  key={item.id}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    padding: '14px 20px',
                    borderBottom: i < news.length - 1 ? '1px solid var(--border)' : 'none',
                    textDecoration: 'none',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '4px' }}>
                    <p style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4, flex: 1 }}>{item.headline}</p>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', flexShrink: 0, whiteSpace: 'nowrap' }}>{timeAgo(item.publishedAt as unknown as { seconds: number })}</span>
                  </div>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{item.source}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
