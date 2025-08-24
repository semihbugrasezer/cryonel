import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatBadgeProps {
    variant?: "default" | "secondary" | "destructive" | "outline";
    children: React.ReactNode;
    className?: string;
}

export function StatBadge({ variant = "default", children, className }: StatBadgeProps) {
    return (
        <Badge
            variant={variant}
            className={cn("font-mono text-xs", className)}
        >
            {children}
        </Badge>
    );
}

export function StatusBadge({
    status,
    className
}: {
    status: "online" | "offline" | "warning" | "error";
    className?: string;
}) {
    const variants = {
        online: "bg-green-100 text-green-800 hover:bg-green-100",
        offline: "bg-gray-100 text-gray-800 hover:bg-gray-100",
        warning: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
        error: "bg-red-100 text-red-800 hover:bg-red-100"
    };

    return (
        <Badge
            variant="secondary"
            className={cn(variants[status], className)}
        >
            {status}
        </Badge>
    );
}
