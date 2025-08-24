// apps/workers/arb/src/utils/arbitrage-calculator.ts

export interface PriceQuote {
  price: number;
  size: number;
  fee: number;
  timestamp: Date;
}

export interface ArbitrageOpportunity {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  buyExchange: string;
  sellExchange: string;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  profitPercentage: number;
  fees: number;
  size: number;
  timestamp: Date;
  confidence: number;
}

export class ArbitrageCalculator {
  static calculateSpread(buyPrice: number, sellPrice: number): number {
    return ((sellPrice - buyPrice) / buyPrice) * 100;
  }

  static calculateProfit(
    buyPrice: number,
    sellPrice: number,
    size: number,
    buyFee: number = 0.001,
    sellFee: number = 0.001
  ): { profit: number; profitPercentage: number; fees: number } {
    const buyAmount = size * buyPrice;
    const sellAmount = size * sellPrice;
    
    const buyFeeAmount = buyAmount * buyFee;
    const sellFeeAmount = sellAmount * sellFee;
    const totalFees = buyFeeAmount + sellFeeAmount;
    
    const profit = sellAmount - buyAmount - totalFees;
    const profitPercentage = (profit / buyAmount) * 100;
    
    return {
      profit,
      profitPercentage,
      fees: totalFees
    };
  }

  static isOpportunityProfitable(
    buyPrice: number,
    sellPrice: number,
    size: number,
    minProfitThreshold: number = 0.5,
    buyFee: number = 0.001,
    sellFee: number = 0.001
  ): boolean {
    const { profitPercentage } = this.calculateProfit(buyPrice, sellPrice, size, buyFee, sellFee);
    return profitPercentage >= minProfitThreshold;
  }

  static calculateOptimalSize(
    buyPrice: number,
    sellPrice: number,
    maxSize: number,
    maxRisk: number = 1000 // USD
  ): number {
    const buyAmount = maxRisk / buyPrice;
    return Math.min(buyAmount, maxSize);
  }

  static estimateSlippage(
    orderSize: number,
    marketDepth: PriceQuote[],
    side: 'buy' | 'sell'
  ): number {
    let remainingSize = orderSize;
    let totalCost = 0;
    let weightedPrice = 0;

    const sortedQuotes = side === 'buy' 
      ? marketDepth.sort((a, b) => a.price - b.price)
      : marketDepth.sort((a, b) => b.price - a.price);

    for (const quote of sortedQuotes) {
      if (remainingSize <= 0) break;
      
      const filledSize = Math.min(remainingSize, quote.size);
      totalCost += filledSize * quote.price;
      weightedPrice += quote.price * filledSize;
      remainingSize -= filledSize;
    }

    if (remainingSize > 0) {
      return Infinity; // Not enough liquidity
    }

    const avgPrice = weightedPrice / orderSize;
    const bestPrice = sortedQuotes[0]?.price || 0;
    
    return Math.abs((avgPrice - bestPrice) / bestPrice) * 100;
  }

  static calculateRiskScore(opportunity: ArbitrageOpportunity): number {
    let risk = 0;
    
    // Price spread risk (higher spreads can be riskier)
    const spread = this.calculateSpread(opportunity.buyPrice, opportunity.sellPrice);
    if (spread > 2) risk += 0.2;
    if (spread > 5) risk += 0.3;
    
    // Size risk
    if (opportunity.size > 100) risk += 0.1;
    if (opportunity.size > 1000) risk += 0.2;
    
    // Timestamp freshness
    const ageMs = Date.now() - opportunity.timestamp.getTime();
    if (ageMs > 5000) risk += 0.2; // 5 seconds
    if (ageMs > 10000) risk += 0.3; // 10 seconds
    
    return Math.min(risk, 1.0);
  }

  static prioritizeOpportunities(opportunities: ArbitrageOpportunity[]): ArbitrageOpportunity[] {
    return opportunities
      .map(opp => ({
        ...opp,
        score: opp.profitPercentage * opp.confidence - this.calculateRiskScore(opp) * 100
      }))
      .sort((a, b) => (b as any).score - (a as any).score);
  }
}
