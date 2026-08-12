import type { Prisma } from "@/app/generated/prisma/client";
import { calculateDocument, type LineItemInput } from "@/lib/calc/pricing";

// re-derives every line's totals and the parent document's totals from
// scratch. called at the end of every line-item mutation (create/edit/delete)
// so the calc module stays the single source of truth all the way to the DB —
// callers run this inside the same transaction as their own write
export async function recalculateAndSaveDocument(tx: Prisma.TransactionClient, documentId: string) {
    const lineItems = await tx.lineItem.findMany({
        where: { documentId },
        orderBy: { createdAt: "asc" },
    });

    const inputs: LineItemInput[] = lineItems.map((item) => ({
        quantity: item.quantity,
        unitPriceCents: item.unitPriceCents,
        discountType: item.discountType,
        discountValue: item.discountValue,
        taxBps: item.taxBps,
    }));

    const { lines, totals } = calculateDocument(inputs);

    await Promise.all(
        lineItems.map((item, i) =>
            tx.lineItem.update({
                where: { id: item.id },
                data: {
                    subtotalCents: lines[i].subtotalCents,
                    discountAmountCents: lines[i].discountAmountCents,
                    taxAmountCents: lines[i].taxAmountCents,
                    lineTotalCents: lines[i].lineTotalCents,
                },
            })
        )
    );

    return tx.document.update({
        where: { id: documentId },
        data: {
            subtotalCents: totals.subtotalCents,
            totalDiscountCents: totals.totalDiscountCents,
            totalTaxCents: totals.totalTaxCents,
            grandTotalCents: totals.grandTotalCents,
        },
        include: { lineItems: { orderBy: { createdAt: "asc" } } },
    });
}
