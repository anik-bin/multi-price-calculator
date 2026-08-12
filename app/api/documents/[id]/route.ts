import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOwnedDocument, getOwnedDocumentWithLineItems } from "@/lib/documents/access";
import { updateDocumentSchema } from "@/lib/validation/document.schema";
import { errorResponse, validationErrorResponse } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id } = await params;
    const document = await getOwnedDocumentWithLineItems(session.userId, id);
    if (!document) {
        return errorResponse(404, "Document not found");
    }

    return NextResponse.json({ document });
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id } = await params;
    const existing = await getOwnedDocument(session.userId, id);
    if (!existing) {
        return errorResponse(404, "Document not found");
    }
    if (existing.status !== "DRAFT") {
        return errorResponse(403, "Cannot edit a finalized document");
    }

    const body = await req.json().catch(() => null);
    const parsed = updateDocumentSchema.safeParse(body);
    if (!parsed.success) {
        return validationErrorResponse(parsed.error);
    }

    const document = await db.document.update({
        where: { id },
        data: parsed.data,
    });

    return NextResponse.json({ document });
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id } = await params;
    const existing = await getOwnedDocument(session.userId, id);
    if (!existing) {
        return errorResponse(404, "Document not found");
    }
    // finalized documents are a settled record — deleting one would let it
    // silently vanish from a report it was already counted in, so only
    // drafts can be removed
    if (existing.status !== "DRAFT") {
        return errorResponse(403, "Cannot delete a finalized document");
    }

    await db.document.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
