import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DocumentStatus } from "@/types";

export function StatusBadge({ status }: { status: DocumentStatus }) {
    const draft = status === "DRAFT";
    return (
        <Badge
            variant="outline"
            className={cn(
                "border-transparent",
                draft ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            )}
        >
            {draft ? "Draft" : "Finalized"}
        </Badge>
    );
}
