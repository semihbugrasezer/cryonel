import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CopyToClipboardProps {
    text: string;
    label?: string;
    variant?: "button" | "badge" | "icon";
    size?: "sm" | "default" | "lg";
    className?: string;
}

export function CopyToClipboard({
    text,
    label = "Copy",
    variant = "button",
    size = "default",
    className
}: CopyToClipboardProps) {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    if (variant === "badge") {
        return (
            <Badge
                variant="secondary"
                className={cn(
                    "cursor-pointer hover:bg-muted-foreground/20 transition-colors",
                    className
                )}
                onClick={copyToClipboard}
            >
                {copied ? "Copied!" : label}
            </Badge>
        );
    }

    if (variant === "icon") {
        return (
            <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                className={cn("h-8 w-8 p-0", className)}
            >
                {copied ? (
                    <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                ) : (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                )}
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            size={size}
            onClick={copyToClipboard}
            className={cn("transition-all", className)}
        >
            {copied ? "Copied!" : label}
        </Button>
    );
}

interface CopyableTextProps {
    text: string;
    showCopyButton?: boolean;
    className?: string;
}

export function CopyableText({ text, showCopyButton = true, className }: CopyableTextProps) {
    return (
        <div className={cn("flex items-center gap-2", className)}>
            <span className="font-mono text-sm break-all">{text}</span>
            {showCopyButton && <CopyToClipboard text={text} variant="icon" />}
        </div>
    );
}
