import { logger } from './logger';
import { ExchangeManager } from './exchange-manager';
import { DatabaseManager } from './database-manager';
import { RedisManager } from './redis-manager';
import { MetricsCollector } from './metrics';
import { ArbitrageOpportunity, ArbitrageCalculator } from '../utils/arbitrage-calculator';
import { TradeExecutor } from '../services/trade-executor';
import { MarketData } from './exchange-manager';
import { ArbitrageResult, ExchangePair } from '../types';
import { config } from '../config/index';

export class ArbitrageEngine {
    private isRunning = false;
    private scanInterval: NodeJS.Timeout | null = null;
    private readonly SCAN_INTERVAL_MS = 1000; // 1 second
    private readonly MIN_PROFIT_THRESHOLD = 0.5; // 0.5% minimum profit
    private readonly MAX_SLIPPAGE = 0.1; // 0.1% maximum slippage

    constructor(
        private exchangeManager: ExchangeManager,
        private databaseManager: DatabaseManager,
        private redisManager: RedisManager,
        private metricsCollector: MetricsCollector
    ) { }

    async start(): Promise<void> {
        if (this.isRunning) {
            logger.warn('Arbitrage engine is already running');
            return;
        }

        try {
            logger.info('Starting arbitrage engine...');

            this.isRunning = true;

            // Start scanning for opportunities
            this.startScanning();

            logger.info('Arbitrage engine started successfully');

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to start arbitrage engine');
            throw error;
        }
    }

    async stop(): Promise<void> {
        if (!this.isRunning) {
            return;
        }

        try {
            logger.info('Stopping arbitrage engine...');

            this.isRunning = false;

            // Stop scanning
            if (this.scanInterval) {
                clearInterval(this.scanInterval);
                this.scanInterval = null;
            }

            logger.info('Arbitrage engine stopped successfully');

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error stopping arbitrage engine');
        }
    }

    private startScanning(): void {
        this.scanInterval = setInterval(async () => {
            if (!this.isRunning) return;

            try {
                await this.scanForOpportunities();
            } catch (error) {
                logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error during opportunity scan');
            }
        }, this.SCAN_INTERVAL_MS);
    }

    private async scanForOpportunities(): Promise<void> {
        try {
            // Get market data from all exchanges
            const marketData = await this.exchangeManager.getAllMarketData();

            // Find arbitrage opportunities
            const opportunities = this.findArbitrageOpportunities(marketData);

            // Process opportunities
            for (const opportunity of opportunities) {
                await this.processArbitrageOpportunity(opportunity);
            }

            // Update metrics
            this.metricsCollector.updateOpportunitiesFound(opportunities.length);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to scan for opportunities');
        }
    }

    private findArbitrageOpportunities(marketData: MarketData[]): ArbitrageOpportunity[] {
        const opportunities: ArbitrageOpportunity[] = [];

        try {
            // Group market data by trading pair
            const pairGroups = this.groupMarketDataByPair(marketData);

            // Check each pair for arbitrage opportunities
            for (const [pair, exchanges] of pairGroups) {
                const pairOpportunities = this.findPairArbitrageOpportunities(pair, exchanges);
                opportunities.push(...pairOpportunities);
            }

            // Sort opportunities by profit percentage (highest first)
            opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);

            // Limit to top opportunities
            const maxOpportunities = config.MAX_OPPORTUNITIES_PER_SCAN || 10;
            return opportunities.slice(0, maxOpportunities);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error finding arbitrage opportunities');
            return [];
        }
    }

    private groupMarketDataByPair(marketData: MarketData[]): Map<string, MarketData[]> {
        const groups = new Map<string, MarketData[]>();

        for (const data of marketData) {
            const pair = `${data.base}/${data.quote}`;
            if (!groups.has(pair)) {
                groups.set(pair, []);
            }
            groups.get(pair)!.push(data);
        }

        return groups;
    }

    private findPairArbitrageOpportunities(pair: string, exchanges: MarketData[]): ArbitrageOpportunity[] {
        const opportunities: ArbitrageOpportunity[] = [];

        try {
            // Need at least 2 exchanges to find arbitrage
            if (exchanges.length < 2) {
                return opportunities;
            }

            // Check all exchange combinations
            for (let i = 0; i < exchanges.length; i++) {
                for (let j = i + 1; j < exchanges.length; j++) {
                    const exchange1 = exchanges[i];
                    const exchange2 = exchanges[j];

                    // Check if exchange1 has lower ask than exchange2's bid
                    if (exchange1.ask < exchange2.bid) {
                        const opportunity = this.createArbitrageOpportunity(
                            pair,
                            exchange1,
                            exchange2,
                            'buy_sell'
                        );

                        if (opportunity && opportunity.profitPercentage >= this.MIN_PROFIT_THRESHOLD) {
                            opportunities.push(opportunity);
                        }
                    }

                    // Check if exchange2 has lower ask than exchange1's bid
                    if (exchange2.ask < exchange1.bid) {
                        const opportunity = this.createArbitrageOpportunity(
                            pair,
                            exchange2,
                            exchange1,
                            'buy_sell'
                        );

                        if (opportunity && opportunity.profitPercentage >= this.MIN_PROFIT_THRESHOLD) {
                            opportunities.push(opportunity);
                        }
                    }
                }
            }

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                pair
            }, 'Error finding pair arbitrage opportunities');
        }

        return opportunities;
    }

    private createArbitrageOpportunity(
        pair: string,
        buyExchange: MarketData,
        sellExchange: MarketData,
        type: 'buy_sell' | 'sell_buy'
    ): ArbitrageOpportunity | null {
        try {
            const [base, quote] = pair.split('/');

            // Calculate optimal trade size (considering liquidity and fees)
            const tradeSize = this.calculateOptimalTradeSize(buyExchange, sellExchange);

            if (tradeSize <= 0) {
                return null;
            }

            // Calculate profit
            const profit = calculateArbitrageProfit(
                buyExchange,
                sellExchange,
                tradeSize,
                type
            );

            if (profit <= 0) {
                return null;
            }

            // Calculate profit percentage
            const profitPercentage = (profit / (tradeSize * buyExchange.ask)) * 100;

            // Create opportunity object
            const opportunity: ArbitrageOpportunity = {
                id: this.generateOpportunityId(),
                pair,
                base,
                quote,
                buyExchange: buyExchange.exchange,
                sellExchange: sellExchange.exchange,
                buyPrice: buyExchange.ask,
                sellPrice: sellExchange.bid,
                tradeSize,
                profit,
                profitPercentage,
                type,
                timestamp: new Date(),
                status: 'pending',
                estimatedFees: this.calculateEstimatedFees(buyExchange, sellExchange, tradeSize),
                slippage: this.calculateSlippage(buyExchange, sellExchange),
                confidence: this.calculateConfidence(buyExchange, sellExchange),
                riskScore: this.calculateRiskScore(buyExchange, sellExchange),
                executionTime: this.estimateExecutionTime(buyExchange, sellExchange)
            };

            return opportunity;

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                pair,
                buyExchange: buyExchange.exchange,
                sellExchange: sellExchange.exchange
            }, 'Error creating arbitrage opportunity');
            return null;
        }
    }

    private calculateOptimalTradeSize(buyExchange: MarketData, sellExchange: MarketData): number {
        try {
            // Consider available liquidity on both exchanges
            const buyLiquidity = Math.min(buyExchange.askVolume, buyExchange.maxTradeSize || Infinity);
            const sellLiquidity = Math.min(sellExchange.bidVolume, sellExchange.maxTradeSize || Infinity);

            // Use the smaller of the two
            const maxTradeSize = Math.min(buyLiquidity, sellLiquidity);

            // Apply safety factor (80% of max to account for slippage)
            const safeTradeSize = maxTradeSize * 0.8;

            // Ensure minimum trade size
            const minTradeSize = config.MIN_TRADE_SIZE || 0.001;

            return Math.max(safeTradeSize, minTradeSize);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error calculating optimal trade size');
            return 0;
        }
    }

    private calculateEstimatedFees(buyExchange: MarketData, sellExchange: MarketData, tradeSize: number): number {
        try {
            const buyFees = (buyExchange.ask * tradeSize) * (buyExchange.feeRate || 0.001);
            const sellFees = (sellExchange.bid * tradeSize) * (sellExchange.feeRate || 0.001);

            return buyFees + sellFees;

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error calculating estimated fees');
            return 0;
        }
    }

    private calculateSlippage(buyExchange: MarketData, sellExchange: MarketData): number {
        try {
            // Estimate slippage based on order book depth and trade size
            const buySlippage = this.estimateSlippageForExchange(buyExchange);
            const sellSlippage = this.estimateSlippageForExchange(sellExchange);

            return Math.max(buySlippage, sellSlippage);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error calculating slippage');
            return 0;
        }
    }

    private estimateSlippageForExchange(exchange: MarketData): number {
        try {
            // Simple slippage estimation based on volume and trade size
            const volumeRatio = (exchange.askVolume || 1) / (exchange.bidVolume || 1);
            const tradeVolumeRatio = (exchange.maxTradeSize || 1) / (exchange.askVolume || 1);

            // Base slippage + volume-based adjustment
            let slippage = 0.001; // 0.1% base

            if (volumeRatio < 0.5) {
                slippage += 0.002; // High volume imbalance
            }

            if (tradeVolumeRatio > 0.1) {
                slippage += 0.003; // Large trade relative to volume
            }

            return Math.min(slippage, this.MAX_SLIPPAGE);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error estimating slippage');
            return 0.001;
        }
    }

    private calculateConfidence(buyExchange: MarketData, sellExchange: MarketData): number {
        try {
            let confidence = 0.5; // Base confidence

            // Volume confidence
            const avgVolume = (buyExchange.askVolume + sellExchange.bidVolume) / 2;
            if (avgVolume > 1000) confidence += 0.2;
            if (avgVolume > 10000) confidence += 0.1;

            // Price confidence (closer prices = higher confidence)
            const priceDiff = Math.abs(buyExchange.ask - sellExchange.bid);
            const priceRatio = priceDiff / buyExchange.ask;
            if (priceRatio < 0.01) confidence += 0.2;
            if (priceRatio < 0.005) confidence += 0.1;

            // Exchange reliability
            if (buyExchange.reliability && sellExchange.reliability) {
                confidence += (buyExchange.reliability + sellExchange.reliability) * 0.1;
            }

            return Math.min(confidence, 1.0);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error calculating confidence');
            return 0.5;
        }
    }

    private calculateRiskScore(buyExchange: MarketData, sellExchange: MarketData): number {
        try {
            let riskScore = 0.5; // Base risk

            // Volume risk
            const minVolume = Math.min(buyExchange.askVolume, sellExchange.bidVolume);
            if (minVolume < 100) riskScore += 0.2;
            if (minVolume < 50) riskScore += 0.2;

            // Price volatility risk
            if (buyExchange.priceChange24h && Math.abs(buyExchange.priceChange24h) > 0.1) {
                riskScore += 0.2;
            }

            // Exchange risk
            if (buyExchange.riskRating) riskScore += buyExchange.riskRating * 0.1;
            if (sellExchange.riskRating) riskScore += sellExchange.riskRating * 0.1;

            return Math.min(riskScore, 1.0);

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error calculating risk score');
            return 0.5;
        }
    }

    private estimateExecutionTime(buyExchange: MarketData, sellExchange: MarketData): number {
        try {
            // Estimate execution time based on exchange performance
            const buyLatency = buyExchange.avgLatency || 100;
            const sellLatency = sellExchange.avgLatency || 100;

            // Add network latency and processing time
            const totalLatency = buyLatency + sellLatency + 200; // 200ms for processing

            return totalLatency;

        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error estimating execution time');
            return 500; // Default 500ms
        }
    }

    private generateOpportunityId(): string {
        return `arb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    private async processArbitrageOpportunity(opportunity: ArbitrageOpportunity): Promise<void> {
        try {
            logger.info({
                opportunityId: opportunity.id,
                pair: opportunity.pair,
                profitPercentage: opportunity.profitPercentage.toFixed(2)
            }, 'Processing arbitrage opportunity');

            // Validate opportunity
            const isValid = await validateArbitrageOpportunity(opportunity);
            if (!isValid) {
                logger.warn({ opportunityId: opportunity.id }, 'Opportunity validation failed');
                opportunity.status = 'invalid';
                return;
            }

            // Check if opportunity is still profitable
            const currentProfit = await this.recalculateProfit(opportunity);
            if (currentProfit.profitPercentage < this.MIN_PROFIT_THRESHOLD) {
                logger.info({
                    opportunityId: opportunity.id,
                    currentProfit: currentProfit.profitPercentage.toFixed(2)
                }, 'Opportunity no longer profitable');
                opportunity.status = 'expired';
                return;
            }

            // Update opportunity with current data
            Object.assign(opportunity, currentProfit);

            // Store opportunity in database
            await this.databaseManager.saveArbitrageOpportunity(opportunity);

            // Store in Redis for quick access
            await this.redisManager.storeOpportunity(opportunity);

            // Execute trade if auto-execution is enabled
            if (config.AUTO_EXECUTE_ARBITRAGE) {
                await this.executeArbitrage(opportunity);
            }

            // Update metrics
            this.metricsCollector.updateOpportunityProcessed(opportunity);

            logger.info({
                opportunityId: opportunity.id,
                status: opportunity.status
            }, 'Arbitrage opportunity processed successfully');

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                opportunityId: opportunity.id
            }, 'Error processing arbitrage opportunity');

            opportunity.status = 'error';
        }
    }

    private async recalculateProfit(opportunity: ArbitrageOpportunity): Promise<Partial<ArbitrageOpportunity>> {
        try {
            // Get current market data
            const buyMarketData = await this.exchangeManager.getMarketData(
                opportunity.buyExchange,
                opportunity.pair
            );

            const sellMarketData = await this.exchangeManager.getMarketData(
                opportunity.sellExchange,
                opportunity.pair
            );

            if (!buyMarketData || !sellMarketData) {
                throw new Error('Failed to get current market data');
            }

            // Recalculate profit
            const profit = calculateArbitrageProfit(
                buyMarketData,
                sellMarketData,
                opportunity.tradeSize,
                opportunity.type
            );

            const profitPercentage = (profit / (opportunity.tradeSize * buyMarketData.ask)) * 100;

            return {
                buyPrice: buyMarketData.ask,
                sellPrice: sellMarketData.bid,
                profit,
                profitPercentage,
                timestamp: new Date()
            };

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                opportunityId: opportunity.id
            }, 'Error recalculating profit');

            return {};
        }
    }

    private async executeArbitrage(opportunity: ArbitrageOpportunity): Promise<void> {
        try {
            logger.info({ opportunityId: opportunity.id }, 'Executing arbitrage trade');

            // Execute the trade
            const result = await executeArbitrageTrade(opportunity);

            if (result.success) {
                opportunity.status = 'executed';
                logger.info({
                    opportunityId: opportunity.id,
                    tradeId: result.tradeId
                }, 'Arbitrage trade executed successfully');

                // Update metrics
                this.metricsCollector.updateArbitrageExecuted(opportunity, result);

            } else {
                opportunity.status = 'failed';
                logger.error({
                    opportunityId: opportunity.id,
                    error: result.error
                }, 'Arbitrage trade execution failed');
            }

            // Update opportunity in database
            await this.databaseManager.updateArbitrageOpportunity(opportunity);

        } catch (error) {
            logger.error({
                error: error instanceof Error ? error.message : String(error),
                opportunityId: opportunity.id
            }, 'Error executing arbitrage trade');

            opportunity.status = 'error';
        }
    }

    // Public methods for external access
    async getOpportunities(limit: number = 100): Promise<ArbitrageOpportunity[]> {
        try {
            return await this.databaseManager.getArbitrageOpportunities(limit);
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error getting opportunities');
            return [];
        }
    }

    async getOpportunityById(id: string): Promise<ArbitrageOpportunity | null> {
        try {
            return await this.databaseManager.getArbitrageOpportunityById(id);
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error), id }, 'Error getting opportunity by ID');
            return null;
        }
    }

    async forceScan(): Promise<void> {
        try {
            logger.info('Force scanning for arbitrage opportunities');
            await this.scanForOpportunities();
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Error during force scan');
        }
    }
}
