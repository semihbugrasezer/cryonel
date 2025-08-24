import { logger } from "./logger";

export interface ExchangeQuote {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  fees: {
    maker: number;
    taker: number;
  };
  latency_ms: number;
  liquidity_score: number; // 0-100, higher is better
  timestamp: Date;
}

export interface RouteResult {
  total_quantity: number;
  average_price: number;
  total_fees: number;
  estimated_slippage: number;
  execution_plan: ExecutionStep[];
  confidence_score: number; // 0-100
  estimated_duration_ms: number;
}

export interface ExecutionStep {
  exchange: string;
  symbol: string;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  priority: number; // 1 = highest priority
  estimated_fees: number;
  reason: string;
}

export interface RoutingConstraints {
  max_exchanges: number;
  max_slippage_percentage: number;
  min_liquidity_score: number;
  preferred_exchanges: string[];
  blacklisted_exchanges: string[];
  max_latency_ms: number;
  require_fills: boolean; // true = reject partial fills
}

export interface ArbitrageOpportunity {
  buy_exchange: string;
  sell_exchange: string;
  symbol: string;
  buy_price: number;
  sell_price: number;
  spread_percentage: number;
  estimated_profit: number;
  min_quantity: number;
  confidence_score: number;
  expires_at: Date;
}

export class SmartRouter {
  private quotes: Map<string, ExchangeQuote[]> = new Map();
  private lastUpdateTime: Map<string, Date> = new Map();
  private readonly QUOTE_STALE_THRESHOLD_MS = 5000; // 5 seconds

  /**
   * Update quotes for a specific symbol
   */
  updateQuotes(symbol: string, quotes: ExchangeQuote[]): void {
    // Validate and filter quotes
    const validQuotes = quotes.filter(quote => 
      quote.price > 0 && 
      quote.quantity > 0 && 
      quote.latency_ms < 10000 && // 10 second max latency
      quote.liquidity_score >= 0
    );

    this.quotes.set(symbol, validQuotes);
    this.lastUpdateTime.set(symbol, new Date());

    logger.debug(`Updated quotes for ${symbol}`, {
      symbol,
      quote_count: validQuotes.length,
      exchanges: validQuotes.map(q => q.exchange)
    });
  }

  /**
   * Check if quotes are stale
   */
  private areQuotesStale(symbol: string): boolean {
    const lastUpdate = this.lastUpdateTime.get(symbol);
    if (!lastUpdate) return true;
    
    return (Date.now() - lastUpdate.getTime()) > this.QUOTE_STALE_THRESHOLD_MS;
  }

  /**
   * Find optimal routing for a trade
   */
  findOptimalRoute(
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    constraints: RoutingConstraints
  ): RouteResult | null {
    if (this.areQuotesStale(symbol)) {
      logger.warn(`Quotes for ${symbol} are stale`, { symbol });
      return null;
    }

    const quotes = this.quotes.get(symbol) || [];
    if (quotes.length === 0) {
      logger.warn(`No quotes available for ${symbol}`, { symbol });
      return null;
    }

    // Filter quotes based on constraints
    let filteredQuotes = quotes.filter(quote => 
      quote.side === side &&
      quote.latency_ms <= constraints.max_latency_ms &&
      quote.liquidity_score >= constraints.min_liquidity_score &&
      !constraints.blacklisted_exchanges.includes(quote.exchange)
    );

    // Apply preferred exchanges boost
    filteredQuotes = filteredQuotes.sort((a, b) => {
      const aPreferred = constraints.preferred_exchanges.includes(a.exchange) ? 1 : 0;
      const bPreferred = constraints.preferred_exchanges.includes(b.exchange) ? 1 : 0;
      
      if (aPreferred !== bPreferred) {
        return bPreferred - aPreferred; // Preferred exchanges first
      }
      
      // Then sort by best price
      return side === 'buy' ? a.price - b.price : b.price - a.price;
    });

    if (filteredQuotes.length === 0) {
      logger.warn(`No quotes match constraints for ${symbol}`, { symbol, constraints });
      return null;
    }

    // Generate execution plan
    const executionPlan = this.generateExecutionPlan(
      filteredQuotes,
      quantity,
      constraints
    );

    if (executionPlan.length === 0) {
      return null;
    }

    // Calculate route metrics
    const totalQuantity = executionPlan.reduce((sum, step) => sum + step.quantity, 0);
    const totalValue = executionPlan.reduce((sum, step) => sum + (step.quantity * step.price), 0);
    const averagePrice = totalValue / totalQuantity;
    const totalFees = executionPlan.reduce((sum, step) => sum + step.estimated_fees, 0);

    // Calculate estimated slippage
    const bestPrice = filteredQuotes[0].price;
    const estimatedSlippage = Math.abs((averagePrice - bestPrice) / bestPrice) * 100;

    // Calculate confidence score based on liquidity and latency
    const avgLiquidity = executionPlan.reduce((sum, step) => {
      const quote = filteredQuotes.find(q => q.exchange === step.exchange);
      return sum + (quote?.liquidity_score || 0);
    }, 0) / executionPlan.length;

    const avgLatency = executionPlan.reduce((sum, step) => {
      const quote = filteredQuotes.find(q => q.exchange === step.exchange);
      return sum + (quote?.latency_ms || 0);
    }, 0) / executionPlan.length;

    const confidenceScore = Math.min(100, 
      (avgLiquidity * 0.6) + 
      ((10000 - avgLatency) / 100 * 0.4) // Lower latency = higher confidence
    );

    const estimatedDuration = Math.max(...executionPlan.map(step => {
      const quote = filteredQuotes.find(q => q.exchange === step.exchange);
      return quote?.latency_ms || 1000;
    })) + 500; // Add 500ms buffer

    return {
      total_quantity: totalQuantity,
      average_price: averagePrice,
      total_fees: totalFees,
      estimated_slippage: estimatedSlippage,
      execution_plan: executionPlan,
      confidence_score: confidenceScore,
      estimated_duration_ms: estimatedDuration
    };
  }

  /**
   * Generate execution plan from filtered quotes
   */
  private generateExecutionPlan(
    quotes: ExchangeQuote[],
    targetQuantity: number,
    constraints: RoutingConstraints
  ): ExecutionStep[] {
    const plan: ExecutionStep[] = [];
    let remainingQuantity = targetQuantity;
    let exchangeCount = 0;

    for (const quote of quotes) {
      if (remainingQuantity <= 0 || exchangeCount >= constraints.max_exchanges) {
        break;
      }

      const quantityToUse = Math.min(remainingQuantity, quote.quantity);
      
      // Calculate estimated fees (simplified)
      const estimatedFees = quantityToUse * quote.price * quote.fees.taker;

      plan.push({
        exchange: quote.exchange,
        symbol: quote.symbol,
        side: quote.side,
        quantity: quantityToUse,
        price: quote.price,
        priority: exchangeCount + 1,
        estimated_fees: estimatedFees,
        reason: exchangeCount === 0 ? 'best_price' : 'liquidity_split'
      });

      remainingQuantity -= quantityToUse;
      exchangeCount++;
    }

    // Check if we couldn't fill the entire order
    if (remainingQuantity > 0 && constraints.require_fills) {
      logger.warn('Could not fill entire order', {
        target_quantity: targetQuantity,
        filled_quantity: targetQuantity - remainingQuantity,
        remaining: remainingQuantity
      });
      return []; // Return empty plan if partial fills not allowed
    }

    return plan;
  }

  /**
   * Find arbitrage opportunities across exchanges
   */
  findArbitrageOpportunities(symbol: string): ArbitrageOpportunity[] {
    if (this.areQuotesStale(symbol)) {
      return [];
    }

    const quotes = this.quotes.get(symbol) || [];
    const buyQuotes = quotes.filter(q => q.side === 'buy').sort((a, b) => a.price - b.price);
    const sellQuotes = quotes.filter(q => q.side === 'sell').sort((a, b) => b.price - a.price);

    const opportunities: ArbitrageOpportunity[] = [];

    for (const buyQuote of buyQuotes) {
      for (const sellQuote of sellQuotes) {
        if (buyQuote.exchange === sellQuote.exchange) continue;

        const spread = sellQuote.price - buyQuote.price;
        const spreadPercentage = (spread / buyQuote.price) * 100;

        // Only consider profitable opportunities (accounting for fees)
        const totalFees = (buyQuote.fees.taker + sellQuote.fees.taker) * buyQuote.price;
        const netSpread = spread - totalFees;

        if (netSpread > 0 && spreadPercentage > 0.1) { // Min 0.1% spread
          const minQuantity = Math.min(buyQuote.quantity, sellQuote.quantity);
          const estimatedProfit = netSpread * minQuantity;

          // Calculate confidence based on liquidity and latency
          const confidence = Math.min(100,
            ((buyQuote.liquidity_score + sellQuote.liquidity_score) / 2) * 0.7 +
            (Math.max(0, 100 - (buyQuote.latency_ms + sellQuote.latency_ms) / 100)) * 0.3
          );

          opportunities.push({
            buy_exchange: buyQuote.exchange,
            sell_exchange: sellQuote.exchange,
            symbol,
            buy_price: buyQuote.price,
            sell_price: sellQuote.price,
            spread_percentage: spreadPercentage,
            estimated_profit: estimatedProfit,
            min_quantity: minQuantity,
            confidence_score: confidence,
            expires_at: new Date(Date.now() + 30000) // 30 seconds expiry
          });
        }
      }
    }

    // Sort by estimated profit descending
    return opportunities.sort((a, b) => b.estimated_profit - a.estimated_profit);
  }

  /**
   * Get current market depth for a symbol
   */
  getMarketDepth(symbol: string): {
    bids: Array<{ exchange: string; price: number; quantity: number; }>;
    asks: Array<{ exchange: string; price: number; quantity: number; }>;
    spread: number;
    best_bid: number;
    best_ask: number;
  } | null {
    if (this.areQuotesStale(symbol)) {
      return null;
    }

    const quotes = this.quotes.get(symbol) || [];
    const bids = quotes
      .filter(q => q.side === 'buy')
      .map(q => ({ exchange: q.exchange, price: q.price, quantity: q.quantity }))
      .sort((a, b) => b.price - a.price);

    const asks = quotes
      .filter(q => q.side === 'sell')
      .map(q => ({ exchange: q.exchange, price: q.price, quantity: q.quantity }))
      .sort((a, b) => a.price - b.price);

    if (bids.length === 0 || asks.length === 0) {
      return null;
    }

    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const spread = bestAsk - bestBid;

    return {
      bids,
      asks,
      spread,
      best_bid: bestBid,
      best_ask: bestAsk
    };
  }

  /**
   * Get routing statistics
   */
  getRoutingStats(): {
    symbols_tracked: number;
    total_quotes: number;
    exchanges_active: string[];
    avg_latency_ms: number;
    stale_quotes: number;
  } {
    const allQuotes = Array.from(this.quotes.values()).flat();
    const uniqueExchanges = [...new Set(allQuotes.map(q => q.exchange))];
    const avgLatency = allQuotes.length > 0 
      ? allQuotes.reduce((sum, q) => sum + q.latency_ms, 0) / allQuotes.length 
      : 0;

    const staleSymbols = Array.from(this.quotes.keys()).filter(symbol => 
      this.areQuotesStale(symbol)
    ).length;

    return {
      symbols_tracked: this.quotes.size,
      total_quotes: allQuotes.length,
      exchanges_active: uniqueExchanges,
      avg_latency_ms: Math.round(avgLatency),
      stale_quotes: staleSymbols
    };
  }

  /**
   * Clear stale quotes
   */
  clearStaleQuotes(): void {
    const symbolsToRemove: string[] = [];
    
    for (const [symbol, _] of this.quotes) {
      if (this.areQuotesStale(symbol)) {
        symbolsToRemove.push(symbol);
      }
    }

    for (const symbol of symbolsToRemove) {
      this.quotes.delete(symbol);
      this.lastUpdateTime.delete(symbol);
    }

    if (symbolsToRemove.length > 0) {
      logger.debug(`Cleared stale quotes for symbols: ${symbolsToRemove.join(', ')}`);
    }
  }

  /**
   * Get current quotes for a symbol
   */
  getCurrentQuotes(symbol: string): ExchangeQuote[] {
    return this.quotes.get(symbol) || [];
  }

  /**
   * Get health status of the router
   */
  getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    symbols_tracked: number;
    total_quotes: number;
    exchanges_active: string[];
    avg_latency_ms: number;
    stale_quotes: number;
    last_update: Date | null;
  } {
    const allQuotes = Array.from(this.quotes.values()).flat();
    const uniqueExchanges = [...new Set(allQuotes.map(q => q.exchange))];
    const avgLatency = allQuotes.length > 0 
      ? allQuotes.reduce((sum, q) => sum + q.latency_ms, 0) / allQuotes.length 
      : 0;

    const staleSymbols = Array.from(this.quotes.keys()).filter(symbol => 
      this.areQuotesStale(symbol)
    ).length;

    const stats = {
      symbols_tracked: this.quotes.size,
      total_quotes: allQuotes.length,
      exchanges_active: uniqueExchanges,
      avg_latency_ms: Math.round(avgLatency),
      stale_quotes: staleSymbols
    };
    const lastUpdate = this.lastUpdateTime.size > 0 
      ? new Date(Math.max(...Array.from(this.lastUpdateTime.values()).map(d => d.getTime()))) 
      : null;

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Determine health status based on various factors
    if (stats.stale_quotes > stats.symbols_tracked * 0.5) {
      status = 'unhealthy';
    } else if (stats.stale_quotes > 0 || stats.avg_latency_ms > 1000) {
      status = 'degraded';
    }

    return {
      status,
      ...stats,
      last_update: lastUpdate
    };
  }
}

// Singleton instance
export const smartRouter = new SmartRouter();