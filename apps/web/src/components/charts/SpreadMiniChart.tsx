import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SpreadData {
    timestamp: string;
    spread: number;
    volume: number;
}

interface SpreadMiniChartProps {
    data: SpreadData[];
    currentSpread: number;
    symbol: string;
    className?: string;
}

export function SpreadMiniChart({
    data,
    currentSpread,
    symbol,
    className
}: SpreadMiniChartProps) {
    const [showChart, setShowChart] = useState(false);

    const formatSpread = (value: number) => `${value.toFixed(4)}%`;

    const getSpreadColor = (spread: number) => {
        if (spread > 0.5) return "text-green-600";
        if (spread > 0.2) return "text-yellow-600";
        if (spread > 0.1) return "text-orange-600";
        return "text-red-600";
    };

    const getSpreadStatus = (spread: number) => {
        if (spread > 0.5) return "High";
        if (spread > 0.2) return "Medium";
        if (spread > 0.1) return "Low";
        return "Very Low";
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-background border border-border rounded-lg p-2 shadow-lg text-xs">
                    <p className="font-medium">{new Date(label).toLocaleTimeString()}</p>
                    <p className={cn(getSpreadColor(payload[0].value))}>
                        Spread: {formatSpread(payload[0].value)}
                    </p>
                    <p className="text-muted-foreground">
                        Volume: {payload[0].payload.volume.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };

    const recentData = data.slice(-20); // Show last 20 data points
    const avgSpread = recentData.length > 0
        ? recentData.reduce((sum, item) => sum + item.spread, 0) / recentData.length
        : 0;

    return (
        <div className={cn("border rounded-lg p-3", className)}>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{symbol}</span>
                    <Badge
                        variant="outline"
                        className={cn("text-xs", getSpreadColor(currentSpread))}
                    >
                        {getSpreadStatus(currentSpread)}
                    </Badge>
                </div>
                <button
                    onClick={() => setShowChart(!showChart)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                    {showChart ? "Hide" : "Show"} Chart
                </button>
            </div>

            <div className="flex items-center justify-between mb-3">
                <div>
                    <div className={cn("text-lg font-bold", getSpreadColor(currentSpread))}>
                        {formatSpread(currentSpread)}
                    </div>
                    <div className="text-xs text-muted-foreground">Current Spread</div>
                </div>
                <div className="text-right">
                    <div className="text-sm font-medium">
                        {formatSpread(avgSpread)}
                    </div>
                    <div className="text-xs text-muted-foreground">Avg (24h)</div>
                </div>
            </div>

            {showChart && (
                <div className="h-24 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={recentData}>
                            <XAxis
                                dataKey="timestamp"
                                hide
                                tickFormatter={() => ""}
                            />
                            <YAxis
                                hide
                                domain={['dataMin - 0.001', 'dataMax + 0.001']}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="spread"
                                stroke="hsl(var(--primary))"
                                strokeWidth={1.5}
                                dot={false}
                                connectNulls
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="text-muted-foreground">
                    Min: <span className="font-mono">{formatSpread(Math.min(...recentData.map(d => d.spread)))}</span>
                </div>
                <div className="text-muted-foreground text-right">
                    Max: <span className="font-mono">{formatSpread(Math.max(...recentData.map(d => d.spread)))}</span>
                </div>
            </div>
        </div>
    );
}

interface SpreadGridProps {
    spreads: Array<{
        symbol: string;
        currentSpread: number;
        data: SpreadData[];
    }>;
    className?: string;
}

export function SpreadGrid({ spreads, className }: SpreadGridProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4", className)}>
            {spreads.map(({ symbol, currentSpread, data }) => (
                <SpreadMiniChart
                    key={symbol}
                    symbol={symbol}
                    currentSpread={currentSpread}
                    data={data}
                />
            ))}
        </div>
    );
}
