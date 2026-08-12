import { Badge } from "@/components/ui/badge";
import type { DocumentStatus } from "@/types";

export function StatusBadge({ status }: { status: DocumentStatus }) {
    return (
        <Badge variant={status === "DRAFT" ? "secondary" : "default"}>
            {status === "DRAFT" ? "Draft" : "Finalized"}
        </Badge>
    );
}
