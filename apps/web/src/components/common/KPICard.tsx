import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
    label: string;
    value: string | number;
    icon?: React.ReactNode;
    trend?: string;
    trendDirection?: "up" | "down";
    className?: string;
}

export function KPICard({ label, value, icon, trend, trendDirection, className }: KPICardProps) {
    return (
        <Card className={cn("", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    {icon}
                    {label}
                </CardTitle>
                {trend && (
                    <div className={cn(
                        "text-xs font-medium",
                        trendDirection === "up" ? "text-green-600" : "text-red-600"
                    )}>
                        {trend}
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
            </CardContent>
        </Card>
    );
}
