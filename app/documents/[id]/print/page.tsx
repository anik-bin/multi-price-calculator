import { cookies } from "next/headers";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { COOKIE_NAME } from "@/lib/auth/session";
import { getOwnedDocumentWithLineItems } from "@/lib/documents/access";
import { formatCents, formatDate } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { PrintButton } from "@/components/documents/print-button";

export default async function DocumentPrintPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    const token = (await cookies()).get(COOKIE_NAME)?.value;
    const session = token ? verifyToken(token) : null;
    if (!session) {
        redirect("/login");
    }

    const doc = await getOwnedDocumentWithLineItems(session.userId, id);
    if (!doc) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-3xl px-6 py-10 print:px-0 print:py-0">
            <div className="no-print mb-6 flex items-center justify-between">
                <Link href={`/documents/${id}`} className="text-sm text-muted-foreground hover:text-foreground">
                    &larr; Back to document
                </Link>
                <PrintButton />
            </div>

            <div className="flex items-start justify-between border-b pb-4">
                <div>
                    <h1 className="text-2xl font-semibold">{doc.title}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">{doc.customer}</p>
                </div>
                <div className="text-right">
                    <StatusBadge status={doc.status} />
                    <p className="mt-2 text-sm text-muted-foreground">Issue date: {formatDate(doc.issueDate.toISOString())}</p>
                </div>
            </div>

            <table className="mt-8 w-full text-sm">
                <thead>
                    <tr className="border-b text-left text-muted-foreground">
                        <th className="py-2 pr-2 font-medium">Description</th>
                        <th className="px-2 py-2 text-right font-medium">Qty</th>
                        <th className="px-2 py-2 text-right font-medium">Unit price</th>
                        <th className="px-2 py-2 text-right font-medium">Subtotal</th>
                        <th className="px-2 py-2 text-right font-medium">Discount amt</th>
                        <th className="px-2 py-2 text-right font-medium">After discount</th>
                        <th className="px-2 py-2 text-right font-medium">Tax amt</th>
                        <th className="py-2 pl-2 text-right font-medium">Line total</th>
                    </tr>
                </thead>
                <tbody>
                    {doc.lineItems.map((item) => (
                        <tr key={item.id} className="border-b">
                            <td className="py-2 pr-2">{item.description}</td>
                            <td className="px-2 py-2 text-right">{item.quantity}</td>
                            <td className="px-2 py-2 text-right">{formatCents(item.unitPriceCents)}</td>
                            <td className="px-2 py-2 text-right">{formatCents(item.subtotalCents)}</td>
                            <td className="px-2 py-2 text-right">{formatCents(item.discountAmountCents)}</td>
                            <td className="px-2 py-2 text-right">
                                {formatCents(item.subtotalCents - item.discountAmountCents)}
                            </td>
                            <td className="px-2 py-2 text-right">{formatCents(item.taxAmountCents)}</td>
                            <td className="py-2 pl-2 text-right">{formatCents(item.lineTotalCents)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="mt-8 flex flex-col gap-2 self-end text-sm sm:w-80 sm:ml-auto">
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCents(doc.subtotalCents)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Discount</span>
                    <span>-{formatCents(doc.totalDiscountCents)}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Tax</span>
                    <span>+{formatCents(doc.totalTaxCents)}</span>
                </div>
                <div className="flex justify-between gap-4 border-t pt-2 text-base font-semibold">
                    <span>Grand total</span>
                    <span>{formatCents(doc.grandTotalCents)}</span>
                </div>
            </div>
        </div>
    );
}
