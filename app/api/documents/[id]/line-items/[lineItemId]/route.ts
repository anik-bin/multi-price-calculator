import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOwnedDocument } from "@/lib/documents/access";
import { recalculateAndSaveDocument } from "@/lib/documents/recalculate";
import { updateLineItemSchema } from "@/lib/validation/lineItem.schema";
import { errorResponse, validationErrorResponse } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string; lineItemId: string }> };

async function loadDraftLineItem(userId: string, documentId: string, lineItemId: string) {
    const document = await getOwnedDocument(userId, documentId);
    if (!document) {
        return { error: errorResponse(404, "Document not found") } as const;
    }
    if (document.status !== "DRAFT") {
        return { error: errorResponse(403, "Cannot modify a line item on a finalized document") } as const;
    }

    const lineItem = await db.lineItem.findFirst({ where: { id: lineItemId, documentId } });
    if (!lineItem) {
        return { error: errorResponse(404, "Line item not found") } as const;
    }

    return { lineItem } as const;
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id: documentId, lineItemId } = await params;
    const loaded = await loadDraftLineItem(session.userId, documentId, lineItemId);
    if ("error" in loaded) {
        return loaded.error;
    }

    const body = await req.json().catch(() => null);
    const parsed = updateLineItemSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed.error);
    }

    try {
        const updated = await db.$transaction(async (tx) => {
            await tx.lineItem.update({ where: { id: lineItemId }, data: parsed.data });
            return recalculateAndSaveDocument(tx, documentId);
        });

        return NextResponse.json({ document: updated });
    } catch (err) {
        if (err instanceof Error) {
            return errorResponse(400, err.message);
        }
        throw err;
    }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id: documentId, lineItemId } = await params;
    const loaded = await loadDraftLineItem(session.userId, documentId, lineItemId);
    if ("error" in loaded) {
        return loaded.error;
    }

    const updated = await db.$transaction(async (tx) => {
        await tx.lineItem.delete({ where: { id: lineItemId } });
        return recalculateAndSaveDocument(tx, documentId);
    });

    return NextResponse.json({ document: updated });
}
