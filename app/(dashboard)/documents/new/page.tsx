"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, fieldError } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Document } from "@/types";

export default function NewDocumentPage() {
    const router = useRouter();
    const [title, setTitle] = useState("");
    const [customer, setCustomer] = useState("");
    const [issueDate, setIssueDate] = useState("");
    const [error, setError] = useState<ApiError | null>(null);
    const [submitting, setSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setSubmitting(true);
        try {
            const { document } = await api.post<{ document: Document }>("/api/documents", {
                title,
                customer,
                issueDate,
            });
            router.push(`/documents/${document.id}`);
        } catch (err) {
            if (err instanceof ApiError) {
                setError(err);
            }
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="mx-auto max-w-md">
            <Card>
                <CardHeader>
                    <CardTitle>New document</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
                            {fieldError(error, "title") && (
                                <p className="text-sm text-destructive">{fieldError(error, "title")}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="customer">Customer</Label>
                            <Input
                                id="customer"
                                value={customer}
                                onChange={(e) => setCustomer(e.target.value)}
                                required
                            />
                            {fieldError(error, "customer") && (
                                <p className="text-sm text-destructive">{fieldError(error, "customer")}</p>
                            )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="issueDate">Issue date</Label>
                            <Input
                                id="issueDate"
                                type="date"
                                value={issueDate}
                                onChange={(e) => setIssueDate(e.target.value)}
                                required
                            />
                            {fieldError(error, "issueDate") && (
                                <p className="text-sm text-destructive">{fieldError(error, "issueDate")}</p>
                            )}
                        </div>
                        {error && !error.details.length && (
                            <p className="text-sm text-destructive">{error.message}</p>
                        )}
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Creating…" : "Create document"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
