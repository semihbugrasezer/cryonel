import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface CommandItem {
    id: string;
    title: string;
    description?: string;
    keywords?: string[];
    action: () => void;
    category: string;
    shortcut?: string;
}

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
    items: CommandItem[];
    placeholder?: string;
}

export function CommandPalette({
    isOpen,
    onClose,
    items,
    placeholder = "Search commands..."
}: CommandPaletteProps) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);

    const filteredItems = items.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.keywords?.some(keyword =>
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
        )
    );

    const groupedItems = filteredItems.reduce((acc, item) => {
        if (!acc[item.category]) {
            acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
    }, {} as Record<string, CommandItem[]>);

    useEffect(() => {
        setSelectedIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;

            switch (e.key) {
                case "ArrowDown":
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredItems.length - 1 ? prev + 1 : 0
                    );
                    break;
                case "ArrowUp":
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev > 0 ? prev - 1 : filteredItems.length - 1
                    );
                    break;
                case "Enter":
                    e.preventDefault();
                    if (filteredItems[selectedIndex]) {
                        filteredItems[selectedIndex].action();
                        onClose();
                    }
                    break;
                case "Escape":
                    e.preventDefault();
                    onClose();
                    break;
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, filteredItems, selectedIndex, onClose]);

    const handleItemClick = (item: CommandItem) => {
        item.action();
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
                <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                        <Input
                            placeholder={placeholder}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1"
                            autoFocus
                        />
                        <Badge variant="secondary" className="text-xs">
                            ⌘K
                        </Badge>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-4">
                        {Object.entries(groupedItems).map(([category, categoryItems]) => (
                            <div key={category}>
                                <h3 className="text-sm font-medium text-muted-foreground mb-2 px-2">
                                    {category}
                                </h3>
                                <div className="space-y-1">
                                    {categoryItems.map((item, index) => {
                                        const globalIndex = filteredItems.indexOf(item);
                                        const isSelected = globalIndex === selectedIndex;

                                        return (
                                            <Button
                                                key={item.id}
                                                variant="ghost"
                                                className={cn(
                                                    "w-full justify-start h-auto p-3",
                                                    isSelected && "bg-accent"
                                                )}
                                                onClick={() => handleItemClick(item)}
                                            >
                                                <div className="flex flex-col items-start text-left flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium">{item.title}</span>
                                                        {item.shortcut && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.shortcut}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    {item.description && (
                                                        <span className="text-sm text-muted-foreground">
                                                            {item.description}
                                                        </span>
                                                    )}
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}

                        {filteredItems.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground">
                                No commands found
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

// Hook for managing command palette state
export function useCommandPalette() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen(true);
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    return {
        isOpen,
        open: () => setIsOpen(true),
        close: () => setIsOpen(false),
        toggle: () => setIsOpen(prev => !prev)
    };
}
