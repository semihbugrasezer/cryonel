import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    icon?: React.ReactNode;
    className?: string;
}

export function EmptyState({ title, description, action, icon, className }: EmptyStateProps) {
    return (
        <Card className={cn("border-dashed", className)}>
            <CardContent className="flex flex-col items-center justify-center py-12">
                {icon && (
                    <div className="mb-4 text-muted-foreground">
                        {icon}
                    </div>
                )}
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                {description && (
                    <p className="text-muted-foreground text-center mb-4 max-w-sm">
                        {description}
                    </p>
                )}
                {action && (
                    <Button onClick={action.onClick}>
                        {action.label}
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface ErrorStateProps {
    title?: string;
    message?: string;
    retry?: () => void;
    className?: string;
}

export function ErrorState({
    title = "Something went wrong",
    message = "An error occurred while loading the data.",
    retry,
    className
}: ErrorStateProps) {
    return (
        <Card className={cn("border-red-200 bg-red-50", className)}>
            <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="mb-4 text-red-500">
                    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                </div>
                <h3 className="text-lg font-semibold text-red-800 mb-2">{title}</h3>
                <p className="text-red-600 text-center mb-4 max-w-sm">
                    {message}
                </p>
                {retry && (
                    <Button variant="outline" onClick={retry}>
                        Try Again
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface LoadingSkeletonProps {
    rows?: number;
    className?: string;
}

export function LoadingSkeleton({ rows = 5, className }: LoadingSkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {Array.from({ length: rows }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-muted rounded animate-pulse" />
                    <div className="space-y-2 flex-1">
                        <div className="h-4 bg-muted rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }} />
                        <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${Math.random() * 30 + 40}%` }} />
                    </div>
                </div>
            ))}
        </div>
    );
}

interface TableSkeletonProps {
    columns?: number;
    rows?: number;
    className?: string;
}

export function TableSkeleton({ columns = 5, rows = 5, className }: TableSkeletonProps) {
    return (
        <div className={cn("space-y-3", className)}>
            {/* Header */}
            <div className="flex space-x-4 pb-4 border-b">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={i} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${Math.random() * 60 + 80}px` }} />
                ))}
            </div>

            {/* Rows */}
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex space-x-4 py-3">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <div key={colIndex} className="h-4 bg-muted rounded animate-pulse" style={{ width: `${Math.random() * 80 + 60}px` }} />
                    ))}
                </div>
            ))}
        </div>
    );
}
