import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FormField {
    name: string;
    label: string;
    type: string;
    placeholder?: string;
    required?: boolean;
    defaultValue?: string;
    options?: { value: string; label: string }[];
}

interface FormDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    title: string;
    description?: string;
    children?: React.ReactNode;
    fields?: FormField[];
    onSubmit: () => void;
    onCancel?: () => void;
    submitText?: string;
    cancelText?: string;
    loading?: boolean;
    disabled?: boolean;
    className?: string;
}

export function FormDialog({
    trigger,
    open: controlledOpen,
    onOpenChange,
    title,
    description,
    children,
    fields,
    onSubmit,
    onCancel,
    submitText = "Save",
    cancelText = "Cancel",
    loading = false,
    disabled = false,
    className
}: FormDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;

    const handleOpenChange = (newOpen: boolean) => {
        if (isControlled) {
            onOpenChange?.(newOpen);
        } else {
            setInternalOpen(newOpen);
        }
    };

    const handleSubmit = () => {
        onSubmit();
        handleOpenChange(false);
    };

    const handleCancel = () => {
        onCancel?.();
        handleOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            {trigger && (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            )}
            <DialogContent className={cn("sm:max-w-[425px]", className)}>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                <div className="py-4">
                    {children}
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={disabled || loading}
                    >
                        {loading ? "Saving..." : submitText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

interface ConfirmDialogProps {
    trigger: React.ReactNode;
    title: string;
    description: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: "default" | "destructive";
    loading?: boolean;
}

export function ConfirmDialog({
    trigger,
    title,
    description,
    onConfirm,
    confirmText = "Confirm",
    cancelText = "Cancel",
    variant = "default",
    loading = false
}: ConfirmDialogProps) {
    const [open, setOpen] = useState(false);

    const handleConfirm = () => {
        onConfirm();
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={loading}
                    >
                        {cancelText}
                    </Button>
                    <Button
                        type="button"
                        variant={variant}
                        onClick={handleConfirm}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
