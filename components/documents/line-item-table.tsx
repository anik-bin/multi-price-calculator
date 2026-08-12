"use client";

import { useState } from "react";
import { toast } from "sonner";
import { api, ApiError } from "@/lib/api-client";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    LineItemFormFields,
    emptyLineItemValues,
    lineItemToFormValues,
    lineItemValuesToPayload,
    type LineItemFormValues,
} from "@/components/documents/line-item-form-fields";
import type { Document, LineItem } from "@/types";

function discountLabel(item: LineItem) {
    if (item.discountType === "NONE") return "—";
    if (item.discountType === "FIXED") return formatCents(item.discountValue);
    return `${item.discountValue / 100}%`;
}

export function LineItemTable({
    documentId,
    lineItems,
    editable,
    onDocumentUpdated,
}: {
    documentId: string;
    lineItems: LineItem[];
    editable: boolean;
    onDocumentUpdated: (document: Document) => void;
}) {
    const [addValues, setAddValues] = useState<LineItemFormValues>(emptyLineItemValues);
    const [addError, setAddError] = useState<ApiError | null>(null);
    const [adding, setAdding] = useState(false);

    const [editingItem, setEditingItem] = useState<LineItem | null>(null);
    const [editValues, setEditValues] = useState<LineItemFormValues>(emptyLineItemValues);
    const [editError, setEditError] = useState<ApiError | null>(null);
    const [saving, setSaving] = useState(false);

    const [deletingId, setDeletingId] = useState<string | null>(null);

    async function handleAdd() {
        setAddError(null);
        setAdding(true);
        try {
            const { document } = await api.post<{ document: Document }>(
                `/api/documents/${documentId}/line-items`,
                lineItemValuesToPayload(addValues)
            );
            onDocumentUpdated(document);
            setAddValues(emptyLineItemValues);
        } catch (err) {
            if (err instanceof ApiError) setAddError(err);
        } finally {
            setAdding(false);
        }
    }

    function openEdit(item: LineItem) {
        setEditingItem(item);
        setEditValues(lineItemToFormValues(item));
        setEditError(null);
    }

    async function handleSaveEdit() {
        if (!editingItem) return;
        setEditError(null);
        setSaving(true);
        try {
            const { document } = await api.patch<{ document: Document }>(
                `/api/documents/${documentId}/line-items/${editingItem.id}`,
                lineItemValuesToPayload(editValues)
            );
            onDocumentUpdated(document);
            setEditingItem(null);
        } catch (err) {
            if (err instanceof ApiError) setEditError(err);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(item: LineItem) {
        if (!window.confirm(`Remove "${item.description}"?`)) return;
        setDeletingId(item.id);
        try {
            const { document } = await api.delete<{ document: Document }>(
                `/api/documents/${documentId}/line-items/${item.id}`
            );
            onDocumentUpdated(document);
        } catch (err) {
            if (err instanceof ApiError) toast.error(err.message);
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="text-right">Qty</TableHead>
                        <TableHead className="text-right">Unit price</TableHead>
                        <TableHead className="text-right">Discount</TableHead>
                        <TableHead className="text-right">Tax</TableHead>
                        <TableHead className="text-right">Line total</TableHead>
                        {editable && <TableHead className="w-24" />}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {lineItems.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={editable ? 7 : 6} className="text-center text-muted-foreground">
                                No line items yet.
                            </TableCell>
                        </TableRow>
                    )}
                    {lineItems.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.description}</TableCell>
                            <TableCell className="text-right">{item.quantity}</TableCell>
                            <TableCell className="text-right">{formatCents(item.unitPriceCents)}</TableCell>
                            <TableCell className="text-right">{discountLabel(item)}</TableCell>
                            <TableCell className="text-right">{item.taxBps ? `${item.taxBps / 100}%` : "—"}</TableCell>
                            <TableCell className="text-right">{formatCents(item.lineTotalCents)}</TableCell>
                            {editable && (
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            disabled={deletingId === item.id}
                                            onClick={() => handleDelete(item)}
                                        >
                                            Delete
                                        </Button>
                                    </div>
                                </TableCell>
                            )}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            {editable && (
                <div className="rounded-lg border p-4">
                    <p className="mb-3 text-sm font-medium">Add line item</p>
                    <LineItemFormFields
                        idPrefix="add"
                        values={addValues}
                        onChange={setAddValues}
                        errorFor={(field) => addError?.details.find((d) => d.field === field)?.message}
                    />
                    {addError && !addError.details.length && (
                        <p className="mt-2 text-sm text-destructive">{addError.message}</p>
                    )}
                    <Button className="mt-3" onClick={handleAdd} disabled={adding}>
                        {adding ? "Adding…" : "Add line item"}
                    </Button>
                </div>
            )}

            <Dialog open={editingItem !== null} onOpenChange={(open) => !open && setEditingItem(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit line item</DialogTitle>
                    </DialogHeader>
                    <LineItemFormFields
                        idPrefix="edit"
                        values={editValues}
                        onChange={setEditValues}
                        errorFor={(field) => editError?.details.find((d) => d.field === field)?.message}
                    />
                    {editError && !editError.details.length && (
                        <p className="text-sm text-destructive">{editError.message}</p>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSaveEdit} disabled={saving}>
                            {saving ? "Saving…" : "Save"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
