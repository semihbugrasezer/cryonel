import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QRCode } from "@/components/common/QRCode";
import { CopyToClipboard } from "@/components/common/CopyToClipboard";
import { cn } from "@/lib/utils";

interface WalletInfo {
    address: string;
    chain: string;
    balance: string;
    isConnected: boolean;
}

interface WalletConnectProps {
    onConnect: (walletType: string, data?: any) => Promise<void>;
    onDisconnect: () => Promise<void>;
    walletInfo?: WalletInfo;
    className?: string;
}

const SUPPORTED_CHAINS = [
    { id: "solana", name: "Solana", icon: "◎", description: "Mainnet & Devnet" },
    { id: "ethereum", name: "Ethereum", icon: "Ξ", description: "Mainnet & Testnets" },
    { id: "polygon", name: "Polygon", icon: "MATIC", description: "Mainnet & Mumbai" },
];

export function WalletConnect({
    onConnect,
    onDisconnect,
    walletInfo,
    className
}: WalletConnectProps) {
    const [selectedChain, setSelectedChain] = useState("solana");
    const [privateKey, setPrivateKey] = useState("");
    const [showQR, setShowQR] = useState(false);
    const [connecting, setConnecting] = useState(false);

    const handleConnect = async (walletType: string) => {
        setConnecting(true);
        try {
            if (walletType === "private-key") {
                if (!privateKey.trim()) {
                    alert("Please enter a private key");
                    return;
                }
                await onConnect("private-key", { privateKey, chain: selectedChain });
            } else {
                await onConnect(walletType, { chain: selectedChain });
            }
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = async () => {
        try {
            await onDisconnect();
        } catch (error) {
            console.error("Failed to disconnect wallet:", error);
        }
    };

    const selectedChainInfo = SUPPORTED_CHAINS.find(chain => chain.id === selectedChain);

    if (walletInfo?.isConnected) {
        return (
            <Card className={cn("w-full max-w-2xl", className)}>
                <CardHeader>
                    <CardTitle>Connected Wallet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span className="text-lg">{selectedChainInfo?.icon}</span>
                            </div>
                            <div>
                                <div className="font-medium">{selectedChainInfo?.name}</div>
                                <div className="text-sm text-muted-foreground">
                                    {walletInfo.address.slice(0, 6)}...{walletInfo.address.slice(-4)}
                                </div>
                            </div>
                        </div>
                        <Badge variant="outline" className="text-green-600 border-green-600">
                            Connected
                        </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-muted-foreground">Balance:</span>
                            <div className="font-medium">{walletInfo.balance}</div>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Chain:</span>
                            <div className="font-medium">{walletInfo.chain}</div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <CopyToClipboard
                            text={walletInfo.address}
                            variant="badge"
                            label="Copy Address"
                        />
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowQR(true)}
                        >
                            Show QR
                        </Button>
                        <div className="flex-1" />
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={handleDisconnect}
                        >
                            Disconnect
                        </Button>
                    </div>

                    {showQR && (
                        <QRCode
                            data={walletInfo.address}
                            title="Wallet Address"
                            description="Scan to get the wallet address"
                            size={200}
                        />
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className={cn("w-full max-w-2xl", className)}>
            <CardHeader>
                <CardTitle>Connect Wallet</CardTitle>
                <div className="text-sm text-muted-foreground">
                    Connect your Web3 wallet to enable DEX trading and portfolio tracking
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Chain Selection */}
                <div className="space-y-3">
                    <Label>Select Blockchain</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {SUPPORTED_CHAINS.map((chain) => (
                            <button
                                key={chain.id}
                                onClick={() => setSelectedChain(chain.id)}
                                className={cn(
                                    "p-3 border rounded-lg text-left transition-colors",
                                    selectedChain === chain.id
                                        ? "border-primary bg-primary/5"
                                        : "border-border hover:border-primary/50"
                                )}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-lg">{chain.icon}</span>
                                    <span className="font-medium">{chain.name}</span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {chain.description}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Connection Methods */}
                <div className="space-y-4">
                    <Label>Connection Method</Label>

                    {/* Browser Wallet */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-medium">Browser Wallet</div>
                                <div className="text-sm text-muted-foreground">
                                    Connect using MetaMask, Phantom, or other browser extensions
                                </div>
                            </div>
                            <Button
                                onClick={() => handleConnect("browser-wallet")}
                                disabled={connecting}
                                size="sm"
                            >
                                {connecting ? "Connecting..." : "Connect"}
                            </Button>
                        </div>
                    </div>

                    {/* WalletConnect */}
                    <div className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <div className="font-medium">WalletConnect</div>
                                <div className="text-sm text-muted-foreground">
                                    Scan QR code with mobile wallet app
                                </div>
                            </div>
                            <Button
                                onClick={() => handleConnect("walletconnect")}
                                disabled={connecting}
                                size="sm"
                                variant="outline"
                            >
                                {connecting ? "Connecting..." : "Connect"}
                            </Button>
                        </div>
                    </div>

                    {/* Private Key */}
                    <div className="p-4 border rounded-lg">
                        <div className="space-y-3">
                            <div>
                                <div className="font-medium">Private Key</div>
                                <div className="text-sm text-muted-foreground">
                                    Import wallet using private key (not recommended for mainnet)
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="privateKey" className="text-xs">
                                    Private Key (Hex format)
                                </Label>
                                <Input
                                    id="privateKey"
                                    type="password"
                                    placeholder="Enter private key"
                                    value={privateKey}
                                    onChange={(e) => setPrivateKey(e.target.value)}
                                    className="font-mono text-sm"
                                />
                            </div>
                            <Button
                                onClick={() => handleConnect("private-key")}
                                disabled={connecting || !privateKey.trim()}
                                size="sm"
                                variant="outline"
                            >
                                {connecting ? "Connecting..." : "Import"}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Security Notice */}
                <Alert className="border-orange-200 bg-orange-50">
                    <AlertDescription className="text-orange-800">
                        <strong>Security Notice:</strong> Never share your private keys.
                        Browser wallets are recommended for better security.
                        CRYONEL never stores your private keys.
                    </AlertDescription>
                </Alert>

                {/* Selected Chain Info */}
                {selectedChainInfo && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-lg">{selectedChainInfo.icon}</span>
                            <span className="font-medium">{selectedChainInfo.name}</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                            {selectedChainInfo.description}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
