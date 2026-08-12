// cents -> display string only happens here, right at the UI edge
export function formatCents(cents: number): string {
    return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: "UTC",
    });
}

// <input type="date"> wants YYYY-MM-DD
export function toDateInputValue(iso: string): string {
    return iso.slice(0, 10);
}

// form inputs are dollars/percent, the API wants integer cents/basis points —
// conversion only happens here, right at the UI edge
export function dollarsToCents(input: string): number {
    return Math.round(parseFloat(input) * 100);
}

export function centsToDollarsInput(cents: number): string {
    return (cents / 100).toFixed(2);
}

export function percentToBps(input: string): number {
    return Math.round(parseFloat(input) * 100);
}

export function bpsToPercentInput(bps: number): string {
    return String(bps / 100);
}
