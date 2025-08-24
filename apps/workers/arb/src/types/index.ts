// apps/workers/arb/src/types/index.ts

export interface ExchangePair {
  symbol: string;
  exchange: string;
  baseAsset: string;
  quoteAsset: string;
}

export interface ArbitrageResult {
  success: boolean;
  profit?: number;
  error?: string;
  executionTime: number;
  trades: {
    buy?: any;
    sell?: any;
  };
}

export { ArbitrageOpportunity } from '../utils/arbitrage-calculator';
export { MarketData } from '../lib/exchange-manager';