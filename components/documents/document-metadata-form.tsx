"use client";

import { useState } from "react";
import { api, ApiError, fieldError } from "@/lib/api-client";
import { toDateInputValue } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Document } from "@/types";

export function DocumentMetadataForm({
    document,
    editable,
    onSaved,
}: {
    document: Document;
    editable: boolean;
    onSaved: (partial: Partial<Document>) => void;
}) {
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState(document.title);
    const [customer, setCustomer] = useState(document.customer);
    const [issueDate, setIssueDate] = useState(toDateInputValue(document.issueDate));
    const [error, setError] = useState<ApiError | null>(null);
    const [saving, setSaving] = useState(false);

    async function handleSave() {
        setError(null);
        setSaving(true);
        try {
            // PATCH doesn't return lineItems, only the updated metadata + totals —
            // the caller is responsible for merging this onto existing state
            const { document: updated } = await api.patch<{ document: Document }>(`/api/documents/${document.id}`, {
                title,
                customer,
                issueDate,
            });
            onSaved(updated);
            setEditing(false);
        } catch (err) {
            if (err instanceof ApiError) setError(err);
        } finally {
            setSaving(false);
        }
    }

    function cancel() {
        setTitle(document.title);
        setCustomer(document.customer);
        setIssueDate(toDateInputValue(document.issueDate));
        setError(null);
        setEditing(false);
    }

    if (!editing) {
        return (
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">{document.title}</h1>
                    <p className="text-sm text-muted-foreground">
                        {document.customer} · {toDateInputValue(document.issueDate)}
                    </p>
                </div>
                {editable && (
                    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                        Edit details
                    </Button>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 rounded-lg border p-4">
            <div className="grid gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="meta-title">Title</Label>
                    <Input id="meta-title" value={title} onChange={(e) => setTitle(e.target.value)} />
                    {fieldError(error, "title") && (
                        <p className="text-sm text-destructive">{fieldError(error, "title")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="meta-customer">Customer</Label>
                    <Input id="meta-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} />
                    {fieldError(error, "customer") && (
                        <p className="text-sm text-destructive">{fieldError(error, "customer")}</p>
                    )}
                </div>
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="meta-issueDate">Issue date</Label>
                    <Input
                        id="meta-issueDate"
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                    />
                    {fieldError(error, "issueDate") && (
                        <p className="text-sm text-destructive">{fieldError(error, "issueDate")}</p>
                    )}
                </div>
            </div>
            {error && !error.details.length && <p className="text-sm text-destructive">{error.message}</p>}
            <div className="flex gap-2">
                <Button size="sm" onClick={handleSave} disabled={saving}>
                    {saving ? "Saving…" : "Save"}
                </Button>
                <Button size="sm" variant="outline" onClick={cancel}>
                    Cancel
                </Button>
            </div>
        </div>
    );
}
