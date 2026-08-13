"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { DocumentMetadataForm } from "@/components/documents/document-metadata-form";
import { LineItemTable } from "@/components/documents/line-item-table";
import type { Document } from "@/types";

export default function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const router = useRouter();
    const [doc, setDoc] = useState<Document | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        api.get<{ document: Document }>(`/api/documents/${id}`)
            .then((res) => setDoc(res.document))
            .catch((err) => {
                if (err instanceof ApiError && err.status === 404) {
                    setNotFound(true);
                } else if (err instanceof ApiError) {
                    toast.error(err.message);
                }
            });
    }, [id]);

    if (notFound) {
        return <p className="text-sm text-muted-foreground">Document not found.</p>;
    }

    if (!doc) {
        return <p className="text-sm text-muted-foreground">Loading…</p>;
    }

    const draft = doc.status === "DRAFT";

    async function handleFinalize() {
        setBusy(true);
        try {
            const { document: updated } = await api.post<{ document: Document }>(`/api/documents/${id}/finalize`);
            setDoc(updated);
            toast.success("Document finalized");
        } catch (err) {
            if (err instanceof ApiError) toast.error(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleDuplicate() {
        setBusy(true);
        try {
            const { document: copy } = await api.post<{ document: Document }>(`/api/documents/${id}/duplicate`);
            toast.success("Duplicated into a new draft");
            router.push(`/documents/${copy.id}`);
        } catch (err) {
            if (err instanceof ApiError) toast.error(err.message);
        } finally {
            setBusy(false);
        }
    }

    async function handleDelete() {
        if (!doc || !window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
        setBusy(true);
        try {
            await api.delete(`/api/documents/${id}`);
            toast.success("Document deleted");
            router.push("/documents");
        } catch (err) {
            if (err instanceof ApiError) toast.error(err.message);
            setBusy(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <DocumentMetadataForm
                document={doc}
                editable={draft}
                onSaved={(partial) => setDoc((prev) => (prev ? { ...prev, ...partial } : prev))}
            />

            <div className="flex items-center gap-3">
                <StatusBadge status={doc.status} />
                <div className="ml-auto flex gap-2">
                    {draft && (
                        <Button onClick={handleFinalize} disabled={busy}>
                            Finalize
                        </Button>
                    )}
                    {!draft && (
                        <Button variant="outline" onClick={handleDuplicate} disabled={busy}>
                            Duplicate into draft
                        </Button>
                    )}
                    {draft && (
                        <Button variant="destructive" onClick={handleDelete} disabled={busy}>
                            Delete
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardContent>
                    <LineItemTable
                        documentId={id}
                        lineItems={doc.lineItems ?? []}
                        editable={draft}
                        onDocumentUpdated={setDoc}
                    />
                </CardContent>
            </Card>

            <Card className="w-80 self-end">
                <CardContent className="flex flex-col gap-2 text-sm">
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
                </CardContent>
            </Card>
        </div>
    );
}
