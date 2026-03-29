import { useCallback } from 'react';
import type { NewsEvent } from '../types';
import {
  getQuote,
  searchTicker,
  getCompanyProfile,
  getCompanyNews,
  type QuoteResult,
  type TickerSearchResult,
  type CompanyProfileResult,
} from '../services/marketService';

export function useMarketData() {
  const fetchQuote = useCallback(async (ticker: string): Promise<QuoteResult> => {
    return getQuote(ticker);
  }, []);

  const fetchSearchTicker = useCallback(
    async (query: string): Promise<TickerSearchResult[]> => {
      return searchTicker(query);
    },
    []
  );

  const fetchCompanyProfile = useCallback(
    async (ticker: string): Promise<CompanyProfileResult> => {
      return getCompanyProfile(ticker);
    },
    []
  );

  const fetchCompanyNews = useCallback(
    async (ticker: string, daysBack = 7): Promise<NewsEvent[]> => {
      return getCompanyNews(ticker, daysBack);
    },
    []
  );

  return {
    getQuote: fetchQuote,
    searchTicker: fetchSearchTicker,
    getCompanyProfile: fetchCompanyProfile,
    getCompanyNews: fetchCompanyNews,
  };
}
