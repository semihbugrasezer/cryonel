import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LatencyPillProps {
    latency: number; // in milliseconds
    className?: string;
}

export function LatencyPill({ latency, className }: LatencyPillProps) {
    const getLatencyColor = (latency: number) => {
        if (latency < 100) return "bg-green-100 text-green-800 hover:bg-green-100";
        if (latency < 300) return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
        if (latency < 1000) return "bg-orange-100 text-orange-800 hover:bg-orange-100";
        return "bg-red-100 text-red-800 hover:bg-red-100";
    };

    const getLatencyLabel = (latency: number) => {
        if (latency < 100) return "Excellent";
        if (latency < 300) return "Good";
        if (latency < 1000) return "Fair";
        return "Poor";
    };

    return (
        <Badge
            variant="secondary"
            className={cn(
                "font-mono text-xs px-2 py-1",
                getLatencyColor(latency),
                className
            )}
        >
            {latency}ms
            <span className="ml-1 text-xs opacity-75">
                ({getLatencyLabel(latency)})
            </span>
        </Badge>
    );
}

export function ConnectionStatus({
    isConnected,
    latency,
    className
}: {
    isConnected: boolean;
    latency?: number;
    className?: string;
}) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <div className={cn(
                "w-2 h-2 rounded-full",
                isConnected ? "bg-green-500" : "bg-red-500"
            )} />
            <span className="text-sm text-muted-foreground">
                {isConnected ? "Connected" : "Disconnected"}
            </span>
            {isConnected && latency && (
                <LatencyPill latency={latency} />
            )}
        </div>
    );
}
