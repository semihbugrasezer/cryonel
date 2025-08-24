// apps/web/src/components/charts/EquityCurve.tsx
import { useState, useMemo } from 'react';
import {
    ComposedChart,
    Line,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine,
} from 'recharts';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

interface EquityDataPoint {
    timestamp: string;
    equity: number;
    drawdown: number;
    trades: number;
    deposits: number;
    withdrawals: number;
}

interface EquityCurveProps {
    data: EquityDataPoint[];
    className?: string;
    height?: number;
    showDrawdown?: boolean;
}

const timeframes = [
    { label: '1W', value: '1w', days: 7 },
    { label: '1M', value: '1m', days: 30 },
    { label: '3M', value: '3m', days: 90 },
    { label: '6M', value: '6m', days: 180 },
    { label: '1Y', value: '1y', days: 365 },
    { label: 'ALL', value: 'all', days: 0 },
];

export function EquityCurve({ data, className, height = 300, showDrawdown = true }: EquityCurveProps) {
    const [selectedTimeframe, setSelectedTimeframe] = useState('3m');
    const [showDeposits, setShowDeposits] = useState(false);

    const filteredData = useMemo(() => {
        if (!data.length) return [];

        const selectedFrame = timeframes.find(tf => tf.value === selectedTimeframe);
        if (!selectedFrame || selectedFrame.value === 'all') return data;

        const now = new Date();
        const cutoffTime = new Date(now.getTime() - selectedFrame.days * 24 * 60 * 60 * 1000);

        return data
            .filter(point => new Date(point.timestamp) >= cutoffTime)
            .map((point) => ({
                ...point,
                date: new Date(point.timestamp).toLocaleDateString(),
                time: new Date(point.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                equityFormatted: point.equity.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                }),
                drawdownFormatted: Math.abs(point.drawdown).toFixed(2),
            }));
    }, [data, selectedTimeframe]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-bg-2 border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-text-hi font-medium">{data.date}</p>
                    <p className="text-text-low text-sm">{data.time}</p>
                    <div className="mt-2 space-y-1">
                        <p className="font-semibold text-text-hi">
                            ${data.equityFormatted}
                        </p>
                        <p className="text-sm text-text-low">
                            Trades: {data.trades}
                        </p>
                        {data.drawdown < 0 && (
                            <p className="text-sm text-red-600">
                                Drawdown: {data.drawdownFormatted}%
                            </p>
                        )}
                        {showDeposits && (
                            <>
                                {data.deposits > 0 && (
                                    <p className="text-sm text-green-600">
                                        Deposit: +${data.deposits.toFixed(2)}
                                    </p>
                                )}
                                {data.withdrawals > 0 && (
                                    <p className="text-sm text-red-600">
                                        Withdrawal: -${data.withdrawals.toFixed(2)}
                                    </p>
                                )}
                            </>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    const calculateMetrics = () => {
        if (filteredData.length === 0) return null;

        const firstEquity = filteredData[0].equity;
        const lastEquity = filteredData[filteredData.length - 1].equity;
        const totalReturn = ((lastEquity - firstEquity) / firstEquity) * 100;

        const maxEquity = Math.max(...filteredData.map(d => d.equity));
        const maxDrawdown = Math.min(...filteredData.map(d => d.drawdown));

        const volatility = calculateVolatility(filteredData.map(d => d.equity));

        return {
            totalReturn,
            maxDrawdown,
            volatility,
            currentEquity: lastEquity,
            peakEquity: maxEquity,
        };
    };

    const calculateVolatility = (values: number[]): number => {
        if (values.length < 2) return 0;

        const returns = [];
        for (let i = 1; i < values.length; i++) {
            returns.push((values[i] - values[i - 1]) / values[i - 1]);
        }

        const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
        const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

        return Math.sqrt(variance) * 100; // Convert to percentage
    };

    const metrics = calculateMetrics();

    return (
        <Card className={cn("p-6", className)}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-hi">Equity Curve</h3>
                    <p className="text-sm text-text-low">
                        Portfolio value and performance over time
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex border border-border rounded-lg p-1">
                        {timeframes.map((timeframe) => (
                            <Button
                                key={timeframe.value}
                                variant={selectedTimeframe === timeframe.value ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setSelectedTimeframe(timeframe.value)}
                                className="h-8 px-3"
                            >
                                {timeframe.label}
                            </Button>
                        ))}
                    </div>

                    <Button
                        variant={showDeposits ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowDeposits(!showDeposits)}
                        className="h-8 px-3"
                    >
                        {showDeposits ? 'Hide' : 'Show'} Flows
                    </Button>
                </div>
            </div>

            {filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-text-low">
                    <p>No data available for selected timeframe</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <ComposedChart data={filteredData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                        <XAxis
                            dataKey="date"
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />

                        {/* Equity Line */}
                        <Line
                            type="monotone"
                            dataKey="equity"
                            stroke="hsl(var(--primary))"
                            strokeWidth={3}
                            dot={false}
                            activeDot={{
                                r: 6,
                                fill: "hsl(var(--primary))",
                                stroke: "hsl(var(--background))",
                                strokeWidth: 2,
                            }}
                        />

                        {/* Drawdown Area */}
                        {showDrawdown && (
                            <Area
                                type="monotone"
                                dataKey="drawdown"
                                stroke="hsl(var(--destructive))"
                                strokeWidth={1}
                                fill="hsl(var(--destructive))"
                                fillOpacity={0.1}
                                dot={false}
                            />
                        )}

                        {/* Reference line for peak equity */}
                        {metrics && (
                            <ReferenceLine
                                y={metrics.peakEquity}
                                stroke="hsl(var(--muted-foreground))"
                                strokeDasharray="3 3"
                                strokeOpacity={0.5}
                            />
                        )}
                    </ComposedChart>
                </ResponsiveContainer>
            )}

            {/* Performance Metrics */}
            {metrics && (
                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                        <p className="text-sm text-text-low">Total Return</p>
                        <p className={cn(
                            "text-lg font-semibold",
                            metrics.totalReturn >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {metrics.totalReturn >= 0 ? '+' : ''}{metrics.totalReturn.toFixed(2)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-text-low">Current Value</p>
                        <p className="text-lg font-semibold text-text-hi">
                            ${metrics.currentEquity.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-text-low">Peak Value</p>
                        <p className="text-lg font-semibold text-text-hi">
                            ${metrics.peakEquity.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            })}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-text-low">Max Drawdown</p>
                        <p className="text-lg font-semibold text-red-600">
                            {metrics.maxDrawdown.toFixed(2)}%
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-text-low">Volatility</p>
                        <p className="text-lg font-semibold text-text-hi">
                            {metrics.volatility.toFixed(2)}%
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
}
