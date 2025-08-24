import { useState } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LatencyData {
    timestamp: string;
    venue: string;
    latency: number;
    status: "success" | "error" | "timeout";
}

interface LatencyChartProps {
    data: LatencyData[];
    title?: string;
    className?: string;
}

export function LatencyChart({ data, title = "Latency Performance", className }: LatencyChartProps) {
    const [chartType, setChartType] = useState<"line" | "bar">("line");
    const [selectedVenue, setSelectedVenue] = useState<string>("all");

    const venues = Array.from(new Set(data.map(item => item.venue)));
    const filteredData = selectedVenue === "all"
        ? data
        : data.filter(item => item.venue === selectedVenue);

    const formatTimestamp = (timestamp: string) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatLatency = (value: number) => `${value}ms`;

    const getLatencyColor = (latency: number) => {
        if (latency < 100) return "text-green-600";
        if (latency < 300) return "text-yellow-600";
        if (latency < 1000) return "text-orange-600";
        return "text-red-600";
    };

    const getLatencyStatus = (latency: number) => {
        if (latency < 100) return "Excellent";
        if (latency < 300) return "Good";
        if (latency < 1000) return "Fair";
        return "Poor";
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
                    <p className="text-sm font-medium">{formatTimestamp(label)}</p>
                    <p className="text-sm">
                        Venue: <span className="font-medium">{item.venue}</span>
                    </p>
                    <p className={cn("text-sm", getLatencyColor(item.latency))}>
                        Latency: {formatLatency(item.latency)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                        Status: {getLatencyStatus(item.latency)}
                    </p>
                </div>
            );
        }
        return null;
    };

    const averageLatency = filteredData.length > 0
        ? filteredData.reduce((sum, item) => sum + item.latency, 0) / filteredData.length
        : 0;

    const latencyStats = venues.map(venue => {
        const venueData = data.filter(item => item.venue === venue);
        const avgLatency = venueData.length > 0
            ? venueData.reduce((sum, item) => sum + item.latency, 0) / venueData.length
            : 0;
        const errorCount = venueData.filter(item => item.status === "error").length;
        const timeoutCount = venueData.filter(item => item.status === "timeout").length;

        return {
            venue,
            avgLatency: Math.round(avgLatency),
            errorCount,
            timeoutCount,
            totalRequests: venueData.length
        };
    });

    return (
        <Card className={className}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>{title}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={cn(
                                "text-2xl font-bold",
                                getLatencyColor(averageLatency)
                            )}>
                                {Math.round(averageLatency)}ms
                            </span>
                            <span className="text-sm text-muted-foreground">
                                Average Latency
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={selectedVenue} onValueChange={setSelectedVenue}>
                            <SelectTrigger className="w-32">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Venues</SelectItem>
                                {venues.map(venue => (
                                    <SelectItem key={venue} value={venue}>{venue}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <div className="flex border rounded-md">
                            <button
                                className={cn(
                                    "px-3 py-1 text-sm transition-colors",
                                    chartType === "line"
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                )}
                                onClick={() => setChartType("line")}
                            >
                                Line
                            </button>
                            <button
                                className={cn(
                                    "px-3 py-1 text-sm transition-colors",
                                    chartType === "bar"
                                        ? "bg-primary text-primary-foreground"
                                        : "hover:bg-muted"
                                )}
                                onClick={() => setChartType("bar")}
                            >
                                Bar
                            </button>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        {chartType === "line" ? (
                            <LineChart data={filteredData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="timestamp"
                                    tickFormatter={formatTimestamp}
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickFormatter={formatLatency}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="latency"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={false}
                                />
                            </LineChart>
                        ) : (
                            <BarChart data={latencyStats}>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="venue"
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="hsl(var(--muted-foreground))"
                                    fontSize={12}
                                    tickFormatter={formatLatency}
                                />
                                <Tooltip />
                                <Bar
                                    dataKey="avgLatency"
                                    fill="hsl(var(--primary))"
                                    radius={[4, 4, 0, 0]}
                                />
                            </BarChart>
                        )}
                    </ResponsiveContainer>
                </div>

                {/* Venue Stats */}
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {latencyStats.map(stat => (
                        <div key={stat.venue} className="p-3 border rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{stat.venue}</span>
                                <Badge variant="outline" className="text-xs">
                                    {stat.totalRequests} req
                                </Badge>
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Avg Latency:</span>
                                    <span className={cn("font-mono", getLatencyColor(stat.avgLatency))}>
                                        {stat.avgLatency}ms
                                    </span>
                                </div>
                                {stat.errorCount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Errors:</span>
                                        <Badge variant="destructive" className="text-xs">
                                            {stat.errorCount}
                                        </Badge>
                                    </div>
                                )}
                                {stat.timeoutCount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Timeouts:</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {stat.timeoutCount}
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
