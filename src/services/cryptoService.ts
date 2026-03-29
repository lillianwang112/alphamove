export interface CryptoQuoteResult {
  price: number;
  change24h: number;
  changePct24h: number;   // as decimal e.g. 0.05 = 5%
  marketCap: number;
  volume24h: number;
}

export interface CryptoInfo {
  id: string;
  symbol: string;
  name: string;
  description: string;
}

const COIN_MAP: Record<string, { id: string; name: string }> = {
  BTC:   { id: 'bitcoin',       name: 'Bitcoin' },
  ETH:   { id: 'ethereum',      name: 'Ethereum' },
  SOL:   { id: 'solana',        name: 'Solana' },
  DOGE:  { id: 'dogecoin',      name: 'Dogecoin' },
  ADA:   { id: 'cardano',       name: 'Cardano' },
  AVAX:  { id: 'avalanche-2',   name: 'Avalanche' },
  LINK:  { id: 'chainlink',     name: 'Chainlink' },
  DOT:   { id: 'polkadot',      name: 'Polkadot' },
  XRP:   { id: 'ripple',        name: 'XRP' },
  LTC:   { id: 'litecoin',      name: 'Litecoin' },
  UNI:   { id: 'uniswap',       name: 'Uniswap' },
  MATIC: { id: 'matic-network', name: 'Polygon' },
};

export const CRYPTO_TICKERS = Object.keys(COIN_MAP);

export function getCryptoName(ticker: string): string {
  return COIN_MAP[ticker.toUpperCase()]?.name ?? ticker;
}

export function isCryptoTicker(ticker: string): boolean {
  return ticker.toUpperCase() in COIN_MAP;
}

export async function getCryptoQuote(ticker: string): Promise<CryptoQuoteResult> {
  const entry = COIN_MAP[ticker.toUpperCase()];
  if (!entry) throw new Error(`Unknown crypto ticker: ${ticker}`);

  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${entry.id}&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`CoinGecko request failed: ${res.status}`);

  const data = await res.json() as Record<string, {
    usd: number;
    usd_24h_change: number;
    usd_market_cap: number;
    usd_24h_vol: number;
  }>;

  const coinData = data[entry.id];
  if (!coinData) throw new Error(`No CoinGecko data for ${ticker}`);

  const changePct = coinData.usd_24h_change / 100;
  return {
    price: coinData.usd,
    change24h: coinData.usd * changePct,
    changePct24h: changePct,
    marketCap: coinData.usd_market_cap,
    volume24h: coinData.usd_24h_vol,
  };
}

// ─── Candle Data ──────────────────────────────────

export interface CryptoCandleResult {
  closes: number[];
  timestamps: number[];
}

export async function getCryptoCandles(ticker: string, days = 30): Promise<CryptoCandleResult> {
  const entry = COIN_MAP[ticker.toUpperCase()];
  if (!entry) return { closes: [], timestamps: [] };

  try {
    const url = `https://api.coingecko.com/api/v3/coins/${entry.id}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return { closes: [], timestamps: [] };

    const data = await res.json() as { prices: [number, number][] };
    if (!data.prices?.length) return { closes: [], timestamps: [] };

    return {
      closes: data.prices.map(([, price]) => price),
      timestamps: data.prices.map(([ts]) => Math.floor(ts / 1000)),
    };
  } catch {
    return { closes: [], timestamps: [] };
  }
}
