// apps/workers/arb/src/lib/metrics.ts
import { logger } from './logger';

export class MetricsCollector {
    private opportunitiesFound = 0;
    private opportunitiesProcessed = 0;
    private arbitragesExecuted = 0;

    constructor() { }

    async start(): Promise<void> {
        try {
            logger.info('Starting metrics collector...');
            // TODO: Implement metrics collection
            logger.info('Metrics collector started successfully');
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to start metrics collector');
            throw error;
        }
    }

    async stop(): Promise<void> {
        try {
            logger.info('Stopping metrics collector...');
            // TODO: Implement metrics collection stop
            logger.info('Metrics collector stopped successfully');
        } catch (error) {
            logger.error({ error: error instanceof Error ? error.message : String(error) }, 'Failed to stop metrics collector');
        }
    }

    updateOpportunitiesFound(count: number): void {
        this.opportunitiesFound += count;
        logger.debug(`Updated opportunities found: ${this.opportunitiesFound}`);
    }

    updateOpportunityProcessed(): void {
        this.opportunitiesProcessed++;
        logger.debug(`Updated opportunities processed: ${this.opportunitiesProcessed}`);
    }

    updateArbitrageExecuted(): void {
        this.arbitragesExecuted++;
        logger.debug(`Updated arbitrages executed: ${this.arbitragesExecuted}`);
    }

    getMetrics(): { opportunitiesFound: number; opportunitiesProcessed: number; arbitragesExecuted: number } {
        return {
            opportunitiesFound: this.opportunitiesFound,
            opportunitiesProcessed: this.opportunitiesProcessed,
            arbitragesExecuted: this.arbitragesExecuted
        };
    }
}
