import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth/session";
import { getOwnedDocumentWithLineItems } from "@/lib/documents/access";
import { recalculateAndSaveDocument } from "@/lib/documents/recalculate";
import { errorResponse } from "@/lib/errors";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: RouteContext) {
    const session = getSessionFromRequest(req);
    if (!session) {
        return errorResponse(401, "Authentication required");
    }

    const { id } = await params;
    const source = await getOwnedDocumentWithLineItems(session.userId, id);
    if (!source) {
        return errorResponse(404, "Document not found");
    }
    // duplicating a draft is just editing it — this exists to let a
    // finalized (immutable) document become an editable starting point again
    if (source.status !== "FINALIZED") {
        return errorResponse(403, "Only a finalized document can be duplicated");
    }

    const duplicate = await db.$transaction(async (tx) => {
        const newDoc = await tx.document.create({
            data: {
                userId: session.userId,
                title: source.title,
                customer: source.customer,
                issueDate: source.issueDate,
                status: "DRAFT",
            },
        });

        if (source.lineItems.length > 0) {
            await tx.lineItem.createMany({
                data: source.lineItems.map((line) => ({
                    documentId: newDoc.id,
                    description: line.description,
                    quantity: line.quantity,
                    unitPriceCents: line.unitPriceCents,
                    discountType: line.discountType,
                    discountValue: line.discountValue,
                    taxBps: line.taxBps,
                })),
            });
        }

        // recompute rather than copy the source's cached totals — same rule
        // as everywhere else, the calc module is the only thing allowed to
        // produce a totals value that gets persisted
        return recalculateAndSaveDocument(tx, newDoc.id);
    });

    return NextResponse.json({ document: duplicate }, { status: 201 });
}
