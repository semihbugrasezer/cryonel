// apps/web/src/components/charts/PnLChart.tsx
import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { cn } from '../../utils/cn';

interface PnLDataPoint {
    timestamp: string;
    pnl: number;
    cumulative: number;
    trades: number;
    displayValue?: string;
}

interface PnLChartProps {
    data: PnLDataPoint[];
    className?: string;
    height?: number;
    showArea?: boolean;
}

const timeframes = [
    { label: '1D', value: '1d', hours: 24 },
    { label: '7D', value: '7d', hours: 168 },
    { label: '30D', value: '30d', hours: 720 },
    { label: '1Y', value: '1y', hours: 8760 },
];

export function PnLChart({ data, className, height = 300, showArea = true }: PnLChartProps) {
    const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
    const [showCumulative, setShowCumulative] = useState(true);

    const filteredData = useMemo(() => {
        if (!data.length) return [];

        const now = new Date();
        const selectedFrame = timeframes.find(tf => tf.value === selectedTimeframe);
        if (!selectedFrame) return data;

        const cutoffTime = new Date(now.getTime() - selectedFrame.hours * 60 * 60 * 1000);

        return data
            .filter(point => new Date(point.timestamp) >= cutoffTime)
            .map((point) => ({
                ...point,
                date: new Date(point.timestamp).toLocaleDateString(),
                time: new Date(point.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                displayValue: showCumulative ? point.cumulative : point.pnl,
            }));
    }, [data, selectedTimeframe, showCumulative]);

    const formatValue = (value: number) => {
        if (value >= 0) {
            return `+$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return `-$${Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-bg-2 border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-text-hi font-medium">{data.date}</p>
                    <p className="text-text-low text-sm">{data.time}</p>
                    <div className="mt-2 space-y-1">
                        <p className={cn(
                            "font-semibold",
                            data.displayValue >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {formatValue(data.displayValue)}
                        </p>
                        <p className="text-text-low text-sm">
                            Trades: {data.trades}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const ChartComponent = showArea ? AreaChart : LineChart;

    return (
        <Card className={cn("p-6", className)}>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-semibold text-text-hi">Profit & Loss</h3>
                    <p className="text-sm text-text-low">
                        {showCumulative ? 'Cumulative' : 'Periodic'} performance over time
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
                        variant={showCumulative ? "default" : "outline"}
                        size="sm"
                        onClick={() => setShowCumulative(!showCumulative)}
                        className="h-8 px-3"
                    >
                        {showCumulative ? 'Cumulative' : 'Periodic'}
                    </Button>
                </div>
            </div>

            {filteredData.length === 0 ? (
                <div className="flex items-center justify-center h-64 text-text-low">
                    <p>No data available for selected timeframe</p>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height={height}>
                    <ChartComponent data={filteredData}>
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

                        {showArea ? (
                            <Area
                                type="monotone"
                                dataKey="displayValue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                fill="hsl(var(--primary))"
                                fillOpacity={0.1}
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: "hsl(var(--primary))",
                                    stroke: "hsl(var(--background))",
                                    strokeWidth: 2,
                                }}
                            />
                        ) : (
                            <Line
                                type="monotone"
                                dataKey="displayValue"
                                stroke="hsl(var(--primary))"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{
                                    r: 4,
                                    fill: "hsl(var(--primary))",
                                    stroke: "hsl(var(--background))",
                                    strokeWidth: 2,
                                }}
                            />
                        )}
                    </ChartComponent>
                </ResponsiveContainer>
            )}

            {/* Summary Stats */}
            {filteredData.length > 0 && (
                <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t border-border">
                    <div className="text-center">
                        <p className="text-sm text-text-low">Total PnL</p>
                        <p className={cn(
                            "text-lg font-semibold",
                            Number(filteredData[filteredData.length - 1]?.displayValue || 0) >= 0
                                ? "text-green-600"
                                : "text-red-600"
                        )}>
                            {formatValue(Number(filteredData[filteredData.length - 1]?.displayValue || 0))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-text-low">Best Day</p>
                        <p className="text-lg font-semibold text-green-600">
                            {formatValue(Math.max(...filteredData.map(d => d.displayValue)))}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-sm text-text-low">Worst Day</p>
                        <p className="text-lg font-semibold text-red-600">
                            {formatValue(Math.min(...filteredData.map(d => d.displayValue)))}
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
}
