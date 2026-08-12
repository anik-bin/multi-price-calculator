import { db } from "@/lib/db";

// scoped by userId in the query itself rather than fetched-then-checked, so a
// document that exists but belongs to someone else comes back as null — same
// shape as "doesn't exist", which is what we want callers to return as 404
export function getOwnedDocument(userId: string, documentId: string) {
    return db.document.findFirst({
        where: { id: documentId, userId },
    });
}

export function getOwnedDocumentWithLineItems(userId: string, documentId: string) {
    return db.document.findFirst({
        where: { id: documentId, userId },
        include: { lineItems: { orderBy: { createdAt: "asc" } } },
    });
}
