import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CopyToClipboard } from "./CopyToClipboard";
import { cn } from "@/lib/utils";

interface QRCodeProps {
    data: string;
    title?: string;
    description?: string;
    size?: number;
    className?: string;
}

export function QRCode({
    data,
    title = "QR Code",
    description,
    size = 200,
    className
}: QRCodeProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const generateQR = async () => {
            try {
                // Simple QR code generation using a basic algorithm
                // In production, you'd want to use a proper QR library like qrcode
                const canvas = canvasRef.current;
                if (!canvas) return;

                const ctx = canvas.getContext("2d");
                if (!ctx) return;

                // Clear canvas
                ctx.clearRect(0, 0, size, size);

                // Draw background
                ctx.fillStyle = "#ffffff";
                ctx.fillRect(0, 0, size, size);

                // Simple placeholder QR pattern (replace with actual QR generation)
                ctx.fillStyle = "#000000";
                const cellSize = size / 25;

                // Draw a simple pattern as placeholder
                for (let i = 0; i < 25; i++) {
                    for (let j = 0; j < 25; j++) {
                        if ((i + j) % 3 === 0 || (i === 0 || i === 24 || j === 0 || j === 24)) {
                            ctx.fillRect(i * cellSize, j * cellSize, cellSize, cellSize);
                        }
                    }
                }
            } catch (error) {
                console.error("Failed to generate QR code:", error);
            }
        };

        generateQR();
    }, [data, size]);

    return (
        <Card className={cn("w-fit", className)}>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </CardHeader>
            <CardContent className="flex flex-col items-center space-y-4">
                <canvas
                    ref={canvasRef}
                    width={size}
                    height={size}
                    className="border border-border rounded-lg"
                />
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono break-all max-w-[200px]">
                        {data}
                    </span>
                    <CopyToClipboard text={data} variant="icon" />
                </div>
            </CardContent>
        </Card>
    );
}

interface QRCodeModalProps {
    data: string;
    title?: string;
    description?: string;
    isOpen: boolean;
    onClose: () => void;
}

export function QRCodeModal({
    data,
    title = "Scan QR Code",
    description,
    isOpen,
    onClose
}: QRCodeModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 max-w-sm w-full mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <Button variant="ghost" size="sm" onClick={onClose}>
                        ✕
                    </Button>
                </div>
                {description && (
                    <p className="text-sm text-muted-foreground mb-4">{description}</p>
                )}
                <QRCode data={data} size={250} />
                <div className="mt-4 flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
