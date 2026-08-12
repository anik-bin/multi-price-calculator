import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOwnedDocumentWithLineItems } from "@/lib/documents/access";
import { errorResponse } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id } = await params;
    const document = await getOwnedDocumentWithLineItems(session.userId, id);
    if (!document) {
        return errorResponse(404, "Document not found");
    }
    if (document.status !== "DRAFT") {
        return errorResponse(403, "Document is already finalized");
    }

    // belt-and-suspenders check on top of the create/edit validation — a line
    // item shouldn't be able to get into this state, but finalize is the last
    // gate before the document becomes immutable, so it's worth re-checking
    const invalidLine = document.lineItems.find((line) => line.quantity <= 0 || line.unitPriceCents < 0);
    if (invalidLine) {
        return errorResponse(422, `Cannot finalize: line item "${invalidLine.description}" has an invalid quantity or price`);
    }

    const updated = await db.document.update({
        where: { id },
        data: { status: "FINALIZED" },
        include: { lineItems: { orderBy: { createdAt: "asc" } } },
    });

    return NextResponse.json({ document: updated });
}
