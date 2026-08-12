"use client";

import { useState, type FormEvent } from "react";
import { api, ApiError, fieldError } from "@/lib/api-client";
import { formatCents } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportSummary } from "@/types";

export default function ReportsPage() {
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [error, setError] = useState<ApiError | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const params = new URLSearchParams({ from, to });
            const result = await api.get<ReportSummary>(`/api/reports/summary?${params}`);
            setSummary(result);
        } catch (err) {
            if (err instanceof ApiError) setError(err);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-xl font-semibold">Reports</h1>

            <Card className="max-w-lg">
                <CardHeader>
                    <CardTitle>Summary by date range</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="from">From</Label>
                                <Input id="from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} required />
                                {fieldError(error, "from") && (
                                    <p className="text-sm text-destructive">{fieldError(error, "from")}</p>
                                )}
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="to">To</Label>
                                <Input id="to" type="date" value={to} onChange={(e) => setTo(e.target.value)} required />
                                {fieldError(error, "to") && (
                                    <p className="text-sm text-destructive">{fieldError(error, "to")}</p>
                                )}
                            </div>
                        </div>
                        {error && !error.details.length && <p className="text-sm text-destructive">{error.message}</p>}
                        <Button type="submit" disabled={loading}>
                            {loading ? "Running…" : "Run report"}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {summary && (
                <Card className="max-w-lg">
                    <CardHeader>
                        <CardTitle>
                            {summary.from} – {summary.to}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-muted-foreground">Documents (finalized)</p>
                            <p className="text-lg font-medium">{summary.documentCount}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Grand total</p>
                            <p className="text-lg font-medium">{formatCents(summary.grandTotalCents)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Total tax</p>
                            <p className="text-lg font-medium">{formatCents(summary.totalTaxCents)}</p>
                        </div>
                        <div>
                            <p className="text-muted-foreground">Total discount</p>
                            <p className="text-lg font-medium">{formatCents(summary.totalDiscountCents)}</p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
