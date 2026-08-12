import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOwnedDocument } from "@/lib/documents/access";
import { recalculateAndSaveDocument } from "@/lib/documents/recalculate";
import { createLineItemSchema } from "@/lib/validation/lineItem.schema";
import { errorResponse, validationErrorResponse } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id: documentId } = await params;
    const document = await getOwnedDocument(session.userId, documentId);
    if (!document) {
        return errorResponse(404, "Document not found");
    }
    if (document.status !== "DRAFT") {
        return errorResponse(403, "Cannot add a line item to a finalized document");
    }

    const body = await req.json().catch(() => null);
    const parsed = createLineItemSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed.error);
    }

    try {
        const updated = await db.$transaction(async (tx) => {
            await tx.lineItem.create({
                data: { ...parsed.data, documentId },
            });

            return recalculateAndSaveDocument(tx, documentId);
        });

        return NextResponse.json({ document: updated }, { status: 201 });
    } catch (err) {
        // calculateLineItem() is the last line of defense behind the zod schema above
        if (err instanceof Error) {
            return errorResponse(400, err.message);
        }
        throw err;
    }
}
