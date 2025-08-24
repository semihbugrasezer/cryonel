import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Common Components
import {
    KPICard,
    StatBadge,
    StatusBadge,
    LatencyPill,
    ConnectionStatus,
    DataTable,
    DetailsDrawer,
    DetailRow,
    DetailSection,
    TradeDetails,
    FormDialog,
    ConfirmDialog,
    EmptyState,
    ErrorState,
    LoadingSkeleton,
    TableSkeleton,
    CopyToClipboard,
    CopyableText,
    QRCode,
    CommandPalette,
    useCommandPalette,
} from "@/components/common";

// Chart Components
import {
    PnLChart,
    LatencyChart,
    SpreadMiniChart,
    SpreadGrid,
} from "@/components/charts";

// Form Components
import {
    APIKeyForm,
    WalletConnect,
    RiskLimitsForm,
    StrategyForm,
    AlertSettingsForm,
} from "@/components/forms";

// Mock Data
import {
    mockPnLData,
    mockLatencyData,
    mockSpreadData,
    mockTrades,
    mockStrategies,
    mockExchanges,
    mockWalletInfo,
} from "@/mocks/data";

export default function ComponentsDemoPage() {
    const [showQR, setShowQR] = useState(false);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const commandPalette = useCommandPalette();

    const handleAPIKeySubmit = async (data: any) => {
        console.log("API Key submitted:", data);
        alert("API Key form submitted successfully!");
    };

    const handleWalletConnect = async (type: string, data?: any) => {
        console.log("Wallet connect:", type, data);
        alert("Wallet connected successfully!");
    };

    const handleWalletDisconnect = async () => {
        console.log("Wallet disconnected");
        alert("Wallet disconnected successfully!");
    };

    const handleRiskLimitsSubmit = async (data: any) => {
        console.log("Risk limits submitted:", data);
        alert("Risk limits saved successfully!");
    };

    const handleStrategySubmit = async (data: any) => {
        console.log("Strategy submitted:", data);
        alert("Strategy created successfully!");
    };

    const handleAlertSettingsSubmit = async (data: any) => {
        console.log("Alert settings submitted:", data);
        alert("Alert settings saved successfully!");
    };

    const handleConfirmAction = () => {
        alert("Action confirmed!");
    };

    const tableColumns = [
        { key: "id", label: "ID", sortable: true },
        { key: "symbol", label: "Symbol", sortable: true },
        {
            key: "side", label: "Side", sortable: true, render: (value: string) => (
                <Badge variant={value === "buy" ? "default" : "secondary"}>
                    {value.toUpperCase()}
                </Badge>
            )
        },
        { key: "quantity", label: "Quantity", sortable: true },
        { key: "price", label: "Price", sortable: true, render: (value: number) => `$${value.toFixed(2)}` },
        {
            key: "status", label: "Status", sortable: true, render: (value: string) => (
                <StatusBadge status={value === "completed" ? "online" : value === "pending" ? "warning" : "error"} />
            )
        },
    ];

    const commandItems = [
        {
            id: "dashboard",
            title: "Go to Dashboard",
            description: "Navigate to the main dashboard",
            action: () => alert("Navigating to Dashboard"),
            category: "Navigation",
            shortcut: "⌘D",
        },
        {
            id: "trades",
            title: "View Trades",
            description: "Open the trades page",
            action: () => alert("Opening Trades"),
            category: "Navigation",
            shortcut: "⌘T",
        },
        {
            id: "settings",
            title: "Open Settings",
            description: "Access application settings",
            action: () => alert("Opening Settings"),
            category: "System",
            shortcut: "⌘,",
        },
    ];

    return (
        <div className="container mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold">CRYONEL Components Demo</h1>
                <p className="text-xl text-muted-foreground">
                    Showcase of all implemented UI components and forms
                </p>
                <div className="flex items-center justify-center gap-4">
                    <Button onClick={() => setShowCommandPalette(true)}>
                        Open Command Palette (⌘K)
                    </Button>
                    <Button variant="outline" onClick={() => setShowQR(true)}>
                        Show QR Code
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="common" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="common">Common</TabsTrigger>
                    <TabsTrigger value="charts">Charts</TabsTrigger>
                    <TabsTrigger value="forms">Forms</TabsTrigger>
                    <TabsTrigger value="data">Data</TabsTrigger>
                </TabsList>

                {/* Common Components Tab */}
                <TabsContent value="common" className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <KPICard
                            label="Total PnL"
                            value="$1,234.56"
                            trend="+12.5%"
                            trendDirection="up"
                        />
                        <KPICard
                            label="Total Trades"
                            value="156"
                            trend="+8.2%"
                            trendDirection="up"
                        />
                        <KPICard
                            label="Win Rate"
                            value="68.5%"
                            trend="+2.1%"
                            trendDirection="up"
                        />
                        <KPICard
                            label="Max Drawdown"
                            value="12.3%"
                            trend="-5.7%"
                            trendDirection="down"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Status Badges & Latency</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <StatusBadge status="online" />
                                    <StatusBadge status="offline" />
                                    <StatusBadge status="warning" />
                                    <StatusBadge status="error" />
                                </div>
                                <div className="flex items-center gap-4">
                                    <LatencyPill latency={45} />
                                    <LatencyPill latency={150} />
                                    <LatencyPill latency={500} />
                                    <LatencyPill latency={1200} />
                                </div>
                                <ConnectionStatus isConnected={true} latency={78} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Utility Components</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <CopyToClipboard text="Hello World" />
                                    <CopyToClipboard text="0x1234..." variant="badge" />
                                    <CopyToClipboard text="Copy me" variant="icon" />
                                </div>
                                <CopyableText text="0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6" />
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>State Management Components</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <EmptyState
                                title="No trades yet"
                                description="Start trading to see your first trade appear here"
                                action={{
                                    label: "Start Trading",
                                    onClick: () => alert("Starting trading..."),
                                }}
                            />
                            <Separator />
                            <ErrorState
                                title="Connection Failed"
                                message="Unable to connect to the trading server"
                                retry={() => alert("Retrying connection...")}
                            />
                            <Separator />
                            <LoadingSkeleton rows={3} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Charts Tab */}
                <TabsContent value="charts" className="space-y-8">
                    <PnLChart data={mockPnLData} />
                    <LatencyChart data={mockLatencyData} />
                    <SpreadGrid spreads={mockSpreadData} />
                </TabsContent>

                {/* Forms Tab */}
                <TabsContent value="forms" className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <APIKeyForm onSubmit={handleAPIKeySubmit} />
                        <WalletConnect
                            onConnect={handleWalletConnect}
                            onDisconnect={handleWalletDisconnect}
                            walletInfo={mockWalletInfo}
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <RiskLimitsForm onSubmit={handleRiskLimitsSubmit} />
                        <StrategyForm onSubmit={handleStrategySubmit} />
                    </div>

                    <AlertSettingsForm onSubmit={handleAlertSettingsSubmit} />
                </TabsContent>

                {/* Data Tab */}
                <TabsContent value="data" className="space-y-8">
                    <DataTable
                        data={mockTrades}
                        columns={tableColumns}
                        title="Recent Trades"
                        searchPlaceholder="Search trades..."
                        onRowClick={(trade) => alert(`Clicked trade: ${trade.id}`)}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Trade Details Example</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <DetailsDrawer
                                    trigger={<Button>View Trade Details</Button>}
                                    title="Trade Details"
                                    description="Detailed information about the selected trade"
                                >
                                    <TradeDetails trade={mockTrades[0]} />
                                </DetailsDrawer>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Form Dialog Example</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <FormDialog
                                    trigger={<Button>Open Form</Button>}
                                    title="Sample Form"
                                    description="This is a sample form dialog"
                                    onSubmit={() => alert("Form submitted!")}
                                >
                                    <div className="space-y-4">
                                        <p>This is the form content area.</p>
                                        <p>You can put any form elements here.</p>
                                    </div>
                                </FormDialog>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Confirm Dialog Example</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ConfirmDialog
                                trigger={<Button variant="destructive">Delete Strategy</Button>}
                                title="Delete Strategy"
                                description="Are you sure you want to delete this strategy? This action cannot be undone."
                                onConfirm={handleConfirmAction}
                                variant="destructive"
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* QR Code Modal */}
            {showQR && (
                <QRCode
                    data="https://cryonel.com"
                    title="CRYONEL Website"
                    description="Scan to visit our website"
                    size={300}
                />
            )}

            {/* Command Palette */}
            <CommandPalette
                isOpen={showCommandPalette}
                onClose={() => setShowCommandPalette(false)}
                items={commandItems}
            />
        </div>
    );
}
