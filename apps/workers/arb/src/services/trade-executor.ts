// apps/workers/arb/src/services/trade-executor.ts

import { ArbitrageOpportunity } from '../utils/arbitrage-calculator';

export interface TradeResult {
  success: boolean;
  orderId?: string;
  executedPrice?: number;
  executedSize?: number;
  timestamp: Date;
  error?: string;
  fees?: number;
}

export interface ExecutionSummary {
  opportunity: ArbitrageOpportunity;
  buyTrade: TradeResult;
  sellTrade: TradeResult;
  totalProfit: number;
  totalFees: number;
  executionTime: number;
  success: boolean;
}

export class TradeExecutor {
  constructor(
    private exchangeManager: import('../lib/exchange-manager').ExchangeManager,
    private logger: any
  ) {}

  async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<ExecutionSummary> {
    const startTime = Date.now();
    
    this.logger.info('Starting arbitrage execution', {
      opportunityId: opportunity.id,
      buyExchange: opportunity.buyExchange,
      sellExchange: opportunity.sellExchange,
      profit: opportunity.profit
    });

    try {
      // Execute buy order first (usually faster)
      const buyTrade = await this.executeBuyOrder(opportunity);
      if (!buyTrade.success) {
        return this.createFailedSummary(opportunity, buyTrade, null, startTime);
      }

      // Execute sell order
      const sellTrade = await this.executeSellOrder(opportunity);
      if (!sellTrade.success) {
        // Try to reverse the buy order if sell fails
        await this.reverseTrade(opportunity, buyTrade);
        return this.createFailedSummary(opportunity, buyTrade, sellTrade, startTime);
      }

      const executionTime = Date.now() - startTime;
      const totalFees = (buyTrade.fees || 0) + (sellTrade.fees || 0);
      const actualProfit = this.calculateActualProfit(buyTrade, sellTrade, totalFees);

      return {
        opportunity,
        buyTrade,
        sellTrade,
        totalProfit: actualProfit,
        totalFees,
        executionTime,
        success: true
      };

    } catch (error) {
      this.logger.error('Arbitrage execution failed', {
        opportunityId: opportunity.id,
        error: error instanceof Error ? error.message : String(error)
      });

      return this.createFailedSummary(opportunity, null, null, startTime, String(error));
    }
  }

  private async executeBuyOrder(opportunity: ArbitrageOpportunity): Promise<TradeResult> {
    try {
      const result = await this.exchangeManager.placeBuyOrder(
        opportunity.buyExchange,
        opportunity.baseAsset,
        opportunity.quoteAsset,
        opportunity.size,
        opportunity.buyPrice
      );

      return {
        success: true,
        orderId: result.orderId,
        executedPrice: result.executedPrice,
        executedSize: result.executedSize,
        fees: result.fees,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  private async executeSellOrder(opportunity: ArbitrageOpportunity): Promise<TradeResult> {
    try {
      const result = await this.exchangeManager.placeSellOrder(
        opportunity.sellExchange,
        opportunity.baseAsset,
        opportunity.quoteAsset,
        opportunity.size,
        opportunity.sellPrice
      );

      return {
        success: true,
        orderId: result.orderId,
        executedPrice: result.executedPrice,
        executedSize: result.executedSize,
        fees: result.fees,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date()
      };
    }
  }

  private async reverseTrade(opportunity: ArbitrageOpportunity, buyTrade: TradeResult): Promise<void> {
    try {
      this.logger.warn('Attempting to reverse failed arbitrage trade', {
        opportunityId: opportunity.id,
        buyOrderId: buyTrade.orderId
      });

      // Place a sell order to reverse the buy
      await this.exchangeManager.placeSellOrder(
        opportunity.buyExchange,
        opportunity.baseAsset,
        opportunity.quoteAsset,
        buyTrade.executedSize || opportunity.size,
        opportunity.buyPrice * 0.99 // Sell at slight loss to ensure execution
      );
    } catch (error) {
      this.logger.error('Failed to reverse trade', {
        opportunityId: opportunity.id,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private calculateActualProfit(
    buyTrade: TradeResult,
    sellTrade: TradeResult,
    totalFees: number
  ): number {
    const buyAmount = (buyTrade.executedSize || 0) * (buyTrade.executedPrice || 0);
    const sellAmount = (sellTrade.executedSize || 0) * (sellTrade.executedPrice || 0);
    return sellAmount - buyAmount - totalFees;
  }

  private createFailedSummary(
    opportunity: ArbitrageOpportunity,
    buyTrade: TradeResult | null,
    sellTrade: TradeResult | null,
    startTime: number,
    error?: string
  ): ExecutionSummary {
    return {
      opportunity,
      buyTrade: buyTrade || {
        success: false,
        error: error || 'Trade not executed',
        timestamp: new Date()
      },
      sellTrade: sellTrade || {
        success: false,
        error: error || 'Trade not executed',
        timestamp: new Date()
      },
      totalProfit: 0,
      totalFees: 0,
      executionTime: Date.now() - startTime,
      success: false
    };
  }

  async validatePreExecution(opportunity: ArbitrageOpportunity): Promise<boolean> {
    try {
      // Check if exchanges are online
      const buyExchangeHealth = await this.exchangeManager.checkExchangeHealth(opportunity.buyExchange);
      const sellExchangeHealth = await this.exchangeManager.checkExchangeHealth(opportunity.sellExchange);
      
      if (!buyExchangeHealth || !sellExchangeHealth) {
        return false;
      }

      // Check account balances
      const hasBalance = await this.exchangeManager.checkSufficientBalance(
        opportunity.buyExchange,
        opportunity.quoteAsset,
        opportunity.size * opportunity.buyPrice
      );

      return hasBalance;
    } catch (error) {
      this.logger.error('Pre-execution validation failed', {
        opportunityId: opportunity.id,
        error: error instanceof Error ? error.message : String(error)
      });
      return false;
    }
  }
}
