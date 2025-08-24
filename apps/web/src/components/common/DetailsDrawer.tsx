import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet";
// import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { cn } from "../../utils/cn";

interface DetailsDrawerProps {
    trigger: React.ReactNode;
    title: string;
    description?: string;
    children: React.ReactNode;
    side?: "left" | "right" | "top" | "bottom";
    className?: string;
}

export function DetailsDrawer({
    trigger,
    title,
    description,
    children,
    side = "right",
    className
}: DetailsDrawerProps) {
    const [open, setOpen] = useState(false);

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                {trigger}
            </SheetTrigger>
            <SheetContent side={side} className={cn("w-[400px] sm:w-[540px]", className)}>
                <SheetHeader>
                    <SheetTitle>{title}</SheetTitle>
                    {description && (
                        <SheetDescription>{description}</SheetDescription>
                    )}
                </SheetHeader>
                <div className="mt-6">
                    {children}
                </div>
            </SheetContent>
        </Sheet>
    );
}

interface DetailRowProps {
    label: string;
    value: React.ReactNode;
    className?: string;
}

export function DetailRow({ label, value, className }: DetailRowProps) {
    return (
        <div className={cn("flex items-center justify-between py-2", className)}>
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className="text-sm">{value}</span>
        </div>
    );
}

interface DetailSectionProps {
    title: string;
    children: React.ReactNode;
    className?: string;
}

export function DetailSection({ title, children, className }: DetailSectionProps) {
    return (
        <div className={cn("space-y-3", className)}>
            <h4 className="text-sm font-semibold">{title}</h4>
            <div className="space-y-2">
                {children}
            </div>
            <Separator />
        </div>
    );
}

interface TradeDetailsProps {
    trade: {
        id: string;
        symbol: string;
        side: "buy" | "sell";
        quantity: number;
        price: number;
        fees: number;
        timestamp: string;
        status: "pending" | "completed" | "failed";
        venue: string;
        txid?: string;
    };
}

export function TradeDetails({ trade }: TradeDetailsProps) {
    return (
        <div className="space-y-6">
            <DetailSection title="Trade Information">
                <DetailRow label="Trade ID" value={trade.id} />
                <DetailRow label="Symbol" value={trade.symbol} />
                <DetailRow
                    label="Side"
                    value={
                        <Badge variant={trade.side === "buy" ? "default" : "secondary"}>
                            {trade.side.toUpperCase()}
                        </Badge>
                    }
                />
                <DetailRow label="Quantity" value={trade.quantity} />
                <DetailRow label="Price" value={`$${trade.price.toFixed(2)}`} />
                <DetailRow label="Fees" value={`$${trade.fees.toFixed(4)}`} />
            </DetailSection>

            <DetailSection title="Execution Details">
                <DetailRow label="Venue" value={trade.venue} />
                <DetailRow label="Status" value={
                    <Badge
                        variant={
                            trade.status === "completed" ? "default" :
                                trade.status === "pending" ? "secondary" : "destructive"
                        }
                    >
                        {trade.status}
                    </Badge>
                } />
                <DetailRow label="Timestamp" value={new Date(trade.timestamp).toLocaleString()} />
                {trade.txid && (
                    <DetailRow label="Transaction ID" value={
                        <span className="font-mono text-xs break-all">{trade.txid}</span>
                    } />
                )}
            </DetailSection>
        </div>
    );
}
