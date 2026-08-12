"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { formatCents, formatDate } from "@/lib/format";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/status-badge";
import type { Document } from "@/types";

export default function DocumentsPage() {
    const router = useRouter();
    const [documents, setDocuments] = useState<Document[] | null>(null);

    useEffect(() => {
        api.get<{ documents: Document[] }>("/api/documents").then((res) => setDocuments(res.documents));
    }, []);

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Documents</h1>
                <Link href="/documents/new" className={buttonVariants()}>
                    New Document
                </Link>
            </div>

            {documents === null && <p className="text-sm text-muted-foreground">Loading…</p>}

            {documents !== null && documents.length === 0 && (
                <p className="text-sm text-muted-foreground">
                    No documents yet. Create your first one to get started.
                </p>
            )}

            {documents !== null && documents.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Issue date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Grand total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.map((doc) => (
                            <TableRow
                                key={doc.id}
                                className="cursor-pointer"
                                onClick={() => router.push(`/documents/${doc.id}`)}
                            >
                                <TableCell className="font-medium">{doc.title}</TableCell>
                                <TableCell>{doc.customer}</TableCell>
                                <TableCell>{formatDate(doc.issueDate)}</TableCell>
                                <TableCell>
                                    <StatusBadge status={doc.status} />
                                </TableCell>
                                <TableCell className="text-right">{formatCents(doc.grandTotalCents)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </div>
    );
}
