// Public House and Senate Stock Watcher data — no API key required

export interface PoliticalTrade {
  id: string;
  politician: string;
  chamber: 'House' | 'Senate';
  party: string;
  state: string;
  ticker: string;
  assetDescription: string;
  type: 'Purchase' | 'Sale' | 'Sale (Full)' | 'Sale (Partial)' | 'Exchange';
  transactionDate: string;
  filedDate: string;
  amount: string;        // e.g. "$1,001 - $15,000"
  owner: string;         // "Self", "Spouse", "Child", "Joint"
}

// Cache the big JSON files — only load once per session
let _houseCache: PoliticalTrade[] | null = null;
let _senateCache: PoliticalTrade[] | null = null;

async function loadHouse(): Promise<PoliticalTrade[]> {
  if (_houseCache) return _houseCache;
  try {
    const res = await fetch('https://house-stock-watcher-data.s3-us-west-2.amazonaws.com/data/all_transactions.json');
    if (!res.ok) return [];
    const raw = await res.json() as Array<{
      transaction_date: string;
      ticker: string;
      asset_description: string;
      type: string;
      amount: string;
      representative: string;
      party: string;
      state: string;
      district: string;
      filed_date?: string;
      owner?: string;
    }>;
    _houseCache = raw
      .filter(r => r.ticker && r.ticker !== '--' && r.ticker.length <= 6)
      .map((r, i) => ({
        id: `house-${i}`,
        politician: r.representative,
        chamber: 'House',
        party: r.party || '?',
        state: r.state || '',
        ticker: r.ticker.trim().toUpperCase(),
        assetDescription: r.asset_description || r.ticker,
        type: normalizeType(r.type),
        transactionDate: r.transaction_date,
        filedDate: r.filed_date || r.transaction_date,
        amount: r.amount || '—',
        owner: r.owner || 'Self',
      }));
    return _houseCache;
  } catch {
    return [];
  }
}

async function loadSenate(): Promise<PoliticalTrade[]> {
  if (_senateCache) return _senateCache;
  try {
    const res = await fetch('https://senate-stock-watcher-data.s3-us-west-2.amazonaws.com/aggregate/all_transactions.json');
    if (!res.ok) return [];
    const raw = await res.json() as Array<{
      transaction_date: string;
      ticker: string;
      asset_type?: string;
      type: string;
      amount: string;
      senator: string;
      party?: string;
      state?: string;
      comment?: string;
      owner?: string;
    }>;
    _senateCache = raw
      .filter(r => r.ticker && r.ticker !== '--' && r.ticker.length <= 6)
      .map((r, i) => ({
        id: `senate-${i}`,
        politician: r.senator,
        chamber: 'Senate',
        party: r.party || '?',
        state: r.state || '',
        ticker: r.ticker.trim().toUpperCase(),
        assetDescription: r.asset_type || r.ticker,
        type: normalizeType(r.type),
        transactionDate: r.transaction_date,
        filedDate: r.transaction_date,
        amount: r.amount || '—',
        owner: r.owner || 'Self',
      }));
    return _senateCache;
  } catch {
    return [];
  }
}

function normalizeType(t: string): PoliticalTrade['type'] {
  const lower = (t || '').toLowerCase();
  if (lower.includes('purchase') || lower.includes('buy')) return 'Purchase';
  if (lower.includes('full')) return 'Sale (Full)';
  if (lower.includes('partial')) return 'Sale (Partial)';
  if (lower.includes('sale') || lower.includes('sell')) return 'Sale';
  if (lower.includes('exchange')) return 'Exchange';
  return 'Purchase';
}

export async function getRecentPoliticalTrades(opts: {
  ticker?: string;
  chamber?: 'all' | 'House' | 'Senate';
  limit?: number;
} = {}): Promise<PoliticalTrade[]> {
  const { ticker, chamber = 'all', limit = 30 } = opts;

  const [house, senate] = await Promise.all([
    chamber === 'Senate' ? [] : loadHouse(),
    chamber === 'House' ? [] : loadSenate(),
  ]);

  let combined = [...house, ...senate];

  if (ticker) {
    combined = combined.filter(t => t.ticker === ticker.toUpperCase());
  }

  // Sort newest first by transaction date
  combined.sort((a, b) => {
    const da = new Date(a.transactionDate).getTime() || 0;
    const db = new Date(b.transactionDate).getTime() || 0;
    return db - da;
  });

  return combined.slice(0, limit);
}
