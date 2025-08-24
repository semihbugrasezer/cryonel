import { createHash } from "crypto";
import { db } from "./db";
import { logger } from "./logger";

export interface DCETrigger {
  type: 'time' | 'price' | 'signal' | 'portfolio';
  params: Record<string, any>;
}

export interface DCEAction {
  type: 'buy' | 'sell' | 'close' | 'rebalance';
  params: {
    symbol: string;
    exchange: string;
    quantity?: number;
    quantity_type?: 'fixed' | 'percentage' | 'risk_based';
    price_type?: 'market' | 'limit' | 'stop';
    price?: number;
    stop_loss?: number;
    take_profit?: number[];
    time_in_force?: 'GTC' | 'IOC' | 'FOK';
  };
}

export interface DCEConstraints {
  max_position_size: number;
  max_daily_trades: number;
  max_drawdown_percentage: number;
  allowed_symbols: string[];
  allowed_exchanges: string[];
  trading_hours?: {
    start: string;
    end: string;
    timezone: string;
  };
  cooldown_period_ms?: number;
}

export interface DCEPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  trigger: DCETrigger;
  actions: DCEAction[];
  constraints: DCEConstraints;
  deterministic_hash: string;
  status: 'active' | 'paused' | 'stopped';
  execution_count: number;
  total_pnl: number;
  last_executed_at?: Date;
}

export interface DCEExecution {
  id: string;
  plan_id: string;
  trigger_data: Record<string, any>;
  execution_hash: string;
  status: 'pending' | 'executing' | 'completed' | 'failed';
  orders_data?: Record<string, any>;
  actual_pnl?: number;
  execution_time_ms?: number;
  error_message?: string;
  created_at: Date;
  completed_at?: Date;
}

export class DCEEngine {
  /**
   * Generate deterministic hash for DCE plan execution
   */
  static generateExecutionHash(
    planHash: string,
    triggerData: Record<string, any>,
    timestamp: number
  ): string {
    const content = JSON.stringify({
      plan_hash: planHash,
      trigger_data: triggerData,
      timestamp: Math.floor(timestamp / 1000) // Round to seconds for determinism
    }, Object.keys({}).sort());

    return createHash('sha256').update(content).digest('hex');
  }

  /**
   * Validate DCE plan constraints
   */
  static async validateConstraints(
    plan: DCEPlan,
    triggerData: Record<string, any>
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      // Check trading hours if specified
      if (plan.constraints.trading_hours) {
        const now = new Date();
        const { start, end, timezone } = plan.constraints.trading_hours;

        // Simple time validation (could be enhanced with proper timezone handling)
        const currentHour = now.getHours();
        const startHour = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);

        if (currentHour < startHour || currentHour >= endHour) {
          errors.push(`Outside trading hours: ${start}-${end} ${timezone}`);
        }
      }

      // Check daily trade limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dailyExecutions = await db.query(
        `SELECT COUNT(*) as count FROM dce_executions 
         WHERE plan_id = $1 AND created_at >= $2 AND status = 'completed'`,
        [plan.id, today]
      );

      const dailyTradeCount = parseInt(dailyExecutions.rows[0].count);
      if (dailyTradeCount >= plan.constraints.max_daily_trades) {
        errors.push(`Daily trade limit exceeded: ${dailyTradeCount}/${plan.constraints.max_daily_trades}`);
      }

      // Check cooldown period
      if (plan.constraints.cooldown_period_ms && plan.last_executed_at) {
        const timeSinceLastExecution = Date.now() - plan.last_executed_at.getTime();
        if (timeSinceLastExecution < plan.constraints.cooldown_period_ms) {
          errors.push(`Cooldown period not met: ${timeSinceLastExecution}ms < ${plan.constraints.cooldown_period_ms}ms`);
        }
      }

      // Validate symbol and exchange allowlists
      for (const action of plan.actions) {
        if (!plan.constraints.allowed_symbols.includes(action.params.symbol)) {
          errors.push(`Symbol not allowed: ${action.params.symbol}`);
        }
        if (!plan.constraints.allowed_exchanges.includes(action.params.exchange)) {
          errors.push(`Exchange not allowed: ${action.params.exchange}`);
        }
      }

    } catch (error) {
      logger.error("Error validating DCE constraints:", error);
      errors.push("Failed to validate constraints");
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a new DCE execution record
   */
  static async createExecution(
    plan: DCEPlan,
    triggerData: Record<string, any>
  ): Promise<string> {
    const executionHash = this.generateExecutionHash(
      plan.deterministic_hash,
      triggerData,
      Date.now()
    );

    const result = await db.query(
      `INSERT INTO dce_executions (plan_id, trigger_data, execution_hash, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id`,
      [plan.id, JSON.stringify(triggerData), executionHash]
    );

    return result.rows[0].id;
  }

  /**
   * Update execution status and results
   */
  static async updateExecution(
    executionId: string,
    status: 'executing' | 'completed' | 'failed',
    ordersData?: Record<string, any>,
    actualPnl?: number,
    executionTimeMs?: number,
    errorMessage?: string
  ): Promise<void> {
    const updateFields = ['status = $2'];
    const values = [executionId, status];
    let paramIndex = 3;

    if (ordersData !== undefined) {
      updateFields.push(`orders_data = $${paramIndex}`);
      values.push(JSON.stringify(ordersData));
      paramIndex++;
    }

    if (actualPnl !== undefined) {
      updateFields.push(`actual_pnl = $${paramIndex}`);
      values.push(actualPnl.toString());
      paramIndex++;
    }

    if (executionTimeMs !== undefined) {
      updateFields.push(`execution_time_ms = $${paramIndex}`);
      values.push(executionTimeMs.toString());
      paramIndex++;
    }

    if (errorMessage !== undefined) {
      updateFields.push(`error_message = $${paramIndex}`);
      values.push(errorMessage);
      paramIndex++;
    }

    if (status === 'completed' || status === 'failed') {
      updateFields.push('completed_at = NOW()');
    }

    const query = `
      UPDATE dce_executions 
      SET ${updateFields.join(', ')}
      WHERE id = $1
    `;

    await db.query(query, values);
  }

  /**
   * Execute a DCE plan (this would be called by the worker)
   */
  static async executePlan(
    planId: string,
    triggerData: Record<string, any>
  ): Promise<{ success: boolean; executionId: string; error?: string }> {
    const startTime = Date.now();
    let executionId: string;

    try {
      // Fetch the plan
      const planResult = await db.query(
        `SELECT * FROM dce_plans WHERE id = $1 AND status = 'active'`,
        [planId]
      );

      if (planResult.rows.length === 0) {
        throw new Error("Plan not found or not active");
      }

      const planRow = planResult.rows[0];
      const plan: DCEPlan = {
        ...planRow,
        trigger: {
          type: planRow.trigger_type,
          params: planRow.trigger_params
        },
        actions: planRow.actions,
        constraints: planRow.constraints,
        last_executed_at: planRow.last_executed_at ? new Date(planRow.last_executed_at) : undefined
      };

      // Validate constraints
      const validation = await this.validateConstraints(plan, triggerData);
      if (!validation.valid) {
        throw new Error(`Constraint validation failed: ${validation.errors.join(', ')}`);
      }

      // Create execution record
      executionId = await this.createExecution(plan, triggerData);

      // Update execution to executing status
      await this.updateExecution(executionId, 'executing');

      // TODO: Implement actual order execution logic here
      // This would integrate with exchange APIs to place orders
      const ordersData = {
        orders: plan.actions.map(action => ({
          action: action.type,
          symbol: action.params.symbol,
          exchange: action.params.exchange,
          // Add mock order data
          order_id: `mock_${Date.now()}_${Math.random()}`,
          status: 'filled',
          filled_quantity: action.params.quantity || 1,
          average_price: action.params.price || 50000
        }))
      };

      // Mock PnL calculation
      const mockPnl = Math.random() * 200 - 100; // Random PnL between -100 and +100

      const executionTime = Date.now() - startTime;

      // Update execution with results
      await this.updateExecution(
        executionId,
        'completed',
        ordersData,
        mockPnl,
        executionTime
      );

      // Update plan statistics
      await db.query(
        `UPDATE dce_plans 
         SET execution_count = execution_count + 1,
             total_pnl = total_pnl + $1,
             last_executed_at = NOW()
         WHERE id = $2`,
        [mockPnl, planId]
      );

      logger.info(`DCE plan executed successfully`, {
        planId,
        executionId,
        executionTime,
        pnl: mockPnl
      });

      return {
        success: true,
        executionId
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error("DCE plan execution failed:", { planId, error: errorMessage });

      if (executionId!) {
        await this.updateExecution(
          executionId,
          'failed',
          undefined,
          undefined,
          Date.now() - startTime,
          errorMessage
        );
      }

      return {
        success: false,
        executionId: executionId!,
        error: errorMessage
      };
    }
  }

  /**
   * Get active plans for trigger evaluation
   */
  static async getActivePlans(): Promise<DCEPlan[]> {
    const result = await db.query(
      `SELECT * FROM dce_plans WHERE status = 'active' ORDER BY created_at ASC`
    );

    return result.rows.map((row: any) => ({
      ...row,
      trigger: {
        type: row.trigger_type,
        params: row.trigger_params
      },
      actions: row.actions,
      constraints: row.constraints,
      last_executed_at: row.last_executed_at ? new Date(row.last_executed_at) : undefined
    }));
  }
}